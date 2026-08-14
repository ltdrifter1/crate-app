import { trackMatchesScene } from "./scenes";
import { normalizeGenre } from "./genres";
import { countdownScore } from "./station";

/**
 * Scene surfing — dial channels under Channel Surfing (CH-01 … CH-09).
 *
 * Source mapping:
 *   01 Y2K Dance             → by genre
 *   02 Variety Mix           → curator shelf (variety pad)
 *   03 Local Pacific Northwest → Audioasis batch upload (`batch` includes audioasis)
 *   04 Electronic            → expansions batch / techno–warehouse scenes
 *   05 Drum & Bass           → by genre
 *   06 Emo & Shoegaze        → by genre
 *   07 Metal                 → metal batch upload (+ genre fallback)
 *   08 Punk                  → punk batch upload (+ keywords)
 *   09 Country & Folk        → country-folk batch upload (+ genre fallback)
 *
 * Batch uploads: set track.batch (or source) like audioasis-wave-1 —
 *   metal-wave-1 | punk-wave-1 | country-folk-wave-1
 */

function singlesOnly(tracks = []) {
  return tracks.filter((t) => (t.duration || 0) <= 900 && String(t.audioUrl || "").trim());
}

/** PNW / Cascadia markers for the Local channel (Audioasis mapping later). */
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
  "audioasis",
];

const SHOEGAZE_KEYWORDS = [
  "shoegaze",
  "shoe gaze",
  "shoegazer",
  "dream pop",
  "dreampop",
  "slowdive",
  "my bloody valentine",
  "mbv",
  "ride",
  "chapterhouse",
  "lush",
  "category 4",
  "nu gaze",
  "nugaze",
  "emo",
  "midwest emo",
  "screamo",
  "post-hardcore",
  "post hardcore",
  "american football",
  "cap'n jazz",
  "dashboard confessional",
  "taking back sunday",
  "brand new",
  "paramore",
  "jimmy eat world",
];

const METAL_KEYWORDS = [
  "metal",
  "heavy metal",
  "thrash",
  "doom",
  "death metal",
  "black metal",
  "metalcore",
  "hardcore metal",
  "sludge",
  "stoner metal",
  "power metal",
  "nu metal",
  "numetal",
  "grindcore",
];

const PUNK_KEYWORDS = [
  "punk",
  "punk rock",
  "post-punk",
  "post punk",
  "hardcore punk",
  "pop punk",
  "pop-punk",
  "skate punk",
  "ska punk",
  "garage punk",
  "crust punk",
  "anarcho",
  "oi!",
  "street punk",
];

const COUNTRY_FOLK_KEYWORDS = [
  "country",
  "folk",
  "americana",
  "bluegrass",
  "alt-country",
  "alt country",
  "singer-songwriter",
  "singer songwriter",
  "honky tonk",
  "outlaw country",
  "roots",
  "country folk",
];

/** Batch / source prefixes for channel upload waves (Audioasis-style). */
export const CHANNEL_BATCH_PREFIXES = {
  "local-pnw": ["audioasis"],
  "electronic-underground": ["expansion", "expansions"],
  metal: ["metal"],
  punk: ["punk"],
  "country-folk": ["country-folk", "countryfolk", "country", "folk"],
};

/** Pending catalog-source wiring (curator shelf / Audioasis / expansions / genre batches). */
export const CHANNEL_SOURCE_NOTES = {
  "y2k-dance": { num: 1, source: "genre", note: "Y2K Dance — match by genre/scene" },
  "variety-mix": { num: 2, source: "variety", note: "Variety Mix — full-shelf variety pad (curator mapping later)" },
  "local-pnw": { num: 3, source: "audioasis", note: "Local PNW — Audioasis batch upload (`batch` includes audioasis)" },
  "electronic-underground": { num: 4, source: "expansions", note: "Electronic — expansions batch (+ techno/warehouse scenes)" },
  "drum-and-bass": { num: 5, source: "genre", note: "Drum & Bass — match by genre/scene" },
  shoegaze: { num: 6, source: "genre", note: "Emo & Shoegaze — match by genre/keywords" },
  metal: { num: 7, source: "metal", note: "Metal — batch upload (`metal-wave-N`) + genre/scene fallback" },
  punk: { num: 8, source: "punk", note: "Punk — batch upload (`punk-wave-N`) + keywords" },
  "country-folk": { num: 9, source: "country-folk", note: "Country & Folk — batch upload (`country-folk-wave-N`) + genre fallback" },
};

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
    track?.batch,
    track?.source,
    track?.curator,
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

function trackBatchSource(track) {
  return String(track?.batch || track?.source || "").toLowerCase();
}

/** True when track.batch / track.source matches a channel's upload wave prefix. */
export function matchesChannelBatch(track, prefixes = []) {
  const batch = trackBatchSource(track);
  if (!batch || !prefixes.length) return false;
  return prefixes.some((p) => batch.includes(String(p).toLowerCase()));
}

