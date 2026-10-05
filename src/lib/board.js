/**
 * The Board — shared logic for the Charts page and Home's Top 5.
 * Pure functions only; every number here is read off the catalog or the
 * chart history. Nothing is estimated.
 */
import { SCENE_CHANNELS, trackMatchesChannel } from "./sceneChannels";
import { countdownScore } from "./station";

/** Segments in the heat meter. */
export const HEAT_SEGMENTS = 10;

/** Neutral ink for tracks no station claims. */
export const NEUTRAL_INK = "#A8B4C6";

/** The one semantic colour on the Board: a track that moved up. Falling is quiet grey; red stays "live". */
export const CLIMB_GREEN = "#6DBF87";

const channelCache = new WeakMap();

/**
 * The dial channel a track sits on. Explicit classifiers (`match`) win, soft
 * keyword/genre matches second, and the catch-all Variety channel never claims
 * a track on its own — otherwise every unclassified cut would turn the same colour.
 */
export function channelForTrack(track) {
  if (!track || typeof track !== "object") return null;
  if (channelCache.has(track)) return channelCache.get(track);
  const candidates = SCENE_CHANNELS.filter((c) => c.id !== "variety-mix");
  let hit = candidates.find((c) => typeof c.match === "function" && c.match(track)) || null;
  if (!hit) hit = candidates.find((c) => typeof c.match !== "function" && trackMatchesChannel(track, c)) || null;
  channelCache.set(track, hit);
  return hit;
}

/** Station ink for a track, or the neutral silver. */
export function inkForTrack(track) {
  return channelForTrack(track)?.accent || NEUTRAL_INK;
}

/** Heat score of an entry: its stored score, else the same formula the station ranks by. */
export function entryScore(entry) {
  if (!entry) return 0;
  if (Number.isFinite(entry.score) && entry.score > 0) return entry.score;
  return countdownScore({
    requestCount: entry.requestCount || 0,
    playCount: entry.playCount || 0,
    likeCount: entry.likeCount || 0,
  });
}

/** Highest score on a board — the meter's 10/10. */
export function boardMaxScore(entries = []) {
  return entries.reduce((m, e) => Math.max(m, entryScore(e)), 0);
}

/** Lit segments, 0–HEAT_SEGMENTS. Anything with heat gets at least one. */
export function heatLevel(entry, maxScore, segments = HEAT_SEGMENTS) {
  const s = entryScore(entry);
  if (!(maxScore > 0) || !(s > 0)) return 0;
  return Math.max(1, Math.min(segments, Math.round((s / maxScore) * segments)));
}

/** Scoreboard numbers for a board. `fresh` and `climbing` stay 0 until there is history. */
export function boardStats(entries = []) {
  let climbing = 0;
  let fresh = 0;
  let requests = 0;
  let plays = 0;
  for (const e of entries) {
    if (e.movement === "up") climbing += 1;
    if (e.movement === "debut" || e.movement === "new") fresh += 1;
    requests += Number(e.requestCount) || 0;
    plays += Number(e.playCount) || 0;
  }
  return { size: entries.length, climbing, fresh, requests, plays };
}

/** "02" style rank label. */
export function rankLabel(rank) {
  const n = Number(rank);
  if (!Number.isFinite(n) || n < 1) return "--";
  return String(Math.floor(n)).padStart(2, "0");
}

/** Crawl text for the top of the Charts page — top five, real counts only. */
export function boardCrawl(entries = [], limit = 5) {
  return entries.slice(0, limit).map((e) => {
    const bits = [`#${e.rank} ${String(e.title || "Untitled").toUpperCase()} — ${String(e.artist || "Unknown").toUpperCase()}`];
    const req = Number(e.requestCount) || 0;
    if (req > 0) bits.push(`${req} ${req === 1 ? "REQUEST" : "REQUESTS"}`);
    return bits.join(" · ");
  });
}

/** Flatten a countdown row (`{ rank, track, score, movement, delta }`) into the shape BoardRow reads. */
export function entryFromCountdown(c) {
  const track = c?.track || {};
  return {
    rank: c.rank,
    id: track.id,
    title: track.title,
    artist: track.artist,
    albumCover: track.albumCover,
    color: track.color,
    movement: c.movement || "same",
    delta: c.delta ?? 0,
    meta: null,
    score: c.score,
    requestCount: track.requestCount || 0,
    playCount: track.playCount || 0,
    likeCount: track.likeCount || 0,
    bpm: track.bpm,
    camelot: track.camelot,
    track,
  };
}
