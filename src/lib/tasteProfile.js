/**
 * Taste profile — genres + two axes members set on join and edit in Club.
 * Straightforward labels only (no "signal" / "transmission" product language).
 */
import { normalizeGenre } from "./genres";
import { hashSeed } from "./homeCollections";

/** 0 = familiar / well-known, 100 = adventurous / deep cuts */
export const TASTE_AXIS_MIN = 0;
export const TASTE_AXIS_MAX = 100;
export const TASTE_AXIS_DEFAULT = 50;

export const ADVENTUROUS_LABELS = {
  low: "Familiar",
  high: "Adventurous",
  title: "How adventurous?",
  hint: "Stick close to what you know, or try new corners.",
};

export const DEPTH_LABELS = {
  low: "Well-known",
  high: "Deep cuts",
  title: "How deep?",
  hint: "Classics and hits, or lesser-known records.",
};

export function clampTasteAxis(value, fallback = TASTE_AXIS_DEFAULT) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(TASTE_AXIS_MIN, Math.min(TASTE_AXIS_MAX, Math.round(n)));
}

/**
 * Normalize taste fields from a user profile (or partial form state).
 */
export function normalizeTasteProfile(source = {}) {
  const genres = Array.isArray(source.genres)
    ? source.genres.filter(Boolean)
    : [];
  return {
    genres,
    adventurous: clampTasteAxis(source.adventurous, TASTE_AXIS_DEFAULT),
    depth: clampTasteAxis(source.depth, TASTE_AXIS_DEFAULT),
  };
}

