/**
 * Build-a-set helpers — duration, vibe order, live preview stats, energy arc.
 * Keeps SESSION_PROFILES as the source of truth for energy shapes.
 */
import { CANONICAL_GENRES, normalizeGenre } from "./genres";
import { SESSION_PROFILES } from "./engine";

export const SET_DURATIONS = [
  { minutes: 30, label: "30 min", short: "30" },
  { minutes: 60, label: "1 hour", short: "1h" },
  { minutes: 120, label: "2 hours", short: "2h" },
  { minutes: 240, label: "4 hours", short: "4h" },
  { minutes: 480, label: "All night", short: "∞" },
];

/** Peak-first booth order — social / motion first, desk last. */
export const SET_VIBE_ORDER = [
  "night",
  "party",
  "workout",
  "run",
  "predrinks",
  "drive",
  "dinner",
  "focus",
  "study",
  "chill",
  "recovery",
];

/** Cyan / metal / neon tints — restrained Y2K, no purple. */
export const SET_VIBE_TINT = {
  night: { rgb: "101,230,255" },
  party: { rgb: "200,242,65" },
  workout: { rgb: "123,167,255" },
  run: { rgb: "231,235,240" },
  predrinks: { rgb: "255,79,216" },
  drive: { rgb: "123,167,255" },
  dinner: { rgb: "184,190,199" },
  focus: { rgb: "101,230,255" },
  study: { rgb: "139,147,159" },
  chill: { rgb: "101,230,255" },
  recovery: { rgb: "139,147,159" },
};

export function formatSetDuration(minutes) {
  const n = Number(minutes) || 0;
  if (n < 60) return `${n} min`;
  if (n === 60) return "1 hour";
  if (n === 480) return "All night";
  const hours = n / 60;
  return Number.isInteger(hours) ? `${hours} hours` : `${n} min`;
}

export function vibeEntries() {
  return SET_VIBE_ORDER
    .filter((id) => SESSION_PROFILES[id])
    .map((id) => [id, SESSION_PROFILES[id]]);
}

export function groupSessionPhases(session = []) {
  const groups = [];
  let current = null;
  session.forEach((t) => {
    const name = t._phase || "Set";
    if (!current || current.name !== name) {
      current = { name, tracks: [] };
      groups.push(current);
    }
    current.tracks.push(t);
  });
  return groups;
}

export function sessionStats(session = []) {
  const seconds = session.reduce((s, t) => s + (t.duration || 210), 0);
  const covers = [];
  const seen = new Set();
  session.forEach((t) => {
    if (t.albumCover && !seen.has(t.albumCover)) {
      seen.add(t.albumCover);
      covers.push(t.albumCover);
    }
  });
  return {
    tracks: session.length,
    seconds,
    minutes: Math.round(seconds / 60),
    covers: covers.slice(0, 8),
  };
}

export function stripSessionMeta(session = []) {
  return session.map((t) => {
    const { _phase, ...rest } = t;
    return rest;
  });
}

export function filterTracksForSet(tracks = [], genre = null) {
  const playable = tracks.filter((t) => (t.duration || 0) <= 900 && (t.duration || 0) > 0);
  if (!genre) return playable;
  const g = normalizeGenre(genre) || genre;
  const sliced = playable.filter((t) => (normalizeGenre(t.genre) || t.genre) === g);
  return sliced.length >= 3 ? sliced : playable;
}

export function genresInPool(tracks = []) {
  const seen = new Set();
  tracks.forEach((t) => {
    const g = normalizeGenre(t.genre);
    if (g) seen.add(g);
  });
  return CANONICAL_GENRES.filter((g) => seen.has(g));
}

/**
 * Smooth energy samples along a profile (t = 0..1).
 */
export function sampleEnergyArc(profile, steps = 48) {
  const phases = profile?.phases;
  if (!phases?.length) return [];
  const knots = [];
  let x = 0;
  phases.forEach((ph) => {
    knots.push({ x, e: ph.e });
    x += ph.p;
  });
  knots.push({ x: 1, e: phases[phases.length - 1].e });

  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    let energy = knots[knots.length - 1].e;
    for (let k = 0; k < knots.length - 1; k += 1) {
      if (t >= knots[k].x && t <= knots[k + 1].x) {
        const span = knots[k + 1].x - knots[k].x || 1;
        const u = (t - knots[k].x) / span;
        const smooth = u * u * (3 - 2 * u);
        energy = knots[k].e + (knots[k + 1].e - knots[k].e) * smooth;
        break;
      }
    }
    points.push({ t, energy });
  }
  return points;
}

/**
 * Energy samples from a built session, stretched across 0..1 by duration.
 */
export function sampleSessionEnergy(session = [], steps = 48) {
  if (!session.length) return [];
  const total = session.reduce((s, t) => s + (t.duration || 210), 0) || 1;
  let acc = 0;
  const spans = session.map((t) => {
    const dur = t.duration || 210;
    const start = acc / total;
    acc += dur;
    return { start, end: acc / total, energy: t.energy || 5 };
  });
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const span = spans.find((s) => t >= s.start && t <= s.end) || spans[spans.length - 1];
    points.push({ t, energy: span.energy });
  }
  return points;
}

export function energyArcPath(points, {
  width = 320,
  height = 88,
  padX = 6,
  padY = 10,
} = {}) {
  if (!points.length) return { line: "", area: "", xy: [] };
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const xy = points.map((p) => ({
    x: padX + p.t * innerW,
    y: padY + (1 - (Math.max(1, Math.min(10, p.energy)) - 1) / 9) * innerH,
  }));
  const line = xy.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = xy[xy.length - 1];
  const first = xy[0];
  const area = `${line} L${last.x.toFixed(1)},${(height - padY).toFixed(1)} L${first.x.toFixed(1)},${(height - padY).toFixed(1)} Z`;
  return { line, area, xy };
}

/**
 * LCD-style waveform bars from an energy curve (djay / Serato Lite steal).
 */
export function energyWaveformBars(points, barCount = 72) {
  if (!points.length) return [];
  const bars = [];
  for (let i = 0; i < barCount; i += 1) {
    const t = barCount === 1 ? 0 : i / (barCount - 1);
    let nearest = points[0];
    let best = 1;
    for (let p = 0; p < points.length; p += 1) {
      const d = Math.abs(points[p].t - t);
      if (d < best) {
        best = d;
        nearest = points[p];
      }
    }
    const energy = nearest.energy || 5;
    const pulse = 0.82 + 0.18 * Math.abs(Math.sin(i * 1.7 + energy));
    bars.push({
      t,
      energy,
      height: Math.max(0.12, Math.min(1, ((energy - 1) / 9) * pulse)),
    });
  }
  return bars;
}

export function setTitle(profile, durationMins) {
  const vibe = profile?.label || "Set";
  return `${vibe} · ${formatSetDuration(durationMins)}`;
}
