import { trackMatchesScene } from "./scenes";
import { normalizeGenre } from "./genres";
import { countdownScore } from "./station";

/**
 * Scene surfing — dial channels under the broad genres.
 * Numbers map to on-air CH-bugs (CH-02 UK GARAGE …).
 */

function singlesOnly(tracks = []) {
  return tracks.filter((t) => (t.duration || 0) <= 900 && String(t.audioUrl || "").trim());
}

/** PNW / Cascadia markers for the Local channel. */
const PNW_KEYWORDS = [
  "pacific northwest",
  "pacific-northwest",
  "pnw",
  "cascadia",
  "seattle",
  "portland",
  "olympia",
  "tacoma",
  "bellingham",
  "spokane",
  "eugene",
  "salem",
  "bend",
  "boise",
  "vancouver wa",
  "vancouver, wa",
  "washington",
  "oregon",
  "puget sound",
  "willamette",
  "columbia river",
];

function trackTextBlob(track) {
  return [
    track?.title,
    track?.artist,
    track?.album,
    track?.genre,
    track?.city,
    track?.region,
    track?.origin,
    track?.location,
    track?.label,
    Array.isArray(track?.tags) ? track.tags.join(" ") : track?.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesKeywords(track, keywords = []) {
  if (!keywords.length) return false;
  const blob = trackTextBlob(track);
  if (!blob) return false;
  return keywords.some((kw) => blob.includes(String(kw).toLowerCase()));
}

function isLocalPnwTrack(track) {
  if (!track) return false;
  const region = String(track.region || track.origin || track.location || "").toLowerCase();
  if (region === "pnw" || region === "pacific northwest" || region === "cascadia") return true;
  if (track.local === true || track.pnw === true) return true;
  return matchesKeywords(track, PNW_KEYWORDS);
}

export const SCENE_CHANNELS = [
  {
    id: "ukg-block",
    num: 2,
    title: "UK Garage",
    shortTitle: "UK Garage",
    dialSlug: "UK GARAGE",
    tagline: "2-step and garage",
    accent: "#9AA3B0",
    scenes: ["uk-garage", "broken-beat"],
    genres: ["Electronic"],
    vibe: "UK Garage",
  },
  {
    id: "rap-city",
    num: 3,
    title: "Rap & Grime",
    shortTitle: "Rap City",
    dialSlug: "RAP CITY",
    tagline: "Hip-hop and UK grime",
    accent: "#C5CAD3",
    scenes: ["hip-hop", "grime"],
    genres: ["Hip-Hop"],
    vibe: "Rap & Grime",
  },
  {
    id: "local-pnw",
    num: 4,
    title: "Local",
    shortTitle: "Local",
    dialSlug: "LOCAL",
    tagline: "Pacific Northwest only",
    accent: "#A8B0BC",
    scenes: [],
    genres: [],
    vibe: "Local",
    /** Only PNW cuts — never pad with the full catalog. */
    strict: true,
    match: isLocalPnwTrack,
    minTracks: 1,
  },
  {
    id: "bass-weight",
    num: 5,
    title: "DnB & Jungle",
    shortTitle: "Bass Weight",
    dialSlug: "BASS WT",
    tagline: "Drum & bass, jungle, dubstep",
    accent: "#7A8494",
    scenes: ["drum-and-bass", "jungle", "liquid", "dubstep", "breakbeat"],
    genres: ["Electronic"],
    vibe: "DnB & Jungle",
  },
  {
    id: "soul-continuum",
    num: 6,
    title: "Soul & R&B",
    shortTitle: "Soul Cont.",
    dialSlug: "SOUL",
    tagline: "Soul, neo-soul, funk",
    accent: "#8A919C",
    scenes: ["soul", "neo-soul", "funk", "rnb", "gospel"],
    genres: ["R&B & Soul"],
    vibe: "Soul & R&B",
  },
  {
    id: "alt-nation",
    num: 7,
    title: "Rock & Alt",
    shortTitle: "Alt Nation",
    dialSlug: "ALT NAT",
    tagline: "Rock, metal, left-field",
    accent: "#16181E",
    scenes: ["rock", "metal", "experimental"],
    genres: ["Rock", "Metal"],
    vibe: "Rock & Alt",
  },
  {
    id: "pop-crash",
    num: 8,
    title: "Pop & Disco",
    shortTitle: "Pop Crash",
    dialSlug: "POP CRASH",
    tagline: "Pop, disco, and house",
    accent: "#8B939F",
    scenes: ["disco", "house"],
    genres: ["Pop", "Latin"],
    vibe: "Pop & Disco",
  },
  {
    id: "afterhours-fog",
    num: 9,
    title: "Ambient & Downtempo",
    shortTitle: "Afterhours",
    dialSlug: "AFTER HRS",
    tagline: "Ambient, downtempo, deep house",
    accent: "#7A91A4",
    scenes: ["ambient", "downtempo", "deep-house"],
    genres: ["Electronic", "Jazz"],
    vibe: "Ambient & Downtempo",
  },
];

export function getSceneChannel(id) {
  if (id === "techno-tunnel") return SCENE_CHANNELS.find((c) => c.id === "local-pnw") || null;
  return SCENE_CHANNELS.find((c) => c.id === id) || null;
}

function matchesChannel(track, channel) {
  if (!track || !channel) return false;
  if (typeof channel.match === "function") return channel.match(track);
  if ((channel.keywords || []).length && matchesKeywords(track, channel.keywords)) return true;
  if ((channel.scenes || []).some((id) => trackMatchesScene(track, id))) return true;
  const g = normalizeGenre(track.genre);
  return (channel.genres || []).includes(g);
}

export function buildSceneChannelPool(tracks = [], channel) {
  const singles = singlesOnly(tracks);
  if (!channel) return singles;
  const hits = singles.filter((t) => matchesChannel(t, channel));
  if (channel.strict) {
    return hits.slice().sort((a, b) => countdownScore(b) - countdownScore(a));
  }
  const ranked = (hits.length ? hits : singles)
    .slice()
    .sort((a, b) => countdownScore(b) - countdownScore(a));
  return ranked;
}

/** Channels that actually have catalog depth right now. */
export function availableSceneChannels(tracks = [], minTracks = 3) {
  return SCENE_CHANNELS.map((channel) => {
    const pool = buildSceneChannelPool(tracks, channel);
    const direct = singlesOnly(tracks).filter((t) => matchesChannel(t, channel));
    const need = channel.minTracks != null ? channel.minTracks : minTracks;
    return {
      ...channel,
      count: direct.length,
      ready: direct.length >= need || (!channel.strict && pool.length >= need),
    };
  }).filter((c) => c.ready);
}

/**
 * Distinct album-cover URLs for a channel tile mosaic (up to `limit`).
 * Prefers direct channel matches, then the ranked pool.
 */
export function channelCoverUrls(tracks = [], channel, limit = 4) {
  const max = Math.max(1, limit);
  const seen = new Set();
  const out = [];
  const push = (list) => {
    for (const t of list || []) {
      const url = t?.albumCover;
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push(url);
      if (out.length >= max) return true;
    }
    return false;
  };
  const direct = singlesOnly(tracks).filter((t) => matchesChannel(t, channel));
  if (push(direct)) return out;
  push(buildSceneChannelPool(tracks, channel));
  return out;
}
