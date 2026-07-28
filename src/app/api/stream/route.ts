import { NextResponse } from 'next/server'
import { sseBus } from '@/lib/sse-events'
import { route } from '@/lib/api-middleware'

export const GET = route({}, async (req, { user }) => {
  const channel = req.nextUrl.searchParams.get('channel')
  if (!channel) {
    return NextResponse.json({ error: 'Missing channel query parameter' }, { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'))
        } catch {
          clearInterval(keepalive)
        }
      }, 30000)

      const unsubscribe = sseBus.subscribe(channel, (event, data) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          )
        } catch {
          clearInterval(keepalive)
          unsubscribe()
        }
      })

      req.signal.addEventListener('abort', () => {
        clearInterval(keepalive)
        unsubscribe()
      })
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
})
