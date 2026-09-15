/**
 * Precomputed Home shelf — newest playable tracks in one Firestore doc
 * so cold Home does one getDoc instead of getDocs(tracks).
 */

const HOME_LITE_LIMIT = 48;
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

async function queryNewestTracks(db) {
  try {
    const snap = await db.collection("tracks").orderBy("createdAt", "desc").limit(HOME_LITE_LIMIT).get();
    return snap.docs.map((d) => toLiteTrack(d.id, d.data()));
  } catch {
    const snap = await db.collection("tracks").limit(HOME_LITE_LIMIT).get();
    return sortNewest(snap.docs.map((d) => toLiteTrack(d.id, d.data())));
  }
}

async function publishHomeLite(db, { FieldValue } = {}) {
  const tracks = await queryNewestTracks(db);
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
  toLiteTrack,
  publishHomeLite,
};
