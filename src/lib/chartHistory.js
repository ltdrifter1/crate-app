import { brandStoragePrefix } from "../brand/identity";
import { normalizeGenre } from "./genres";
import { monthKey as calendarMonthKey } from "./mixes";
import { getSceneChannel, trackMatchesChannel } from "./sceneChannels";
import { buildCountdown, stationDayKey } from "./station";

/**
 * Chart history — daily snapshots, monthly charts, climbers, weekly reveal.
 * Monthly charts can be overall or scoped by channel / genre.
 */

export { calendarMonthKey as monthKey };

function storageKey(suffix) {
  return `${brandStoragePrefix()}:chart:${suffix}`;
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota */
  }
}

function snapshotFromCountdown(countdown = [], dayKey) {
  return {
    dayKey,
    capturedAt: Date.now(),
    entries: countdown.slice(0, 20).map((c) => ({
      rank: c.rank,
      id: c.track?.id,
      title: c.track?.title || "Untitled",
      artist: c.track?.artist || "Unknown",
      albumCover: c.track?.albumCover || null,
      score: c.score || 0,
      requestCount: c.track?.requestCount || 0,
      playCount: c.track?.playCount || 0,
    })),
  };
}

/** Normalize scope: overall | channel | genre */
export function normalizeChartScope(scope = {}) {
  const mode = scope.mode === "channel" || scope.mode === "genre" ? scope.mode : "overall";
  if (mode === "channel") {
    const channelId = String(scope.channelId || "").trim();
    return { mode, channelId: channelId || null, genre: null };
  }
  if (mode === "genre") {
    const genre = normalizeGenre(scope.genre) || String(scope.genre || "").trim() || null;
    return { mode, channelId: null, genre };
  }
  return { mode: "overall", channelId: null, genre: null };
}

export function chartScopeKey(scope = {}) {
  const s = normalizeChartScope(scope);
  if (s.mode === "channel") return `channel:${s.channelId || "none"}`;
  if (s.mode === "genre") return `genre:${s.genre || "none"}`;
  return "overall";
}

export function chartScopeLabel(scope = {}) {
  const s = normalizeChartScope(scope);
  if (s.mode === "channel") {
    const ch = getSceneChannel(s.channelId);
    return ch ? `CH-${String(ch.num).padStart(2, "0")} · ${ch.shortTitle || ch.title}` : "Channel";
  }
  if (s.mode === "genre") return s.genre || "Genre";
  return "Overall";
}

/** Filter catalog for a chart scope (channel / genre / overall). */
export function filterTracksForChartScope(tracks = [], scope = {}) {
  const s = normalizeChartScope(scope);
  if (s.mode === "channel") {
    const channel = getSceneChannel(s.channelId);
    if (!channel) return [];
    return tracks.filter((t) => trackMatchesChannel(t, channel));
  }
  if (s.mode === "genre") {
    if (!s.genre) return [];
    return tracks.filter((t) => normalizeGenre(t.genre) === s.genre);
  }
  return tracks;
}

/**
 * Live monthly chart — heat-ranked singles for the current month, optionally
 * scoped by channel or genre. Month is a presentation label; ranking uses
 * live request/play/like heat (same as the station countdown).
 */
export function buildMonthlyChart(tracks = [], options = {}) {
  const {
    limit = 20,
    date = new Date(),
    scope = { mode: "overall" },
  } = options;
  const key = calendarMonthKey(date);
  const scoped = filterTracksForChartScope(tracks, scope);
  const countdown = buildCountdown(scoped, limit);
  return countdown.map((c) => ({
    ...c,
    monthKey: key,
    scope: normalizeChartScope(scope),
  }));
}

/** Persist today's chart; returns the snapshot. */
export function captureChartSnapshot(tracks = [], date = new Date()) {
  const dayKey = stationDayKey(date);
  const countdown = buildCountdown(tracks, 20);
  if (!countdown.length) return null;
  const snap = snapshotFromCountdown(countdown, dayKey);
  writeJson(storageKey(`day:${dayKey}`), snap);

  const index = readJson(storageKey("index"), []);
  // Keep ~3 months so monthly reveal can look back
  const nextIndex = [dayKey, ...index.filter((d) => d !== dayKey)].slice(0, 93);
  writeJson(storageKey("index"), nextIndex);

  // Number-ones archive
  const top = snap.entries[0];
  if (top?.id) {
    const ones = readJson(storageKey("numberOnes"), []);
    const withoutToday = ones.filter((o) => o.dayKey !== dayKey);
    writeJson(
      storageKey("numberOnes"),
      [{ dayKey, ...top }, ...withoutToday].slice(0, 90)
    );
  }
  return snap;
}

