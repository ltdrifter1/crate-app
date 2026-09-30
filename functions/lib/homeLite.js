/**
 * Precomputed Home shelf — newest + hottest playable tracks in one Firestore doc
 * so cold Home does one getDoc instead of getDocs(tracks).
 */

const HOME_LITE_LIMIT = 48;
const HOME_LITE_HEAT_LIMIT = 16;
const HOME_LITE_FIELDS = [
  "title", "artist", "album", "albumCover", "audioUrl", "duration",
  "energy", "genre", "playCount", "likeCount", "requestCount", "skipCount",
  "color", "camelot", "bpm", "videoUrl", "batch", "source", "createdAt",
];

function createdAtMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  return 0;
}

function toLiteTrack(id, data = {}) {
  const out = { id: String(id) };
  HOME_LITE_FIELDS.forEach((key) => {
    if (data[key] !== undefined) out[key] = data[key];
  });
  return out;
}

function sortNewest(tracks) {
  return [...tracks].sort((a, b) => {
    const diff = createdAtMs(b.createdAt) - createdAtMs(a.createdAt);
    if (diff !== 0) return diff;
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
}

function mergeHomeLiteTracks(newest = [], hottest = [], limit = HOME_LITE_LIMIT) {
  const seen = new Set();
  const out = [];
  const heatCap = Math.min(HOME_LITE_HEAT_LIMIT, limit);
  const push = (track) => {
    if (!track?.id || seen.has(track.id)) return false;
    seen.add(track.id);
    out.push(track);
    return out.length >= limit;
  };
  for (const t of hottest) {
    if (out.length >= heatCap) break;
    if (push(t)) return out;
  }
  for (const t of newest) {
    if (push(t)) return out;
  }
  return out;
}

async function queryBy(db, field, n) {
  const snap = await db.collection("tracks").orderBy(field, "desc").limit(n).get();
  return snap.docs.map((d) => toLiteTrack(d.id, d.data()));
}

async function queryNewestTracks(db) {
  try {
    return await queryBy(db, "createdAt", HOME_LITE_LIMIT);
  } catch {
    const snap = await db.collection("tracks").limit(HOME_LITE_LIMIT).get();
    return sortNewest(snap.docs.map((d) => toLiteTrack(d.id, d.data())));
  }
}

async function queryHottestTracks(db) {
  try {
    return await queryBy(db, "playCount", HOME_LITE_HEAT_LIMIT);
  } catch {
    return [];
  }
}

async function publishHomeLite(db, { FieldValue } = {}) {
  const [newest, hottest] = await Promise.all([
    queryNewestTracks(db),
    queryHottestTracks(db),
  ]);
  const tracks = mergeHomeLiteTracks(newest, hottest);
  const payload = {
    trackCount: tracks.length,
    tracks,
  };
  if (FieldValue?.serverTimestamp) payload.updatedAt = FieldValue.serverTimestamp();
  else payload.updatedAt = new Date();
  await db.doc("catalog/homeLite").set(payload);
  return payload;
}

module.exports = {
  HOME_LITE_LIMIT,
  HOME_LITE_HEAT_LIMIT,
  toLiteTrack,
  mergeHomeLiteTracks,
  publishHomeLite,
};
