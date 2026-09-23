/**
 * Versioned full-crate JSON on Cloud Storage so clients skip getDocs(tracks).
 * Lite fields only — same shape as homeLite rows.
 */

const { toLiteTrack } = require("./homeLite");

const CATALOG_OBJECT = "catalog/v1.json";

function createdAtMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  if (value instanceof Date) return value.getTime();
  return 0;
}

function sortNewest(tracks) {
  return [...tracks].sort((a, b) => {
    const diff = createdAtMs(b.createdAt) - createdAtMs(a.createdAt);
    if (diff !== 0) return diff;
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
}

function serializeCreatedAt(value) {
  if (!value) return null;
  if (typeof value.toMillis === "function") return { seconds: Math.floor(value.toMillis() / 1000) };
  if (typeof value.seconds === "number") return { seconds: value.seconds };
  if (value instanceof Date) return { seconds: Math.floor(value.getTime() / 1000) };
  return value;
}

function toCdnTrack(id, data = {}) {
  const row = toLiteTrack(id, data);
  if (row.createdAt) row.createdAt = serializeCreatedAt(row.createdAt);
  return row;
}

async function queryAllLiteTracks(db) {
  try {
    const snap = await db.collection("tracks").orderBy("createdAt", "desc").get();
    return sortNewest(snap.docs.map((d) => toCdnTrack(d.id, d.data())));
  } catch {
    const snap = await db.collection("tracks").get();
    return sortNewest(snap.docs.map((d) => toCdnTrack(d.id, d.data())));
  }
}

/**
 * Write catalog/v1.json to the default bucket. Public-read via storage rules.
 */
async function publishCatalogJson(db, bucket) {
  const tracks = await queryAllLiteTracks(db);
  const payload = {
    version: 1,
    ts: Date.now(),
    trackCount: tracks.length,
    tracks,
  };
  const body = JSON.stringify(payload);
  if (!bucket || typeof bucket.file !== "function") {
    return payload;
  }
  const file = bucket.file(CATALOG_OBJECT);
  await file.save(body, {
    resumable: false,
    metadata: {
      contentType: "application/json; charset=utf-8",
      cacheControl: "public, max-age=120, s-maxage=3600",
    },
  });
  return payload;
}

module.exports = {
  CATALOG_OBJECT,
  toCdnTrack,
  publishCatalogJson,
};
