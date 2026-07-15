type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  meta?: Record<string, unknown>
  timestamp: string
}

function formatEntry(entry: LogEntry): string {
  return JSON.stringify({
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString()
  })
}

function shouldLog(level: LogLevel): boolean {
  if (process.env.NODE_ENV === 'production') {
    return level !== 'debug'
  }
  return true
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('debug')) {
      console.log(formatEntry({ level: 'debug', message, meta, timestamp: new Date().toISOString() }))
    }
  },

  info: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('info')) {
      console.log(formatEntry({ level: 'info', message, meta, timestamp: new Date().toISOString() }))
    }
  },

  warn: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('warn')) {
      console.warn(formatEntry({ level: 'warn', message, meta, timestamp: new Date().toISOString() }))
    }
  },

  error: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('error')) {
      console.error(formatEntry({ level: 'error', message, meta, timestamp: new Date().toISOString() }))
    }
  }
}