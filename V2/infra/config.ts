interface resourceArgs {
    cpu: string
    memory: string
}

interface coinArgs {
    name: string
    api: {
        replicas: number
        resources: {
            [key: string]: resourceArgs
        }
    }
    indexer: {
        replicas: number
        resources: {
            [key: string]: resourceArgs
        }
    }
    monitor: {
        replicas: number
        resources: {
            [key: string]: resourceArgs
        }
    }
    TxValidator: {
        replicas: number
        resources: {
            [key: string]: resourceArgs
        }
    }
    BlockValidator: {
        replicas: number
        resources: {
            [key: string]: resourceArgs
        }
    }
    apiMonitor: {
        period: string
        threshold: number
    }
    httpMonitor: {
        requestThreshold: number
        requestPeriod: number
        errorThreshold: number
        errorPeriod: number
    }
    syncMonitor: {
        period: string
        threshold: number
    }
}

const defaultMonitorResources = {
    limits: {
        cpu: '100m',
        memory: '512Mi'
    },
    requests: {
        cpu: '100m',
        memory: '512Mi'
    }
}

const defaultIndexerResources = {
    limits: {
        cpu: '1024m',
        memory: '1024Mi'
    },
    requests: {
        cpu: '1024m',
        memory: '1024Mi'
    }
}

const defaultApiResources = {
    limits: {
        cpu: '200m',
        memory: '512Mi'
    },
    requests: {
        cpu: '200m',
        memory: '512Mi'
    }
}

const defaultTxvalidatorResources = {
    limits: {
        cpu: '500m',
        memory: '512Mi'
    },
    requests: {
        cpu: '500m',
        memory: '512Mi'
    }
}

const defaultBlockvalidatorResources = {
    limits: {
        cpu: '1024m',
        memory: '2048Mi'
    },
    requests: {
        cpu: '1024m',
        memory: '1024Mi'
    }
}

const defaultApiReplicas = 4

