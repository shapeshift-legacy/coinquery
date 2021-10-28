import { HttpListenerSource, HttpProviderConfig } from './exported-types';

const axios = require('axios')

const httpAgents: any = {}
const http = require('http')
const https = require('https')

const httpAgent = new http.Agent({ keepAlive: true })
const httpsAgent = new https.Agent({ keepAlive: true })

export class HttpProviderWrapper {
  private providers: any[]
  private counter: number = 0
  private config: HttpProviderConfig
  private httpListenerSource?: HttpListenerSource

  private inc(): number {
    const value = this.counter
    this.counter = (this.counter + 1) % this.providers.length
    return value
  }

  constructor(providers: any[], config: HttpProviderConfig, httpListenerSource?: HttpListenerSource) {
    this.providers = providers
    this.config = config
    this.httpListenerSource = httpListenerSource
  }

  getHost(): any {
    return this.providers[this.inc()].host
  }

  isConnected(): boolean {
    const provider = this.providers[this.counter]
    return provider.isConnected.call(provider)
  }

  send(payload: any) {
    throw new Error('Calling web3 syncronously is disabled for this application.')
  }

  sendAsync(payload: any, callback: any) {
    const providerIndex = this.counter
    const provider = this.providers[this.inc()]
    const onResponse = this.httpListenerSource
      ? this.httpListenerSource({ payload, providerIndex, provider })
      : undefined

    const callback2 = (...args: any[]) => {
      if (onResponse)
        onResponse()

      const error = args[0]
      if (error) {
        console.error('Web3 http error. Trying again', provider.host, payload.method)
        setTimeout(() => this.sendAsync(payload, callback), 1000)
      }
      else {
        callback(...args)
      }
    }
    axios({
      httpAgent,
      httpsAgent,
      method: 'post',
      url: provider.host,
      data: payload,
    })
      .then((response: any) => {
        callback2(null, response.data)
      })
      .catch((error: any) => {
        callback2(error)
      })
    // return provider.sendAsync.call(provider, payload, callback2)
  }
}
