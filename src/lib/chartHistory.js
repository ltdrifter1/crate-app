import { brandStoragePrefix } from "../brand/identity";
import { buildCountdown, stationDayKey } from "./station";

/**
 * Chart history — daily snapshots for climbers, #1 archive, weekly reveal.
 */

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

/** Persist today's chart; returns the snapshot. */
export function captureChartSnapshot(tracks = [], date = new Date()) {
  const dayKey = stationDayKey(date);
  const countdown = buildCountdown(tracks, 20);
  if (!countdown.length) return null;
  const snap = snapshotFromCountdown(countdown, dayKey);
  writeJson(storageKey(`day:${dayKey}`), snap);

  const index = readJson(storageKey("index"), []);
  const nextIndex = [dayKey, ...index.filter((d) => d !== dayKey)].slice(0, 60);
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
