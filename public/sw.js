/* eslint-disable */
const CACHE_NAME = 'elimunova-v3'
const STATIC_ASSETS = [
  '/',
  '/pricing',
  '/about',
  '/contact',
  '/auth/signin',
  '/auth/signup',
  '/dashboard',
  '/logo-black-removebg-preview.png',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  )
  self.clients.claim()
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || new Response('Offline', { status: 503 })
  }
}

// Serve cached copy instantly (offline + low-data friendly), then refresh in
// the background. Used for read-only GET API calls.
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => null)
  return cached || (await network)
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Auth/session endpoints must always hit the network.
  if (url.pathname.startsWith('/api/auth/')) {
    event.respondWith(fetch(request))
    return
  }

  if (url.pathname.startsWith('/api/')) {
    // Read-only GET: serve from cache first, refresh in background.
    // Mutations (POST/PUT/PATCH/DELETE): never cached — always network.
    if (request.method === 'GET') {
      event.respondWith(staleWhileRevalidate(request))
    } else {
      event.respondWith(fetch(request))
    }
    return
  }

  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request))
    return
  }

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request))
    return
  }

  event.respondWith(cacheFirst(request))
})

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting()
})
