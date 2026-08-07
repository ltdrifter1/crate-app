/**
 * Load catalog from Firestore with ordered-query fallback.
 */
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export function mapTrackDoc(docSnap) {
  return {
    ...docSnap.data(),
    id: docSnap.id,
    liked: false,
  };
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

export async function fetchCatalogTracks(db) {
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
