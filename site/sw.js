/* RTM archive — offline shell and on-demand shard cache.
 *
 * The site is made of many small files now, so the network layer can do the
 * heavy lifting a single monolithic data script never allowed:
 *   shell      network first, cached copy when offline
 *   journal /  stale-while-revalidate: instant on return, fresh in the
 *   search /   background
 *   posts
 *   thumbs     cache first, bounded
 *   full plate cache first, bounded (the reader asked for it once)
 *
 * Bump VERSION on every deploy; activate() drops every older cache.
 */
const VERSION = 'rtm-v79';
const SHELL_CACHE = VERSION + '-shell';
const DATA_CACHE = VERSION + '-data';
const THUMB_CACHE = VERSION + '-thumb';
const FULL_CACHE = VERSION + '-full';

const SHELL = [
  './',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/vendor/perfect-freehand.js',
  'data/index.js',
  'data/integrity.js',
];

const INDEX_URL = new URL('index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    /* One bad file must not abort the install and leave the site uncached. */
    await Promise.all(SHELL.map(url => cache.add(url).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => !key.startsWith(VERSION)).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req, SHELL_CACHE, INDEX_URL));
    return;
  }
  /* Chart files may be served from an external bucket (RTM_ASSETS_BASE); the
   * pathname is what matters, not the origin. */
  if (url.pathname.includes('/assets/thumbs/')) {
    event.respondWith(cacheFirst(req, THUMB_CACHE, 500));
    return;
  }
  if (url.pathname.includes('/assets/images/')) {
    event.respondWith(cacheFirst(req, FULL_CACHE, 30));
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/assets/')) return; // fonts, icons: browser cache
  if (url.pathname.includes('/data/journals/') ||
      url.pathname.includes('/data/search/') ||
      url.pathname.includes('/data/posts/')) {
    event.respondWith(staleWhileRevalidate(req, DATA_CACHE));
    return;
  }
  if (url.pathname.includes('/js/') ||
      url.pathname.includes('/css/') ||
      url.pathname.endsWith('/data/index.js') ||
      url.pathname.endsWith('/data/integrity.js')) {
    event.respondWith(networkFirst(req, SHELL_CACHE));
  }
});

async function networkFirst(req, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req);
    if (hit) return hit;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    return Response.error();
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const network = fetch(req).then(res => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  return hit || network || Response.error();
}

async function cacheFirst(req, cacheName, max) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok) {
    await cache.put(req, res.clone());
    await trim(cache, max);
  }
  return res;
}

/* Cache Storage has no eviction ordering of its own; keys() is insertion
   order, so dropping from the front keeps the most recently read plates. */
async function trim(cache, max) {
  const keys = await cache.keys();
  if (keys.length <= max) return;
  await Promise.all(keys.slice(0, keys.length - max).map(key => cache.delete(key)));
}
