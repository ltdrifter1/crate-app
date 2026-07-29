/**
 * Digital Record Club — collection stats from a member's liked tracks.
 * Album / EP / Single are inferred from release groupings (no releaseType field yet).
 *
 * Rules of thumb (aligned with catalog albumStory):
 * - Single: empty album, "Singles & Unknown", or exactly 1 track in the release
 * - EP: 2–6 tracks
 * - Album: 7+ tracks
 */

import { slugify } from "./catalog";

const SINGLES_BUCKET = "singles & unknown";

export function classifyRelease(trackCount, albumTitle = "") {
  const title = String(albumTitle || "").trim().toLowerCase();
  const count = Math.max(0, Number(trackCount) || 0);
  if (!title || title === SINGLES_BUCKET || count <= 1) return "single";
  if (count <= 6) return "ep";
  return "album";
}

/**
 * Group liked tracks into releases, then count albums / EPs / singles.
 * @returns {{ albums: number, eps: number, singles: number, releases: Array }}
 */
export function collectionStats(tracks = []) {
  const map = new Map();
  (tracks || []).forEach((t) => {
    if (!t) return;
    const artist = (t.artist || "").trim() || "Unknown";
    const album = (t.album || "").trim() || "Singles & Unknown";
    const key = `${slugify(artist)}__${slugify(album)}`;
    if (!map.has(key)) {
      map.set(key, { key, title: album, artist, tracks: [] });
    }
    map.get(key).tracks.push(t);
  });

  let albums = 0;
  let eps = 0;
  let singles = 0;
  const releases = [];

  for (const rel of map.values()) {
    const type = classifyRelease(rel.tracks.length, rel.title);
    const entry = {
      key: rel.key,
      title: rel.title,
      artist: rel.artist,
      count: rel.tracks.length,
      type,
    };
    releases.push(entry);
    if (type === "album") albums += 1;
    else if (type === "ep") eps += 1;
    else singles += 1;
  }

  releases.sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));

  return { albums, eps, singles, releases };
}

export function collectionStatsLabel(stats) {
  if (!stats) return "No collection yet";
  const { albums = 0, eps = 0, singles = 0 } = stats;
  if (albums + eps + singles === 0) return "No collection yet";
  return `${albums} Album${albums === 1 ? "" : "s"} · ${eps} EP${eps === 1 ? "" : "s"} · ${singles} Single${singles === 1 ? "" : "s"}`;
}
