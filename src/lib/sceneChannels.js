import { trackMatchesScene, matchSceneFromText, getScene } from "./scenes";
import { normalizeGenre } from "./genres";
import { countdownScore } from "./station";

/**
 * Scene surfing — dial channels under Channel Surfing.
 *
 * Source mapping:
 *   01 Y2K Dance             → millennial house/garage/disco mix (not all Electronic)
 *   02 Psychedelic Rock      → psych / acid / space-rock (not the whole Rock lane)
 *   03 Variety Mix           → curator shelf (variety pad)
 *   04 Local                 → Audioasis batch upload (`batch` includes audioasis)
 *      Featured Channel Surfing station — larger broadcast tile (pinned when listing decorated dials)
 *   05 House                 → house / deep / tech-house / disco scenes
 *   06 Techno                → expansions batch / techno–warehouse scenes (was Electronic)
 *   07 UK Garage             → UKG / 2-step / broken-beat
 *   08 Dubstep               → dubstep / UK bass (not a 140bpm dump)
 *   09 Drum & Bass           → DnB / jungle / liquid scenes
 *   10 Emo & Shoegaze        → by genre
 *   11 Metal                 → metal batch upload (+ genre fallback)
 *   12 Punk                  → punk batch upload (+ keywords)
 *   13 Country & Folk        → country-folk batch upload (+ genre fallback)
 *   14 Ambient / Downtempo   → downtempo / trip-hop / ambient scenes
 *
 * Batch uploads: set track.batch (or source) like audioasis-wave-1 —
 *   metal-wave-1 | punk-wave-1 | country-folk-wave-1 | house-wave-1 | techno-wave-1
 *   | psych-wave-1
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
  "boise",
  "vancouver wa",
  "vancouver, wa",
  "oregon",
  "puget sound",
  "willamette",
  "columbia river",
  "audioasis",
];

/** Genre / style tokens plus distinctive band names. */
const SHOEGAZE_KEYWORDS = [
  "shoegaze",
  "shoe gaze",
  "shoegazer",
  "dream pop",
  "dreampop",
  "slowdive",
  "my bloody valentine",
  "mbv",
  "chapterhouse",
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
  "paramore",
  "jimmy eat world",
];

/** Band names that are also everyday words — match artist only. */
const SHOEGAZE_ARTISTS = ["ride", "lush", "brand new"];

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
  "punks",
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
  "country folk",
];

const DOWNTOMPO_KEYWORDS = [
  "downtempo",
  "trip-hop",
  "trip hop",
  "triphop",
  "chillout",
  "chill-out",
  "chill out",
  "lo-fi",
  "lofi",
];

const HOUSE_SCENES = ["house", "deep-house", "tech-house", "disco", "progressive", "amapiano"];
const TECHNO_SCENES = ["techno", "industrial", "minimal", "acid"];
const UK_GARAGE_SCENES = ["uk-garage", "broken-beat"];
const DNB_SCENES = ["drum-and-bass", "jungle", "liquid"];

const HOUSE_GENRE_KEYWORDS = ["house", "deep house", "tech house", "disco", "amapiano"];
const TECHNO_GENRE_KEYWORDS = ["techno", "minimal", "industrial", "acid"];
const UK_GARAGE_GENRE_KEYWORDS = ["uk garage", "ukg", "2-step", "2 step", "speed garage", "broken beat"];
const DUBSTEP_KEYWORDS = ["dubstep", "brostep", "post-dubstep", "post dubstep", "wobble"];
const PSYCH_KEYWORDS = [
  "psychedelic rock",
  "psychedelic",
  "psychedelia",
  "psych-rock",
  "psych rock",
  "acid rock",
  "acid-rock",
  "krautrock",
  "space rock",
  "space-rock",
  "garage psych",
  "neo-psych",
  "neopsych",
  "lysergic",
  "paisley underground",
];

