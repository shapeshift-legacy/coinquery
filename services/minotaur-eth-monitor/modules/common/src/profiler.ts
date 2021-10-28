import { logger } from 'common';

export interface CumulativeAverage {
  sum: number
  count: number
}

export interface Profile {
  seconds: CumulativeAverage
  nanoseconds: CumulativeAverage
  timer: any
}

export function getAverage(values: number[]) {
  let sum = 0
  for (const value of values) {
    sum += value / values.length
  }
  return sum
}

export type ProfilerMap = { [key: string]: Profile }

export interface Profiler {
  start(name: string): void

  stop(name?: string): void

  next(name: string): void

  log(profiles?: ProfilerMap): void

  logFlat(): void
}

function newCumulativeAverage() {
  return {
    sum: 0,
    count: 0
  }
}

function newProfile() {
  return {
    nanoseconds: newCumulativeAverage(),
    seconds: newCumulativeAverage(),
    timer: undefined
  }
}

function formatValue(value: number) {
  const rounded = Math.round(value).toString()
  return (rounded as any).padStart(16, ' ')
}

function formatAverage(cumulativeAverage: CumulativeAverage) {
  const value = cumulativeAverage.count
    ? cumulativeAverage.sum / cumulativeAverage.count
    : 0

  return formatValue(value)
}

function updateCumulativeAverage(average: CumulativeAverage, sample: number) {
  average.sum += sample
  average.count++
}

const oneBillion = 1000000000

function logProfiles(profiles: ProfilerMap, useWinston: boolean = true) {
  const keys = Object.keys(profiles).sort()
  if (keys.length == 0) {
    if (!useWinston)
      console.log('Nothing to profile')
    return
  }

  if (!useWinston)
    console.log('Profile results:')

  const keyPadLength = keys.reduce((a, b) => a.length > b.length ? a : b).length

  const profileResults: any = {}

  for (const key of keys) {
    const profile = profiles[key]
    const count = formatValue(profile.seconds.count)
    const average1 = formatAverage(profile.seconds)
    const average2 = formatAverage(profile.nanoseconds)
    const nanoOver = Math.floor(profile.nanoseconds.sum / oneBillion)
    const nanoLeft = profile.nanoseconds.sum - nanoOver * oneBillion
    const sum1 = formatValue(profile.seconds.sum + nanoOver)
    const sum2 = formatValue(nanoLeft)
    if (!useWinston)
      console.log(' ', key.padStart(keyPadLength, ' '), count, average1, average2, sum1, sum2)
    else
      profileResults[key] = { count, average1, average2, sum1, sum2 }
  }

  if (useWinston)
    logger.log({
      level: 'info',
      title: 'Profiler',
      message: profileResults
    })
}

export class SimpleProfiler implements Profiler {
  private profiles: ProfilerMap = {}
  private current: string = ''

  start(name: string) {
    const profile = (this.profiles[name] = this.profiles[name] || newProfile())
    profile.timer = process.hrtime()
    this.current = name
  }

  stop(name: string = this.current) {
    const profile = this.profiles[name]
    const sample = process.hrtime(profile.timer)
    updateCumulativeAverage(profile.seconds, sample[0])
    updateCumulativeAverage(profile.nanoseconds, sample[1])
    profile.timer = undefined
    this.current = ''
  }

  next(name: string) {
    this.stop(this.current)
    this.start(name)
  }

  log(profiles: ProfilerMap = this.profiles) {
    // logProfiles(profiles)
  }

  logFlat() {
    this.log(this.profiles)
  }

}

function stopProfileTimer(profile: Profile, timer: any) {
  const sample = process.hrtime(timer)
  updateCumulativeAverage(profile.seconds, sample[0])
  updateCumulativeAverage(profile.nanoseconds, sample[1])
}

export class ConcurrentProfiler {
  private profiles: ProfilerMap = {}

  start(name: string) {
    const profile = (this.profiles[name] = this.profiles[name] || newProfile())
    const timer = process.hrtime()
    return () => stopProfileTimer(profile, timer)
  }

  log() {
    // logProfiles(this.profiles)
  }
}

export class CompositeProfiler implements Profiler {
  profilers: Profiler[]

  constructor(profilers: Profiler[]) {
    this.profilers = profilers;
  }

  start(name: string) {
    for (const profiler of this.profilers) {
      profiler.start(name)
    }
  }

  stop(name?: string) {
    for (const profiler of this.profilers) {
      profiler.stop(name)
    }
  }

  next(name: string) {
    for (const profiler of this.profilers) {
      profiler.next(name)
    }
  }

  log(profiles?: ProfilerMap) {
    for (const profiler of this.profilers) {
      profiler.log()
    }
  }

  logFlat() {
    for (const profiler of this.profilers) {
      profiler.logFlat()
    }
  }
}

export class EmptyProfiler implements Profiler {
  start(name: string) {
  }

  stop(name?: string) {
  }

  next(name: string) {
  }

  log(profiles?: ProfilerMap) {
  }

  logFlat() {
  }
}
