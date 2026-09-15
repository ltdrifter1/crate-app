/**
 * Dislike taste — soft then hard avoidance of genre + energy neighborhoods.
 *
 * One dislike of the current track downweights that canonical genre + energy
 * band for radio / mix / energy-shift picks.
 *
 * After DISLIKE_HARD_THRESHOLD similar dislikes (same genre + same or adjacent
 * energy band) the neighborhood is hard-suppressed so those cuts stop coming
 * up — unless a focused Channel Surfing / scene pool would otherwise empty.
 *
 * Persisted on the user doc as `dislikeTaste` + `dislikedTracks`.
 */

import { normalizeGenre } from "./genres";

/** Similar (genre + overlapping energy) dislikes before hard suppress. */
export const DISLIKE_HARD_THRESHOLD = 3;

/** Multiplier applied to pick weight at soft counts 1 and 2. */
export const DISLIKE_SOFT_WEIGHTS = {
  1: 0.35,
  2: 0.12,
};

export const DISLIKE_EVENT_CAP = 40;

/** Energy bands — aligned with listenInsights thresholds. */
export const ENERGY_BANDS = [
  { id: "soft", min: 0, max: 3.5, label: "Calm" },
  { id: "steady", min: 3.5, max: 5.5, label: "Mid" },
  { id: "lift", min: 5.5, max: 7.5, label: "Upbeat" },
  { id: "peak", min: 7.5, max: 10.01, label: "High energy" },
];

const BAND_ORDER = ENERGY_BANDS.map((b) => b.id);

export function energyBandId(energy) {
  const n = Number(energy);
  if (!Number.isFinite(n)) return "steady";
  for (const band of ENERGY_BANDS) {
    if (n < band.max) return band.id;
  }
  return "peak";
}

export function adjacentEnergyBands(bandId) {
  const i = BAND_ORDER.indexOf(bandId);
  if (i < 0) return [bandId];
  const out = [bandId];
  if (BAND_ORDER[i - 1]) out.push(BAND_ORDER[i - 1]);
  if (BAND_ORDER[i + 1]) out.push(BAND_ORDER[i + 1]);
  return out;
}

export function neighborhoodKey(genre, bandId) {
  const g = (normalizeGenre(genre) || String(genre || "").trim() || "unknown").toLowerCase();
  return `${g}|${bandId || "steady"}`;
}

export function trackNeighborhood(track) {
  const genre = normalizeGenre(track?.genre) || track?.genre || "unknown";
  const band = energyBandId(track?.energy);
  const overlappingBands = adjacentEnergyBands(band);
  return {
    genre,
    band,
    key: neighborhoodKey(genre, band),
    overlappingKeys: overlappingBands.map((b) => neighborhoodKey(genre, b)),
  };
}

export function emptyDislikeTaste() {
  return { neighborhoods: {}, events: [] };
}

export function normalizeDislikeTaste(raw = {}) {
  const neighborhoods = {};
  const src = raw && typeof raw === "object" ? raw.neighborhoods : null;
  if (src && typeof src === "object") {
    Object.entries(src).forEach(([key, row]) => {
      if (!key || !row || typeof row !== "object") return;
      neighborhoods[key] = {
        count: Math.max(0, Number(row.count) || 0),
        suppressed: !!row.suppressed,
        lastTs: Number(row.lastTs) || 0,
        trackIds: Array.isArray(row.trackIds) ? row.trackIds.filter(Boolean).slice(0, 20) : [],
      };
    });
  }
  const events = Array.isArray(raw?.events)
    ? raw.events
      .filter((e) => e && e.trackId)
      .map((e) => ({
        trackId: e.trackId,
        genre: e.genre || "",
        band: e.band || "steady",
        key: e.key || neighborhoodKey(e.genre, e.band),
        ts: Number(e.ts) || 0,
      }))
      .slice(0, DISLIKE_EVENT_CAP)
    : [];
  return { neighborhoods, events };
}