function isLocalPnwTrack(track) {
  if (!track) return false;
  const region = String(track.region || track.origin || track.location || "").toLowerCase();
  if (region === "pnw" || region === "pacific northwest" || region === "cascadia") return true;
  if (track.local === true || track.pnw === true) return true;
  // Audioasis batch upload waves
  if (matchesChannelBatch(track, CHANNEL_BATCH_PREFIXES["local-pnw"])) return true;
  return matchesKeywords(track, PNW_KEYWORDS);
}

function isShoegazeTrack(track) {
  if (!track) return false;
  const rawGenre = String(track.genre || "").toLowerCase();
  if (
    rawGenre.includes("shoegaze") ||
    rawGenre.includes("dream pop") ||
    rawGenre.includes("dreampop") ||
    rawGenre.includes("emo") ||
    rawGenre.includes("screamo") ||
    rawGenre.includes("post-hardcore") ||
    rawGenre.includes("post hardcore")
  ) {
    return true;
  }
  return matchesKeywords(track, SHOEGAZE_KEYWORDS);
}

function isMetalTrack(track) {
  if (!track) return false;
  // Metal batch uploads (Audioasis-style waves)
  if (matchesChannelBatch(track, CHANNEL_BATCH_PREFIXES.metal)) return true;
  if (normalizeGenre(track.genre) === "Metal") return true;
  if (trackMatchesScene(track, "metal")) return true;
  const rawGenre = String(track.genre || "").toLowerCase();
  if (rawGenre.includes("metal") || rawGenre.includes("thrash") || rawGenre.includes("doom")) return true;
  return matchesKeywords(track, METAL_KEYWORDS);
}

/** Punk maps into Rock in normalizeGenre — match batch, raw labels + keywords. */
function isPunkTrack(track) {
  if (!track) return false;
  if (matchesChannelBatch(track, CHANNEL_BATCH_PREFIXES.punk)) return true;
  const rawGenre = String(track.genre || "").toLowerCase();
  if (
    rawGenre.includes("punk") ||
    rawGenre === "hardcore" ||
    rawGenre.includes("hardcore punk")
  ) {
    return true;
  }
  return matchesKeywords(track, PUNK_KEYWORDS);
}

function isCountryFolkTrack(track) {
  if (!track) return false;
  if (matchesChannelBatch(track, CHANNEL_BATCH_PREFIXES["country-folk"])) return true;
  if (normalizeGenre(track.genre) === "Country & Folk") return true;
  if (trackMatchesScene(track, "folk")) return true;
  const rawGenre = String(track.genre || "").toLowerCase();
  if (
    rawGenre.includes("country") ||
    rawGenre.includes("folk") ||
    rawGenre.includes("americana") ||
    rawGenre.includes("bluegrass")
  ) {
    return true;
  }
  return matchesKeywords(track, COUNTRY_FOLK_KEYWORDS);
}

/** Soft expansions hint until batch mapping lands. */
function isElectronicUndergroundTrack(track) {
  if (!track) return false;
  if (matchesChannelBatch(track, CHANNEL_BATCH_PREFIXES["electronic-underground"])) return true;
  if (matchesKeywords(track, ["underground", "warehouse", "expansions"])) return true;
  if (["techno", "industrial", "minimal", "experimental", "acid"].some((id) => trackMatchesScene(track, id))) {
    return true;
  }
  const g = normalizeGenre(track.genre);
  // Electronic lane only when energy/bpm reads underground-leaning
  if (g === "Electronic") {
    const energy = Number(track.energy) || 5;
    const bpm = Number(track.bpm) || 0;
    if (energy >= 7 || (bpm >= 128 && energy >= 5)) return true;
  }
  return false;
}

