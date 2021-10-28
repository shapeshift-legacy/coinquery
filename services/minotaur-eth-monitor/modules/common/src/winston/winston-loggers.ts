import { format } from 'winston'

const { printf } = format
const path = require('path')
const winston = require('winston')

export function getServiceName(): string {
  const globalServiceName = (global as any).serviceName
  return globalServiceName || 'unknown'
}

export function setServiceName(name: string) {
  (global as any).serviceName = name
}

const datadogFormat = printf(function (info: any) {
  const log = {
    service: getServiceName(),
    msg_title: info.title,
    msg_text: info.message,
    alert_type: info.level,
    data: info.data
  }
  return JSON.stringify(log)
})

const datadogLevels = {
  levels: {
    error: 0,
    warning: 1,
    success: 2,
    info: 3
  }
}

const logFormat = winston.format.printf(function (info: any) {
  return `[${info.level}]: ${JSON.stringify(`${info.title}: ${info.message}`, null, 4)}\n`;
})
export const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      levels: datadogLevels.levels,
      json: false,
      colorize: true,
      format: winston.format.combine(logFormat)
    }),
    new winston.transports.File({
      levels: datadogLevels.levels,
      filename: '/var/log/minotaur/combined.log',
      format: datadogFormat
    })
  ]
})