# Offline-First PWA Strategy

## Architecture

```
Browser ←→ Service Worker ←→ IndexedDB ←→ Sync Queue
                  ↕                        ↕
              Cache Storage           Background Sync API
                  ↕                        ↕
              Network (Vercel)      API (when online)
```

## What to Cache

### Tier 1 — Static assets (always cached, never stale)
- Next.js JS chunks, CSS, fonts, icons → `precacheAndRoute()` via Workbox
- Logo, splash screen, offline fallback page
- Estimated size: ~2 MB

### Tier 2 — Content (stale-while-revalidate)
- Lesson plans the student has viewed
- Schemes of work for current term
- Recent tutor session history
- Student's own progress / XP / streak
- TTL: refresh when online, serve cached when offline

### Tier 3 — User input (queue for sync)
- Tutor chat messages → stored in IndexedDB, sent via BackgroundSync when online
- Quiz answers → queued locally, synced in batch
- Attendance QR scans → queued if offline

## Implementation Steps

### Day 1: Service Worker

```bash
npm install workbox-webpack-plugin
```

Create `public/sw.js`:
```javascript
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies'

precacheAndRoute(self.__WB_MANIFEST)

// API content — stale while revalidate
registerRoute(
  /\/api\/student\/(progress|lessons|schedule)/,
  new StaleWhileRevalidate({ cacheName: 'api-content' })
)

// Lesson plans / schemes — network first, fallback to cache
registerRoute(
  /\/api\/(lesson-plans|schemes-of-work)/,
  new NetworkFirst({ cacheName: 'curriculum', networkTimeoutSeconds: 5 })
)

// Static assets — cache first
registerRoute(
  /\.(js|css|png|jpg|webp|woff2)$/,
  new CacheFirst({ cacheName: 'static' })
)
```

### Day 2: IndexedDB Sync Queue

Create `src/lib/offline-queue.ts`:
```typescript
const DB_NAME = 'elimunova-offline'
const STORE = 'sync-queue'

export async function enqueue(method: string, url: string, body?: unknown) {
  const db = await openDB()
  await db.add(STORE, {
    id: crypto.randomUUID(),
    method, url, body: JSON.stringify(body),
    createdAt: Date.now(),
    retries: 0
  })
  // Register background sync if available
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready
    await reg.sync.register('sync-api-queue')
  }
}

export async function dequeue(): Promise<QueuedRequest | null> {
  const db = await openDB()
  const tx = db.transaction(STORE, 'readwrite')
  const cursor = await tx.store.openCursor()
  if (!cursor) return null
  const item = cursor.value
  await cursor.delete()
  return item
}
```

### Day 3: Background Sync in SW

In `public/sw.js`:
```javascript
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-api-queue') {
    event.waitUntil(processQueue())
  }
})

async function processQueue() {
  let item = await dequeue()
  while (item) {
    try {
      await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: item.body
      })
    } catch {
      await reEnqueue(item) // Retry later
      break
    }
    item = await dequeue()
  }
}
```

### Day 4: Manifest & Install Prompt

Add to `src/app/layout.tsx`:
```tsx
export const metadata = {
  manifest: '/manifest.json',
  themeColor: '#4f46e5',
}
```

Create `public/manifest.json`:
```json
{
  "name": "ElimuNova",
  "short_name": "ElimuNova",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4f46e5",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Day 5: Offline Fallback Page

Create `src/app/offline/page.tsx`:
```tsx
export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-2">You're offline</h1>
      <p className="text-gray-600 mb-4">Your cached lessons are still available.</p>
      <Link href="/student/lessons" className="text-indigo-600 underline">
        View cached lessons
      </Link>
    </div>
  )
}
```

Register the offline fallback in `sw.js`:
```javascript
import { setCatchHandler } from 'workbox-routing'
setCatchHandler(({ event }) => {
  if (event.request.mode === 'navigate') {
    return caches.match('/offline')
  }
  return Response.error()
})
```

## Key Design Decisions

| Decision | Why |
|----------|-----|
| **Workbox** over raw SW API | Handles precaching, routing, strategies. Reduces SW code by 70%. |
| **IndexedDB** over localStorage | Larger storage (250MB+), async API, structured data. |
| **Background Sync** over periodic sync | Fires immediately when online, no delay. |
| **Stale-while-revalidate** for API | Users see cached data instantly, fresh data loads in background. |
| **Network-first for curriculum** | Lesson plans change rarely; always serve latest if possible. |

## Estimated Impact

| Metric | Before | After |
|--------|--------|-------|
| First paint on 2G | 8-12s | 0.5-1s (cached) |
| Tutor message sent offline | Lost | Queued, delivered on reconnect |
| Lesson plan access in rural area | Broken | Works from cache |
| Data usage per session | ~5 MB | ~200 KB (cached assets) |
