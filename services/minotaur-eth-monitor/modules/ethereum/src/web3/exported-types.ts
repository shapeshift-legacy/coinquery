
export interface HttpProviderConfig {
  logRequests?: boolean
}

export interface HttpProviderEvent {
  providerIndex: number
  provider: any
  payload: any
}

export type HttpProviderHandler = () => void

export type HttpListenerSource = (event: HttpProviderEvent) => HttpProviderHandler
