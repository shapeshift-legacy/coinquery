package main

//+build ignore

import (
	"log"
	"os"
	"strings"
	"text/template"
	"time"

	"../coin"
)

func main() {

	now := time.Now()
	unix := now.Format(time.UnixDate)

	coinName := os.Getenv("ticker")
	coinTicker := strings.ToUpper(coinName)
	f, osErr := os.Create("../" + coinName + ".json")
	if osErr != nil {
		log.Fatal(osErr)
	}
	defer f.Close()

	packageTemplate.Execute(f, struct {
		CoinTicker string
	}{
		CoinTicker: coinTicker,
	})

	// open makefile and append to it
	makefile, err := os.OpenFile("../Makefile", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Panic(err)
	}
	defer makefile.Close()
	makefileTemplate.Execute(makefile, struct {
		CoinName   string
		CoinTicker string
	}{
		CoinName:   coinName,
		CoinTicker: coinTicker,
	})

	coinFile, osErr := os.Create("../coin/coin.go")
	if osErr != nil {
		log.Panic(osErr)
	}
	defer coinFile.Close()

	// append new coin to Coin list
	var coins = append(coin.Coins, coinTicker)
	coinsTemplate.Execute(coinFile, struct {
		Coins     []string
		Timestamp string
	}{
		Coins:     coins,
		Timestamp: unix,
	})
}

var coinsTemplate = template.Must(template.New("coin-constants-tmpl").Parse(`// ***
// Code (re)generated by go generate; DO NOT EDIT BY HAND;
// {{ .Timestamp }}
package coin
var Coins = []string{
{{range .Coins}}
    "{{.}}",
{{end}}
}
`))

var makefileTemplate = template.Must(template.New("makefile-tmpl").Parse(`
##############################################
############### {{ .CoinTicker }} VARIABLES ################
##############################################
{{ .CoinTicker }}_COMMIT=$$(cd ../{{ .CoinTicker }} && git rev-parse --short HEAD)
{{ .CoinTicker }}_STACK_NAME = cq-{{ .CoinName }}-$(STACK_COUNT)
{{ .CoinTicker }}_NAME = coinquery/{{ .CoinName }}-insight
{{ .CoinTicker }}_IMAGE = coinquery/{{ .CoinName }}-insight:dev
{{ .CoinTicker }}_REPO_IMAGE = $(ECS_REPO_URI)/$({{ .CoinTicker }}_NAME):$({{ .CoinTicker }}_COMMIT)-{{ .CoinName }}
############################
#### {{ .CoinTicker }} BUILD COMMANDS ####
############################
.PHONY: {{ .CoinName }}-image
{{ .CoinName }}-image:
	@cd ../{{ .CoinTicker }} && make {{ .CoinName }}
.PHONY: {{ .CoinName }}-deploy
{{ .CoinName }}-deploy:
	@$$(aws ecr get-login --no-include-email --region $(REGION))
	@docker tag $({{ .CoinTicker }}_IMAGE) $({{ .CoinTicker }}_REPO_IMAGE)
	@docker push $({{ .CoinTicker }}_REPO_IMAGE)
.PHONY: {{ .CoinTicker }}-init
{{ .CoinTicker }}-init: {{ .CoinName }}-image {{ .CoinName }}-deploy
	@aws --region $(REGION) cloudformation create-stack \
		--stack-name $({{ .CoinTicker }}_STACK_NAME) \
		--template-body file://{{ .CoinName }}.json \
		--parameters \
			ParameterKey={{ .CoinTicker }}Image,ParameterValue=$({{ .CoinTicker }}_REPO_IMAGE) \
			ParameterKey=SSLCertificate,ParameterValue=$(REGION_SSL) \
			ParameterKey=IsProdConditon,ParameterValue="$(IS_PROD)" \
		--capabilities CAPABILITY_IAM
`))