const PSYCH_ARTISTS = [
  "grateful dead",
  "jefferson airplane",
  "13th floor elevators",
  "jimi hendrix",
  "the jimi hendrix experience",
  "pink floyd",
  "tame impala",
  "king gizzard",
  "ty segall",
  "wooden shjips",
  "unknown mortal orchestra",
  "brian jonestown massacre",
  "spacemen 3",
  "spiritualized",
  "os mutantes",
  "hawkwind",
  "the doors",
  "quicksilver messenger service",
  "kikagaku moyo",
  "the black angels",
];

const DUBSTEP_ARTISTS = [
  "skrillex",
  "burial",
  "skream",
  "benga",
  "magnetic man",
  "rusko",
  "caspa",
  "joker",
  "the bug",
  "eskmo",
  "mount kimbie",
  "6blocc",
  "digital mystikz",
  "kode9",
  "kode 9",
  "loefah",
  "hatcha",
  "pinch",
  "distance",
  "coki",
  "flux pavilion",
  "knife party",
  "zomboy",
  "excision",
  "modestep",
  "nero",
  "plastician",
  "shackleton",
  "boxcutter",
];

const Y2K_DANCE_SCENES = [
  "uk-garage",
  "deep-house",
  "tech-house",
  "broken-beat",
  "disco",
  "progressive",
  "trance",
];

/** Batch / source prefixes for channel upload waves (Audioasis-style). */
export const CHANNEL_BATCH_PREFIXES = {
  "psychedelic-rock": ["psych-wave", "psychedelic", "acid-rock"],
  "variety-mix": ["variety", "curator", "variety-mix"],
  "local-pnw": ["audioasis"],
  house: ["house"],
  techno: ["techno", "expansion", "expansions"],
  /** Legacy Electronic channel id — same waves as Techno. */
  "electronic-underground": ["techno", "expansion", "expansions"],
  "uk-garage": ["uk-garage", "ukg"],
  dubstep: ["dubstep"],
  metal: ["metal"],
  punk: ["punk"],
  "country-folk": ["country-folk", "countryfolk", "country", "folk"],
  downtempo: ["downtempo", "trip-hop", "triphop"],
};

/** Default Variety Mix pool size when no curator batch is present. */
export const VARIETY_CROSS_GENRE_LIMIT = 48;

