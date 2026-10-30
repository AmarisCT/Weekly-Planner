// Lets the planner open even without a connection.
// Always tries the network first (so updates show up right away) and only
// falls back to the saved copy when offline.
const CACHE = 'weekly-planner-v4';
const CORE = [
  './', './index.html', './planner.html', './login.html',
  './style.css', './home.css',
  './script.js', './auth.js', './home.js', './room.js', './sky.js', './screen.js', './seasons.js', './pwa.js',
  './assets/room-window-cutout.webp', './assets/icons/icon-192.png', './favicon.ico', './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.allSettled(CORE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;
        if (request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      })
  );
});
