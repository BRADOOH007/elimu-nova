import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: process.env.NODE_ENV === 'development',
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
})

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  const originalError = console.error
  console.error = (...args: any[]) => {
    originalError.apply(console, args)
    const error = args.find(a => a instanceof Error)
    const message = args.find(a => typeof a === 'string')
    if (error || message) {
      Sentry.captureException(error || new Error(message), {
        extra: { fullArgs: args.map(a => typeof a === 'string' ? a : String(a)) },
      })
    }
  }
}
