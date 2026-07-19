import * as Sentry from "@sentry/nextjs"

type LogLevel = "error" | "warn" | "info"

function shouldReport(level: LogLevel): boolean {
  if (typeof window === "undefined") return true
  return process.env.NODE_ENV === "production"
}

export function logError(message: string, error?: unknown, context?: Record<string, unknown>) {
  if (shouldReport("error")) {
    Sentry.captureException(error || new Error(message), {
      extra: { ...context, message },
    })
  }
  if (process.env.NODE_ENV === "development") {
    console.error(`[ERROR] ${message}`, error || "")
  }
}

export function logWarn(message: string, context?: Record<string, unknown>) {
  if (shouldReport("warn")) {
    Sentry.captureMessage(message, { level: "warning", extra: context })
  }
  if (process.env.NODE_ENV === "development") {
    console.warn(`[WARN] ${message}`)
  }
}

export function logInfo(message: string, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[INFO] ${message}`, context || "")
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEBUG] ${message}`, context || "")
    }
  },
  info: (message: string, context?: Record<string, unknown>) => {
    if (shouldReport("info")) {
      Sentry.captureMessage(message, { level: "info", extra: context })
    }
    if (process.env.NODE_ENV === "development") {
      console.log(`[INFO] ${message}`, context || "")
    }
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    if (shouldReport("warn")) {
      Sentry.captureMessage(message, { level: "warning", extra: context })
    }
    if (process.env.NODE_ENV === "development") {
      console.warn(`[WARN] ${message}`)
    }
  },
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    if (shouldReport("error")) {
      Sentry.captureException(error || new Error(message), {
        extra: { ...context, message },
      })
    }
    if (process.env.NODE_ENV === "development") {
      console.error(`[ERROR] ${message}`, error || "")
    }
  },
}
