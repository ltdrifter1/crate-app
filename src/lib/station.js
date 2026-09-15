import { brandStoragePrefix } from "../brand/identity";

/**
 * Station — MTV / MuchMusic broadcast layer.
 * Countdown ranking, dayparts, requests, presence heat, dedications.
 */

const DAYPARTS = [
  { id: "after-hours", label: "After Hours", start: 0, end: 5, vibe: "Late signal · headphones on" },
  { id: "sunrise", label: "Sunrise Block", start: 5, end: 9, vibe: "Soft open · first spins" },
  { id: "daytime", label: "Daytime Live", start: 9, end: 15, vibe: "Office speakers · open windows" },
  { id: "after-school", label: "After School Chaos", start: 15, end: 19, vibe: "Bags down · volume up" },
  { id: "prime-time", label: "Prime Time Countdown", start: 19, end: 22, vibe: "Appointment viewing" },
  { id: "night-crash", label: "Night Crash", start: 22, end: 24, vibe: "Last call · one more" },
];

function singlesOnly(tracks = []) {
  return tracks.filter((t) => (t.duration || 0) <= 900);
}

/** UTC day key for request / dedication quotas. */
export function stationDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function stationDaypart(date = new Date()) {
  const h = date.getHours();
  return DAYPARTS.find((d) => h >= d.start && h < d.end) || DAYPARTS[0];
}

/** Heat score for countdown — requests dominate, then plays/likes. */
export function countdownScore(track = {}) {
  const requests = track.requestCount || 0;
  const plays = track.playCount || 0;
  const likes = track.likeCount || 0;
  const pull = track._signal?.pull || 0;
  return requests * 12 + plays * 1.4 + likes * 3.2 + pull * 0.5;
}

/**
 * Numbered countdown chart — Most Requested energy.
 * Returns [{ rank, track, score, deltaLabel }].
 */
export function buildCountdown(tracks = [], limit = 20) {
  const ranked = singlesOnly(tracks)
    .slice()
    .sort((a, b) => {
      const s = countdownScore(b) - countdownScore(a);
      if (s !== 0) return s;
      const plays = (b.playCount || 0) - (a.playCount || 0);
      if (plays !== 0) return plays;
      return String(a.id).localeCompare(String(b.id));
    })
    .slice(0, limit);

  return ranked.map((track, i) => {
    const rank = i + 1;
    let deltaLabel = "NEW";
    if ((track.requestCount || 0) >= 3) deltaLabel = "↑ HOT";
    else if ((track.playCount || 0) >= 8) deltaLabel = "↑";
    else if (rank <= 5) deltaLabel = "●";
    else if ((track.playCount || 0) === 0 && (track.likeCount || 0) === 0) deltaLabel = "NEW";
    else deltaLabel = "·";
    return { rank, track, score: countdownScore(track), deltaLabel };
  });
}

/** Human lower-third line for the now-playing graphic. */
export function nowPlayingLowerThird(track, { daypart = null, rank = null, show = null } = {}) {
  if (!track) return null;
  const parts = [];
  if (rank != null) parts.push(`#${rank}`);
  parts.push("NOW PLAYING");
  const scene = track.sceneLabel || track.genre || null;
  const year = track.year || track.releaseYear || null;
  const metaBits = [scene, year].filter(Boolean);
  if (show?.title) metaBits.unshift(show.shortTitle || show.title);
  if (show?.host?.name) metaBits.push(`with ${show.host.name}`);
  const meta = metaBits.join(" · ");
  return {
    kicker: parts.join(" · "),
    title: track.title || "Untitled",
    artist: track.artist || "Unknown",
    meta: meta || (daypart ? daypart.label : "On air"),
    daypart: daypart?.label || null,
    showTitle: show?.title || null,
  };
}

/**
 * Estimated locked-in audience — deterministic heat from track + daypart.
 * Feels alive without inventing fake live infra.
 */
export function estimateLockedIn(track, date = new Date()) {
  const daypart = stationDaypart(date);
  const baseByPart = {
    "after-hours": 38,
    sunrise: 52,
    daytime: 94,
    "after-school": 186,
    "prime-time": 240,
    "night-crash": 128,
  };
  const base = baseByPart[daypart.id] || 80;
  const heat = Math.min(
    220,
    (track?.playCount || 0) * 2.2 +
      (track?.likeCount || 0) * 4 +
      (track?.requestCount || 0) * 9
  );
  const idHash = String(track?.id || "x")
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  const wobble = (idHash + date.getMinutes()) % 17;
  return Math.max(12, Math.round(base + heat * 0.35 + wobble));
}