export const SCENE_CHANNELS = [
  {
    id: "y2k-dance",
    num: 1,
    title: "Y2K Dance",
    shortTitle: "Y2K Dance",
    dialSlug: "Y2K DANCE",
    tagline: "Millennium dancefloor — house, garage, disco",
    accent: "#9AA3B0",
    scenes: ["house", "uk-garage", "deep-house", "tech-house", "broken-beat", "disco", "progressive", "trance"],
    genres: ["Electronic", "Pop"],
    vibe: "Y2K Dance",
    source: "genre",
  },
  {
    id: "variety-mix",
    num: 2,
    title: "Variety Mix",
    shortTitle: "Variety Mix",
    dialSlug: "VARIETY",
    tagline: "Cross-genre spins · anything goes",
    accent: "#C5CAD3",
    scenes: [],
    genres: [],
    vibe: "Variety Mix",
    source: "variety",
    /**
     * Curator mapping TODO — empty filters + non-strict pool pads with the
     * full shelf (variety). When curator metadata ships, switch to a strict match.
     */
    minTracks: 1,
  },
  {
    id: "local-pnw",
    num: 3,
    title: "Local Pacific Northwest",
    shortTitle: "Local PNW",
    dialSlug: "LOCAL PNW",
    tagline: "Pacific Northwest only",
    accent: "#A8B0BC",
    scenes: [],
    genres: [],
    vibe: "Local Pacific Northwest",
    source: "audioasis",
    /** Only PNW / Audioasis cuts — never pad with the full catalog. */
    strict: true,
    match: isLocalPnwTrack,
    minTracks: 1,
  },
  {
    id: "electronic-underground",
    num: 4,
    title: "Electronic",
    shortTitle: "Electronic",
    dialSlug: "ELECTRONIC",
    tagline: "Techno, warehouse, late voltage",
    accent: "#7A8494",
    scenes: ["techno", "industrial", "minimal", "experimental", "acid"],
    genres: [],
    vibe: "Electronic",
    source: "expansions",
    /** Expansions batch mapping TODO — genre/scene match until then. */
    match: isElectronicUndergroundTrack,
    minTracks: 1,
  },
  {
    id: "drum-and-bass",
    num: 5,
    title: "Drum & Bass",
    shortTitle: "Drum & Bass",
    dialSlug: "DRUM BASS",
    tagline: "DnB, jungle, liquid",
    accent: "#8A919C",
    scenes: ["drum-and-bass", "jungle", "liquid", "breakbeat"],
    genres: ["Electronic"],
    vibe: "Drum & Bass",
    source: "genre",
  },
  {
    id: "shoegaze",
    num: 6,
    title: "Emo & Shoegaze",
    shortTitle: "Emo & Shoegaze",
    dialSlug: "EMO SHOE",
    tagline: "Feelings, fuzz, and walls of guitar",
    accent: "#16181E",
    scenes: [],
    genres: [],
    vibe: "Emo & Shoegaze",
    source: "genre",
    strict: true,
    match: isShoegazeTrack,
    minTracks: 1,
  },
  {
    id: "metal",
    num: 7,
    title: "Metal",
    shortTitle: "Metal",
    dialSlug: "METAL",
    tagline: "Riffs, weight, and high gain",
    accent: "#9A8F86",
    scenes: ["metal"],
    genres: ["Metal"],
    vibe: "Metal",
    source: "metal",
    /** Batch upload waves (`metal-wave-N`) + genre fallback — never pad. */
    strict: true,
    match: isMetalTrack,
    minTracks: 1,
  },
  {
    id: "punk",
    num: 8,
    title: "Punk",
    shortTitle: "Punk",
    dialSlug: "PUNK",
    tagline: "Fast, loud, and unpolished",
    accent: "#B0A49A",
    scenes: [],
    genres: [],
    vibe: "Punk",
    source: "punk",
    /** Batch upload waves (`punk-wave-N`) + keywords — never pad. */
    strict: true,
    match: isPunkTrack,
    minTracks: 1,
  },
  {
    id: "country-folk",
    num: 9,
    title: "Country & Folk",
    shortTitle: "Country & Folk",
    dialSlug: "COUNTRY",
    tagline: "Twang, roots, and open roads",
    accent: "#A89878",
    scenes: ["folk"],
    genres: ["Country & Folk"],
    vibe: "Country & Folk",
    source: "country-folk",
    /** Batch upload waves (`country-folk-wave-N`) + genre fallback — never pad. */
    strict: true,
    match: isCountryFolkTrack,
    minTracks: 1,
  },
];

export function getSceneChannel(id) {
  // Legacy aliases from earlier dials
  if (id === "techno-tunnel") return SCENE_CHANNELS.find((c) => c.id === "local-pnw") || null;
  if (id === "ukg-block" || id === "house-ukg") return SCENE_CHANNELS.find((c) => c.id === "y2k-dance") || null;
  if (id === "bass-weight") return SCENE_CHANNELS.find((c) => c.id === "drum-and-bass") || null;
  if (id === "rap-city") return SCENE_CHANNELS.find((c) => c.id === "variety-mix") || null;
  return SCENE_CHANNELS.find((c) => c.id === id) || null;
}

function matchesChannel(track, channel) {
  if (!track || !channel) return false;
  if (typeof channel.match === "function") {
    const hit = channel.match(track);
    if (hit) return true;
    // preferMatch channels still allow scene/genre fallback when match misses
    if (!channel.preferMatch) return false;
  }
  if ((channel.keywords || []).length && matchesKeywords(track, channel.keywords)) return true;
  if ((channel.scenes || []).some((sid) => trackMatchesScene(track, sid))) return true;
  const g = normalizeGenre(track.genre);
  return (channel.genres || []).includes(g);
}

/** Public channel membership check for charts / filters. */
export function trackMatchesChannel(track, channel) {
  return matchesChannel(track, channel);
}

export function buildSceneChannelPool(tracks = [], channel) {
  const singles = singlesOnly(tracks);
  if (!channel) return singles;
  const hits = singles.filter((t) => matchesChannel(t, channel));
  if (channel.strict) {
    return hits.slice().sort((a, b) => countdownScore(b) - countdownScore(a));
  }
  // Variety / expansions: prefer direct hits, then pad with ranked shelf
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
