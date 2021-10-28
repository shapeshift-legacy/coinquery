import { each as promiseEach } from 'promise-each2'

enum Status {
  inactive,
  running,
  stopping,
}

export interface CronConfig {
  interval: number
}

export interface CronConfigChange {
  interval?: number,
  active?: boolean
}

export type OldAction = () => Promise<any> | void
export type NewAction = (config: CronConfig) => Promise<CronConfigChange> | void
export type Action = NewAction | OldAction
export type SimpleAction = () => Promise<any> | void

export interface Task {
  name: string
  action: Action
}

export interface CronErrorLogger {
  logError(error: Error): Promise<any> | void
}

class DefaultErrorLogger implements CronErrorLogger {
  logError(error: Error) {
    console.error(error.stack || error.message)
  }
}

export class Cron {
  interval: number
  status: Status = Status.inactive
  private tasks: Task[]
  private errorLogger: CronErrorLogger
  private isWorking: boolean = false

  constructor(tasks: Task[], interval: number = 30000, errorLogger: CronErrorLogger = new DefaultErrorLogger()) {
    this.tasks = tasks;
    this.interval = interval
    this.errorLogger = errorLogger
  }

  private runTask(task: Task) {
    return Promise.resolve().then(() => (task.action as any)({ interval: this.interval }))
      .then((adjustment: CronConfigChange | undefined) => {
        if (adjustment && typeof adjustment === 'object') {
          if (typeof adjustment.interval === 'number') {
            this.interval = adjustment.interval
          }
          if (typeof adjustment.active === 'boolean') {
            this.status = Status.inactive
          }
        }
      })
      .catch(e => {
        let error: any
        if (typeof e === 'string')
          error = new Error(e)
        else if (!e || typeof e !== 'object')
          error = new Error()

        error.message = "Error during task '" + task.name + "': " + e.message
        this.errorLogger.logError(error)
      })
  }

  private update(): Promise<any> {
    this.isWorking = true
    return promiseEach(this.tasks, (task: Task) => this.runTask(task))
      .then(() => this.isWorking = false)
  }

  /**
   * Begins the Cron.
   */
  start() {
    if (this.status != Status.inactive)
      throw new Error('Cron is already running.');

    const loop = () => {
      if (this.status == Status.stopping)
        this.status = Status.inactive;

      if (this.status == Status.running)
        setTimeout(update, this.interval)
    }

    const update = () => {
      this.update()
        .then(loop)
        .catch(error => {
          this.errorLogger.logError(error)
          loop()
        })
    }
    update()
    this.status = Status.running
  }

  /**
   * @hidden
   * Deprecated. Event handler for next time the Cron is idle.
   */
  onceNotWorking(action: SimpleAction): Promise<void> {
    if (!this.isWorking) {
      const result = action()
      return result && typeof result.then === 'function'
        ? result
        : Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const poll = () => {
        if (!this.isWorking) {
          resolve(action())
        }
        else {
          setTimeout(poll, 50)
        }
      }

      poll()
    })
  }

  /**
   * @hidden
   * Deprecated. Triggers an update before the normal interval.
   */
  forceUpdate(): Promise<void> {
    return this.onceNotWorking(() => this.update())
  }

  /**
   * Stops the Cron.
   */
  stop(): Promise<void> {
    return this.onceNotWorking(() => {
      this.status = Status.inactive
    })
  }

}
