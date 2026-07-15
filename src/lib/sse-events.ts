type SSECallback = (event: string, data: unknown) => void

class SSEEventBus {
  private channels = new Map<string, Set<SSECallback>>()

  subscribe(channel: string, cb: SSECallback): () => void {
    if (!this.channels.has(channel)) this.channels.set(channel, new Set())
    this.channels.get(channel)!.add(cb)
    return () => this.channels.get(channel)?.delete(cb)
  }

  publish(channel: string, event: string, data: unknown): void {
    this.channels.get(channel)?.forEach((cb) => cb(event, data))
  }
}

export const sseBus = new SSEEventBus()