/** UTC YYYY-MM — stable monthly rotation boundary. */
export function tasteMonthKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Human month label for UI: "August 2026" */
export function tasteMonthLabel(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const safe = Number.isNaN(d.getTime()) ? new Date() : d;
  return safe.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function axisPct(value) {
  return clampTasteAxis(value);
}

/**
 * Compact stats for Club / Interests — e.g. Electronic 100%, Adventurous 74%.
 * Genre weights are even across selected genres when no listen history is passed.
 */
export function tasteProfileStats(taste = {}, { genreMix = null } = {}) {
  const profile = normalizeTasteProfile(taste);
  const rows = [];

  if (Array.isArray(genreMix) && genreMix.length) {
    genreMix.slice(0, 4).forEach((g) => {
      rows.push({
        id: `genre:${g.genre}`,
        label: g.genre,
        pct: Math.max(1, Math.min(100, Math.round(g.pct ?? g.count ?? 0))),
      });
    });
  } else if (profile.genres.length) {
    const pct = Math.round(100 / profile.genres.length);
    profile.genres.slice(0, 4).forEach((g, i) => {
      // Spread remainder so bars sum near 100 for 2–3 genres
      const rem = 100 - pct * profile.genres.length;
      rows.push({
        id: `genre:${g}`,
        label: g,
        pct: Math.min(100, pct + (i === 0 ? rem : 0)),
      });
    });
  }

  rows.push({
    id: "adventurous",
    label: "Adventurous",
    pct: axisPct(profile.adventurous),
  });
  rows.push({
    id: "depth",
    label: "Deep cuts",
    pct: axisPct(profile.depth),
  });

  return rows;
}

function singlesOnly(tracks = []) {
  return (tracks || []).filter((t) => t && (t.duration || 0) <= 900);
}

function popularityScore(track) {
  const plays = Number(track?.playCount) || 0;
  const likes = Number(track?.likeCount) || 0;
  return plays + likes * 2;
}

/**
 * Score a track against the member's taste.
 * High adventurous → reward out-of-genre; high depth → reward lower popularity.
 */
export function scoreTrackForTaste(track, taste = {}) {
  const profile = normalizeTasteProfile(taste);
  const preferred = new Set(
    profile.genres.map((g) => normalizeGenre(g) || g).filter(Boolean)
  );
  const genre = normalizeGenre(track?.genre) || "";
  const inTaste = preferred.size === 0 ? true : preferred.has(genre);
  const adv = profile.adventurous / 100;
  const depth = profile.depth / 100;
  const pop = popularityScore(track);
  // Normalize popularity into ~0..1 against soft ceiling
  const popNorm = Math.min(1, pop / 40);

  let score = 0;

  // Genre fit: familiar listeners want in-taste; adventurous want some stretch
  if (preferred.size === 0) {
    score += 4;
  } else if (inTaste) {
    score += 10 * (1 - adv * 0.55);
  } else {
    score += 10 * (adv * 0.95);
  }

  // Depth: well-known → popular; deep cuts → quieter catalog
  score += (1 - depth) * popNorm * 8;
  score += depth * (1 - popNorm) * 8;

  // Mild boost for energy mid-range so picks feel listenable
  const energy = Number(track?.energy);
  if (Number.isFinite(energy)) {
    const mid = 1 - Math.abs(energy - 5.5) / 5.5;
    score += mid * 1.5;
  }

  // Prefer unplayed discovery for monthly slate
  if (!track?.liked && (track?.playCount || 0) === 0) score += 1.2;

  return score;
}

function seededShuffle(list, seed) {
  const out = [...list];
  let s = seed >>> 0;
  for (let i = out.length - 1; i > 0; i -= 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickReason(track, profile) {
  const preferred = new Set(
    profile.genres.map((g) => normalizeGenre(g) || g).filter(Boolean)
  );
  const genre = normalizeGenre(track?.genre) || "";
  const inTaste = preferred.size === 0 || preferred.has(genre);
  const pop = popularityScore(track);

  if (profile.depth >= 65 && pop < 8) return "Deep cut";
  if (profile.adventurous >= 65 && !inTaste) return "Outside your usual";
  if (inTaste && genre) return genre;
  if (pop >= 20) return "Well-known";
  return "For you";
}

/**
 * Stable monthly picks for a member (default 3).
 * Same user + month → same slate; rotates each calendar month.
 */
export function pickMonthlyTracks(
  tracks = [],
  taste = {},
  {
    limit = 3,
    userKey = "",
    monthKey = tasteMonthKey(),
    excludeIds = [],
  } = {}
) {
  const profile = normalizeTasteProfile(taste);
  const exclude = new Set(excludeIds);
  const pool = singlesOnly(tracks).filter((t) => t?.id && !exclude.has(t.id));
  if (!pool.length) {
    return {
      monthKey,
      monthLabel: tasteMonthLabel(parseMonthKey(monthKey)),
      picks: [],
      coldStart: true,
    };
  }

  const seed = hashSeed(`${userKey || "guest"}:month:${monthKey}`);
  const scored = pool
    .map((t) => ({
      track: t,
      score: scoreTrackForTaste(t, profile),
      reason: pickReason(t, profile),
    }))
    .sort(
      (a, b) =>
        b.score - a.score || String(a.track.id).localeCompare(String(b.track.id))
    );

  // Take a wider window, then seed-shuffle so the month feels fresh but stable
  const window = Math.min(scored.length, Math.max(limit * 8, limit));
  const rotated = seededShuffle(scored.slice(0, window), seed);

  // Diversify genres a bit across the three picks
  const picks = [];
  const usedGenres = new Set();
  for (const row of rotated) {
    if (picks.length >= limit) break;
    const g = normalizeGenre(row.track.genre) || row.track.id;
    if (usedGenres.has(g) && picks.length < limit - 1 && rotated.length > limit) {
      continue;
    }
    usedGenres.add(g);
    picks.push({ track: row.track, reason: row.reason, score: row.score });
  }
  // Fill if diversification skipped too many
  if (picks.length < limit) {
    for (const row of rotated) {
      if (picks.length >= limit) break;
      if (picks.some((p) => p.track.id === row.track.id)) continue;
      picks.push({ track: row.track, reason: row.reason, score: row.score });
    }
  }

  return {
    monthKey,
    monthLabel: tasteMonthLabel(parseMonthKey(monthKey)),
    picks,
    coldStart: profile.genres.length === 0,
  };
}

function parseMonthKey(key) {
  const m = String(key || "").match(/^(\d{4})-(\d{2})$/);
  if (!m) return new Date();
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
}

/** Short blurb under the taste summary. */
export function tasteProfileBlurb(taste = {}) {
  const profile = normalizeTasteProfile(taste);
  const parts = [];
  if (profile.genres.length) {
    parts.push(
      profile.genres.length === 1
        ? profile.genres[0]
        : `${profile.genres.slice(0, 2).join(" · ")}${
            profile.genres.length > 2 ? " +" : ""
          }`
    );
  }
  if (profile.adventurous >= 70) parts.push("adventurous");
  else if (profile.adventurous <= 30) parts.push("familiar");
  if (profile.depth >= 70) parts.push("deep cuts");
  else if (profile.depth <= 30) parts.push("well-known");
  if (!parts.length) return "Set your genres and taste to steer picks.";
  return parts.join(" · ");
}
