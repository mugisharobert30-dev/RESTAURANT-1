const CACHE = "luwombo-v2";
const ASSETS = ["/", "/menu", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Navigations (HTML pages): always try the network first so users
  // never keep a stale version of a page. Fall back to cache offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/")))
    );
    return;
  }

  // Hashed static assets (/_next/static/*, fonts, images): cache-first,
  // and refresh the cached copy in the background so future visits are fast.
  const isAsset = /\.(?:css|js|woff2?|svg|png|jpg|jpeg|webp|ico)$/.test(new URL(req.url).pathname);
  if (isAsset || req.url.includes("/_next/static/")) {
    event.respondWith(
      caches.match(req).then((hit) => {
        const network = fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
          .catch(() => hit || Response.error());
        return hit || network;
      })
    );
  }
});