const AWS = require('aws-sdk');
const { REGIONS } = require('./constants.js');
const { daysBetween } = require('./utils.js');

const getVolumes = async (region, ec2) => {
  const volumeParams = {
    Filters: [{ Name: 'status', Values: ['available'] }],
  };
  let regionVolumes;

  try {
    regionVolumes = await ec2.describeVolumes(volumeParams).promise();
  } catch (err) {
    console.error(`Error retreiving volumes in ${region}: ${err}`);
    regionVolumes = [];
  }

  return regionVolumes;
};

const getSnapshots = async (region, ec2) => {
  const snapshotParams = {
    Filters: [{ Name: 'owner-id', Values: [process.env.OWNER_ID] }],
  };
  let regionSnapshots;

  try {
    regionSnapshots = await ec2.describeSnapshots(snapshotParams).promise();
  } catch (err) {
    console.error(`Error retreiving snapshots in ${region}: ${err}`);
    regionSnapshots = [];
  }

  return regionSnapshots;
};

const removeUnusedVolumes = async (volumes, ec2) => {
  const volumePromises = volumes.map(async (volume) => {
    try {
      await ec2.deleteVolume({ VolumeId: volume.VolumeId }).promise();
    } catch (err) {
      console.error(`Error removing volume: ${volume.VolumeId} - Err: ${err}`);
    }
  });

  await Promise.all(volumePromises);
};

const removeOldSnapshots = async (snapshots, ec2) => {
  const currentDate = new Date();

  const snapshotPromises = snapshots.map(async (snapshot) => {
    const snapshotDate = new Date(snapshot.StartTime);

    if (daysBetween(currentDate, snapshotDate) > process.env.DAYS) {
      try {
        await ec2.deleteSnapshot({ SnapshotId: snapshot.SnapshotId }).promise();
      } catch (err) {
        console.error(
          `Error removing snapshot: ${snapshot.SnapshotId}. Err: ${err}`,
        );
      }
    }
  });

  await Promise.all(snapshotPromises);
};

const sanitizeByRegion = async () => {
  const regionPromises = REGIONS.map(async (region) => {
    AWS.config.update({ region });

    const ec2 = new AWS.EC2();
    const regionVolumes = await getVolumes(region, ec2);
    const regionSnapshots = await getSnapshots(region, ec2);

    await removeUnusedVolumes(regionVolumes.Volumes, ec2);
    await removeOldSnapshots(regionSnapshots.Snapshots, ec2);
  });

  await Promise.all(regionPromises);
};

// main lambda function
const sanitizeAws = async () => {
  await sanitizeByRegion();
  return { message: 'AWS successfully cleaned up.' };
};

module.exports = { sanitizeAws };
