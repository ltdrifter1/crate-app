/**
 * Load catalog from Firestore with ordered-query fallback.
 * Home cold-boot uses a lite path (single homeLite doc or a limited query)
 * so shelves fill before the full `tracks` collection download.
 */
async function firestoreApi() {
  return import("firebase/firestore");
}

export const HOME_LITE_LIMIT = 48;
/** Hottest cuts reserved in the lite shelf so Most Requested isn't only newest. */
export const HOME_LITE_HEAT_LIMIT = 16;
export const HOME_LITE_DOC_PATH = ["catalog", "homeLite"];

/** Fields Home / play need on first paint. Extra keys are kept if present. */
export const HOME_LITE_FIELDS = [
  "title", "artist", "album", "albumCover", "audioUrl", "duration",
  "energy", "genre", "playCount", "likeCount", "requestCount", "skipCount",
  "color", "camelot", "bpm", "videoUrl", "batch", "source", "createdAt",
];

export function mapTrackDoc(docSnap) {
  return {
    ...docSnap.data(),
    id: docSnap.id,
    liked: false,
  };
}

export function toLiteTrack(track = {}) {
  if (!track || !track.id) return null;
  const out = { id: String(track.id), liked: !!track.liked };
  HOME_LITE_FIELDS.forEach((key) => {
    if (track[key] !== undefined) out[key] = track[key];
  });
  return out;
}

function createdAtMs(track) {
  const c = track?.createdAt;
  if (!c) return 0;
  if (typeof c.toMillis === "function") return c.toMillis();
  if (typeof c.seconds === "number") return c.seconds * 1000;
  if (c instanceof Date) return c.getTime();
  return 0;
}