export function getCoins(env: string): coinArgs[] {
    return [
        {
            name: 'btc',
            api: {
                replicas: env === 'prod' ? defaultApiReplicas : 2,
                resources: {
                    limits: {
                        cpu: '200m',
                        memory: '700Mi'
                    },
                    requests: {
                        cpu: '200m',
                        memory: '700Mi'
                    }
                }
            },
            indexer: {
                replicas: 1,
                resources: {
                    limits: {
                        cpu: '1500m',
                        memory: '1024Mi'
                    },
                    requests: {
                        cpu: '1500m',
                        memory: '1024Mi'
                    }
                }
            },
            monitor: {
                replicas: 1,
                resources: defaultMonitorResources
            },
            TxValidator: {
                replicas: 1,
                resources: defaultTxvalidatorResources
            },
            BlockValidator: {
                replicas: 1,
                resources: defaultBlockvalidatorResources
            },
            apiMonitor: {
                period: '15m',
                threshold: 1000
            },
            syncMonitor: {
                period: '15m',
                threshold: 120
            },
            httpMonitor: {
                requestThreshold: 7,
                requestPeriod: 60,
                errorThreshold: 5000,
                errorPeriod: 60
            }
        },
        {
            name: 'btctestnet',
            api: {
                replicas: env === 'prod' ? defaultApiReplicas : 2,
                resources: {
                    limits: {
                        cpu: '200m',
                        memory: '700Mi'
                    },
                    requests: {
                        cpu: '200m',
                        memory: '700Mi'
                    }
                }
            },
            indexer: {
                replicas: 1,
                resources: {
                    limits: {
                        cpu: '1500m',
                        memory: '1024Mi'
                    },
                    requests: {
                        cpu: '1500m',
                        memory: '1024Mi'
                    }
                }
            },
            monitor: {
                replicas: 1,
                resources: defaultMonitorResources
            },
            TxValidator: {
                replicas: 1,
                resources: defaultTxvalidatorResources
            },
            BlockValidator: {
                replicas: 1,
                resources: defaultBlockvalidatorResources
            },
            apiMonitor: {
                period: '15m',
                threshold: 1000
            },
            syncMonitor: {
                period: '60m',
                threshold: 120
            },
            httpMonitor: {
                requestThreshold: 7,
                requestPeriod: 60,
                errorThreshold: 5000,
                errorPeriod: 60
            }
        },
        {
            name: 'ltc',
            api: {
                replicas: env === 'prod' ? defaultApiReplicas : 2,
                resources: defaultApiResources
            },
            indexer: {
                replicas: 1,
                resources: {
                    limits: {
                        cpu: '150m',
                        memory: '300Mi'
                    },
                    requests: {
                        cpu: '150m',
                        memory: '300Mi'
                    }
                }
            },
            monitor: {
                replicas: 1,
                resources: defaultMonitorResources
            },
            TxValidator: {
                replicas: 1,
                resources: defaultTxvalidatorResources
            },
            BlockValidator: {
                replicas: 1,
                resources: defaultBlockvalidatorResources
            },
            apiMonitor: {
                period: '15m',
                threshold: 100
            },
            syncMonitor: {
                period: '30m',
                threshold: 60
            },
            httpMonitor: {
                requestThreshold: 7,
                requestPeriod: 60,
                errorThreshold: 5000,
                errorPeriod: 60
            }
        },
        {
            name: 'dash',
            api: {
                replicas: env === 'prod' ? defaultApiReplicas : 2,
                resources: {
                    limits: {
                        cpu: '100m',
                        memory: '512Mi'
                    },
                    requests: {
                        cpu: '100m',
                        memory: '512Mi'
                    }
                }
            },
            indexer: {
                replicas: 1,
                resources: {
                    limits: {
                        cpu: '300m',
                        memory: '500Mi'
                    },
                    requests: {
                        cpu: '300m',
                        memory: '500Mi'
                    }
                }
            },
            monitor: {
                replicas: 1,
                resources: defaultMonitorResources
            },
            TxValidator: {
                replicas: 1,
                resources: defaultTxvalidatorResources
            },
            BlockValidator: {
                replicas: 1,
                resources: defaultBlockvalidatorResources
            },
            apiMonitor: {
                period: '15m',
                threshold: 100
            },
            syncMonitor: {
                period: '30m',
                threshold: 60
            },
            httpMonitor: {
                requestThreshold: 7,
                requestPeriod: 60,
                errorThreshold: 5000,
                errorPeriod: 60
            }
        },
        {
            name: 'dgb',
            api: {
                replicas: env === 'prod' ? defaultApiReplicas : 2,
                resources: defaultApiResources
            },
            indexer: {
                replicas: 1,
                resources: {
                    limits: {
                        cpu: '150m',
                        memory: '200Mi'
                    },
                    requests: {
                        cpu: '150m',
                        memory: '200Mi'
                    }
                }
            },
            monitor: {
                replicas: 1,
                resources: defaultMonitorResources
            },
            TxValidator: {
                replicas: 1,
                resources: defaultTxvalidatorResources
            },
            BlockValidator: {
                replicas: 1,
                resources: defaultBlockvalidatorResources
            },
            apiMonitor: {
                period: '15m',
                threshold: 250
            },
            syncMonitor: {
                period: '10m',
                threshold: 20
            },
            httpMonitor: {
                requestThreshold: 7,
                requestPeriod: 60,
                errorThreshold: 5000,
                errorPeriod: 60
            }
        },
        {
            name: 'bch',
            api: {
                replicas: env === 'prod' ? defaultApiReplicas : 2,
                resources: defaultApiResources
            },
            indexer: {
                replicas: 1,
                resources: {
                    limits: {
                        cpu: '1500m',
                        memory: '1024Mi'
                    },
                    requests: {
                        cpu: '1500m',
                        memory: '1024Mi'
                    }
                }
            },
            monitor: {
                replicas: 1,
                resources: defaultMonitorResources
            },
            TxValidator: {
                replicas: 1,
                resources: defaultTxvalidatorResources
            },
            BlockValidator: {
                replicas: 1,
                resources: defaultBlockvalidatorResources
            },
            apiMonitor: {
                period: '15m',
                threshold: 250
            },
            syncMonitor: {
                period: '60m',
                threshold: 120
            },
            httpMonitor: {
                requestThreshold: 7,
                requestPeriod: 60,
                errorThreshold: 5000,
                errorPeriod: 60
            }
        },
        {
            name: 'doge',
            api: {
                replicas: env === 'prod' ? defaultApiReplicas : 2,
                resources: {
                    limits: {
                        cpu: '200m',
                        memory: '512Mi'
                    },
                    requests: {
                        cpu: '200m',
                        memory: '512Mi'
                    }
                }
            },
            indexer: {
                replicas: 1,
                resources: {
                    limits: {
                        cpu: '500m',
                        memory: '256Mi'
                    },
                    requests: {
                        cpu: '500m',
                        memory: '256Mi'
                    }
                }
            },
            monitor: {
                replicas: 1,
                resources: defaultMonitorResources
            },
            TxValidator: {
                replicas: 1,
                resources: defaultTxvalidatorResources
            },
            BlockValidator: {
                replicas: 1,
                resources: defaultBlockvalidatorResources
            },
            apiMonitor: {
                period: '15m',
                threshold: 100
            },
            syncMonitor: {
                period: '30m',
                threshold: 60
            },
            httpMonitor: {
                requestThreshold: 7,
                requestPeriod: 30,
                errorThreshold: 5000,
                errorPeriod: 60
            }
        }
    ]
}
