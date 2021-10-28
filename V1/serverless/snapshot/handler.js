const request = require('requestretry');
const AWS = require('aws-sdk');
const signale = require('signale');
const { REGIONS } = require('./constants.js');

async function getAllInstances(region) {
  AWS.config.update({ region });

  const ec2 = new AWS.EC2();
  const params = {
    Filters: [{ Name: 'tag:InstanceJob', Values: ['Snapshotter'] }],
  };

  try {
    const data = await ec2.describeInstances(params).promise();
    const reservationsCount = data.Reservations.length;
    const instances = [];

    if (reservationsCount >= 1) {
      for (let index = 0; index < reservationsCount; index += 1) {
        instances.push(...data.Reservations[index].Instances);
      }
    }

    return instances;
  } catch (err) {
    throw new Error('No reservations.');
  }
}

async function shutdownInstance(instanceId, region) {
  AWS.config.update({ region });

  const ec2 = new AWS.EC2();
  const params = { InstanceIds: [instanceId] };

  try {
    const data = await ec2.stopInstances(params).promise();

    await ec2.waitFor('instanceStopped', params).promise();
    return data;
  } catch (err) {
    throw err;
  }
}

async function startInstance(instanceId, region) {
  AWS.config.update({ region });

  const ec2 = new AWS.EC2();
  const params = { InstanceIds: [instanceId] };

  try {
    const data = await ec2.startInstances(params).promise();

    await ec2.waitFor('instanceRunning', params).promise();
    return data;
  } catch (err) {
    throw err;
  }
}

async function snapshotVolumeId(
  volumeId,
  stackName,
  currentBlockNumber,
  chaintype,
  region,
) {
  AWS.config.update({ region });

  const ec2 = new AWS.EC2();
  const params = {
    TagSpecifications: [
      {
        ResourceType: 'snapshot',
        Tags: [
          { Key: 'Name', Value: stackName },
          { Key: 'Blockchain', Value: 'true' },
          { Key: 'Blocknumber', Value: currentBlockNumber },
          { Key: 'Chaintype', Value: chaintype },
        ],
      },
    ],
    VolumeId: volumeId,
    Description: `Bockchain at block number: ${currentBlockNumber}`,
  };

  try {
    const data = await ec2.createSnapshot(params).promise();

    return data;
  } catch (err) {
    throw err;
  }
}

async function requestBlockNumber(url) {
  try {
    const res = await request({
      method: 'GET',
      timeout: 2000,
      maxAttempts: 5,
      retryDelay: 1000,
      retryStrategy: request.RetryStrategies.HTTPOrNetworkError,
      uri: url,
      json: true,
      fullResponse: false,
    });

    return res;
  } catch (err) {
    throw err;
  }
}

async function getCurrentBlockNumber(ip, chainType) {
  let url = `http://${ip}`;
  let keyName;

  if (chainType.toUpperCase() === 'GETH' || 
      chainType.toUpperCase() === 'GETH_ARCHIVAL' ||
      chainType.toUpperCase() === 'PARITY') {
    url += ':8000/api?module=proxy&action=eth_blockNumber&apikey=42';
    keyName = 'result';
  } else if (chainType.toUpperCase() === 'DOGE') {
    url += ':3001/api/status';
    keyName = 'info.blocks';
  } else {
    url += ':3001/api/sync';
    keyName = 'height';
  }

  try {
    const blockNumberObject = await requestBlockNumber(url);
    const blockNumber = chainType.toUpperCase() === 'DOGE'
      ? blockNumberObject[keyName.split('.')[0]][keyName.split('.')[1]]
      : blockNumberObject[keyName];

    return blockNumber;
  } catch (err) {
    throw err;
  }
}

