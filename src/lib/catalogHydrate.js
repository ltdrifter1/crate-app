/**
 * Scene + signal enrichment — imported dynamically after first paint so
 * Home shelves can render lite tracks before the full trait pass.
 */
export async function hydrateCatalogTracks(tracks = []) {
  const [{ computeSignalTraits }, { enrichTracksWithScenes }] = await Promise.all([
    import("./engine"),
    import("./scenes"),
  ]);
  return computeSignalTraits(enrichTracksWithScenes(tracks));
}

const DISPLAY_KEYS = [
  "title", "artist", "album", "albumCover", "audioUrl", "color",
  "liked", "disliked", "duration",
];

function displayFieldsMatch(a, b) {
  if (!a || !b) return false;
  for (let i = 0; i < DISPLAY_KEYS.length; i += 1) {
    const key = DISPLAY_KEYS[i];
    if (a[key] !== b[key]) return false;
  }
  return true;
}

/**
 * Keep existing track object identities when a refresh only added enrichment
 * (_scene / _signal) or identical rows. Memoized TrackCards / Channel plates
 * then skip, so sleeves do not reload on hydrate or like-flag merge.
 */
export function adoptCatalogTracks(prev = [], next = []) {
  if (!Array.isArray(next) || next === prev) return next;
  if (!Array.isArray(prev) || !prev.length) return next;
  const byId = new Map();
  for (let i = 0; i < prev.length; i += 1) {
    const row = prev[i];
    if (row?.id) byId.set(row.id, row);
  }
  if (!byId.size) return next;
  const out = new Array(next.length);
  for (let i = 0; i < next.length; i += 1) {
    const t = next[i];
    if (!t?.id) {
      out[i] = t;
      continue;
    }
    const old = byId.get(t.id);
    if (!old || old === t) {
      out[i] = old || t;
      continue;
    }
    if (displayFieldsMatch(old, t)) {
      if (t._scene !== undefined) old._scene = t._scene;
      if (t._scenes !== undefined) old._scenes = t._scenes;
      if (t._signal !== undefined) old._signal = t._signal;
      if (t.playCount !== undefined && t.playCount !== old.playCount) old.playCount = t.playCount;
      if (t.likeCount !== undefined && t.likeCount !== old.likeCount) old.likeCount = t.likeCount;
      if (t.skipCount !== undefined && t.skipCount !== old.skipCount) old.skipCount = t.skipCount;
      out[i] = old;
      continue;
    }
    out[i] = { ...old, ...t };
  }
  return out;
}

/** Patch one track without cloning the rest of the shelf. */
export function patchTrackById(tracks, id, patch) {
  if (!Array.isArray(tracks) || !id) return tracks;
  const i = tracks.findIndex((t) => t && t.id === id);
  if (i < 0) return tracks;
  const current = tracks[i];
  const nextRow = typeof patch === "function" ? patch(current) : { ...current, ...patch };
  if (nextRow === current) return tracks;
  const out = tracks.slice();
  out[i] = nextRow;
  return out;
}
