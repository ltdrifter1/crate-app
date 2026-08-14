import { trackMatchesScene } from "./scenes";
import { normalizeGenre } from "./genres";
import { countdownScore } from "./station";

/**
 * Scene surfing — dial channels under Channel Surfing (CH-01 … CH-06).
 *
 * Source mapping (remember for later — not fully wired yet):
 *   01 Y2K Dance             → by genre
 *   02 Variety Mix           → Evie
 *   03 Local Pacific Northwest → Audioasis batch upload mapping
 *   04 Electronic Underground → expansions
 *   05 Drum & Bass           → by genre
 *   06 Emo & Shoegaze        → by genre
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

/** Pending catalog-source wiring (Evie / Audioasis / expansions). */
export const CHANNEL_SOURCE_NOTES = {
  "y2k-dance": { num: 1, source: "genre", note: "Y2K Dance — match by genre/scene" },
  "variety-mix": { num: 2, source: "evie", note: "Variety Mix — Evie curator/playlist mapping (TODO)" },
  "local-pnw": { num: 3, source: "audioasis", note: "Local PNW — Audioasis batch upload mapping (TODO)" },
  "electronic-underground": { num: 4, source: "expansions", note: "Electronic Underground — expansions mapping (TODO)" },
  "drum-and-bass": { num: 5, source: "genre", note: "Drum & Bass — match by genre/scene" },
  shoegaze: { num: 6, source: "genre", note: "Emo & Shoegaze — match by genre/keywords" },
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

function isLocalPnwTrack(track) {
  if (!track) return false;
  const region = String(track.region || track.origin || track.location || "").toLowerCase();
  if (region === "pnw" || region === "pacific northwest" || region === "cascadia") return true;
  if (track.local === true || track.pnw === true) return true;
  // Soft Audioasis hint until batch mapping is wired
  const batch = String(track.batch || track.source || "").toLowerCase();
  if (batch.includes("audioasis")) return true;
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

/** Soft expansions hint until batch mapping lands. */
function isElectronicUndergroundTrack(track) {
  if (!track) return false;
  const batch = String(track.batch || track.source || "").toLowerCase();
  if (batch.includes("expansion")) return true;
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
    tagline: "Evie's cross-genre dial",
    accent: "#C5CAD3",
    scenes: [],
    genres: [],
    vibe: "Variety Mix",
    source: "evie",
    /**
     * Evie curator mapping TODO — empty filters + non-strict pool pads with the
     * full shelf (variety). When Evie metadata ships, switch to a strict match.
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
    title: "Electronic Underground",
    shortTitle: "Underground",
    dialSlug: "UNDERGROUND",
    tagline: "Techno, warehouse, expansions",
    accent: "#7A8494",
    scenes: ["techno", "industrial", "minimal", "experimental", "acid"],
    genres: [],
    vibe: "Electronic Underground",
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