var packageTemplate = template.Must(template.New("package-tmpl").Parse(`{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "{{ .CoinTicker }} Stack (Insight)",
  "Parameters": {
    "SSLCertificate": {
      "Type": "String",
      "Description": "The SSL Certificate for HTTPS connections."
    },
    "IsProdConditon": {
      "Type": "String",
      "Description": "Flag for production scaling instances."
    },
    "NetworkStack": {
      "Type": "String",
      "Default": "coinquery-network",
      "Description": "The CloudFormation stack exporting our desired VPC and networking configuration."
    },
    "{{ .CoinTicker }}Image": {
      "Type": "String",
      "Description": "Fully qualified ECR image tag for the {{ .CoinTicker }}."
    },
    "ChainType": {
      "Type": "String",
      "Default": "{{ .CoinTicker }}",
      "Description": "Tag name for snappy to know what to snapshot"
    }
  },
  "Conditions": {
    "IsProd": {
      "Fn::Equals": [
        {
          "Ref": "IsProdConditon"
        },
        "true"
      ]
    }
  },
  "Mappings": {
    "AWSRegionToAMI": {
      "us-east-2": {
        "AMIID": "ami-956e52f0"
      },
      "us-east-1": {
        "AMIID": "ami-5253c32d"
      },
      "us-west-2": {
        "AMIID": "ami-d2f489aa"
      },
      "us-west-1": {
        "AMIID": "ami-6b81980b"
      },
      "eu-west-3": {
        "AMIID": "ami-ca75c4b7"
      },
      "eu-west-2": {
        "AMIID": "ami-3622cf51"
      },
      "eu-west-1": {
        "AMIID": "ami-c91624b0"
      },
      "eu-central-1": {
        "AMIID": "ami-10e6c8fb"
      },
      "ap-northeast-2": {
        "AMIID": "ami-7c69c112"
      },
      "ap-northeast-1": {
        "AMIID": "ami-f3f8098c"
      },
      "ap-southeast-2": {
        "AMIID": "ami-bc04d5de"
      },
      "ap-southeast-1": {
        "AMIID": "ami-b75a6acb"
      },
      "ca-central-1": {
        "AMIID": "ami-da6cecbe"
      },
      "ap-south-1": {
        "AMIID": "ami-c7072aa8"
      },
      "sa-east-1": {
        "AMIID": "ami-a1e2becd"
      }
    }
  },
  "Resources": {
    "SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "{{ .CoinTicker }} Security Group",
        "VpcId": {
          "Fn::ImportValue": {
            "Fn::Sub": "${NetworkStack}-VPC"
          }
        },
        "SecurityGroupIngress": [
          {
            "CidrIp": "0.0.0.0/0",
            "IpProtocol": "tcp",
            "FromPort": "443",
            "ToPort": "443"
          },
          {
            "CidrIp": "0.0.0.0/0",
            "IpProtocol": "tcp",
            "FromPort": "3001",
            "ToPort": "3001"
          }
        ],
        "SecurityGroupEgress": [
          {
            "CidrIp": "0.0.0.0/0",
            "IpProtocol": "-1"
          }
        ]
      }
    },
    "LoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Type": "application",
        "Name": {
          "Fn::Sub": "${AWS::StackName}-alb"
        },
        "Scheme": "internet-facing",
        "Subnets": [
          {
            "Fn::ImportValue": {
              "Fn::Sub": "${NetworkStack}-Subnet0"
            }
          },
          {
            "Fn::ImportValue": {
              "Fn::Sub": "${NetworkStack}-Subnet1"
            }
          }
        ],
        "IpAddressType": "ipv4",
        "LoadBalancerAttributes": [
          {
            "Key": "idle_timeout.timeout_seconds",
            "Value": "30"
          }
        ],
        "SecurityGroups": [
          {
            "Ref": "SecurityGroup"
          }
        ]
      }
    },
    "ListenerRule": {
      "Type": "AWS::ElasticLoadBalancingV2::ListenerRule",
      "Properties": {
        "Actions": [
          {
            "Type": "forward",
            "TargetGroupArn": {
              "Ref": "TargetGroup"
            }
          }
        ],
        "Conditions": [
          {
            "Field": "path-pattern",
            "Values": [
              "/*"
            ]
          }
        ],
        "ListenerArn": {
          "Ref": "Listener"
        },
        "Priority": 1
      }
    },
    "Listener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {
              "Ref": "TargetGroup"
            }
          }
        ],
        "LoadBalancerArn": {
          "Ref": "LoadBalancer"
        },
        "Port": "443",
        "Protocol": "HTTPS",
        "Certificates": [
          {
            "CertificateArn": {
              "Ref": "SSLCertificate"
            }
          }
        ]
      }
    },
    "TargetGroup": {
      "DependsOn": "LoadBalancer",
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckPath": "/api/status?q=getInfo",
        "HealthCheckPort": "3001",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckTimeoutSeconds": 10,
        "HealthyThresholdCount": 2,
        "Matcher": {
          "HttpCode": "200"
        },
        "Name": {
          "Fn::Sub": "${AWS::StackName}-target-group"
        },
        "Port": 3001,
        "Protocol": "HTTP",
        "TargetGroupAttributes": [
          {
            "Key": "deregistration_delay.timeout_seconds",
            "Value": "5"
          }
        ],
        "UnhealthyThresholdCount": 4,
        "VpcId": {
          "Fn::ImportValue": {
            "Fn::Sub": "${NetworkStack}-VPC"
          }
        }
      }
    },
    "Cluster": {
      "Type": "AWS::ECS::Cluster"
    },
    "SnapshotCluster": {
      "Type": "AWS::ECS::Cluster"
    },
    "serviceSnapshot{{ .CoinTicker }}": {
      "Type": "AWS::ECS::Service",
      "DependsOn": "SnapshotInstance",
      "Properties": {
        "Cluster": {
          "Ref": "SnapshotCluster"
        },
        "ServiceName": {
          "Fn::Sub": "${AWS::StackName}-service-snapshot"
        },
        "DesiredCount": 1,
        "DeploymentConfiguration": {
          "MaximumPercent": 200,
          "MinimumHealthyPercent": 50
        },
        "TaskDefinition": {
          "Ref": "TaskDefinitionSnapshot{{ .CoinTicker }}"
        }
      }
    },
    "TaskDefinitionSnapshot{{ .CoinTicker }}": {
      "Type": "AWS::ECS::TaskDefinition",
      "Properties": {
        "Family": {
          "Fn::Sub": "${AWS::StackName}-snapshot"
        },
        "NetworkMode": "host",
        "ContainerDefinitions": [
          {
            "Name": {
              "Fn::Sub": "${AWS::StackName}-snapshot"
            },
            "Cpu": 512,
            "Essential": true,
            "Image": {
              "Ref": "{{ .CoinTicker }}Image"
            },
            "Memory": 6500,
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {
                  "Ref": "LogGroup"
                },
                "awslogs-region": {
                  "Ref": "AWS::Region"
                },
                "awslogs-stream-prefix": "container"
              }
            },
            "MountPoints": [
              {
                "ContainerPath": "/home/cqdev/.bitcoin",
                "SourceVolume": "blockchain"
              }
            ],
            "PortMappings": [
              {
                "ContainerPort": 30303,
                "HostPort": 30303
              },
              {
                "ContainerPort": 8545,
                "HostPort": 8545
              }
            ]
          }
        ],
        "Volumes": [
          {
            "Name": "blockchain",
            "Host": {
              "SourcePath": "/mnt/blockchain"
            }
          }
        ]
      }
    },
    "Service{{ .CoinTicker }}": {
      "Type": "AWS::ECS::Service",
      "DependsOn": "AutoScalingGroup",
      "Properties": {
        "Cluster": {
          "Ref": "Cluster"
        },
        "ServiceName": {
          "Fn::Sub": "${AWS::StackName}-service-{{ .CoinTicker }}"
        },
        "DesiredCount": {
          "Fn::If": [
            "IsProd",
            2,
            1
          ]
        },
        "HealthCheckGracePeriodSeconds": 10,
        "DeploymentConfiguration": {
          "MaximumPercent": 200,
          "MinimumHealthyPercent": 50
        },
        "Role": {
          "Ref": "Service{{ .CoinTicker }}Role"
        },
        "LoadBalancers": [
          {
            "ContainerName": {
              "Fn::Sub": "${AWS::StackName}-{{ .CoinTicker }}"
            },
            "ContainerPort": 3001,
            "TargetGroupArn": {
              "Ref": "TargetGroup"
            }
          }
        ],
        "TaskDefinition": {
          "Ref": "TaskDefinition{{ .CoinTicker }}"
        }
      }
    },
    "TaskDefinition{{ .CoinTicker }}": {
      "Type": "AWS::ECS::TaskDefinition",
      "Properties": {
        "Family": {
          "Fn::Sub": "${AWS::StackName}-{{ .CoinTicker }}"
        },
        "NetworkMode": "host",
        "ContainerDefinitions": [
          {
            "Name": {
              "Fn::Sub": "${AWS::StackName}-{{ .CoinTicker }}"
            },
            "Cpu": 512,
            "Essential": true,
            "Image": {
              "Ref": "{{ .CoinTicker }}Image"
            },
            "Memory": 7500,
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {
                  "Ref": "LogGroup"
                },
                "awslogs-region": {
                  "Ref": "AWS::Region"
                },
                "awslogs-stream-prefix": "container"
              }
            },
            "MountPoints": [
              {
                "ContainerPath": "/home/cqdev/.bitcoin",
                "SourceVolume": "blockchain"
              }
            ],
            "PortMappings": [
              {
                "ContainerPort": 3001,
                "HostPort": 3001
              }
            ]
          }
        ],
        "Volumes": [
          {
            "Name": "blockchain",
            "Host": {
              "SourcePath": "/mnt/blockchain"
            }
          }
        ]
      }
    },
    "LogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "${AWS::StackName}-log-group"
        },
        "RetentionInDays": {
          "Fn::If": [
            "IsProd",
            "3653",
            "3"
          ]
        }
      }
    },
    "SnapshotInstance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": {
          "Fn::FindInMap": [
            "AWSRegionToAMI",
            {
              "Ref": "AWS::Region"
            },
            "AMIID"
          ]
        },
        "InstanceType": "m4.large",
        "EbsOptimized": true,
        "IamInstanceProfile": {
          "Ref": "InstanceProfile"
        },
        "KeyName": {
          "Fn::Sub": "ssh-${AWS::Region}"
        },
        "SecurityGroupIds": [
          {
            "Ref": "SecurityGroup"
          }
        ],
        "SubnetId": {
          "Fn::ImportValue": {
            "Fn::Sub": "${NetworkStack}-Subnet0"
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${AWS::StackName}-snapshot-instance"
            }
          },
          {
            "Key": "InstanceJob",
            "Value": "Snapshotter"
          },
          {
            "Key": "ChainType",
            "Value": {
              "Ref": "ChainType"
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -x\n",
                "yum install -y aws-cfn-bootstrap curl unzip\n",
                "## Install AWS CLI\n",
                "curl https://s3.amazonaws.com/aws-cli/awscli-bundle.zip -o awscli-bundle.zip\n",
                "unzip awscli-bundle.zip\n",
                "./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws\n",
                "export PATH=/usr/local/bin:$PATH\n",
                "export AWS_DEFAULT_REGION=",
                {
                  "Ref": "AWS::Region"
                },
                "\n",
                "snapID=$(curl 'https://otn5bw43if.execute-api.us-west-2.amazonaws.com/dev/getLatestSnapshot/?region=",
                {
                  "Ref": "AWS::Region"
                },
                "&cointype=",
                {
                  "Ref": "ChainType"
                },
                "')",
                "\n",
                "if [[ $snapID =~ ^snap-[a-zA-Z0-9]{17}$ ]]; then\n",
                "aws ec2 create-volume --region ",
                {
                  "Ref": "AWS::Region"
                },
                " --volume-type io1 --iops 3000 --tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value=",
                {
                  "Fn::Sub": "${AWS::StackName}-snapshot-volume"
                },
                "}]' --size 600 --availability-zone ",
                {
                  "Fn::ImportValue": {
                    "Fn::Sub": "${NetworkStack}-Subnet0AZ"
                  }
                },
                " --snapshot-id $snapID\n",
                "else\n",
                "aws ec2 create-volume --region ",
                {
                  "Ref": "AWS::Region"
                },
                " --volume-type io1 --iops 3000 --tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value=",
                {
                  "Fn::Sub": "${AWS::StackName}-snapshot-volume"
                },
                "}]' --size 600 --availability-zone ",
                {
                  "Fn::ImportValue": {
                    "Fn::Sub": "${NetworkStack}-Subnet0AZ"
                  }
                },
                "\n",
                "fi\n",
                "## Find device and attach it\n",
                "INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)\n",
                "VolumeId=$(aws ec2 describe-volumes --filters \"Name=tag-value,Values=",
                {
                  "Fn::Sub": "${AWS::StackName}-snapshot-volume"
                },
                "\" ",
                "\"Name=status,Values=available\" --query 'Volumes[0].VolumeId' --output text); \n",
                "until [[ -b /dev/sdf ]]; \n",
                "do \n",
                "aws ec2 attach-volume --volume-id $VolumeId",
                " --instance-id $INSTANCE_ID --device /dev/sdf ",
                "|| ",
                "VolumeId=$(aws ec2 describe-volumes --filters \"Name=tag-value,Values=",
                {
                  "Fn::Sub": "${AWS::StackName}-snapshot-volume"
                },
                "\" ",
                "\"Name=status,Values=available\" --query 'Volumes[0].VolumeId' --output text); \n",
                "sleep 5\n",
                "done \n",
                "mkdir -p /mnt/blockchain\n",
                "## Format device\n",
                "## If we cannot mount, make a new filesystem and try again\n",
                "mount /dev/sdf /mnt/blockchain\n",
                "if [ ! $? -eq 0 ]; then\n",
                "    echo \"making new filesystem...\"\n",
                "    mkfs -t ext4 /dev/sdf\n",
                "    mount /dev/sdf /mnt/blockchain\n",
                "else\n",
                "    echo \"mount successful on first attempt, skipping mkfs\"\n",
                "fi\n",
                "chmod -R 777 /mnt/blockchain\n",
                "## Automount configuration\n",
                "if [ -z \"$(grep /dev/sdf /etc/fstab)\" ]; then\n",
                "    echo \"/dev/sdf /mnt/blockchain ext4 defaults,nofail 0 2\" >> /etc/fstab\n",
                "fi\n",
                "service docker restart\n",
                "echo ECS_CLUSTER=",
                {
                  "Ref": "SnapshotCluster"
                },
                " >> /etc/ecs/ecs.config\n"
              ]
            ]
          }
        }
      }
    },
    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "DesiredCapacity": {
          "Fn::If": [
            "IsProd",
            "2",
            "1"
          ]
        },
        "LaunchConfigurationName": {
          "Ref": "LaunchConfiguration"
        },
        "MaxSize": {
          "Fn::If": [
            "IsProd",
            "2",
            "1"
          ]
        },
        "MinSize": {
          "Fn::If": [
            "IsProd",
            "2",
            "1"
          ]
        },
        "VPCZoneIdentifier": [
          {
            "Fn::ImportValue": {
              "Fn::Sub": "${NetworkStack}-Subnet0"
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${AWS::StackName}-instance"
            },
            "PropagateAtLaunch": true
          }
        ]
      },
      "CreationPolicy": {
        "ResourceSignal": {
          "Count": {
            "Fn::If": [
              "IsProd",
              "2",
              "1"
            ]
          },
          "Timeout": "PT15M"
        }
      },
      "UpdatePolicy": {
        "AutoScalingRollingUpdate": {
          "MaxBatchSize": 1,
          "PauseTime": "PT15M",
          "SuspendProcesses": [
            "HealthCheck",
            "ReplaceUnhealthy",
            "AZRebalance",
            "AlarmNotification",
            "ScheduledActions"
          ],
          "WaitOnResourceSignals": true
        }
      }
    },
    "LaunchConfiguration": {
      "Type": "AWS::AutoScaling::LaunchConfiguration",
      "Properties": {
        "EbsOptimized": true,
        "ImageId": {
          "Fn::FindInMap": [
            "AWSRegionToAMI",
            {
              "Ref": "AWS::Region"
            },
            "AMIID"
          ]
        },
        "InstanceType": "m4.large",
        "IamInstanceProfile": {
          "Ref": "InstanceProfile"
        },
        "InstanceMonitoring": true,
        "KeyName": {
          "Fn::Sub": "ssh-${AWS::Region}"
        },
        "SecurityGroups": [
          {
            "Ref": "SecurityGroup"
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash -x\n",
                "yum install -y aws-cfn-bootstrap curl unzip\n",
                "## Install AWS CLI\n",
                "curl https://s3.amazonaws.com/aws-cli/awscli-bundle.zip -o awscli-bundle.zip\n",
                "unzip awscli-bundle.zip\n",
                "./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws\n",
                "export PATH=/usr/local/bin:$PATH\n",
                "export AWS_DEFAULT_REGION=",
                {
                  "Ref": "AWS::Region"
                },
                "\n",
                "snapID=$(curl 'https://otn5bw43if.execute-api.us-west-2.amazonaws.com/dev/getLatestSnapshot/?region=",
                {
                  "Ref": "AWS::Region"
                },
                "&cointype=",
                {
                  "Ref": "ChainType"
                },
                "')",
                "\n",
                "if [[ $snapID =~ ^snap-[a-zA-Z0-9]{17}$ ]]; then\n",
                "aws ec2 create-volume --region ",
                {
                  "Ref": "AWS::Region"
                },
                " --volume-type io1 --iops 3000 --tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value=",
                {
                  "Fn::Sub": "${AWS::StackName}-volume"
                },
                "}]' --size 600 --availability-zone ",
                {
                  "Fn::ImportValue": {
                    "Fn::Sub": "${NetworkStack}-Subnet0AZ"
                  }
                },
                " --snapshot-id $snapID\n",
                "else\n",
                "aws ec2 create-volume --region ",
                {
                  "Ref": "AWS::Region"
                },
                " --volume-type io1 --iops 3000 --tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value=",
                {
                  "Fn::Sub": "${AWS::StackName}-volume"
                },
                "}]' --size 600 --availability-zone ",
                {
                  "Fn::ImportValue": {
                    "Fn::Sub": "${NetworkStack}-Subnet0AZ"
                  }
                },
                "\n",
                "fi\n",
                "## Find device and attach it\n",
                "INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)\n",
                "VolumeId=$(aws ec2 describe-volumes --filters \"Name=tag-value,Values=",
                {
                  "Fn::Sub": "${AWS::StackName}-volume"
                },
                "\" ",
                "\"Name=status,Values=available\" --query 'Volumes[0].VolumeId' --output text); \n",
                "until [[ -b /dev/sdf ]]; \n",
                "do \n",
                "aws ec2 attach-volume --volume-id $VolumeId",
                " --instance-id $INSTANCE_ID --device /dev/sdf ",
                "|| ",
                "VolumeId=$(aws ec2 describe-volumes --filters \"Name=tag-value,Values=",
                {
                  "Fn::Sub": "${AWS::StackName}-volume"
                },
                "\" ",
                "\"Name=status,Values=available\" --query 'Volumes[0].VolumeId' --output text); \n",
                "sleep 5\n",
                "done \n",
                "mkdir -p /mnt/blockchain\n",
                "## Format device\n",
                "## If we cannot mount, make a new filesystem and try again\n",
                "mount /dev/sdf /mnt/blockchain\n",
                "if [ ! $? -eq 0 ]; then\n",
                "    echo \"making new filesystem...\"\n",
                "    mkfs -t ext4 /dev/sdf\n",
                "    mount /dev/sdf /mnt/blockchain\n",
                "else\n",
                "    echo \"mount successful on first attempt, skipping mkfs\"\n",
                "fi\n",
                "chmod -R 777 /mnt/blockchain\n",
                "## Automount configuration\n",
                "if [ -z \"$(grep /dev/sdf /etc/fstab)\" ]; then\n",
                "    echo \"/dev/sdf /mnt/blockchain ext4 defaults,nofail 0 2\" >> /etc/fstab\n",
                "fi\n",
                "    echo \"fs-bf58d076.efs.eu-west-1.amazonaws.com:/ /mnt/shared-blockchain/ nfs4 nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,_netdev 0 0 /mnt/blockchain ext4 defaults,nofail 0 2\" >> /etc/fstab\n",
                "service docker restart\n",
                "echo ECS_CLUSTER=",
                {
                  "Ref": "Cluster"
                },
                " >> /etc/ecs/ecs.config\n",
                "if [ $(aws cloudformation describe-stacks --stack-name ",
                {
                  "Ref": "AWS::StackName"
                },
                " --query 'Stacks[0].StackStatus' --output text) != UPDATE_COMPLETE ]; then \n",
                "/opt/aws/bin/cfn-signal -e $? --region ",
                {
                  "Ref": "AWS::Region"
                },
                " --stack ",
                {
                  "Ref": "AWS::StackName"
                },
                " --resource AutoScalingGroup\n",
                "fi\n"
              ]
            ]
          }
        }
      }
    },
    "InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Roles": [
          {
            "Ref": "EC2Role"
          }
        ]
      }
    },
    "EC2Role": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "ec2.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "Path": "/",
        "Policies": [
          {
            "PolicyName": "ec2-policy",
            "PolicyDocument": {
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ecs:CreateCluster",
                    "ecs:DeregisterContainerInstance",
                    "ecs:DiscoverPollEndpoint",
                    "ecs:Poll",
                    "ecs:RegisterContainerInstance",
                    "ecs:StartTelemetrySession",
                    "ecs:Submit*",
                    "ecr:*",
                    "s3:*",
                    "ec2:*",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "cloudformation:Describe*"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "Service{{ .CoinTicker }}Role": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "ecs.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "Path": "/",
        "Policies": [
          {
            "PolicyName": "ecs-policy",
            "PolicyDocument": {
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ec2:AuthorizeSecurityGroupIngress",
                    "ec2:Describe*",
                    "s3:*",
                    "elasticloadbalancing:DeregisterInstancesFromLoadBalancer",
                    "elasticloadbalancing:Describe*",
                    "elasticloadbalancing:RegisterInstancesWithLoadBalancer",
                    "elasticloadbalancing:DeregisterTargets",
                    "elasticloadbalancing:DescribeTargetGroups",
                    "elasticloadbalancing:DescribeTargetHealth",
                    "elasticloadbalancing:RegisterTargets"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    }
  },
  "Outputs": {
    "cluster": {
      "Value": {
        "Ref": "Cluster"
      }
    },
    "service{{ .CoinTicker }}": {
      "Value": {
        "Ref": "Service{{ .CoinTicker }}"
      }
    }
  }
}`))
