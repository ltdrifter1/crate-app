/* Planet MP3 app-shell — cache fonts + hashed CRA /static. Never lock index.html. */
const CACHE = "pmp-shell-v2";
// The faces the UI actually sets type in (see theme.js): Outfit body/display, Barlow Condensed
// caps, Plex Mono LCD. Plex Sans is only a fallback in the stack, so it is no longer precached.
const PRECACHE = [
  "/fonts/outfit-400.woff2",
  "/fonts/outfit-600.woff2",
  "/fonts/outfit-700.woff2",
  "/fonts/outfit-800.woff2",
  "/fonts/barlow-condensed-700.woff2",
  "/fonts/barlow-condensed-800.woff2",
  "/fonts/ibm-plex-mono-500.woff2",
  "/fonts/ibm-plex-mono-700.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

function isShellAsset(url) {
  const path = url.pathname || "";
  return path.startsWith("/fonts/") || path.startsWith("/static/");
}

function isCatalogJson(url) {
  return /catalog.*v1\.json/i.test(url.pathname + url.search);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin && !isCatalogJson(url)) return;

  if (isShellAsset(url)) {
    event.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        });
      })
    );
    return;
  }

  if (isCatalogJson(url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
});
