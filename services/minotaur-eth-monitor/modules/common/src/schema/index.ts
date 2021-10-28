// export interface Trellis {
//   primary_keys?: string[]
//   properties: any
// }
//
// export interface FullSchema {
//   Transaction: Trellis
// }

// export function getFullMinotaurSchema(): any {
//   return require('./schema.json')
// }
//
// export function getEthereumExplorerSchema(): any {
//   return require('../../../ethereum/src/schema/ethereum-explorer-schema.json')
// }
//
// export function getBitcoinExplorerSchema(): any {
//   return require('../../../bitcoin/src/bitcoin-explorer-schema.json')
// }

// export type Diff<T extends string, U extends string> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T];
// export type Omit<T, K extends keyof T> = { [P in Diff<keyof T, K>]: T[P] };
