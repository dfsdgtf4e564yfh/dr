const CACHE_NAME = 'clinic-v4'
const STATIC_CACHE = 'clinic-static-v4'
const API_CACHE = 'clinic-api-v4'
const FONT_CACHE = 'clinic-fonts-v4'

const STATIC_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable.png',
  '/icons/apple-touch-icon.png',
]

const FONT_URLS = [
  '/fonts/webfonts/Vazirmatn-Regular.woff2',
  '/fonts/webfonts/Vazirmatn-Bold.woff2',
  '/fonts/webfonts/Vazirmatn-Medium.woff2',
  '/fonts/webfonts/Vazirmatn-Light.woff2',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_URLS)),
      caches.open(FONT_CACHE).then((cache) => {
        return Promise.allSettled(FONT_URLS.map((url) => cache.add(url).catch(() => {})))
      }),
    ]).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => ![STATIC_CACHE, FONT_CACHE, API_CACHE].includes(name))
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return

  if (url.origin !== self.location.origin && !url.href.includes('fonts.gstatic.com') && !url.href.includes('fonts.googleapis.com')) {
    return
  }

  if (request.url.includes('/api/')) {
    // Network-only for API: no caching of sensitive medical data
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ offline: true, cached: false }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503,
        })
      })
    )
    return
  }

  if (FONT_URLS.some((f) => request.url.includes(f))) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        const clone = response.clone()
        caches.open(FONT_CACHE).then((cache) => cache.put(request, clone))
        return response
      }))
    )
    return
  }

  // Network-first for page navigations / HTML so new deploys reach users immediately.
  const isNavigation = request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')
  if (isNavigation) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone()
          caches.open(STATIC_CACHE).then((c) => c.put(request, clone))
        }
        return response
      }).catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    )
    return
  }

  // Cache-first for static assets (Vite bundles are content-hashed, so this is safe)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone()
          const cache = request.url.includes('/fonts/') ? FONT_CACHE : STATIC_CACHE
          caches.open(cache).then((c) => c.put(request, clone))
        }
        return response
      }).catch(() => new Response('Offline', { status: 503 }))
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