export function listChartDays(limit = 14) {
  return readJson(storageKey("index"), []).slice(0, limit);
}

export function getChartSnapshot(dayKey) {
  if (!dayKey) return null;
  return readJson(storageKey(`day:${dayKey}`), null);
}

export function getNumberOnes(limit = 12) {
  return readJson(storageKey("numberOnes"), []).slice(0, limit);
}

function previousDayKey(dayKey) {
  const d = new Date(`${dayKey}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Enrich live countdown with movement vs yesterday's snapshot.
 * delta: positive = climbed (rank number went down).
 */
export function enrichCountdownWithHistory(countdown = [], dayKey = stationDayKey()) {
  const prev = getChartSnapshot(previousDayKey(dayKey));
  const prevRank = new Map((prev?.entries || []).map((e) => [e.id, e.rank]));
  return countdown.map((c) => {
    const before = prevRank.get(c.track?.id);
    let movement = "new";
    let delta = null;
    if (before == null) {
      movement = "debut";
    } else if (before === c.rank) {
      movement = "same";
      delta = 0;
    } else if (before > c.rank) {
      movement = "up";
      delta = before - c.rank;
    } else {
      movement = "down";
      delta = c.rank - before;
    }
    return { ...c, movement, delta, previousRank: before ?? null };
  });
}

export function biggestClimbers(countdown = [], limit = 5) {
  return enrichCountdownWithHistory(countdown)
    .filter((c) => c.movement === "up")
    .sort((a, b) => (b.delta || 0) - (a.delta || 0))
    .slice(0, limit);
}

/** ISO week key YYYY-Www */
export function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function dayKeyInMonth(dayKey, month) {
  return typeof dayKey === "string" && dayKey.startsWith(`${month}-`);
}

/**
 * Monthly reveal — best peak rank per track across stored days in the month.
 * When tracks + scope are provided, only include tracks that match the scope.
 */
export function buildMonthlyReveal(limit = 20, options = {}) {
  const {
    date = new Date(),
    scope = { mode: "overall" },
    tracks = null,
  } = options;
  const key = calendarMonthKey(date);
  const s = normalizeChartScope(scope);
  const allowed =
    tracks && s.mode !== "overall"
      ? new Set(filterTracksForChartScope(tracks, s).map((t) => t.id))
      : null;

  const days = listChartDays(93).filter((d) => dayKeyInMonth(d, key));
  const best = new Map();
  for (const dayKey of days) {
    const snap = getChartSnapshot(dayKey);
    for (const e of snap?.entries || []) {
      if (!e.id) continue;
      if (allowed && !allowed.has(e.id)) continue;
      const prev = best.get(e.id);
      if (!prev || e.rank < prev.rank || (e.rank === prev.rank && (e.score || 0) > (prev.score || 0))) {
        best.set(e.id, { ...e, peakDay: dayKey });
      }
    }
  }
  return [...best.values()]
    .sort((a, b) => a.rank - b.rank || (b.score || 0) - (a.score || 0))
    .slice(0, limit)
    .map((e, i) => ({
      ...e,
      monthRank: i + 1,
      monthKey: key,
      scope: s,
    }));
}

/**
 * Weekly reveal — best rank per track across the last 7 stored days.
 */
export function buildWeeklyReveal(limit = 10) {
  const days = listChartDays(7);
  const best = new Map();
  for (const dayKey of days) {
    const snap = getChartSnapshot(dayKey);
    for (const e of snap?.entries || []) {
      if (!e.id) continue;
      const prev = best.get(e.id);
      if (!prev || e.rank < prev.rank) {
        best.set(e.id, { ...e, peakDay: dayKey });
      }
    }
  }
  return [...best.values()]
    .sort((a, b) => a.rank - b.rank || (b.score || 0) - (a.score || 0))
    .slice(0, limit)
    .map((e, i) => ({ ...e, weekRank: i + 1 }));
}

/** Ensure today is snapshotted when Home loads. */
export function ensureTodayChart(tracks = []) {
  const dayKey = stationDayKey();
  const existing = getChartSnapshot(dayKey);
  // Refresh throughout the day so requests move the archive
  return captureChartSnapshot(tracks) || existing;
}
