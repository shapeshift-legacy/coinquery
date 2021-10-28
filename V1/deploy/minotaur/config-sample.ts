import { EthereumConfig } from "../src"

export const ethereumConfig: EthereumConfig = {
  database: {
    host: "eth-blocks.<redacted>.us-east-2.rds.amazonaws.com",
    database: "eth_blocks",
    devMode: true,
    username: "cqdev",
    password: "",
    dialect: "postgres"
  },
  ethereum: {
    client: {
      http: "http://redacted.example.com:8545"
    }
  },
  blockQueue: {
    minSize: 5,
    maxSize: 10,
    maxBlockRequests: 10
  },
  interval: 15000,
  profiling: false
}