/** Pending catalog-source wiring (curator shelf / Audioasis / expansions / genre batches). */
export const CHANNEL_SOURCE_NOTES = {
  "y2k-dance": { num: 1, source: "genre", note: "Y2K Dance — millennial house/garage/disco mix, not the whole Electronic lane" },
  "psychedelic-rock": { num: 2, source: "genre", note: "Psychedelic Rock — psych/acid/space-rock, not the whole Rock lane" },
  "variety-mix": { num: 3, source: "variety", note: "Variety Mix — curator batch (`variety-wave-N`) or cross-genre mix" },
  "local-pnw": { num: 4, source: "audioasis", showcase: true, note: "Local — featured Channel Surfing station; Audioasis batch (`batch` includes audioasis)" },
  house: { num: 5, source: "genre", note: "House — house/deep/tech-house/disco scenes, not the whole Electronic lane" },
  techno: { num: 6, source: "expansions", note: "Techno — expansions batch (`expansions-wave-N`) + techno/warehouse scenes" },
  "uk-garage": { num: 7, source: "genre", note: "UK Garage — UKG / 2-step / broken-beat, not the whole Electronic lane" },
  dubstep: { num: 8, source: "genre", note: "Dubstep — dubstep/UK bass keywords + artists, not a 140bpm dump" },
  "drum-and-bass": { num: 9, source: "genre", note: "Drum & Bass — DnB/jungle/liquid scenes, not the whole Electronic lane" },
  shoegaze: { num: 10, source: "genre", note: "Emo & Shoegaze — match by genre/keywords" },
  metal: { num: 11, source: "metal", note: "Metal — batch upload (`metal-wave-N`) + genre/scene fallback" },
  punk: { num: 12, source: "punk", note: "Punk — batch upload (`punk-wave-N`) + keywords" },
  "country-folk": { num: 13, source: "country-folk", note: "Country & Folk — batch upload (`country-folk-wave-N`) + genre fallback" },
  downtempo: { num: 14, source: "genre", note: "Ambient / Downtempo — trip-hop / chill / ambient scenes" },
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

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-token match so "emo" does not hit "ceremony" / "memory". */
function keywordInText(text, keyword) {
  const blob = String(text || "").toLowerCase();
  const kw = String(keyword || "").trim().toLowerCase();
  if (!blob || !kw) return false;
  const pattern = escapeRegex(kw).replace(/ +/g, "\\s+");
  return new RegExp(`(^|[^a-z0-9])${pattern}([^a-z0-9]|$)`).test(blob);
}

function matchesKeywords(track, keywords = []) {
  if (!keywords.length) return false;
  const blob = trackTextBlob(track);
  if (!blob) return false;
  return keywords.some((kw) => keywordInText(blob, kw));
}

function artistHitsBand(track, bands = []) {
  const artist = String(track?.artist || "").toLowerCase();
  if (!artist || !bands.length) return false;
  return bands.some((band) => {
    const name = String(band || "").toLowerCase();
    if (name === "brand new" && artist.includes("heavies")) return false;
    if (name === "the bug" && /\bbug club\b/.test(artist)) return false;
    return keywordInText(artist, name);
  });
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
  const blob = trackTextBlob(track);
  // Paris Olympia Theatre / similar venues are not Cascadia
  const keywords = /olympia\s+theatre/.test(blob)
    ? PNW_KEYWORDS.filter((kw) => kw !== "olympia")
    : PNW_KEYWORDS;
  return matchesKeywords(track, keywords);
}

function isShoegazeTrack(track) {
  if (!track) return false;
  const rawGenre = String(track.genre || "").toLowerCase();
  if (
    keywordInText(rawGenre, "shoegaze") ||
    keywordInText(rawGenre, "dream pop") ||
    keywordInText(rawGenre, "dreampop") ||
    keywordInText(rawGenre, "emo") ||
    keywordInText(rawGenre, "screamo") ||
    keywordInText(rawGenre, "post-hardcore") ||
    keywordInText(rawGenre, "post hardcore")
  ) {
    return true;
  }
  if (artistHitsBand(track, SHOEGAZE_ARTISTS)) return true;
  return matchesKeywords(track, SHOEGAZE_KEYWORDS);
}

function isMetalTrack(track) {
  if (!track) return false;
  // "Instant Holograms On Metal Film" is photography, not metal
  const t = {
    ...track,
    title: String(track.title || "").replace(/metal\s+film/gi, " "),
    album: String(track.album || "").replace(/metal\s+film/gi, " "),
  };
  // Metal batch uploads (Audioasis-style waves)
  if (matchesChannelBatch(t, CHANNEL_BATCH_PREFIXES.metal)) return true;
  if (normalizeGenre(t.genre) === "Metal") return true;
  if (trackMatchesScene(t, "metal")) return true;
  const rawGenre = String(t.genre || "").toLowerCase();
  if (keywordInText(rawGenre, "metal") || keywordInText(rawGenre, "thrash") || keywordInText(rawGenre, "doom")) {
    return true;
  }
  // MF DOOM / Doomtree are hip-hop, not the metal subgenre
  if (normalizeGenre(t.genre) === "Hip-Hop") return false;
  return matchesKeywords(t, METAL_KEYWORDS);
}

/** Punk maps into Rock in normalizeGenre — match batch, raw labels + keywords. */
function isPunkTrack(track) {
  if (!track) return false;
  if (matchesChannelBatch(track, CHANNEL_BATCH_PREFIXES.punk)) return true;
  const rawGenre = String(track.genre || "").toLowerCase();
  if (
    keywordInText(rawGenre, "punk") ||
    rawGenre === "hardcore" ||
    keywordInText(rawGenre, "hardcore punk")
  ) {
    return true;
  }
  // Daft Punk is French house, not a punk band
  const stripped = {
    ...track,
    artist: String(track.artist || "").replace(/daft\s+punk/gi, " "),
    title: String(track.title || "").replace(/daft\s+punk/gi, " "),
    album: String(track.album || "").replace(/daft\s+punk/gi, " "),
  };
  return matchesKeywords(stripped, PUNK_KEYWORDS);
}

function isCountryFolkTrack(track) {
  if (!track) return false;
  if (matchesChannelBatch(track, CHANNEL_BATCH_PREFIXES["country-folk"])) return true;
  if (normalizeGenre(track.genre) === "Country & Folk") return true;
  if (trackMatchesScene(track, "folk")) return true;
  const rawGenre = String(track.genre || "").toLowerCase();
  if (
    keywordInText(rawGenre, "country") ||
    keywordInText(rawGenre, "folk") ||
    keywordInText(rawGenre, "americana") ||
    keywordInText(rawGenre, "bluegrass")
  ) {
    return true;
  }
  return matchesKeywords(track, COUNTRY_FOLK_KEYWORDS);
}

export function isDowntempoTrack(track) {
  if (!track) return false;
  if (matchesChannelBatch(track, CHANNEL_BATCH_PREFIXES.downtempo)) return true;
  if (trackMatchesScene(track, "downtempo")) return true;
  if (trackMatchesScene(track, "ambient")) return true;
  const rawGenre = String(track.genre || "").toLowerCase();
  if (
    keywordInText(rawGenre, "downtempo") ||
    keywordInText(rawGenre, "trip-hop") ||
    keywordInText(rawGenre, "trip hop") ||
    keywordInText(rawGenre, "chill") ||
    keywordInText(rawGenre, "ambient")
  ) {
    return true;
  }
  return matchesKeywords(track, DOWNTOMPO_KEYWORDS);
}

/**
 * Y2K Dance — millennial house/garage/disco mix, not the entire Electronic lane.
 * Coarse `genre: Electronic` used to last-resort infer as house and dump
 * the whole catalog onto CH-01 (and, with genres:["Electronic"], CH-06).
 */
function isY2kDanceTrack(track) {
  if (!track) return false;
  if (Y2K_DANCE_SCENES.some((sid) => trackMatchesScene(track, sid))) return true;
  if (!trackMatchesScene(track, "house")) return false;
  const raw = String(track.genre || "").trim().toLowerCase();
  if (raw && raw !== "electronic") return true;
  const bpm = Number(track.bpm) || 0;
  const energy = Number(track.energy) || 5;
  return bpm >= 118 && bpm <= 130 && energy >= 4 && energy <= 8;
}

/**
 * Psychedelic Rock — swirl and long-form guitar, not the entire Rock lane.
 * Coarse `genre: Rock` used to dump indie/punk onto any guitar station.
 */
export function isPsychedelicRockTrack(track) {
  if (!track) return false;
  if (matchesChannelBatch(track, CHANNEL_BATCH_PREFIXES["psychedelic-rock"])) return true;
  const rawGenre = String(track.genre || "").toLowerCase();
  // Goa / psytrance is a dancefloor lane, not this station.
  if (
    keywordInText(rawGenre, "psytrance") ||
    keywordInText(rawGenre, "psy trance") ||
    keywordInText(rawGenre, "goa") ||
    keywordInText(rawGenre, "goa trance")
  ) {
    return false;
  }
  if (trackMatchesScene(track, "psychedelic-rock")) return true;
  if (genreHitsKeywords(track, PSYCH_KEYWORDS)) return true;
  if (artistHitsBand(track, PSYCH_ARTISTS)) {
    const g = normalizeGenre(track.genre);
    if (!g || g === "Rock" || g === "Pop") return true;
    return false;
  }
  if (!matchesKeywords(track, PSYCH_KEYWORDS)) return false;
  const g = normalizeGenre(track.genre);
  if (g === "Electronic" || g === "Metal" || g === "Hip-Hop") return false;
  return true;
}

function genreHitsKeywords(track, keywords = []) {
  const raw = String(track?.genre || "").toLowerCase();
  if (!raw) return false;
  return keywords.some((kw) => keywordInText(raw, kw));
}

/** Named scene — genre string, keywords, or explicit sceneId. Not soft BPM scoring. */
function hitsNamedScene(track, sceneId) {
  if (!track || !sceneId) return false;
  if (String(track.sceneId || "").toLowerCase() === sceneId) return true;
  if (track._scene?.id === sceneId) return true;
  if (matchSceneFromText(track.genre)?.id === sceneId) return true;
  const scene = getScene(sceneId);
  if (!scene) return false;
  const keywords = [...(scene.keywords || []), ...(scene.aliases || [])];
  return matchesKeywords(track, keywords);
}

export function isHouseTrack(track) {
  if (!track) return false;
  if (matchesChannelBatch(track, CHANNEL_BATCH_PREFIXES.house)) return true;
  // More specific electronic stations win when the cut is clearly theirs.
  if (isDubstepTrack(track) || isUkGarageTrack(track)) return false;
  if (DNB_SCENES.some((sid) => trackMatchesScene(track, sid))) return false;
  if (HOUSE_SCENES.some((sid) => trackMatchesScene(track, sid))) return true;
  return genreHitsKeywords(track, HOUSE_GENRE_KEYWORDS);
}

export function isTechnoTrack(track) {
  if (!track) return false;
  if (matchesChannelBatch(track, CHANNEL_BATCH_PREFIXES.techno)) return true;
  if (TECHNO_SCENES.some((id) => hitsNamedScene(track, id))) return true;
  if (genreHitsKeywords(track, TECHNO_GENRE_KEYWORDS)) return true;
  if (matchesKeywords(track, ["warehouse"])) return true;
  // Honest warehouse pocket — not the 140bpm scoring dump.
  if (normalizeGenre(track.genre) === "Electronic") {
    const energy = Number(track.energy) || 5;
    const bpm = Number(track.bpm) || 0;
    if (energy >= 7 && bpm >= 128) return true;
  }
  return false;
}

/** @deprecated Electronic channel became Techno — keep the export for older tests. */
export function isElectronicUndergroundTrack(track) {
  return isTechnoTrack(track);
}

export function isUkGarageTrack(track) {
  if (!track) return false;
  if (matchesChannelBatch(track, CHANNEL_BATCH_PREFIXES["uk-garage"])) return true;
  if (UK_GARAGE_SCENES.some((sid) => trackMatchesScene(track, sid))) return true;
  if (genreHitsKeywords(track, UK_GARAGE_GENRE_KEYWORDS)) return true;
  return matchesKeywords(track, ["uk garage", "ukg", "2-step", "2 step", "speed garage"]);
}

export function isDubstepTrack(track) {
  if (!track) return false;
  if (matchesChannelBatch(track, CHANNEL_BATCH_PREFIXES.dubstep)) return true;
  const bpm = Number(track.bpm) || 0;
  // Amen-break tempo belongs on Drum & Bass, even for Skrillex collabs.
  if (bpm >= 155) return false;
  if (DNB_SCENES.some((sid) => trackMatchesScene(track, sid))) return false;
  if (matchesKeywords(track, DUBSTEP_KEYWORDS) || genreHitsKeywords(track, DUBSTEP_KEYWORDS)) {
    const g = normalizeGenre(track.genre);
    if (!g || g === "Electronic") return true;
    return false;
  }
  if (artistHitsBand(track, DUBSTEP_ARTISTS)) return true;
  return false;
}

/**
 * Curator-tagged Variety Mix cuts — batch waves, channel ids, or explicit flags.
 * Admin CSV: set `batch` to `variety-wave-1` (or `curator-wave-1`).
 */
export function isVarietyCuratorTrack(track) {
  if (!track) return false;
  if (track.varietyMix === true || track.curated === true) return true;
  if (matchesChannelBatch(track, CHANNEL_BATCH_PREFIXES["variety-mix"])) return true;
  const channels = track.channels || track.channelIds || track.sceneChannels;
  if (Array.isArray(channels)) {
    return channels.some((c) => {
      const id = String(c || "").toLowerCase();
      return id === "variety-mix" || id === "variety" || id === "curator";
    });
  }
  const single = String(track.channel || track.channelId || "").toLowerCase();
  return single === "variety-mix" || single === "variety";
}

/**
 * Cross-genre station mix when no curator batch is present —
 * round-robin by normalized genre, ranked within each lane.
 */
export function buildCrossGenreVarietyPool(tracks = [], limit = VARIETY_CROSS_GENRE_LIMIT) {
  const max = Math.max(1, Number(limit) || VARIETY_CROSS_GENRE_LIMIT);
  const singles = singlesOnly(tracks);
  const byGenre = new Map();
  for (const t of singles) {
    const g = normalizeGenre(t.genre) || "Other";
    if (!byGenre.has(g)) byGenre.set(g, []);
    byGenre.get(g).push(t);
  }
  for (const list of byGenre.values()) {
    list.sort((a, b) => countdownScore(b) - countdownScore(a));
  }
  const queues = [...byGenre.values()].sort((a, b) => b.length - a.length);
  const out = [];
  const seen = new Set();
  let progressed = true;
  while (out.length < max && progressed) {
    progressed = false;
    for (const q of queues) {
      while (q.length && seen.has(q[0].id)) q.shift();
      if (!q.length) continue;
      const next = q.shift();
      seen.add(next.id);
      out.push(next);
      progressed = true;
      if (out.length >= max) break;
    }
  }
  return out;
}

/** Featured Channel Surfing dial — Local is the station we feature on Home. */
export const SHOWCASE_CHANNEL_ID = "local-pnw";

export const SCENE_CHANNELS = [
  {
    id: "y2k-dance",
    num: 1,
    title: "Y2K Dance",
    shortTitle: "Y2K Dance",
    dialSlug: "Y2K DANCE",
    tagline: "Millennium dancefloor — house, garage, disco",
    accent: "#E21B7A",
    scenes: ["house", "uk-garage", "deep-house", "tech-house", "broken-beat", "disco", "progressive", "trance"],
    genres: [],
    vibe: "Y2K Dance",
    source: "genre",
    /** Scene/BPM dancefloor — never the whole Electronic lane. */
    match: isY2kDanceTrack,
  },
  {
    id: "psychedelic-rock",
    num: 2,
    title: "Psychedelic Rock",
    shortTitle: "Psychedelic Rock",
    dialSlug: "PSYCH ROCK",
    tagline: "Fuzz, swirl, and the long jam",
    accent: "#D6F25A",
    scenes: ["psychedelic-rock"],
    genres: [],
    vibe: "Psychedelic Rock",
    source: "genre",
    strict: true,
    match: isPsychedelicRockTrack,
    minTracks: 1,
  },
  {
    id: "variety-mix",
    num: 3,
    title: "Variety Mix",
    shortTitle: "Variety Mix",
    dialSlug: "VARIETY",
    tagline: "Cross-genre spins · curator shelf",
    accent: "#1E6FE8",
    scenes: [],
    genres: [],
    vibe: "Variety Mix",
    source: "variety",
    /** Curator batch (`variety-wave-N`) when present; else cross-genre mix. */
    match: isVarietyCuratorTrack,
    preferMatch: true,
    poolLimit: VARIETY_CROSS_GENRE_LIMIT,
    minTracks: 1,
  },
  {
    id: "local-pnw",
    num: 4,
    title: "Local",
    shortTitle: "Local",
    dialSlug: "LOCAL",
    tagline: "Pacific Northwest only",
    accent: "#2E8B6A",
    scenes: [],
    genres: [],
    vibe: "Local",
    source: "audioasis",
    showcase: true,
    /** Only PNW / Audioasis cuts — never pad with the full catalog. */
    strict: true,
    match: isLocalPnwTrack,
    minTracks: 1,
  },
  {
    id: "house",
    num: 5,
    title: "House",
    shortTitle: "House",
    dialSlug: "HOUSE",
    tagline: "Four-to-the-floor — Chicago inheritance",
    accent: "#E85A1A",
    scenes: HOUSE_SCENES,
    genres: [],
    vibe: "House",
    source: "genre",
    strict: true,
    match: isHouseTrack,
    minTracks: 1,
  },
  {
    id: "techno",
    num: 6,
    title: "Techno",
    shortTitle: "Techno",
    dialSlug: "TECHNO",
    tagline: "Machines with intent — Detroit to Berlin",
    accent: "#1E6FE8",
    scenes: TECHNO_SCENES,
    genres: [],
    vibe: "Techno",
    source: "expansions",
    strict: true,
    match: isTechnoTrack,
    minTracks: 1,
  },
  {
    id: "uk-garage",
    num: 7,
    title: "UK Garage",
    shortTitle: "UK Garage",
    dialSlug: "UK GARAGE",
    tagline: "Skip, shuffle, 2-step — late bus home",
    accent: "#F5C400",
    scenes: UK_GARAGE_SCENES,
    genres: [],
    vibe: "UK Garage",
    source: "genre",
    strict: true,
    match: isUkGarageTrack,
    minTracks: 1,
  },
  {
    id: "dubstep",
    num: 8,
    title: "Dubstep",
    shortTitle: "Dubstep",
    dialSlug: "DUBSTEP",
    tagline: "Half-time weight — Croydon inheritance",
    accent: "#7B4BFF",
    scenes: ["dubstep"],
    genres: [],
    vibe: "Dubstep",
    source: "genre",
    strict: true,
    match: isDubstepTrack,
    minTracks: 1,
  },
  {
    id: "drum-and-bass",
    num: 9,
    title: "Drum & Bass",
    shortTitle: "Drum & Bass",
    dialSlug: "DRUM BASS",
    tagline: "DnB, jungle, liquid",
    accent: "#B8F04A",
    scenes: ["drum-and-bass", "jungle", "liquid", "breakbeat"],
    genres: [],
    vibe: "Drum & Bass",
    source: "genre",
  },
  {
    id: "shoegaze",
    num: 10,
    title: "Emo & Shoegaze",
    shortTitle: "Emo & Shoegaze",
    dialSlug: "EMO SHOE",
    tagline: "Feelings, fuzz, and walls of guitar",
    accent: "#C48AA8",
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
    num: 11,
    title: "Metal",
    shortTitle: "Metal",
    dialSlug: "METAL",
    tagline: "Riffs, weight, and high gain",
    accent: "#E0314A",
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
    num: 12,
    title: "Punk",
    shortTitle: "Punk",
    dialSlug: "PUNK",
    tagline: "Fast, loud, and unpolished",
    accent: "#FF3D8A",
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
    num: 13,
    title: "Country & Folk",
    shortTitle: "Country & Folk",
    dialSlug: "COUNTRY",
    tagline: "Twang, roots, and open roads",
    accent: "#C47A22",
    scenes: ["folk"],
    genres: ["Country & Folk"],
    vibe: "Country & Folk",
    source: "country-folk",
    /** Batch upload waves (`country-folk-wave-N`) + genre fallback — never pad. */
    strict: true,
    match: isCountryFolkTrack,
    minTracks: 1,
  },
  {
    id: "downtempo",
    num: 14,
    title: "Ambient / Downtempo",
    shortTitle: "Ambient / Downtempo",
    dialSlug: "DOWNTEMPO",
    tagline: "Trip-hop, ambient, late listening",
    accent: "#8FA8E8",
    scenes: ["downtempo", "ambient"],
    genres: [],
    vibe: "Ambient / Downtempo",
    source: "genre",
    strict: true,
    match: isDowntempoTrack,
    minTracks: 1,
  },
];

export function getShowcaseChannel() {
  return SCENE_CHANNELS.find((c) => c.showcase || c.id === SHOWCASE_CHANNEL_ID) || null;
}

export function getSceneChannel(id) {
  // Legacy aliases from earlier dials
  if (id === "showcase") return getShowcaseChannel();
  if (id === "techno-tunnel") return SCENE_CHANNELS.find((c) => c.id === "local-pnw") || null;
  if (id === "electronic-underground") return SCENE_CHANNELS.find((c) => c.id === "techno") || null;
  if (id === "house-ukg") return SCENE_CHANNELS.find((c) => c.id === "y2k-dance") || null;
  if (id === "ukg-block") return SCENE_CHANNELS.find((c) => c.id === "uk-garage") || null;
  if (id === "bass-weight") return SCENE_CHANNELS.find((c) => c.id === "drum-and-bass") || null;
  if (id === "rap-city") return SCENE_CHANNELS.find((c) => c.id === "variety-mix") || null;
  if (id === "ambient-downtempo") return SCENE_CHANNELS.find((c) => c.id === "downtempo") || null;
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

  // Variety Mix: curator batch when present, otherwise a balanced cross-genre mix
  if (channel.source === "variety" || channel.id === "variety-mix") {
    const curated = singles.filter((t) => isVarietyCuratorTrack(t));
    const need = channel.minTracks != null ? channel.minTracks : 1;
    if (curated.length >= need) {
      return curated.slice().sort((a, b) => countdownScore(b) - countdownScore(a));
    }
    return buildCrossGenreVarietyPool(singles, channel.poolLimit || VARIETY_CROSS_GENRE_LIMIT);
  }

  const hits = singles.filter((t) => matchesChannel(t, channel));
  if (channel.strict) {
    return hits.slice().sort((a, b) => countdownScore(b) - countdownScore(a));
  }
  // Expansions / soft channels: prefer direct hits, then pad with ranked shelf
  const ranked = (hits.length ? hits : singles)
    .slice()
    .sort((a, b) => countdownScore(b) - countdownScore(a));
  return ranked;
}

/** All dials with live counts. Home lists every channel, even if empty. */
export function decorateSceneChannels(tracks = [], minTracks = 3) {
  return SCENE_CHANNELS.map((channel) => {
    const pool = buildSceneChannelPool(tracks, channel);
    const direct = singlesOnly(tracks).filter((t) => matchesChannel(t, channel));
    const need = channel.minTracks != null ? channel.minTracks : minTracks;
    const isVariety = channel.source === "variety" || channel.id === "variety-mix";
    const count = isVariety && direct.length === 0 ? pool.length : direct.length;
    return {
      ...channel,
      count,
      ready: direct.length >= need || (!channel.strict && pool.length >= need),
    };
  }).sort((a, b) => {
    if (!!a.showcase !== !!b.showcase) return a.showcase ? -1 : 1;
    return (a.num || 0) - (b.num || 0);
  });
}

/** Channels that actually have catalog depth right now. */
export function availableSceneChannels(tracks = [], minTracks = 3) {
  return decorateSceneChannels(tracks, minTracks).filter((c) => c.ready);
}

/**
 * Distinct album-cover URLs for a channel tile mosaic (up to `limit`).
 * Prefers an explicit `channel.art` override, then direct matches, then the pool.
 * Bundled Channel Surfing icons live in `channelArt.js` so App's scene-channel
 * import does not pull image bytes onto the Home-critical JS graph.
 */
export function channelCoverUrls(tracks = [], channel, limit = 4) {
  if (channel?.art) return [channel.art];
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
