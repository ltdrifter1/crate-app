import { normalizeGenre } from "./genres";

/** Home radio dayparts — auto-selected from the clock, not a manual picker. */
export const MIX_LANES = [
  { id: "daytime", label: "Daytime", blurb: "Bright, open, and moving with the day." },
  { id: "nighttime", label: "Nighttime", blurb: "Deep, late, and low-lit." },
];

export function mixLaneById(id) {
  return MIX_LANES.find((m) => m.id === id) || MIX_LANES[0];
}

/**
 * Daytime 06:00–17:59 · Nighttime 18:00–05:59.
 * Pass a Date or hour number for tests.
 */
export function mixLaneForDate(dateOrHour = new Date()) {
  const hour = typeof dateOrHour === "number"
    ? dateOrHour
    : dateOrHour.getHours();
  return mixLaneById(hour >= 6 && hour < 18 ? "daytime" : "nighttime");
}

/** Genres that fit both dayparts. */
const BOTH_GENRES = new Set(["Electronic", "Hip-Hop", "R&B & Soul", "Pop", "Reggae", "Latin"]);
/** Day-leaning genres — still allowed at night when energy is soft enough. */
const DAY_LEAN_GENRES = new Set(["Rock", "Metal", "Country & Folk"]);
/** Night-leaning genres — still allowed by day when energy is bright enough. */
const NIGHT_LEAN_GENRES = new Set(["Jazz", "Classical"]);

function playableSingles(tracks = []) {
  return tracks.filter((t) => (t.duration || 0) <= 900);
}

/**
 * Whether a track belongs in Daytime.
 * Mid energy (4–7) and BOTH_GENRES create intentional overlap with Nighttime.
 */
export function trackFitsDaytime(track) {
  if (!track) return false;
  const energy = track.energy ?? 5;
  const genre = normalizeGenre(track.genre);
  if (BOTH_GENRES.has(genre)) return true;
  if (DAY_LEAN_GENRES.has(genre)) return true;
  if (NIGHT_LEAN_GENRES.has(genre)) return energy >= 5;
  // Unclassified / mid–high energy rides with the day
  return energy >= 4;
}

/**
 * Whether a track belongs in Nighttime.
 * Overlaps with Daytime on BOTH_GENRES and mid energy.
 */
export function trackFitsNighttime(track) {
  if (!track) return false;
  const energy = track.energy ?? 5;
  const genre = normalizeGenre(track.genre);
  if (BOTH_GENRES.has(genre)) return true;
  if (NIGHT_LEAN_GENRES.has(genre)) return true;
  if (DAY_LEAN_GENRES.has(genre)) return energy <= 6;
  // Unclassified / mid–low energy rides with the night
  return energy <= 7;
}

export function trackFitsMixLane(track, laneId = "daytime") {
  return laneId === "nighttime" ? trackFitsNighttime(track) : trackFitsDaytime(track);
}

/**
 * Filter catalog for a daypart. Falls back to all playable singles if empty.
 * Legacy ids (main/mellow/…) map to the current clock daypart.
 */
export function tracksForMixLane(tracks = [], laneId = "daytime") {
  const singles = playableSingles(tracks);
  if (!singles.length) return [];

  const resolved = ["daytime", "nighttime"].includes(laneId)
    ? laneId
    : mixLaneForDate().id;

  const pool = singles.filter((t) => trackFitsMixLane(t, resolved));
  return pool.length ? pool : singles;
}
