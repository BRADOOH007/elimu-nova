export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.SENTRY_DSN) {
    const Sentry = await import('@sentry/nextjs')
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.25 : 1.0,
    })

    if (process.env.NODE_ENV === 'production') {
      const originalError = console.error
      console.error = (...args: any[]) => {
        originalError.apply(console, args)
        const error = args.find((a: any) => a instanceof Error)
        const message = args.find((a: any) => typeof a === 'string')
        if (error || message) {
          Sentry.captureException(error || new Error(message), {
            extra: { fullArgs: args.map((a: any) => typeof a === 'string' ? a : String(a)) },
          })
        }
      }
    }
  }
}
