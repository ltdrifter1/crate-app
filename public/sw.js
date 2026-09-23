/* Planet MP3 app-shell — cache fonts + hashed CRA /static. Never lock index.html. */
const CACHE = "pmp-shell-v1";
const PRECACHE = [
  "/fonts/ibm-plex-sans-400.woff2",
  "/fonts/ibm-plex-sans-600.woff2",
  "/fonts/ibm-plex-sans-700.woff2",
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
