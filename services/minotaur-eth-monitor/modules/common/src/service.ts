import { Cron } from 'common/src/cron'
import { logger, setServiceName } from 'common/src/winston/winston-loggers'
import { batchUpsert, getEndBlock, IndexRange, ValidationRecord } from 'common'
import { CommonModel } from './types'
import { Trellis } from 'vineyard-data/legacy';

export interface ServiceRecord<State extends ServiceState> {
  name: string
  enabled: boolean
  state: State
}

export interface ServiceState {
  enabled: boolean
  readonly interval: number
}

export interface BlockServiceFields {
  readonly blockIndex: number
  readonly step: number
  readonly batchSize: number
  readonly floor?: number // Temporarily defaults to zero.  Should have no default when bitcoin is using this.
}

export interface ValidationServiceState extends BlockServiceState {
  readonly pass: number
}

export type BlockServiceState = ServiceState & BlockServiceFields

export interface ServiceResult<State extends ServiceState> {
  shouldContinue: boolean
  state: State
}

export type ServiceAction<State extends ServiceState> = (state: State) => Promise<ServiceResult<State>>

export type ServiceActionSource<State extends ServiceState> = (state: State) => Promise<ServiceAction<State>>

export async function setServiceBlockIndex(model: CommonModel, serviceName: string, index: number): Promise<void> {
  await model.Service.update({ name: serviceName, blockIndex: index })
}

export async function getServiceRecord<State extends ServiceState>(model: CommonModel, serviceName: string): Promise<ServiceRecord<State> | undefined> {
  return await model.Service.first({ name: serviceName })
}

export async function getServiceState<State extends ServiceState>(model: CommonModel, serviceName: string): Promise<State | undefined> {
  const serviceRecord = await getServiceRecord<State>(model, serviceName)
  return serviceRecord
    ? Object.assign(serviceRecord.state, { enabled: serviceRecord.enabled })
    : undefined
}

export function logEnabledChange(serviceName: string, enabled: boolean) {
  const message = enabled
    ? 'Service is enabled, starting service'
    : 'Service is disabled'

  logger.log({
    level: 'info',
    title: `Service '${serviceName}'`,
    message
  })
}

export async function innerServiceLoop<State extends ServiceState>(model: CommonModel, name: string, actionSource: ServiceActionSource<State>) {
  let enabled = true
  try {
    const initialState = await getServiceState<State>(model, name)
    const action = await actionSource(initialState!)

    while (true) {
      const state = (await getServiceState<State>(model, name))!
      if (state.enabled != enabled)
        logEnabledChange(name, state.enabled)

      if (!state.enabled)
        break

      enabled = state.enabled
      const result = await action(state)
      const newState = Object.assign({}, result.state)
      delete newState.enabled
      await model.Service.update(name, { state: newState })
      if (!result.shouldContinue)
        break
    }
  } catch (error) {
    logger.log({
      level: 'error',
      title: `Service '${name}' outer service loop`,
      message: `${error.stack}`
    })
  }
  console.log('exiting inner monitor loop')
}

export async function startServiceCron<State extends ServiceState>(model: CommonModel, name: string, actionSource: ServiceActionSource<State>) {
  const serviceNameIndex = process.argv.indexOf('--serviceName')
  const serviceName = serviceNameIndex != -1
    ? process.argv[serviceNameIndex + 1] || name
    : name
  setServiceName(serviceName)

  logger.log({
    level: 'info',
    title: `Service '${serviceName}'`,
    message: 'Starting outer service loop'
  })

  const state = await getServiceState<State>(model, serviceName)
  if (!state)
    throw new Error(`Missing database record for service ${serviceName}`)

  const serviceCron = new Cron(
    [
      {
        name: 'Service Cron',
        action: () => innerServiceLoop(model, serviceName, actionSource)
      }
    ],
    state.interval
  )
  serviceCron.start()
}

export function getTruncatedBatchSize(state: BlockServiceFields, endBlock: number): number {
  const floor = typeof state.floor === 'number'
    ? state.floor
    : 0

  const boundedSize = state.step > 0
    ? endBlock - state.blockIndex
    : state.blockIndex - floor

  const size = Math.min(boundedSize, state.batchSize)

  return size < 0 ? 0 : size
}

export type BlockActionOld<State extends BlockServiceState> = (state: State, batchSize: number) => Promise<ServiceResult<State>>

export type BlockActionSourceOld<State extends BlockServiceState> = (state: State) => Promise<BlockActionOld<State>>

// Strongly typed, slightly simpler Object.assign modeled after Kotlin's copy method.
export function copy<A extends B, B>(a: A, b: B): A {
  return Object.assign({}, a, b)
}

export function blockServiceOld<State extends BlockServiceState>(model: CommonModel, actionSource: BlockActionSourceOld<State>): ServiceActionSource<State> {
  return async (state: State) => {
    const action = await actionSource(state)
    const endBlock = await getEndBlock(model.ground, state.step)
    return async (state: State) => {
      const batchSize = getTruncatedBatchSize(state, endBlock)
      if (batchSize === 0) {
        return {
          state,
          shouldContinue: false
        }
      }
      else {
        const result = await action(state, batchSize)
        const newState = copy(result.state, {
          blockIndex: state.blockIndex + batchSize
        })
        return copy(result, {
          state: newState
        })
      }
    }
  }
}

export type BlockAction<State extends BlockServiceState> = (state: State, range: IndexRange) => Promise<ServiceResult<State>>

export type BlockActionSource<State extends BlockServiceState> = (state: State) => Promise<BlockAction<State>>

export function validateBlockState(state: BlockServiceState): string[] {
  const result: string[] = []
  if (state.step !== -1 && state.step !== 1)
    result.push('state.step must be 1 or -1')

  return result
}

export function rangeFromPoints(points: number[]): IndexRange {
  return {
    start: points[0],
    end: points[1]
  }
}

export function blockService<State extends BlockServiceState>(model: CommonModel, actionSource: BlockActionSource<State>): ServiceActionSource<State> {
  return async (state: State) => {
    const action = await actionSource(state)
    const endBlock = await getEndBlock(model.ground, state.step)
    return async (state: State) => {
      const errors = validateBlockState(state)
      if (errors.length > 0)
        throw new Error(errors[0])

      const batchSize = getTruncatedBatchSize(state, endBlock)
      if (batchSize === 0) {
        return {
          state,
          shouldContinue: false
        }
      }
      else {
        const range = rangeFromPoints([
          state.blockIndex,
          state.blockIndex + (batchSize - 1) * state.step
        ].sort())

        const result = await action(state, range)
        const newState = copy(result.state, {
          blockIndex: state.blockIndex + batchSize * state.step
        })
        return copy(result, {
          state: newState
        })
      }
    }
  }
}

export type ValidationResult = ValidationRecord[]

export type ValidationAction<State extends BlockServiceState> = (state: State, batchSize: number) => Promise<ValidationResult>

export type ValidationActionSource<State extends BlockServiceState> = (state: State) => Promise<ValidationAction<State>>

export function validationService<State extends ValidationServiceState>(model: CommonModel, trellis: Trellis, action: ValidationAction<State>): ServiceActionSource<State> {
  return blockServiceOld(model, async (state: State) => {
    return async (state: State, batchSize: number) => {
      const records = await action(state, batchSize)
      await batchUpsert(model.ground, trellis, records)
      return {
        state,
        shouldContinue: true
      }
    }
  })
}

export function serviceActionSource<State extends ServiceState>(action: ServiceAction<State>): ServiceActionSource<State> {
  return async (state: State) => {
    return async () => {
      const result = await action(state)
      return result
    }
  }
}