const AWSMock = require('aws-sdk-mock');
const AWS = require('aws-sdk');
const handler = require('../handler');

beforeEach(() => {
  AWSMock.setSDKInstance(AWS);
});

afterEach(() => {
  AWSMock.restore();
});

describe('hander', () => {
  it('should be able to retrieve all instances for a given region', async () => {
    const region = 'ca-central-1';
    const instances = await handler.getAllInstances(region);
    const mockReservations = {
      Reservations: [{
        AmiLaunchIndex: 0,
        ImageId: 'ami-897ff9ed',
        InstanceId: 'i-0c34ccd58bbf4b8e3',
        InstanceType: 'm4.large',
        KeyName: 'ssh-ca-central-1',
        LaunchTime: '2018-06-22T19:18:40.000Z',
        Monitoring: { State: 'disabled' },
        Placement:
          {
            AvailabilityZone: 'ca-central-1a',
            GroupName: '',
            Tenancy: 'default'
          },
        PrivateDnsName: 'ip-10-0-0-227.ca-central-1.compute.internal',
        ElasticGpuAssociations: [],
        NetworkInterfaces: [],
        RootDeviceName: '/dev/xvda',
        RootDeviceType: 'ebs',
        SecurityGroups: [],
        SourceDestCheck: true,
        VirtualizationType: 'hvm',
        CpuOptions: { CoreCount: 1, ThreadsPerCore: 2 },
      },]
    };
    AWSMock.mock('EC2', 'describeInstances', (params, callback) => callback(null, mockReservations));
    expect(instances.length).toBeGreaterThan(0);
  });

  it('should resolve with empty array if no reservation in a given region', async () => {
    const region = 'ca-central-1';
    AWSMock.mock('EC2', 'describeInstances', (params, callback) => callback(null, { Reservations: [] }));
    await expect(handler.getAllInstances(region)).resolves.toEqual([]);
  });

  it('should be able to snapshot an instance\'s volume', async () => {
    const volumeId = 'vol-06f072b4034339aaa';
    const stackName = 'cq-bch-p0001-dev-snapshot-instance'
    const currentBlockNumber = '500000';
    const chaintype = 'BCH'
    const region = 'ca-central-1';
    const mockAwsSuccessResponse = {
      Description: 'Bockchain at block number:5000',
      Encrypted: false,
      OwnerId: '486379091271',
      Progress: '',
      SnapshotId: 'snap-008c2bcd1f78b6663',
      StartTime: '2018-06-25T17:15:06.000Z',
      State: 'pending',
      VolumeId: 'vol-06f072b4034339aaa',
      VolumeSize: 8,
      Tags: [
        { Key: 'Blocknumber', Value: '500000' },
        { Key: 'Blockchain', Value: 'true' },
        { Key: 'Chaintype', Value: 'BCH' },
        { Key: 'Name', Value: 'cq-bch-p0001-dev-snapshot-instance' }
      ],
    };
    AWSMock.mock('EC2', 'createSnapshot', (params, callback) => callback(null, mockAwsSuccessResponse));
    // partial match fields above...
    await expect(handler.snapshotVolumeId(volumeId, stackName, currentBlockNumber, chaintype, region))
      .resolves.toEqual(expect.objectContaining({
        State: 'pending',
        Tags: [
          { Key: 'Blocknumber', Value: '500000' },
          { Key: 'Blockchain', Value: 'true' },
          { Key: 'Chaintype', Value: 'BCH' },
          { Key: 'Name', Value: 'cq-bch-p0001-dev-snapshot-instance' }
        ],
      }));
  });

  xit('should be able to retrieve latest block', async () => {
    const chainType = 'ZEC';
    const ip = 'redacted.example.com';
    const height = 355418;
    const spy = jest.spyOn(handler, 'requestBlockNumber').mockImplementation(async (_) => ({
      "status": "FOOBAR",
      "blockChainHeight": 530599,
      "syncPercentage": 100,
      height,
      "error": null,
      "type": "bitcore node",
    }));
    expect(await handler.getCurrentBlockNumber(ip, chainType)).toEqual(height);
    expect(handler.requestBlockNumber).toBeCalledWith('http://redacted.example.com:3001/api/sync');
    spy.mockClear();
  });

  xit('should be able to retrieve the lastest DOGE block', async () => {
    const chainType = 'DOGE';
    const ip = 'redacted.example.com';
    const height = 10000;
    const spy = jest.spyOn(handler, 'requestBlockNumber').mockImplementation(async (_) => ({
      "info": {
        "version": 1100000,
        "protocolversion": 70004,
        "walletversion": 60000,
        "balance": 0,
        "blocks": height,
        "timeoffset": -1,
        "connections": 8,
        "proxy": "",
        "difficulty": 3475982.10172235,
        "testnet": false,
        "keypoololdest": 1530567170,
        "keypoolsize": 101,
        "paytxfee": 0,
        "relayfee": 1,
        "errors": ""
      }
    }));
    expect(await handler.getCurrentBlockNumber(ip, chainType)).toEqual(height);
    expect(handler.requestBlockNumber).toBeCalledWith('http://redacted.example.com:3100/api/status');
    spy.mockClear();
  });

  xit('should be able respond accordingly if no latest snapshot is available', async () => {
    const region = 'ca-central-1';
    const cointype = 'ABC'; // no such coin stack
    const context = {};
    const event = {
      queryStringParameters: {
        region,
        cointype,
      },
    };
    AWSMock.mock('EC2', 'describeSnapshots', (params, callback) => callback(null, { Snapshots: [] }));
    await handler.getLatestSnapshot(event, context, function(err, resp) {
      expect(err).toBeNull();
      expect(resp.body).toBe(`Zero completed instances for ${cointype}`);
    });
  });

  it('should be able to retrieve latest snapshot when available', async () => {
    const region = 'ca-central-1';
    const cointype = 'LTC';
    const context = {};
    const event = {
      queryStringParameters: {
        region,
        cointype,
      },
    };
    const SnapshotId = 'snap-053bfab4a3cf47ec8'
    AWSMock.mock('EC2', 'describeSnapshots', (params, callback) => callback(null, {
      Snapshots: [
        {
          Description: 'Bockchain at block number:1441712',
          Encrypted: false,
          OwnerId: '486379091271',
          Progress: '100%',
          SnapshotId,
          StartTime: '2018-06-18T18:49:10.000Z',
          State: 'completed',
          VolumeId: 'vol-09585cf739f9921fa',
          VolumeSize: 600,
          Tags: [],
        },
      ]
    }));
    await handler.getLatestSnapshot(event, context, (err, resp) => {
      expect(err).toBeNull();
      expect(resp.body).toEqual('snap-053bfab4a3cf47ec8');
    });
  });

  // ****
  // NOTE: this test will create snapshots for a given region, therefore its disabled
  // ****

  xit('should be able to snapshot regions', async () => {
    const regions = ['ap-northeast-1'];
    const context = {};
    const event = {
      pathParameters: {
        regions,
      },
    };
    const getCurrentBlockNumberSpy = jest.spyOn(handler, 'getCurrentBlockNumber');
    const listTasksPerClustersInRegionSpy = jest.spyOn(handler, 'listTasksPerClustersInRegion');
    const stopTasksSpy = jest.spyOn(handler, 'stopTasks');
    const snapshotVolumeIdSpy = jest.spyOn(handler, 'snapshotVolumeId');
    await handler.snapshot(event, context, function(err, resp) {
      expect(err).toBeNull();
      expect(getCurrentBlockNumberSpy).toHaveBeenCalled();
      expect(listTasksPerClustersInRegionSpy).toHaveBeenCalled();
      expect(stopTasksSpy).toHaveBeenCalled();
      expect(snapshotVolumeIdSpy).toHaveBeenCalled();

    });
  }, 10000);
});
