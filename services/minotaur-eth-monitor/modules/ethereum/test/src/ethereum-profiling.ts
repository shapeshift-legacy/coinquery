import { ConcurrentProfiler } from 'common';
import { HttpListenerSource, HttpProviderEvent } from '../../src'

function formatCounts(counts: number[]): string {
  return counts.map(c => c.toString().padStart(3, ' '))
    .join(' ')
}

export class EthereumHttpProfiler {
  private requestCounts: number[]
  private profiler = new ConcurrentProfiler()
  blockQueue: any
  private active = true

  constructor(providerCount: number) {
    this.requestCounts = new Array(providerCount).fill(0)
  }

  stop() {
    this.active = false
  }

  getHttpListenerSource(): HttpListenerSource {
    return (event: HttpProviderEvent) => {
      if (!this.active)
        return () => {
        }

      this.requestCounts[event.providerIndex]++
      logStuff(event, this.blockQueue, this.requestCounts)
      const host = event.provider.host
      const method = event.payload.method
      const finishedCallbacks = [
        'h  ' + host,
        'm ' + method,
        'mh ' + method + ' ' + host
      ]
        .map(name => this.profiler.start(name))

      return () => {
        this.requestCounts[event.providerIndex]--
        finishedCallbacks.forEach(finished => finished())
      }
    }
  }

  log() {
    this.profiler.log()
  }
}

export function logStuff(event: HttpProviderEvent, blockQueue: any, requestCounts: number[]) {
  if (!blockQueue) {
    return
  }

  const hostString = event.provider.host.toString().padEnd(30, ' ')
  const blockRequestCount = blockQueue.getRequestCount().toString().padStart(2, ' ')
  const blockReadyBlockCount = blockQueue.getReadyBlockCount().toString().padStart(2, ' ')
  const blockConsecutiveBlockCount = blockQueue.getConsecutiveBlockCount().toString().padStart(2, ' ')
  const readyBlocks = blockQueue.getReadyBlocks()
  const readyBlockString = readyBlocks
    .map((b: any) => b.index)
    .sort()
    .map((i: number) => {
      const bundle = readyBlocks.filter((b: any) => b.block.block.index === i)[0]
      return '' + i + '(' + bundle.block.transactions.length + ')'
    })
    .join(', ')

  console.log(
    'web3-request',
    formatCounts(requestCounts),
    hostString,
    blockRequestCount,
    blockReadyBlockCount,
    blockConsecutiveBlockCount,
    event.payload.method.padEnd(26, ' '),
    readyBlockString
  )
}
