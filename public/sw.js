// Files to cache
const cacheName = 'js13kPWA-v10';

const appShellFiles = [
  '/print/lishu.ttf',
  '/print/classic-weibei.ttf',
  '/print/KaiTi_GB2312.ttf',
  '/print/FZL2JW.TTF',
  '/print/liugongquan.ttf',
  '/print/songti.ttf',
  '/print/xingkai.ttf',
  '/print/umi.css',
  '/print/umi.js',
];

const contentToCache = appShellFiles;

// Installing Service Worker
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
  e.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      console.log('[Service Worker] Caching all: app shell and content');
      await cache.addAll(contentToCache);
    })(),
  );
});

// Fetching content using Service Worker
self.addEventListener('fetch', (e) => {
  e.respondWith(
    (async () => {
      const updateLatest = async () => {
        const response = await fetch(e.request);
        const cache = await caches.open(cacheName);
        // console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
        cache.put(e.request, response.clone());
        return response;
      };
      const r = await caches.match(e.request);
      console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
      if (r) {
        if (/umi\.css/.test(e.request) || /umi\.js/.test(e.request)) {
          updateLatest();
        }
        return r;
      }
      return updateLatest();
    })(),
  );
});
