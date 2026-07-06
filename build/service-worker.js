/* Crate service worker — offline app shell + fast static assets.
 *
 * Safety-first strategy:
 *  - Navigations: network-first, falling back to the cached shell when offline.
 *    (So the live server always wins when online — a bad cache can never
 *     permanently brick the app.)
 *  - Hashed /static/ assets: cache-first (filenames are content-hashed, so
 *    cached copies are always correct for their name).
 *  - Everything cross-origin (Firestore, Cloud Storage audio/covers) is left
 *    entirely to the network — the SW never intercepts it.
 */
const CACHE = "crate-shell-v1";
const SHELL = ["./", "index.html", "manifest.json", "favicon1.ico", "logo192.png", "logo512.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Only handle our own origin; never touch Firebase / Storage / audio.
  if (url.origin !== self.location.origin) return;

  // Navigations → network-first with offline fallback to the cached shell.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match("index.html").then((r) => r || caches.match("./"))
      )
    );
    return;
  }

  // Content-hashed static assets → cache-first.
  if (url.pathname.startsWith("/static/")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        });
      })
    );
  }
});
