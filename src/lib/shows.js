import { normalizeGenre } from "./genres";
import { trackMatchesScene } from "./scenes";
import { buildCountdown, countdownScore, stationDaypart } from "./station";

/**
 * VJ-hosted programmed blocks — Planet MP3 as a real channel.
 * Deterministic 24h schedule, named hosts, show pools, bumpers.
 */

function singlesOnly(tracks = []) {
  return tracks.filter((t) => (t.duration || 0) <= 900 && String(t.audioUrl || "").trim());
}

function hourOf(date = new Date()) {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

/** Format hour float → "4:00 PM" */
export function formatShowClock(hour) {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  const m = Math.round((hour % 1) * 60) % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatShowRange(startHour, endHour) {
  const end = endHour === 24 ? 0 : endHour;
  return `${formatShowClock(startHour)} – ${formatShowClock(end)}`;
}

/** Minutes until a future hour today (wraps past midnight). */
export function minutesUntilHour(targetHour, date = new Date()) {
  const now = hourOf(date);
  let delta = targetHour - now;
  if (delta < 0) delta += 24;
  return Math.round(delta * 60);
}

// ─── VJs ─────────────────────────────────────────────────────────────────────

export const VJ_HOSTS = {
  maya: {
    id: "maya",
    name: "Maya Chen",
    handle: "@maya",
    title: "After School Desk",
    bio: "Chaos curator. Requests, shout-outs, and anything that hits before dinner.",
    accent: "#FF3B4E",
    monogram: "MC",
  },
  dez: {
    id: "dez",
    name: "Dez Rivera",
    handle: "@dez",
    title: "Countdown Host",
    bio: "Keeps the chart honest. If it’s climbing, Dez is already on it.",
    accent: "#FFB020",
    monogram: "DR",
  },
  sol: {
    id: "sol",
    name: "Sol Park",
    handle: "@sol",
    title: "Morning Signal",
    bio: "Soft open, bright spins — the voice that wakes the station up.",
    accent: "#5C8CFF",
    monogram: "SP",
  },
  rio: {
    id: "rio",
    name: "Rio Santos",
    handle: "@rio",
    title: "Midday Frequency",
    bio: "Windows down energy. Pop heat, rhythm, and lunch-break pressure.",
    accent: "#2ED3A4",
    monogram: "RS",
  },
  jules: {
    id: "jules",
    name: "Jules Okonkwo",
    handle: "@jules",
    title: "Night Desk",
    bio: "Alt edges and after-hours gravity. Headphones recommended.",
    accent: "#B07CFF",
    monogram: "JO",
  },
  desk: {
    id: "desk",
    name: "The Desk",
    handle: "@planetmp3",
    title: "Station Desk",
    bio: "Editorial continuity — Community Mix hours and station IDs.",
    accent: "#16181E",
    monogram: "PM",
  },
};

export function getHost(hostId) {
  return VJ_HOSTS[hostId] || VJ_HOSTS.desk;
}

// ─── Shows (weekly grid, local clock) ────────────────────────────────────────

/**
 * Continuous 24h programming. `mode` drives pool selection:
 * - open: mix-lane flavored catalog
 * - genre: prefer genres[]
 * - scene: prefer scenes[]
 * - energy: clamp energy range
 * - countdown: Most Requested order
 * - requests: countdown-weighted but looser energy
 * - community: soft editorial / liked / mid energy
 */
export const STATION_SHOWS = [
  {
    id: "night-crash",
    title: "Night Crash",
    shortTitle: "Night Crash",
    tagline: "Last call · one more cut",
    hostId: "jules",
    startHour: 0,
    endHour: 5,
    mode: "energy",
    energy: [2, 6],
    genres: ["Electronic", "Jazz", "R&B & Soul", "Hip-Hop"],
    scenes: ["ambient", "downtempo", "deep-house"],
    bumpers: [
      "Still with Jules — Night Crash holds until sunrise.",
      "Dim lights. One more orbit.",
      "If you’re up, you’re in the right room.",
    ],
    intro: "Night Crash with Jules. Headphones on.",
  },
  {
    id: "sunrise-signal",
    title: "Sunrise Signal",
    shortTitle: "Sunrise",
    tagline: "Soft open · first spins of the day",
    hostId: "sol",
    startHour: 5,
    endHour: 9,
    mode: "energy",
    energy: [3, 6],
    genres: ["Pop", "R&B & Soul", "Electronic", "Jazz", "Country & Folk"],
    scenes: ["soul", "house", "folk"],
    bumpers: [
      "Sol on Sunrise Signal — easing the station awake.",
      "Coffee volume. Windows cracking open.",
      "First spins of the day coming through.",
    ],
    intro: "Sunrise Signal with Sol Park. Good morning.",
  },
  {
    id: "desk-live",
    title: "Desk Live",
    shortTitle: "Desk Live",
    tagline: "Daytime open channel · Sol at the desk",
    hostId: "sol",
    startHour: 9,
    endHour: 12,
    mode: "open",
    energy: [4, 7],
    genres: ["Pop", "Rock", "Hip-Hop", "Electronic", "R&B & Soul"],
    bumpers: [
      "Desk Live — Sol keeping the daytime signal clean.",
      "Request lines are warm. Stay locked.",
      "Mid-morning pressure, no filler.",
    ],
    intro: "You’re on Desk Live with Sol.",
  },
  {
    id: "lunch-frequency",
    title: "Lunch Frequency",
    shortTitle: "Lunch Freq",
    tagline: "Windows-down hour with Rio",
    hostId: "rio",
    startHour: 12,
    endHour: 15,
    mode: "genre",
    energy: [5, 8],
    genres: ["Pop", "Latin", "Hip-Hop", "R&B & Soul", "Reggae"],
    bumpers: [
      "Rio on Lunch Frequency — bags of heat before the bell.",
      "Eat fast. Play louder.",
      "Midday rhythm check in progress.",
    ],
    intro: "Lunch Frequency with Rio Santos.",
  },
  {
    id: "after-school-chaos",
    title: "After School Chaos",
    shortTitle: "After School",
    tagline: "Bags down · volume up · Maya’s desk",
    hostId: "maya",
    startHour: 15,
    endHour: 19,
    mode: "requests",
    energy: [5, 9],
    genres: ["Pop", "Hip-Hop", "Rock", "Electronic", "R&B & Soul"],
    bumpers: [
      "Maya’s running After School Chaos — send it.",
      "Request lines are lit. Keep ’em coming.",
      "School’s out. The chart doesn’t care.",
    ],
    intro: "After School Chaos with Maya Chen. Let’s go.",
  },
  {
    id: "most-requested-live",
    title: "Most Requested Live",
    shortTitle: "Most Requested",
    tagline: "Prime-time countdown with Dez",
    hostId: "dez",
    startHour: 19,
    endHour: 22,
    mode: "countdown",
    energy: [4, 9],
    genres: [],
    bumpers: [
      "Dez has the countdown — Most Requested Live.",
      "Appointment viewing. Don’t touch that dial.",
      "What’s #1 tonight? We’re finding out live.",
    ],
    intro: "Most Requested Live with Dez Rivera. The chart is open.",
  },
  {
    id: "alt-frequency",
    title: "Alt Frequency",
    shortTitle: "Alt Freq",
    tagline: "Edges, aliens, after-dark with Jules",
    hostId: "jules",
    startHour: 22,
    endHour: 24,
    mode: "scene",
    energy: [4, 8],
    genres: ["Electronic", "Rock", "Hip-Hop", "Metal"],
    scenes: ["techno", "rock", "drum-and-bass", "uk-garage", "experimental"],
    bumpers: [
      "Jules on Alt Frequency — left of the dial.",
      "If it feels weird, it belongs here.",
      "Night edge programming in progress.",
    ],
    intro: "Alt Frequency with Jules. Stay strange.",
  },
];

export function getShowById(id) {
  return STATION_SHOWS.find((s) => s.id === id) || null;
}

export function enrichShow(show) {
  if (!show) return null;
  const host = getHost(show.hostId);
  return {
    ...show,
    host,
    timeLabel: formatShowRange(show.startHour, show.endHour),
    daypartHint: stationDaypart(new Date(2000, 0, 1, Math.floor(show.startHour))).label,
  };
}

/** Does local hour fall inside [start, end)? Supports end=24. */
export function showCoversHour(show, hourFloat) {
  if (!show) return false;
  const h = ((hourFloat % 24) + 24) % 24;
  if (show.startHour < show.endHour) {
    return h >= show.startHour && h < show.endHour;
  }
  // wraps midnight
  return h >= show.startHour || h < show.endHour;
}

export function resolveShowAt(date = new Date()) {
  const h = hourOf(date);
  const show = STATION_SHOWS.find((s) => showCoversHour(s, h)) || STATION_SHOWS[0];
  const enriched = enrichShow(show);
  const end = show.endHour === 24 ? 24 : show.endHour;
  const start = show.startHour;
  let elapsed;
  if (start < end) {
    elapsed = h - start;
  } else {
    // overnight
    elapsed = h >= start ? h - start : h + (24 - start);
  }
  const duration = start < end ? end - start : 24 - start + end;
  const remaining = Math.max(0, duration - elapsed);
  const next = nextShowAfter(show);
  return {
    show: enriched,
    host: enriched.host,
    hour: h,
    elapsedMinutes: Math.round(elapsed * 60),
    remainingMinutes: Math.round(remaining * 60),
    progress: duration > 0 ? Math.min(1, Math.max(0, elapsed / duration)) : 0,
    nextShow: enrichShow(next),
    status: "live",
  };
}

export function nextShowAfter(show) {
  if (!show) return STATION_SHOWS[0];
  const idx = STATION_SHOWS.findIndex((s) => s.id === show.id);
  return STATION_SHOWS[(idx + 1) % STATION_SHOWS.length];
}

/** Full-day guide with live / up-next / later flags. */
export function buildDailyGuide(date = new Date()) {
  const live = resolveShowAt(date);
  return STATION_SHOWS.map((raw) => {
    const show = enrichShow(raw);
    let status = "later";
    if (show.id === live.show.id) status = "live";
    else if (show.id === live.nextShow?.id) status = "up-next";
    return {
      ...show,
      status,
      remainingMinutes: status === "live" ? live.remainingMinutes : null,
    };
  });
}

function energyFits(track, range) {
  if (!range || range.length < 2) return true;
  const e = track.energy ?? 5;
  return e >= range[0] && e <= range[1];
}

function genreFits(track, genres = []) {
  if (!genres.length) return true;
  const g = normalizeGenre(track.genre);
  return genres.includes(g);
}

function sceneFits(track, scenes = []) {
  if (!scenes.length) return true;
  return scenes.some((id) => trackMatchesScene(track, id));
}

/**
 * Build the listening pool for a show.
 * Always falls back to playable singles so a sparse catalog never dead-airs.
 */
export function buildShowPool(tracks = [], show, { countdown = null } = {}) {
  const singles = singlesOnly(tracks);
  if (!singles.length) return [];
  if (!show) return singles;

  const mode = show.mode || "open";

  if (mode === "countdown" || mode === "requests") {
    const chart = countdown || buildCountdown(singles, 40);
    const ordered = chart.map((c) => c.track).filter(Boolean);
    if (mode === "countdown" && ordered.length) return ordered;
    // requests: prefer chart heat but keep a wider shelf
    const ids = new Set(ordered.map((t) => t.id));
    const rest = singles
      .filter((t) => !ids.has(t.id))
      .sort((a, b) => countdownScore(b) - countdownScore(a));
    return [...ordered, ...rest];
  }

  let pool = singles.filter((t) => energyFits(t, show.energy));

  if (mode === "scene" && show.scenes?.length) {
    const sceneHits = pool.filter((t) => sceneFits(t, show.scenes));
    if (sceneHits.length >= 8) pool = sceneHits;
    else {
      const genreHits = pool.filter((t) => genreFits(t, show.genres));
      pool = [...sceneHits, ...genreHits.filter((t) => !sceneHits.includes(t))];
    }
  } else if ((mode === "genre" || mode === "open" || mode === "energy" || mode === "community") && show.genres?.length) {
    const genreHits = pool.filter((t) => genreFits(t, show.genres));
    if (genreHits.length >= 6) pool = genreHits;
  }

  if (mode === "community") {
    pool = pool
      .slice()
      .sort((a, b) => {
        const like = (b.liked ? 1 : 0) - (a.liked ? 1 : 0);
        if (like) return like;
        return (b.likeCount || 0) - (a.likeCount || 0);
      });
  } else {
    pool = pool
      .slice()
      .sort((a, b) => countdownScore(b) - countdownScore(a));
  }

  return pool.length ? pool : singles;
}

/** Pick a rotating bumper line for interstitials. */
export function pickShowBumper(show, date = new Date()) {
  const lines = show?.bumpers || [];
  if (!lines.length) return null;
  const slot = Math.floor(date.getMinutes() / 5) + (show.id || "").length;
  return lines[slot % lines.length];
}

/** Ticker / lower-third helpers for a live show. */
export function showOnAirLabel(show) {
  if (!show) return null;
  return show.shortTitle || show.title;
}

export function showHostCredit(show) {
  if (!show?.host) return null;
  return `with ${show.host.name}`;
}

/**
 * Extend station ticker with live show + host + next block.
 */
export function buildShowTickerBits({ show = null, nextShow = null, bumper = null } = {}) {
  const bits = [];
  if (show) {
    bits.push(`NOW ON AIR — ${show.title.toUpperCase()}`);
    if (show.host?.name) bits.push(`HOSTED BY ${show.host.name.toUpperCase()}`);
  }
  if (nextShow) {
    bits.push(`UP NEXT — ${nextShow.title.toUpperCase()} · ${formatShowClock(nextShow.startHour)}`);
  }
  if (bumper) bits.push(bumper);
  return bits;
}

/** Human remaining copy — "42 min left" / "switches soon". */
export function formatRemaining(minutes) {
  if (minutes == null) return "";
  if (minutes <= 1) return "switching soon";
  if (minutes < 60) return `${minutes} min left`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h left`;
  return `${h}h ${m}m left`;
}