export function countSimilarDislikes(taste, hood) {
  const keys = new Set(hood?.overlappingKeys || [hood?.key].filter(Boolean));
  return (taste?.events || []).filter((e) => keys.has(e.key)).length;
}

/**
 * Record a dislike against a track. Idempotent per trackId.
 * Escalates overlapping neighborhoods to suppressed at the hard threshold.
 */
export function recordDislikeEvent(taste, track, { ts = Date.now() } = {}) {
  const next = normalizeDislikeTaste(taste);
  const hood = trackNeighborhood(track);
  if (!track?.id) {
    return { taste: next, neighborhood: hood, similarCount: 0, hard: false };
  }

  if (next.events.some((e) => e.trackId === track.id)) {
    const similarCount = countSimilarDislikes(next, hood);
    return {
      taste: next,
      neighborhood: hood,
      similarCount,
      hard: similarCount >= DISLIKE_HARD_THRESHOLD,
    };
  }

  const events = [
    {
      trackId: track.id,
      genre: hood.genre,
      band: hood.band,
      key: hood.key,
      ts,
    },
    ...next.events,
  ].slice(0, DISLIKE_EVENT_CAP);

  const neighborhoods = { ...next.neighborhoods };
  const prev = neighborhoods[hood.key] || {
    count: 0,
    suppressed: false,
    lastTs: 0,
    trackIds: [],
  };
  neighborhoods[hood.key] = {
    count: prev.count + 1,
    lastTs: ts,
    trackIds: Array.from(new Set([track.id, ...(prev.trackIds || [])])).slice(0, 20),
    suppressed: prev.suppressed,
  };

  const similarCount = events.filter((e) => hood.overlappingKeys.includes(e.key)).length;
  const hard = similarCount >= DISLIKE_HARD_THRESHOLD;
  if (hard) {
    hood.overlappingKeys.forEach((k) => {
      const row = neighborhoods[k] || {
        count: 0,
        lastTs: ts,
        trackIds: [],
        suppressed: false,
      };
      neighborhoods[k] = { ...row, suppressed: true };
    });
  }

  return {
    taste: { neighborhoods, events },
    neighborhood: hood,
    similarCount,
    hard,
  };
}

export function dislikedTrackSet(profileOrIds = []) {
  if (Array.isArray(profileOrIds)) return new Set(profileOrIds.filter(Boolean));
  return new Set((profileOrIds?.dislikedTracks || []).filter(Boolean));
}

export function dislikeWeightForTrack(track, taste, { allowHard = true } = {}) {
  const hood = trackNeighborhood(track);
  const row = taste?.neighborhoods?.[hood.key];
  if (!row) return 1;
  if (allowHard && row.suppressed) return 0;
  if (row.count >= DISLIKE_HARD_THRESHOLD) {
    return allowHard ? 0 : DISLIKE_SOFT_WEIGHTS[2];
  }
  if (row.count <= 0) return 1;
  return DISLIKE_SOFT_WEIGHTS[row.count] ?? DISLIKE_SOFT_WEIGHTS[2];
}

export function isNeighborhoodSuppressed(track, taste) {
  const hood = trackNeighborhood(track);
  return !!taste?.neighborhoods?.[hood.key]?.suppressed;
}

/**
 * Drop hard-suppressed (and zero-weight) tracks.
 * If that would empty a focused Channel / scene pool, keep the original list
 * so Home stage / Channel Surfing never stall.
 */
export function applyDislikeToPool(tracks, taste, { preserveFocus = false } = {}) {
  if (!taste || !tracks?.length) return tracks || [];
  const kept = tracks.filter((t) => dislikeWeightForTrack(t, taste, { allowHard: true }) > 0);
  if (kept.length) return kept;
  if (preserveFocus) return tracks;
  return tracks;
}

export function applyDislikeWeight(baseWeight, track, taste, opts) {
  const w = dislikeWeightForTrack(track, taste, opts);
  return Math.max(0, (Number(baseWeight) || 0) * w);
}
