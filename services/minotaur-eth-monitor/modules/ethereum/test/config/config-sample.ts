import { EthereumConfig } from '../../src'

export const ethereumConfig: EthereumConfig = {
  blockQueue: {
    minSize: 5,
    maxSize: 10,
    maxBlockRequests: 10
  },
  database: {
    host: 'localhost',
    database: 'vineyard_minotaur_dev',
    devMode: true,
    username: '',
    password: '',
    dialect: 'postgres'
  },
  ethereum: {
    client: {
      http: ''
    }
  }
}
