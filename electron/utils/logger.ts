import { app } from 'electron'
import { join } from 'path'
import { createWriteStream } from 'fs'
import { format } from 'util'

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export class Logger {
  private static instance: Logger
  private logStream: any
  private logLevel: LogLevel = LogLevel.INFO

  private constructor() {
    const logPath = join(app.getPath('userData'), 'logs')
    this.logStream = createWriteStream(join(logPath, 'app.log'), { flags: 'a' })
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level
  }

  debug(message: string, ...args: any[]) {
    this.log(LogLevel.DEBUG, message, ...args)
  }

  info(message: string, ...args: any[]) {
    this.log(LogLevel.INFO, message, ...args)
  }

  warn(message: string, ...args: any[]) {
    this.log(LogLevel.WARN, message, ...args)
  }

  error(message: string, ...args: any[]) {
    this.log(LogLevel.ERROR, message, ...args)
  }

  private log(level: LogLevel, message: string, ...args: any[]) {
    if (this.getLogLevelPriority(level) < this.getLogLevelPriority(this.logLevel)) {
      return
    }

    const timestamp = new Date().toISOString()
    const formattedMessage = format(message, ...args)
    const logEntry = `[${timestamp}] ${level}: ${formattedMessage}\n`

    this.logStream.write(logEntry)
    console.log(logEntry)
  }

  private getLogLevelPriority(level: LogLevel): number {
    switch (level) {
      case LogLevel.DEBUG:
        return 0
      case LogLevel.INFO:
        return 1
      case LogLevel.WARN:
        return 2
      case LogLevel.ERROR:
        return 3
      default:
        return 4
    }
  }
} 