async function findLatest(snapshots) {
  const latestSnapshot = { snapshot: snapshots[0], blockNumber: 0 };
  const snapshotsCount = snapshots.length;

  for (let index = 0; index < snapshotsCount; index += 1) {
    const snapshotAtIndex = snapshots[index];
    const snapshotTagsLength = snapshotAtIndex.Tags.length;

    for (let tagIndex = 0; tagIndex < snapshotTagsLength; tagIndex += 1) {
      const snapshotTag = snapshotAtIndex.Tags[tagIndex];

      if (snapshotTag.Key === 'Blocknumber') {
        if (parseInt(snapshotTag.Value) > latestSnapshot.blockNumber) {
          latestSnapshot.snapshot = snapshotAtIndex;
          latestSnapshot.blockNumber = parseInt(snapshotTag.Value);
        }
      }
    }

    if (index + 1 === snapshotsCount) return latestSnapshot.snapshot;
  }

  throw new Error('no snapshots named that');
}

async function getLatestSnapshot(event, context, callback) {
  const { region } = event.queryStringParameters;
  const coinType = event.queryStringParameters.cointype;

  AWS.config.update({ region });

  const ec2 = new AWS.EC2();
  const params = {
    Filters: [
      {
        Name: 'tag:Blockchain',
        Values: ['true'],
      },
      {
        Name: 'tag:Chaintype',
        Values: [coinType],
      },
      {
        Name: 'status',
        Values: ['completed'],
      },
    ],
  };

  try {
    const data = await ec2.describeSnapshots(params).promise();
    const latestSnapshot = await findLatest(data.Snapshots);
    const response = { body: latestSnapshot.SnapshotId };

    callback(null, response);
  } catch (err) {
    callback(err, undefined);
  }
}

// main lambda function
async function snapshot() {
  signale.watch('Starting...');

  const regionPromises = REGIONS.map(async (region) => {
    let allInstances;

    try {
      allInstances = await getAllInstances(region);

      if (allInstances) {
        signale.success(`Found ${allInstances.length} instances in ${region}.`);
      } else {
        signale.success(`Found 0 instances in ${region}.`);
        return `no instances in ${region}`;
      }
    } catch (err) {
      signale.fatal(`Couldn't get instances in ${region}.`);
      return `${err.toString()} in ${region}`;
    }

    const instancePromises = allInstances.map(async (instance) => {
      const instanceId = instance.InstanceId;
      const instanceState = instance.State.Name;
      let currentBlockNumber = '-1';
      let chainType;

      if (instanceState === 'running') {
        const ip = instance.PublicIpAddress;
        chainType = instance.Tags.find(tag => tag.Key === 'ChainType').Value;

        try {
          currentBlockNumber = await getCurrentBlockNumber(ip, chainType);
          await shutdownInstance(instanceId, region);
        } catch (err) {
          signale.fatal(
            `could not retrieve blockNumber or shutdown instance for ${ip} in ${region}`,
          );
        }

        const volumeId = instance.BlockDeviceMappings.find(o => (
          o.DeviceName === '/dev/sdf'
        )).Ebs.VolumeId;

        const stackName = instance.Tags.find(tag => (
          tag.Key === 'aws:cloudformation:stack-name'
        )).Value;

        try {
          await snapshotVolumeId(
            volumeId,
            stackName,
            currentBlockNumber.toString(),
            chainType,
            region,
          );
        } catch (err) {
          signale.fatal(
            `Failed snapshotting volume ${volumeId} for stack ${stackName} in ${region}.`,
          );
        }

        try {
          await startInstance(instanceId, region);
        } catch (err) {
          signale.fatal(`Failed start Instance ${instanceId} in ${region}.`);
        }

        return `${stackName} in ${region}`;
      }

      const stackName = instance.Tags.find(tag => (
        tag.Key === 'aws:cloudformation:stack-name'
      )).Value;

      return `${stackName} not running.`;
    });

    const allPromises = await Promise.all(instancePromises);

    return allPromises;
  });

  const rp = await Promise.all(regionPromises);

  signale.success('Results:');
  rp.forEach(val => console.log(val));
  signale.complete('Finished!');

  return rp;
}

module.exports = {
  getAllInstances,
  shutdownInstance,
  startInstance,
  snapshotVolumeId,
  requestBlockNumber,
  getCurrentBlockNumber,
  findLatest,
  getLatestSnapshot,
  snapshot,
};
