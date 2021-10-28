#!/bin/bash -x

echo "==================================================="
echo " BEGIN USERDATA SCRIPT"
echo "==================================================="

# variables
REGION=$1
CHAIN_TYPE=$2
STACK_N_VOLUME=$3
VOLUME_SIZE=$4
NETWORK_STACK=$5
ECS_CLUSTER=$6
STACK_NAME=$7

yum install -y aws-cfn-bootstrap curl unzip

export AWS_DEFAULT_REGION=$REGION
snapID=$(curl "https://<redacted>.execute-api.us-west-2.amazonaws.com/dev/getLatestSnapshot/?region=$REGION&cointype=$CHAIN_TYPE")

if [[ $snapID =~ ^snap-[a-zA-Z0-9]{17}$ ]]; then
    aws ec2 create-volume --region $REGION --volume-type gp2 --tag-specifications "ResourceType=volume,Tags=[{Key=Name,Value=${STACK_N_VOLUME}}]" --size $VOLUME_SIZE --availability-zone $NETWORK_STACK --snapshot-id $snapID
else
    aws ec2 create-volume --region $REGION --volume-type gp2 --tag-specifications "ResourceType=volume,Tags=[{Key=Name,Value=${STACK_N_VOLUME}}]" --size $VOLUME_SIZE --availability-zone $NETWORK_STACK
fi

## Find device and attach it
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
VolumeId=$(aws ec2 describe-volumes --filters "Name=tag-value,Values=${STACK_N_VOLUME}" "Name=status,Values=available" --query 'Volumes[0].VolumeId' --output text);
until [[ -b /dev/sdf ]]; 
do
aws ec2 attach-volume --volume-id $VolumeId --instance-id $INSTANCE_ID --device /dev/sdf || VolumeId=$(aws ec2 describe-volumes --filters "Name=tag-value,Values=${STACK_N_VOLUME}" "Name=status,Values=available" --query 'Volumes[0].VolumeId' --output text); 
sleep 5
done
mkdir -p /mnt/blockchain

## Format device
## If we cannot mount, make a new filesystem and try again
mount /dev/sdf /mnt/blockchain

if [ ! $? -eq 0 ]; then
    echo "making new filesystem..."
    mkfs -t ext4 /dev/sdf
    mount /dev/sdf /mnt/blockchain
else
    echo "mount successful on first attempt, skipping mkfs"
fi

chmod -R 777 /mnt/blockchain

## Automount configuration
if [ -z "$(grep /dev/sdf /etc/fstab)" ]; then
    echo "/dev/sdf /mnt/blockchain ext4 defaults,nofail 0 2" >> /etc/fstab
fi
    echo "<redacted>.efs.eu-west-1.amazonaws.com:/ /mnt/shared-blockchain/ nfs4 nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,_netdev 0 0 /mnt/blockchain ext4 defaults,nofail 0 2" >> /etc/fstab

service docker restart

echo ECS_CLUSTER=$ECS_CLUSTER >> /etc/ecs/ecs.config

if [ $(aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].StackStatus' --output text) != UPDATE_COMPLETE ]; then 
    /opt/aws/bin/cfn-signal -e $? --region $REGION --stack $STACK_NAME --resource AutoScalingGroup
fi

echo "==================================================="
echo " END USERDATA SCRIPT"
echo "==================================================="
echo ".."
echo ".."
