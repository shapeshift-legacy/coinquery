import * as pulumi from '@pulumi/pulumi'
import * as infra from '@foxcookieco/infrastructure'
import * as kube from '@pulumi/kubernetes'
import * as dd from '@pulumi/datadog'
import { getCoins } from './config'

async function main() {
    const namespace = 'coinquery'
    const environment = pulumi.getStack() as 'stage' | 'prod'
    const sops_decrypt = `sops -d /config/${environment}.json > /config/config.json`
    const cluster = infra.kube.getClusterData('megacluster', environment)
    const hash = infra.git.getInfo().hash.short
    const image = await infra.docker.buildAndPushImage(
        'coinquery',
        hash,
        {
            context: '../',
            args: {
                VERSION: hash,
                ENVIRONMENT: environment
            }
        },
        []
    )

    const coins = getCoins(environment)

    coins.forEach(coin => {
        // No testnet in prod
        if (coin.name.includes('testnet') && environment == 'prod') return

        const serviceType = `api`

        const serviceName = `${coin.name}-${serviceType}`

        const api = new infra.kube.Microservice(
            `${serviceName}`,
            {
                replicas: coin.api.replicas,
                deploymentStrategy: { type: 'RollingUpdate' },
                enableDatadogLogs: true,
                namespace: namespace,
                datadogLogTags: ['coinquery', '☝️', serviceType, coin.name],
                containers: [
                    {
                        name: 'coinquery',
                        image: image.imageName,
                        command: [
                            'sh',
                            '-c',
                            `${sops_decrypt} && /go/bin/api -config ./config/config.json -coin ${coin.name}`
                        ],
                        resources: coin.api.resources,
                        env: [{ name: 'ENVIRONMENT', value: environment }],
                        ports: 'default' // port 8000,
                    }
                ]
            },
            { provider: cluster.provider }
        )

        if (api.service) {
            new kube.networking.v1beta1.Ingress(
                `${coin.name}-ingress`,
                {
                    metadata: {
                        namespace: namespace
                    },
                    spec: {
                        rules: [
                            {
                                host: pulumi.interpolate`api-coinquery.${cluster.domain}`,
                                http: {
                                    paths: [
                                        {
                                            path: `/api/${coin.name}`,
                                            backend: {
                                                serviceName: api.service.metadata.name,
                                                servicePort: 8000
                                            }
                                        },
                                        {
                                            path: `/api/insight/${coin.name}`,
                                            backend: {
                                                serviceName: api.service.metadata.name,
                                                servicePort: 8000
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                host: 'prod.redacted.example.com',
                                http: {
                                    paths: [
                                        {
                                            path: `/api/${coin.name}`,
                                            backend: {
                                                serviceName: api.service.metadata.name,
                                                servicePort: 8000
                                            }
                                        },
                                        {
                                            path: `/api/insight/${coin.name}`,
                                            backend: {
                                                serviceName: api.service.metadata.name,
                                                servicePort: 8000
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                host: 'redacted.example.com',
                                http: {
                                    paths: [
                                        {
                                            path: `/api/${coin.name}`,
                                            backend: {
                                                serviceName: api.service.metadata.name,
                                                servicePort: 8000
                                            }
                                        },
                                        {
                                            path: `/api/insight/${coin.name}`,
                                            backend: {
                                                serviceName: api.service.metadata.name,
                                                servicePort: 8000
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                host: 'www.redacted.example.com',
                                http: {
                                    paths: [
                                        {
                                            path: `/api/${coin.name}`,
                                            backend: {
                                                serviceName: api.service.metadata.name,
                                                servicePort: 8000
                                            }
                                        },
                                        {
                                            path: `/api/insight/${coin.name}`,
                                            backend: {
                                                serviceName: api.service.metadata.name,
                                                servicePort: 8000
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
                { provider: cluster.provider }
            )

            const traefikServiceName = pulumi.interpolate`${namespace}-${serviceName}-8000_kubernetes`

            new infra.monitor.SimpleMonitor(
                `${serviceName}`,
                {
                    environment: environment,
                    serviceName: traefikServiceName,
                    namespace: namespace,
                    durationThreshold: coin.httpMonitor.requestThreshold,
                    durationPeriod: coin.httpMonitor.requestPeriod,
                    errorThreshold: coin.httpMonitor.errorThreshold,
                    errorPeriod: coin.httpMonitor.errorPeriod,
                },
                {}
            )
        }

        new infra.kube.Microservice(
            `${coin.name}-indexer`,
            {
                replicas: coin.indexer.replicas,
                deploymentStrategy: { type: 'Recreate' }, // this makes sure to destroy old before deploy new. Never run 2 indexers
                enableDatadogLogs: true,
                datadogLogTags: ['coinquery', '☝️', 'indexer', coin.name],
                namespace: namespace,
                containers: [
                    {
                        name: 'coinquery',
                        image: image.imageName,
                        command: [
                            'sh',
                            '-c',
                            `${sops_decrypt} && /go/bin/indexer -config ./config/config.json -coin ${coin.name} -sync -batch 1`
                        ],
                        ports: 'default', // port 8000
                        resources: coin.indexer.resources,
                        env: [{ name: 'ENVIRONMENT', value: environment }]
                    }
                ]
            },
            { provider: cluster.provider, deleteBeforeReplace: true }
        )

        new infra.kube.Microservice(
            `${coin.name}-monitor`,
            {
                replicas: coin.monitor.replicas,
                enableDatadogLogs: true,
                datadogLogTags: ['coinquery', '☝️', 'monitor', coin.name],
                namespace: namespace,
                containers: [
                    {
                        name: 'coinquery',
                        image: image.imageName,
                        command: [
                            'sh',
                            '-c',
                            `${sops_decrypt} && /go/bin/monitor -config ./config/config.json -coin ${coin.name}`
                        ],
                        resources: coin.monitor.resources,
                        env: [{ name: 'ENVIRONMENT', value: environment }],
                        ports: 'default' // port 8000
                    }
                ]
            },
            { provider: cluster.provider }
        )

        new infra.kube.CronJob(
            `${coin.name}-txvalidator`,
            {
                schedule: '0 */1 * * *', // every hour
                concurrencyPolicy: 'Forbid',
                failedJobsHistoryLimit: 1,
                successfulJobsHistoryLimit: 1,
                enableDatadogLogs: true,
                datadogLogTags: ['coinquery', '☝️', 'txvalidator', coin.name],
                namespace: namespace,
                containers: [
                    {
                        name: 'coinquery',
                        image: image.imageName,
                        command: [
                            'sh',
                            '-c',
                            `${sops_decrypt} && /go/bin/txvalidator -config ./config/config.json -coin ${coin.name}`
                        ],
                        env: [{ name: 'ENVIRONMENT', value: environment }],
                        ports: 'default', // port 8000
                        resources: coin.TxValidator.resources
                    }
                ]
            },
            { provider: cluster.provider }
        )

        new infra.kube.CronJob(
            `${coin.name}-blockvalidator`,
            {
                schedule: '0 */1 * * *', // every hour
                concurrencyPolicy: 'Forbid',
                failedJobsHistoryLimit: 1,
                successfulJobsHistoryLimit: 1,
                enableDatadogLogs: true,
                datadogLogTags: ['coinquery', '☝️', 'blockvalidator', coin.name],
                namespace: namespace,
                containers: [
                    {
                        name: 'coinquery',
                        image: image.imageName,
                        command: [
                            'sh',
                            '-c',
                            `${sops_decrypt} && /go/bin/blockvalidator -config ./config/config.json -coin ${coin.name}`
                        ],
                        env: [{ name: 'ENVIRONMENT', value: environment }],
                        ports: 'default', // port 8000
                        resources: coin.BlockValidator.resources
                    }
                ]
            },
            { provider: cluster.provider }
        )

        new dd.Monitor(`${coin.name}-sync-monitor`, {
            name: `Coinquery ${coin.name} is out of sync - megacluster - ${environment}`,
            type: 'log alert',
            query: `logs("environment:${environment} cluster:megacluster service:coinquery-monitor @coin:${coin.name} status:error coinquery is out of sync").index("main").rollup("count").last("${coin.syncMonitor.period}") >= ${coin.syncMonitor.threshold}`,
            message: pulumi.interpolate`
            {{#is_alert}}
            https://api-coinquery.${cluster.domain}/api/${coin.name}/info
            ${environment === 'prod' ? '@slack-alerts' : '@slack-blockchain-alerts'}
            {{/is_alert}}
            {{#is_alert_recovery}}
            https://api-coinquery.${cluster.domain}/api/${coin.name}/info
            ${environment === 'prod' ? '@slack-alerts' : '@slack-blockchain-alerts'}
            {{/is_alert_recovery}}

            [Ops Guide](https://confluence.redacted.example.com/pages/viewpage.action?spaceKey=OPS&title=On-call%3A++Blockchain+Squads)
        `,
            thresholds: {
                critical: coin.syncMonitor.threshold,
                warning: coin.syncMonitor.threshold / 2
            },
            tags: ['coinquery', coin.name, 'monitor', 'shapeshift-account'],
            locked: true
        })

        new dd.Monitor(`${coin.name}-api-monitor`, {
            name: `Coinquery ${coin.name} API Alert - megacluster - ${environment}`,
            type: 'log alert',
            query: `logs("environment:${environment} cluster:megacluster service:coinquery-api @coin:${coin.name} @package:insight status:error -\"sql: no rows in result set failed to get transaction\"").index("main").rollup("count").last("${coin.apiMonitor.period}") >= ${coin.apiMonitor.threshold}`,
            message: pulumi.interpolate`
            {{#is_alert}}
            https://api-coinquery.${cluster.domain}/api/${coin.name}/info
            ${environment === 'prod' ? '@slack-alerts' : '@slack-blockchain-alerts'}
            {{/is_alert}}
            {{#is_alert_recovery}}
            https://api-coinquery.${cluster.domain}/api/${coin.name}/info
            ${environment === 'prod' ? '@slack-alerts' : '@slack-blockchain-alerts'}
            {{/is_alert_recovery}}

            [Ops Guide](https://confluence.redacted.example.com/pages/viewpage.action?spaceKey=OPS&title=On-call%3A++Blockchain+Squads)
        `,
            thresholds: {
                critical: coin.apiMonitor.threshold,
                warning: coin.apiMonitor.threshold / 2
            },
            tags: ['coinquery', coin.name, 'api', 'shapeshift-account'],
            locked: true
        })
    })

    const api = new infra.kube.Microservice(
        `eth-api`,
        {
            replicas: environment === 'prod' ? 4 : 2,
            enableDatadogLogs: true,
            namespace: namespace,
            deploymentStrategy: { type: 'RollingUpdate' },
            datadogLogTags: ['coinquery', '☝️', 'api', 'eth'],
            containers: [
                {
                    name: 'coinquery',
                    image: image.imageName,
                    command: [
                        'sh',
                        '-c',
                        `${sops_decrypt} && /go/bin/api -config ./config/config.json -coin eth`
                    ],
                    resources: {
                        limits: {
                            cpu: '200m',
                            memory: '512Mi'
                        },
                        requests: {
                            cpu: '100m',
                            memory: '256Mi'
                        }
                    },
                    env: [{ name: 'ENVIRONMENT', value: environment }],
                    ports: 'default' // port 8000
                }
            ]
        },
        { provider: cluster.provider }
    )

    if (api.service) {
        new kube.networking.v1beta1.Ingress(
            `eth-ingress`,
            {
                metadata: {
                    namespace: namespace
                },
                spec: {
                    rules: [
                        {
                            host: pulumi.interpolate`eth-coinquery.${cluster.domain}`,
                            http: {
                                paths: [
                                    {
                                        path: `/api`,
                                        backend: {
                                            serviceName: api.service.metadata.name,
                                            servicePort: 8000
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            host: 'eth.redacted.example.com',
                            http: {
                                paths: [
                                    {
                                        path: `/api`,
                                        backend: {
                                            serviceName: api.service.metadata.name,
                                            servicePort: 8000
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
            { provider: cluster.provider }
        )
    }

    if (environment !== 'prod') {
        const apiRinkeby = new infra.kube.Microservice(
            `eth-rinkeby-api`,
            {
                replicas: 1,
                enableDatadogLogs: true,
                namespace: namespace,
                deploymentStrategy: { type: 'RollingUpdate' },
                datadogLogTags: ['coinquery', '☝️', 'api', 'eth','testnet','rinkeby'],
                containers: [
                    {
                        name: 'coinquery',
                        image: image.imageName,
                        command: [
                            'sh',
                            '-c',
                            `${sops_decrypt} && /go/bin/api -config ./config/config.json -coin ethrinkeby`
                        ],
                        resources: {
                            limits: {
                                cpu: '200m',
                                memory: '512Mi'
                            },
                            requests: {
                                cpu: '100m',
                                memory: '256Mi'
                            }
                        },
                        env: [{ name: 'ENVIRONMENT', value: environment }],
                        ports: 'default' // port 8000
                    }
                ]
            },
            { provider: cluster.provider }
        )

        if (apiRinkeby.service) {
            new kube.networking.v1beta1.Ingress(
                `eth-rinkeby-ingress`,
                {
                    metadata: {
                        namespace: namespace
                    },
                    spec: {
                        rules: [
                            {
                                host: pulumi.interpolate`eth-rinkeby-coinquery.${cluster.domain}`,
                                http: {
                                    paths: [
                                        {
                                            path: `/api`,
                                            backend: {
                                                serviceName: apiRinkeby.service.metadata.name,
                                                servicePort: 8000
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                host: 'rinkeby.eth.redacted.example.com',
                                http: {
                                    paths: [
                                        {
                                            path: `/api`,
                                            backend: {
                                                serviceName: apiRinkeby.service.metadata.name,
                                                servicePort: 8000
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
                { provider: cluster.provider }
            )
        }

        //TODO no alerts yet because not yet prod
        // new dd.Monitor('eth-rinkeby-api-monitor', {
        //     name: `Coinquery eth rinkeby API Alert - megacluster - ${environment}`,
        //     type: 'log alert',
        //     query: `logs("environment:${environment} cluster:megacluster service:coinquery-api @coin:eth-rinkeby @package:logger -@statusCode:200").index("main").rollup("count").last("15m") >= 1000`,
        //     message: pulumi.interpolate`{{#is_alert}}\n @opsgenie-platform-squads ${
        //         environment === 'prod' ? '@slack-alerts' : '@blockchain-alerts'
        //     } \n {{/is_alert}} \n\n {{#is_alert_recovery}}\n ${
        //         environment === 'prod' ? '@slack-alerts' : '@blockchain-alerts'
        //     } \n {{/is_alert_recovery}} \n\n [Ops Guide](https://confluence.redacted.example.com/pages/viewpage.action?spaceKey=OPS&title=On-call%3A++Blockchain+Squads)`,
        //     thresholds: {
        //         critical: 1000
        //     },
        //     tags: ['coinquery', 'eth', 'api', 'shapeshift-account'],
        //     locked: true
        // })

        const apiRopsten = new infra.kube.Microservice(
            `eth-ropsten-api`,
            {
                replicas:  1,
                enableDatadogLogs: true,
                namespace: namespace,
                deploymentStrategy: { type: 'RollingUpdate' },
                datadogLogTags: ['coinquery', '☝️', 'api', 'eth','testnet','ropsten'],
                containers: [
                    {
                        name: 'coinquery',
                        image: image.imageName,
                        command: [
                            'sh',
                            '-c',
                            `${sops_decrypt} && /go/bin/api -config ./config/config.json -coin ethropsten`
                        ],
                        resources: {
                            limits: {
                                cpu: '200m',
                                memory: '512Mi'
                            },
                            requests: {
                                cpu: '100m',
                                memory: '256Mi'
                            }
                        },
                        env: [{ name: 'ENVIRONMENT', value: environment }],
                        ports: 'default' // port 8000
                    }
                ]
            },
            { provider: cluster.provider }
        )

        if (apiRopsten.service) {
            new kube.networking.v1beta1.Ingress(
                `eth-ropsten-ingress`,
                {
                    metadata: {
                        namespace: namespace
                    },
                    spec: {
                        rules: [
                            {
                                host: pulumi.interpolate`eth-ropsten-coinquery.${cluster.domain}`,
                                http: {
                                    paths: [
                                        {
                                            path: `/api`,
                                            backend: {
                                                serviceName: apiRopsten.service.metadata.name,
                                                servicePort: 8000
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                host: 'ropsten.redacted.example.com',
                                http: {
                                    paths: [
                                        {
                                            path: `/api`,
                                            backend: {
                                                serviceName: apiRopsten.service.metadata.name,
                                                servicePort: 8000
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
                { provider: cluster.provider }
            )
        }

        //TODO ropsten alerts
    }

    new dd.Monitor('eth-api-monitor', {
        name: `Coinquery eth API Alert - megacluster - ${environment}`,
        type: 'log alert',
        query: `logs("environment:${environment} cluster:megacluster service:coinquery-api @coin:eth @package:logger -@statusCode:200").index("main").rollup("count").last("15m") >= 1000`,
        message: pulumi.interpolate`{{#is_alert}}\n @opsgenie-platform-squads ${
            environment === 'prod' ? '@slack-alerts' : '@blockchain-alerts'
        } \n {{/is_alert}} \n\n {{#is_alert_recovery}}\n ${
            environment === 'prod' ? '@slack-alerts' : '@blockchain-alerts'
        } \n {{/is_alert_recovery}} \n\n [Ops Guide](https://confluence.redacted.example.com/pages/viewpage.action?spaceKey=OPS&title=On-call%3A++Blockchain+Squads)`,
        thresholds: {
            critical: 1000
        },
        tags: ['coinquery', 'eth', 'api', 'shapeshift-account'],
        locked: true
    })
}

main()