function storageKey(suffix) {
  return `${brandStoragePrefix()}:station:${suffix}`;
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
    /* quota / private mode */
  }
}

/** Local request ledger — one bump per track per day per browser. */
export function hasRequestedToday(trackId, dayKey = stationDayKey()) {
  if (!trackId) return false;
  const bag = readJson(storageKey(`requests:${dayKey}`), {});
  return !!bag[trackId];
}

export function markRequestedToday(trackId, dayKey = stationDayKey()) {
  if (!trackId) return false;
  const key = storageKey(`requests:${dayKey}`);
  const bag = readJson(key, {});
  if (bag[trackId]) return false;
  bag[trackId] = Date.now();
  writeJson(key, bag);
  return true;
}

const MAX_DEDICATIONS = 40;
const MAX_DEDICATION_LEN = 72;

const SEED_DEDICATIONS = [
  { text: "This one is for the late bus ride home", fromName: "Mira" },
  { text: "Play this loud in the kitchen", fromName: "Jae" },
  { text: "Shout out everyone still discovering cuts", fromName: "Theo" },
  { text: "Dedication to my sister — she always finds the good ones", fromName: "Sam" },
  { text: "Requesting pure chaos energy", fromName: "Riley" },
];

/** Seed a few rotating dedications so the crawl never feels empty. */
export function seedDedicationFeed(now = Date.now()) {
  const existing = readJson(storageKey("dedications"), null);
  if (existing && Array.isArray(existing) && existing.length > 0) return existing;
  const seeded = SEED_DEDICATIONS.map((d, i) => ({
    id: `seed-${i}`,
    text: d.text,
    fromName: d.fromName,
    trackId: null,
    trackTitle: null,
    createdAt: now - (i + 1) * 1000 * 60 * 7,
    seed: true,
  }));
  writeJson(storageKey("dedications"), seeded);
  return seeded;
}

export function listDedications(limit = 12) {
  const feed = seedDedicationFeed();
  return feed
    .slice()
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, limit);
}

export function addDedication({
  text,
  fromName = "Listener",
  trackId = null,
  trackTitle = null,
} = {}) {
  const cleaned = String(text || "").trim().slice(0, MAX_DEDICATION_LEN);
  if (!cleaned) return null;
  const entry = {
    id: `d-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text: cleaned,
    fromName: String(fromName || "Listener").trim().slice(0, 24) || "Listener",
    trackId,
    trackTitle: trackTitle || null,
    createdAt: Date.now(),
    seed: false,
  };
  const feed = [entry, ...listDedications(MAX_DEDICATIONS)].slice(0, MAX_DEDICATIONS);
  writeJson(storageKey("dedications"), feed);
  return entry;
}

/** Ticker copy for the station crawl. */
export function buildStationTicker({
  countdown = [],
  daypart = null,
  communityMixTitle = null,
  dedication = null,
  show = null,
  nextShow = null,
  bumper = null,
  showBits = [],
} = {}) {
  const bits = [];
  bits.push("PLANET MP3 — ON AIR");
  if (showBits?.length) bits.push(...showBits);
  else if (show?.title) {
    bits.push(`NOW ON AIR — ${String(show.title).toUpperCase()}`);
    if (show.host?.name) bits.push(`HOSTED BY ${String(show.host.name).toUpperCase()}`);
    if (nextShow?.title) {
      bits.push(`UP NEXT — ${String(nextShow.title).toUpperCase()}`);
    }
  } else if (daypart?.label) {
    bits.push(daypart.label.toUpperCase());
  }
  if (bumper) bits.push(bumper);
  if (countdown[0]?.track) {
    bits.push(`#1 MOST REQUESTED — ${countdown[0].track.title} · ${countdown[0].track.artist}`);
  }
  if (countdown[1]?.track) {
    bits.push(`#2 — ${countdown[1].track.title}`);
  }
  if (communityMixTitle) bits.push(`COMMUNITY MIX — ${communityMixTitle}`);
  if (dedication?.text) {
    bits.push(`DEDICATION — ${dedication.fromName}: “${dedication.text}”`);
  }
  bits.push("REQUEST · REACT · DISCOVER");
  return bits.join("   ◆   ");
}

/** Soft reaction burst options on the player. */
export const STATION_REACTIONS = ["🔥", "💥", "🙌", "📺", "🕺"];

export function reactionBurstKey(trackId) {
  return storageKey(`react:${trackId || "none"}:${stationDayKey()}`);
}