export function sortTracksNewestFirst(tracks = []) {
  return [...tracks].sort((a, b) => {
    const diff = createdAtMs(b) - createdAtMs(a);
    if (diff !== 0) return diff;
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
}

/**
 * Home lite shelf: keep a heat window so countdown works before the full
 * catalog arrives, then fill with newest.
 */
export function mergeHomeLiteTracks(newest = [], hottest = [], limit = HOME_LITE_LIMIT) {
  const seen = new Set();
  const out = [];
  const push = (track) => {
    const row = toLiteTrack(track) || (track?.id ? track : null);
    if (!row?.id || seen.has(row.id)) return false;
    seen.add(row.id);
    out.push(row);
    return out.length >= limit;
  };
  const heatCap = Math.min(HOME_LITE_HEAT_LIMIT, limit);
  for (const t of hottest) {
    if (out.length >= heatCap) break;
    if (push(t)) return out;
  }
  for (const t of newest) {
    if (push(t)) return out;
  }
  return out;
}

/** Published by functions/lib/catalogJson.js — gzip JSON, long CDN cache. */
export const CATALOG_CDN_OBJECT = "catalog/v1.json";
export const CATALOG_CDN_TIMEOUT_MS = 800;
const DEFAULT_CATALOG_BUCKET = "crate-app-58494.firebasestorage.app";

export function catalogCdnEnabled() {
  const raw = typeof process !== "undefined" ? process.env.REACT_APP_CATALOG_URL : "";
  const v = String(raw || "").trim().toLowerCase();
  if (v === "off" || v === "0" || v === "false" || v === "none") return false;
  return true;
}

export function defaultCatalogCdnUrl() {
  const raw = typeof process !== "undefined" ? process.env.REACT_APP_CATALOG_URL : "";
  const env = String(raw || "").trim();
  if (env && !["off", "0", "false", "none"].includes(env.toLowerCase())) return env;
  return `https://firebasestorage.googleapis.com/v0/b/${DEFAULT_CATALOG_BUCKET}/o/${encodeURIComponent(CATALOG_CDN_OBJECT)}?alt=media`;
}

export function catalogVersionOf(entry) {
  return Number(entry?.version) || Number(entry?.ts) || 0;
}

export function isNewerCatalog(remote, local) {
  if (!remote?.tracks?.length) return false;
  if (!local?.tracks?.length) return true;
  return catalogVersionOf(remote) > catalogVersionOf(local);
}

export function parseCatalogCdnPayload(json) {
  const tracks = Array.isArray(json?.tracks)
    ? json.tracks.filter((t) => t && t.id)
    : [];
  if (!tracks.length) return null;
  const ts = Number(json.ts) || Date.now();
  return {
    ts,
    version: Number(json.version) || ts,
    tracks: sortTracksNewestFirst(tracks),
    source: "cdn",
  };
}

export async function fetchCatalogCdn({
  url,
  fetchImpl,
  timeoutMs = CATALOG_CDN_TIMEOUT_MS,
} = {}) {
  if (!catalogCdnEnabled()) return null;
  const href = url || defaultCatalogCdnUrl();
  const f = fetchImpl || (typeof fetch === "function" ? fetch : null);
  if (!href || !f) return null;
  const ctrl = typeof AbortController === "function" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), Math.max(200, Number(timeoutMs) || 800)) : null;
  try {
    const res = await f(href, {
      signal: ctrl?.signal,
      headers: { Accept: "application/json" },
    });
    if (!res?.ok) return null;
    const json = await res.json();
    return parseCatalogCdnPayload(json);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function fetchCatalogTracksFromFirestore(db) {
  const { collection, getDocs, query, orderBy } = await firestoreApi();
  try {
    const q = query(collection(db, "tracks"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return sortTracksNewestFirst(snap.docs.map(mapTrackDoc));
  } catch (orderedErr) {
    try {
      const snap = await getDocs(collection(db, "tracks"));
      if (!snap.empty) {
        return sortTracksNewestFirst(snap.docs.map(mapTrackDoc));
      }
    } catch {
      // fall through
    }
    throw orderedErr;
  }
}

export async function fetchCatalogTracks(db) {
  const cdn = await fetchCatalogCdn();
  if (cdn?.tracks?.length) return cdn.tracks;
  return fetchCatalogTracksFromFirestore(db);
}

async function fetchHomeLiteDoc(db) {
  const { doc, getDoc } = await firestoreApi();
  const snap = await getDoc(doc(db, ...HOME_LITE_DOC_PATH));
  if (!snap.exists()) return null;
  const data = snap.data() || {};
  const raw = Array.isArray(data.tracks) ? data.tracks : [];
  const tracks = raw.map((t) => toLiteTrack(t)).filter(Boolean);
  if (!tracks.length) return null;
  return {
    tracks: sortTracksNewestFirst(tracks),
    source: "lite-doc",
    updatedAt: data.updatedAt || null,
  };
}

async function queryTracksBy(db, field, n) {
  const { collection, getDocs, query, orderBy, limit } = await firestoreApi();
  const q = query(collection(db, "tracks"), orderBy(field, "desc"), limit(n));
  const snap = await getDocs(q);
  return snap.docs.map(mapTrackDoc);
}

async function fetchHomeLiteQuery(db) {
  const newestJob = queryTracksBy(db, "createdAt", HOME_LITE_LIMIT)
    .then((tracks) => ({ tracks, source: "lite-query" }))
    .catch(async () => {
      try {
        const { collection, getDocs, query, limit } = await firestoreApi();
        const q = query(collection(db, "tracks"), limit(HOME_LITE_LIMIT));
        const snap = await getDocs(q);
        return { tracks: snap.docs.map(mapTrackDoc), source: "lite-query-unordered" };
      } catch {
        return { tracks: [], source: "lite-query" };
      }
    });
  const hottestJob = queryTracksBy(db, "playCount", HOME_LITE_HEAT_LIMIT).catch(() => []);
  const [newestResult, hottest] = await Promise.all([newestJob, hottestJob]);
  const tracks = mergeHomeLiteTracks(newestResult.tracks, hottest);
  if (!tracks.length) return null;
  return { tracks, source: newestResult.source };
}

/**
 * First paint: IndexedDB → localStorage stub → CDN JSON. No Firebase.
 */
export async function loadCatalogFirstPaint({
  cacheKey,
  readSync,
  fetchCdn = fetchCatalogCdn,
} = {}) {
  const fromIdb = cacheKey ? await readCatalogIdb(cacheKey) : null;
  if (fromIdb?.tracks?.length) {
    return { ...fromIdb, source: fromIdb.source || "idb" };
  }
  const sync = typeof readSync === "function" ? readSync() : null;
  if (sync?.tracks?.length) {
    return { ...sync, source: sync.source || "sync" };
  }
  const cdn = await fetchCdn();
  if (cdn?.tracks?.length) return cdn;
  return null;
}

/**
 * Cold-boot Home catalog: one precomputed doc if Luke published it,
 * otherwise a shelf-sized `limit()` query — never the full collection.
 */
export async function fetchHomeLite(db) {
  try {
    const fromDoc = await fetchHomeLiteDoc(db);
    if (fromDoc) return fromDoc;
  } catch {
    // rules / missing collection — fall through to limited query
  }
  const fromQuery = await fetchHomeLiteQuery(db);
  if (fromQuery) return fromQuery;
  return { tracks: [], source: "empty" };
}

export function countPlayableTracks(tracks = []) {
  return tracks.filter((t) => String(t.audioUrl || "").trim().length > 0).length;
}

/** Skip background refetch when warm-start cache is still fresh. */
export const CATALOG_CACHE_TTL_MS = 15 * 60 * 1000;

export function isCatalogCacheFresh(entry, now = Date.now(), ttlMs = CATALOG_CACHE_TTL_MS) {
  if (!entry || !Array.isArray(entry.tracks) || !entry.tracks.length) return false;
  const ts = Number(entry.ts);
  if (!Number.isFinite(ts) || ts <= 0) return false;
  return now - ts < ttlMs;
}

/* ── IndexedDB catalog store (avoids sync localStorage JSON on large shelves) ─ */

const IDB_NAME = "planetmp3-catalog";
const IDB_STORE = "cache";
const IDB_VERSION = 1;

function openCatalogIdb() {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("no idb"));
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onerror = () => reject(req.error || new Error("idb open failed"));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

/** Read cached catalog entry `{ ts, tracks }` from IndexedDB. */
export async function readCatalogIdb(key) {
  try {
    const db = await openCatalogIdb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const v = req.result;
        if (!v || !Array.isArray(v.tracks) || !v.tracks.length) resolve(null);
        else {
          resolve({
            ts: Number(v.ts) || 0,
            version: Number(v.version) || Number(v.ts) || 0,
            source: v.source || "",
            tracks: v.tracks,
          });
        }
      };
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

/** Persist catalog entry to IndexedDB (best-effort). */
export async function writeCatalogIdb(key, tracks, meta = {}) {
  try {
    const db = await openCatalogIdb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      const ts = Date.now();
      tx.objectStore(IDB_STORE).put({
        ts,
        tracks,
        version: Number(meta.version) || ts,
        source: meta.source || "",
      }, key);
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
    });
    return true;
  } catch {
    return false;
  }
}
