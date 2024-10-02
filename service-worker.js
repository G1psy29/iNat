const CACHE_NAME = 'inaturalist-explorer-00';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './icon-192x192.jpg',
  './icon-512x512.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});