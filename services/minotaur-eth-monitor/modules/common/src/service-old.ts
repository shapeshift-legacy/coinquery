import { setServiceName } from 'common';

export class Service {
  enabled: boolean = true
  blockIndex: number = -1
  name: string
  interval: number = 60000

  constructor(name: string) {
    this.name = name
    setServiceName(name)
  }

  async start(model: any): Promise<void> {
    const record = await model.Service.first({ name: this.name })
    this.blockIndex = record.blockIndex
  }

  async update(model: any, mod: number = 1): Promise<void> {
    this.blockIndex += mod
    await model.Service.update({ name: this.name, blockIndex: this.blockIndex })
  }

  async setIndex(model: any, index: number): Promise<void> {
    this.blockIndex = index
    await model.Service.update({ name: this.name, blockIndex: this.blockIndex })
  }

  async isEnabled(model: any): Promise<boolean> {
    const service = await model.Service.first({ name: this.name })
    if (!service.enabled) {
      if (this.enabled)
        console.log(`Detected ${this.name} disabled`)

      this.enabled = false
    }
    else if (!this.enabled) {
      this.enabled = true
      console.log(`Detected ${this.name} enabled`)
    }

    return this.enabled
  }
}