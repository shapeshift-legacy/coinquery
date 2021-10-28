module.exports = {
  btg: {
    symbol: 'BTG',
    deltaBlocks: 4, // 40 minutes (at 10min avg block time)
    opsGenieIncidentKey: '1046',
    refURL: 'https://btgexplorer.com/api/sync',
    cqURL: 'https://btg.redacted.example.com/api/status',
    refKeyName: 'blockChainHeight',
    cqKeyName: 'info.blocks',
    blockNumberEndpoint: 'api/status',
    syncEndpoint: 'api/sync',
    stack: '*btg*',
    cqApiPort: '3001'
  },
  dash: {
    symbol: 'DASH',
    deltaBlocks: 8,  // 20 minutes (at 2.5min avg block time)
    opsGenieIncidentKey: '1045',
    refURL: 'https://insight.dash.org/api/sync',
    cqURL: 'https://dash.redacted.example.com/api/status',
    refKeyName: 'blockChainHeight',
    cqKeyName: 'info.blocks',
    blockNumberEndpoint: 'api/status',
    syncEndpoint: 'api/sync',
    stack: '*dash*',
    cqApiPort: '3001'
  },
  doge: {
    symbol: 'DOGE',
    deltaBlocks: 20,  // 20 minutes (at 1min avg block time)
    opsGenieIncidentKey: '1049',
    refURL: 'https://chain.so/api/v2/get_info/doge',
    cqURL: 'https://doge.redacted.example.com/api/status',
    refKeyName: 'data.blocks',
    cqKeyName: 'info.blocks',
    blockNumberEndpoint: 'api/status',
    syncEndpoint: 'api/sync',
    stack: '*doge*',
    cqApiPort: '3001'
  }
}
