/**
 * Taste blend — preferred genres lead (95%), with a small open mix (5%).
 * Clock mix lane / scene / energy stay background; genres are the user lever.
 */

import { normalizeGenre } from "./genres";

export const TASTE_IN_RATIO = 0.95;

function preferredSet(preferredGenres = []) {
  return new Set(
    (preferredGenres || []).map((g) => normalizeGenre(g) || g).filter(Boolean)
  );
}

export function trackInTaste(track, preferredGenres = []) {
  const set = preferredSet(preferredGenres);
  if (!set.size || !track) return false;
  const g = normalizeGenre(track.genre);
  return !!(g && set.has(g));
}

/**
 * Split a pool into in-taste / out-of-taste by preferred genres.
 */
export function splitTastePool(tracks = [], preferredGenres = []) {
  const set = preferredSet(preferredGenres);
  if (!set.size) {
    return { inTaste: [...tracks], outTaste: [], preferred: set };
  }
  const inTaste = [];
  const outTaste = [];
  tracks.forEach((t) => {
    const g = normalizeGenre(t.genre);
    if (g && set.has(g)) inTaste.push(t);
    else outTaste.push(t);
  });
  return { inTaste, outTaste, preferred: set };
}

/**
 * For one pick: return the candidate subset (95% in-taste / 5% out).
 * Falls back sensibly when a bucket is empty.
 */
export function tasteCandidatePool(
  tracks = [],
  preferredGenres = [],
  { inRatio = TASTE_IN_RATIO, random = Math.random } = {}
) {
  const { inTaste, outTaste, preferred } = splitTastePool(tracks, preferredGenres);
  if (!preferred.size) {
    return { tracks, bucket: "all", inRatio };
  }
  if (!inTaste.length) {
    return { tracks: outTaste.length ? outTaste : tracks, bucket: "fallback-out", inRatio };
  }
  if (!outTaste.length) {
    return { tracks: inTaste, bucket: "in-only", inRatio };
  }
  if (random() < inRatio) {
    return { tracks: inTaste, bucket: "in", inRatio };
  }
  return { tracks: outTaste, bucket: "out", inRatio };
}

/** Build a static pool ~95% in-taste for timed sets (not per-pick random). */
export function blendPoolForSession(tracks = [], preferredGenres = [], inRatio = TASTE_IN_RATIO) {
  const { inTaste, outTaste, preferred } = splitTastePool(tracks, preferredGenres);
  if (!preferred.size) return tracks;
  if (!inTaste.length) return outTaste.length ? outTaste : tracks;
  if (!outTaste.length) return inTaste;
  const outTarget = Math.max(1, Math.round((inTaste.length * (1 - inRatio)) / inRatio));
  const outSlice = [...outTaste].sort(() => Math.random() - 0.5).slice(0, Math.min(outTarget, outTaste.length));
  return [...inTaste, ...outSlice];
}

/** Auto session energy shape from the clock mix lane — not a user picker. */
export function vibeForMixLane(mixLane = "daytime") {
  return mixLane === "nighttime" ? "night" : "drive";
}
