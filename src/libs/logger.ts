import * as Sentry from '@sentry/react'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogContext = Record<string, unknown>

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  correlationId?: string
}

function createLogger() {
  const isServer = typeof window === 'undefined'
  const isProd = import.meta.env.PROD

  function log(level: LogLevel, message: string, context?: LogContext) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    }

    if (isProd && isServer) {
      console[level === 'error' ? 'error' : 'log'](JSON.stringify(entry))
    } else {
      const prefix = `[${level.toUpperCase()}]`
      console[level === 'error' ? 'error' : 'log'](prefix, message, context || '')
    }

    if (level === 'error' && context?.error instanceof Error) {
      Sentry.captureException(context.error, { extra: context })
    }
  }

  return {
    debug: (msg: string, ctx?: LogContext) => log('debug', msg, ctx),
    info: (msg: string, ctx?: LogContext) => log('info', msg, ctx),
    warn: (msg: string, ctx?: LogContext) => log('warn', msg, ctx),
    error: (msg: string, ctx?: LogContext) => log('error', msg, ctx),
  }
}

export const logger = createLogger()
