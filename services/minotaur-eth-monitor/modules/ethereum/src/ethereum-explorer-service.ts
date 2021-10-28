import { createPartitionConfig, EthereumBlockReader, HttpListenerSource } from './web3'
import {
  createEthereumExplorerDao,
  EthereumModel,
  getEthereumExplorerSchema,
  saveFullBlocks
} from './ethereum-explorer'
import { ContractTransaction, EthereumBlock, EthereumConfig, PartitionConfig } from './types'
import {
  blockchain, BlockServiceState,
  createBlockQueue,
  createVillage,
  EmptyProfiler, getServiceRecord,
  logger,
  MinotaurVillage,
  OptionalMonitorConfig,
  Profiler,
  scanBlocks, scanBlocks2,
  Service,
  ServiceActionSource,
  ServiceRecord, ServiceState,
  SimpleProfiler
} from 'common'
import { MonitorConfig } from '../../common/src/types';

export type EthereumVillage = MinotaurVillage<EthereumModel, EthereumConfig>

export async function prepareEthereumMonitor(
  village: EthereumVillage,
  config: OptionalMonitorConfig,
  httpListenerSource?: HttpListenerSource
): Promise<any> {
  throw new Error('This method of ethereum monitoring is no longer supported.')
}

export async function startEthereumMonitor(
  village: EthereumVillage,
  config: OptionalMonitorConfig,
  partition: PartitionConfig
) {
  throw new Error('This method of ethereum monitoring is no longer supported.')
}

export async function startEthereumMonitor2(elements: any) {
  throw new Error('This method of ethereum monitoring is no longer supported.')
}

export function createEthereumVillage(config: EthereumConfig): Promise<EthereumVillage> {
  return createVillage(getEthereumExplorerSchema(), config)
}

type BlockBundle = blockchain.BlockBundle<EthereumBlock, ContractTransaction>

export function ethereumMonitorServiceActionSource(
  village: EthereumVillage,
  config: MonitorConfig,
  partition: PartitionConfig,
  client = EthereumBlockReader.createFromConfig(village.config.ethereum.client)
): ServiceActionSource<BlockServiceState> {
  const defaults = {
    minConfirmations: 12
  }
  const appliedConfig = Object.assign({}, defaults, config)
  const model = village.model
  const partitionConfig = createPartitionConfig(partition)
  const saver = (blocks: BlockBundle[], profiler2: Profiler) =>
    saveFullBlocks(model.ground, blocks, profiler2, partitionConfig)
  return async (state: BlockServiceState) => {
    console.log(state.blockIndex)
    const blockQueue = await createBlockQueue(client, appliedConfig.queue, appliedConfig.minConfirmations, state.blockIndex)

    return async (state: BlockServiceState) => {
      const dao = createEthereumExplorerDao(model)
      const profiler = appliedConfig.profiling ? new SimpleProfiler() : new EmptyProfiler()
      const result = await scanBlocks2(blockQueue, state, saver, dao.ground, dao.lastBlockDao, appliedConfig, profiler, model)
      profiler.logFlat()
      return result
    }
  }
}