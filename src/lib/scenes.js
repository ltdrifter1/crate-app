/**
 * Scene taxonomy — culture-first labels that survive the coarse 11-genre store.
 *
 * `normalizeGenre()` still collapses for admin/Firestore compatibility.
 * Scenes restore UK Garage, Techno, Ambient, Jungle, etc. for discovery UX.
 */

import { normalizeGenre } from "./genres";

/** Family groupings for editorial browsing (not storage). */
export const SCENE_FAMILIES = [
  {
    id: "dancefloor",
    label: "Dancefloor",
    story: "Four-to-the-floor pressure and long blends.",
  },
  {
    id: "bass",
    label: "Bass weight",
    story: "Pirate frequencies, broken rhythms, low-end cities.",
  },
  {
    id: "afterhours",
    label: "Afterhours",
    story: "Soft edges when the lights come up — or never do.",
  },
  {
    id: "soul-continuum",
    label: "Soul continuum",
    story: "Gospel heat, funk pocket, late-night R&B.",
  },
  {
    id: "jazz-world",
    label: "Jazz & elsewhere",
    story: "Improvisation, modal rooms, global crosstalk.",
  },
  {
    id: "rock-roots",
    label: "Rock & roots",
    story: "Guitars, dirt, folk lineages.",
  },
  {
    id: "classical-score",
    label: "Score & chamber",
    story: "Composed weight — concert hall to cinema.",
  },
];

/**
 * First-class scenes. `familyId` links to SCENE_FAMILIES.
 * `lane` maps to CANONICAL_GENRES for storage compatibility.
 */
export const SCENES = [
  // ── Dancefloor ──────────────────────────────────────────────
  {
    id: "house",
    label: "House",
    familyId: "dancefloor",
    lane: "Electronic",
    story: "The wide floor — Chicago inheritance, still moving.",
    atmosphere: "warmup",
    energy: [4, 8],
    bpm: [118, 130],
    aliases: ["house", "chicago house", "classic house"],
    keywords: ["house"],
    related: ["deep-house", "tech-house", "disco", "garage"],
    cities: ["Chicago", "New York"],
  },
  {
    id: "deep-house",
    label: "Deep House",
    familyId: "dancefloor",
    lane: "Electronic",
    story: "Warm pads, patient drums — the afterglow of the floor.",
    atmosphere: "night-fog",
    energy: [3, 6],
    bpm: [118, 126],
    aliases: ["deep house", "deephouse"],
    keywords: ["deep house", "deephouse"],
    related: ["house", "ambient", "soul"],
    cities: ["Chicago", "London"],
  },
  {
    id: "tech-house",
    label: "Tech House",
    familyId: "dancefloor",
    lane: "Electronic",
    story: "House bones with techno muscle.",
    atmosphere: "concrete",
    energy: [6, 9],
    bpm: [124, 130],
    aliases: ["tech house", "tech-house", "techhouse"],
    keywords: ["tech house", "techhouse"],
    related: ["techno", "house", "minimal"],
    cities: ["Ibiza", "Berlin"],
  },
  {
    id: "techno",
    label: "Techno",
    familyId: "dancefloor",
    lane: "Electronic",
    story: "Machines with intent — Detroit to Berlin lineage.",
    atmosphere: "factory-glow",
    energy: [6, 10],
    bpm: [128, 145],
    aliases: ["techno", "detroit techno", "hard techno", "industrial techno"],
    keywords: ["techno", "detroit", "berghain", "tresor"],
    related: ["minimal", "tech-house", "industrial"],
    cities: ["Detroit", "Berlin"],
  },
  {
    id: "minimal",
    label: "Minimal",
    familyId: "dancefloor",
    lane: "Electronic",
    story: "Reduction as drama — space between the hits.",
    atmosphere: "dark",
    energy: [4, 7],
    bpm: [124, 132],
    aliases: ["minimal", "minimal techno", "microhouse"],
    keywords: ["minimal", "microhouse"],
    related: ["techno", "tech-house"],
    cities: ["Berlin", "Cologne"],
  },
  {
    id: "disco",
    label: "Disco",
    familyId: "dancefloor",
    lane: "Electronic",
    story: "Strings, four-on-the-floor joy, mirrorball inheritance.",
    atmosphere: "heat-haze",
    energy: [5, 8],
    bpm: [110, 128],
    aliases: ["disco", "nu-disco", "nu disco", "italo", "italo disco"],
    keywords: ["disco", "italo", "mirrorball"],
    related: ["house", "funk", "soul"],
    cities: ["New York", "Philadelphia"],
  },
  {
    id: "progressive",
    label: "Progressive",
    familyId: "dancefloor",
    lane: "Electronic",
    story: "Long arcs — builds that refuse to rush the drop.",
    atmosphere: "peak",
    energy: [5, 8],
    bpm: [122, 130],
    aliases: ["progressive house", "progressive", "prog house"],
    keywords: ["progressive"],
    related: ["house", "trance", "tech-house"],
    cities: ["London", "Gothenburg"],
  },
  {
    id: "trance",
    label: "Trance",
    familyId: "dancefloor",
    lane: "Electronic",
    story: "Uplift as architecture — long melodies, bigger rooms.",
    atmosphere: "peak",
    energy: [6, 9],
    bpm: [128, 140],
    aliases: ["trance", "psytrance", "psy trance", "uplifting trance", "tech trance"],
    keywords: ["trance", "psytrance", "uplifting"],
    related: ["progressive", "techno", "house"],
    cities: ["Goa", "Frankfurt", "Amsterdam"],
  },
  {
    id: "acid",
    label: "Acid",
    familyId: "dancefloor",
    lane: "Electronic",
    story: "303 squelch — Chicago inheritance that never went quiet.",
    atmosphere: "factory-glow",
    energy: [5, 9],
    bpm: [120, 135],
    aliases: ["acid", "acid house", "acid techno", "303"],
    keywords: ["acid", "303", "squelch", "tb-303"],
    related: ["house", "techno", "industrial"],
    cities: ["Chicago", "London", "Manchester"],
  },
  {
    id: "amapiano",
    label: "Amapiano",
    familyId: "dancefloor",
    lane: "Electronic",
    story: "Log drums and patience — South African Sunday pressure.",
    atmosphere: "heat-haze",
    energy: [4, 7],
    bpm: [110, 120],
    aliases: ["amapiano", "ama piano"],
    keywords: ["amapiano", "log drum"],
    related: ["deep-house", "afrobeat", "house"],
    cities: ["Johannesburg", "Pretoria", "Durban"],
  },
  {
    id: "footwork",
    label: "Footwork / Juke",
    familyId: "dancefloor",
    lane: "Electronic",
    story: "Chicago double-time — feet as the lead instrument.",
    atmosphere: "concrete",
    energy: [7, 10],
    bpm: [145, 165],
    aliases: ["footwork", "juke", "chicago juke", "ghetto house"],
    keywords: ["footwork", "juke", "teklife"],
    related: ["house", "breakbeat", "hip-hop"],
    cities: ["Chicago"],
  },
  {
    id: "industrial",
    label: "Industrial",
    familyId: "dancefloor",
    lane: "Electronic",
    story: "Metal on metal — warehouse severity without apology.",
    atmosphere: "factory-glow",
    energy: [7, 10],
    bpm: [130, 150],
    aliases: ["industrial", "industrial techno", "ebm", "body music"],
    keywords: ["industrial", "ebm", "body music"],
    related: ["techno", "acid", "minimal"],
    cities: ["Berlin", "Detroit", "Ghent"],
  },

  // ── Bass ────────────────────────────────────────────────────
  {
    id: "drum-and-bass",
    label: "Drum and Bass",
    familyId: "bass",
    lane: "Electronic",
    story: "Break science at velocity — London's long shadow.",
    atmosphere: "tube-hum",
    energy: [7, 10],
    bpm: [160, 180],
    aliases: ["drum and bass", "drum & bass", "dnb", "d&b", "dn'b"],
    keywords: ["drum and bass", "dnb"],
    related: ["jungle", "liquid", "breakbeat", "uk-garage"],
    cities: ["London", "Bristol"],
  },
  {
    id: "jungle",
    label: "Jungle",
    familyId: "bass",
    lane: "Electronic",
    story: "Chopped breaks, ragga toast, pirate heat.",
    atmosphere: "neon-damp",
    energy: [7, 10],
    bpm: [155, 170],
    aliases: ["jungle", "oldschool jungle", "ragga jungle"],
    keywords: ["jungle", "ragga", "amen"],
    related: ["drum-and-bass", "breakbeat", "dancehall"],
    cities: ["London", "Bristol"],
  },
  {
    id: "liquid",
    label: "Liquid",
    familyId: "bass",
    lane: "Electronic",
    story: "Rolling drums, soft pads — DnB that still breathes.",
    atmosphere: "night-fog",
    energy: [5, 8],
    bpm: [168, 176],
    aliases: ["liquid", "liquid dnb", "liquid drum and bass", "liquid funk"],
    keywords: ["liquid dnb", "liquid funk"],
    related: ["drum-and-bass", "soul", "jazz"],
    cities: ["London", "Manchester"],
  },
  {
    id: "uk-garage",
    label: "UK Garage",
    familyId: "bass",
    lane: "Electronic",
    story: "Skip, shuffle, late bus home — 2-step and beyond.",
    atmosphere: "neon-damp",
    energy: [5, 8],
    bpm: [128, 138],
    aliases: ["uk garage", "ukg", "2-step", "2 step", "speed garage", "uk garage 2-step"],
    keywords: ["uk garage", "ukg", "2-step", "2 step", "speed garage"],
    related: ["broken-beat", "grime", "house", "drum-and-bass"],
    cities: ["London"],
  },
  {
    id: "broken-beat",
    label: "Broken Beat",
    familyId: "bass",
    lane: "Electronic",
    story: "Off-grid swing — West London's secret handshake.",
    atmosphere: "amber-lamp",
    energy: [4, 7],
    bpm: [120, 135],
    aliases: ["broken beat", "brokenbeat", "bruk"],
    keywords: ["broken beat", "bruk", "west london"],
    related: ["uk-garage", "jazz", "house"],
    cities: ["London"],
  },
  {
    id: "dubstep",
    label: "Dubstep",
    familyId: "bass",
    lane: "Electronic",
    story: "Half-time weight — Croydon inheritance, global mutation.",
    atmosphere: "dark",
    energy: [5, 9],
    bpm: [138, 145],
    aliases: ["dubstep", "brostep", "post-dubstep"],
    keywords: ["dubstep", "wobble", "half-time"],
    related: ["uk-garage", "grime", "dub"],
    cities: ["London", "Croydon"],
  },
  {
    id: "grime",
    label: "Grime",
    familyId: "bass",
    lane: "Hip-Hop",
    story: "MC pressure, square-wave stabs, East London nights.",
    atmosphere: "neon-damp",
    energy: [6, 9],
    bpm: [138, 142],
    aliases: ["grime", "8-bar", "uk grime"],
    keywords: ["grime", "wiley", "eskibeat"],
    related: ["uk-garage", "hip-hop", "dubstep"],
    cities: ["London"],
  },
  {
    id: "breakbeat",
    label: "Breakbeat",
    familyId: "bass",
    lane: "Electronic",
    story: "Broken drums without the DnB ceiling.",
    atmosphere: "concrete",
    energy: [5, 8],
    bpm: [120, 140],
    aliases: ["breakbeat", "breaks", "break beat", "nu breaks"],
    keywords: ["breakbeat", "breaks", "amen"],
    related: ["jungle", "footwork", "uk-garage"],
    cities: ["London", "Los Angeles"],
  },

  // ── Afterhours ──────────────────────────────────────────────
  {
    id: "ambient",
    label: "Ambient",
    familyId: "afterhours",
    lane: "Electronic",
    story: "Atmosphere as composition — no rush to arrive.",
    atmosphere: "rain-glass",
    energy: [1, 3],
    bpm: [60, 110],
    aliases: ["ambient", "ambient techno", "drone", "soundscape"],
    keywords: ["ambient", "drone", "eno"],
    related: ["downtempo", "classical", "experimental"],
    cities: ["Berlin", "Reykjavik"],
  },
  {
    id: "downtempo",
    label: "Downtempo",
    familyId: "afterhours",
    lane: "Electronic",
    story: "Head-nod pace — trip-hop cousins and late listening.",
    atmosphere: "dawn-haze",
    energy: [2, 5],
    bpm: [70, 110],
    aliases: ["downtempo", "trip-hop", "trip hop", "chillout", "chill"],
    keywords: ["downtempo", "trip-hop", "trip hop", "chillout"],
    related: ["ambient", "soul", "hip-hop"],
    cities: ["Bristol", "London"],
  },
  {
    id: "experimental",
    label: "Experimental",
    familyId: "afterhours",
    lane: "Classical",
    story: "Leftfield form — rooms without a map.",
    atmosphere: "vault",
    energy: [1, 6],
    bpm: [40, 140],
    aliases: ["experimental", "leftfield", "avant-garde", "avant garde", "electroacoustic"],
    keywords: ["experimental", "leftfield", "avant"],
    related: ["ambient", "classical", "techno"],
    cities: ["Berlin", "Paris", "Tokyo"],
  },

  // ── Soul continuum ──────────────────────────────────────────
  {
    id: "soul",
    label: "Soul",
    familyId: "soul-continuum",
    lane: "R&B & Soul",
    story: "The voice as instrument — Motown heat to quiet storm.",
    atmosphere: "amber-lamp",
    energy: [3, 7],
    bpm: [70, 120],
    aliases: ["soul", "northern soul", "quiet storm"],
    keywords: ["soul", "motown"],
    related: ["funk", "neo-soul", "rnb", "gospel"],
    cities: ["Detroit", "Memphis", "Philadelphia"],
  },
  {
    id: "funk",
    label: "Funk",
    familyId: "soul-continuum",
    lane: "R&B & Soul",
    story: "The one — pocket first, everything else second.",
    atmosphere: "heat-haze",
    energy: [5, 8],
    bpm: [90, 120],
    aliases: ["funk", "p-funk", "boogie"],
    keywords: ["funk", "boogie", "james brown"],
    related: ["soul", "disco", "hip-hop"],
    cities: ["Dayton", "New Orleans"],
  },
  {
    id: "neo-soul",
    label: "Neo-Soul",
    familyId: "soul-continuum",
    lane: "R&B & Soul",
    story: "Hip-hop era soul — live drums meeting sampler memory.",
    atmosphere: "amber-lamp",
    energy: [3, 6],
    bpm: [70, 100],
    aliases: ["neo-soul", "neo soul", "neosoul"],
    keywords: ["neo-soul", "neo soul", "dilla"],
    related: ["soul", "rnb", "hip-hop", "jazz"],
    cities: ["Philadelphia", "London"],
  },
  {
    id: "rnb",
    label: "R&B",
    familyId: "soul-continuum",
    lane: "R&B & Soul",
    story: "Contemporary voice craft — from quiet storm to 808 gloss.",
    atmosphere: "night-fog",
    energy: [3, 7],
    bpm: [60, 120],
    aliases: ["r&b", "rnb", "r and b", "contemporary r&b"],
    keywords: ["r&b", "rnb"],
    related: ["soul", "neo-soul", "hip-hop"],
    cities: ["Atlanta", "Los Angeles"],
  },
  {
    id: "gospel",
    label: "Gospel",
    familyId: "soul-continuum",
    lane: "R&B & Soul",
    story: "Testimony and choir — the root under so much floor music.",
    atmosphere: "dawn-haze",
    energy: [4, 8],
    bpm: [70, 130],
    aliases: ["gospel", "gospel house"],
    keywords: ["gospel", "choir"],
    related: ["soul", "house"],
    cities: ["Chicago", "Memphis"],
  },

  // ── Jazz & world ────────────────────────────────────────────
  {
    id: "jazz",
    label: "Jazz",
    familyId: "jazz-world",
    lane: "Jazz",
    story: "Improvisation as architecture — standards to spiritual.",
    atmosphere: "amber-lamp",
    energy: [2, 7],
    bpm: [60, 200],
    aliases: ["jazz", "bebop", "hard bop", "cool jazz", "spiritual jazz", "modal jazz"],
    keywords: ["jazz", "coltrane", "mingus", "modal"],
    related: ["soul", "broken-beat", "classical"],
    cities: ["New York", "New Orleans", "Chicago"],
  },
  {
    id: "afrobeat",
    label: "Afrobeat",
    familyId: "jazz-world",
    lane: "Pop",
    story: "Polyrhythm as politics — Lagos to the world stage.",
    atmosphere: "heat-haze",
    energy: [5, 8],
    bpm: [100, 130],
    aliases: ["afrobeat", "afrobeats"],
    keywords: ["afrobeat", "afrobeats", "fela"],
    related: ["funk", "house", "jazz"],
    cities: ["Lagos", "London", "Accra"],
  },
  {
    id: "reggae",
    label: "Reggae",
    familyId: "jazz-world",
    lane: "Reggae",
    story: "One drop and spiritual bass — Kingston as mother city.",
    atmosphere: "heat-haze",
    energy: [3, 6],
    bpm: [60, 90],
    aliases: ["reggae", "rocksteady", "ska", "roots reggae"],
    keywords: ["reggae", "rocksteady", "kingston", "roots"],
    related: ["dub", "dancehall", "soul"],
    cities: ["Kingston", "London"],
  },
  {
    id: "dub",
    label: "Dub",
    familyId: "jazz-world",
    lane: "Reggae",
    story: "Space as instrument — delay, drop-out, version culture.",
    atmosphere: "night-fog",
    energy: [2, 5],
    bpm: [60, 100],
    aliases: ["dub", "dub reggae", "version"],
    keywords: ["dub", "version", "echo chamber"],
    related: ["reggae", "ambient", "dubstep"],
    cities: ["Kingston", "London", "Berlin"],
  },
  {
    id: "dancehall",
    label: "Dancehall",
    familyId: "jazz-world",
    lane: "Reggae",
    story: "Slackness and toasting — the sound system as stage.",
    atmosphere: "heat-haze",
    energy: [5, 8],
    bpm: [85, 110],
    aliases: ["dancehall", "bashment", "ragga"],
    keywords: ["dancehall", "bashment"],
    related: ["reggae", "jungle", "hip-hop"],
    cities: ["Kingston", "London"],
  },
  {
    id: "latin",
    label: "Latin",
    familyId: "jazz-world",
    lane: "Latin",
    story: "Clave, montuno, and diaspora floor music.",
    atmosphere: "heat-haze",
    energy: [4, 8],
    bpm: [90, 130],
    aliases: ["latin", "salsa", "mambo", "boogaloo", "latin jazz"],
    keywords: ["latin", "salsa", "mambo", "clave"],
    related: ["jazz", "disco", "house"],
    cities: ["Havana", "New York", "San Juan"],
  },

  // ── Hip-Hop ─────────────────────────────────────────────────
  {
    id: "hip-hop",
    label: "Hip-Hop",
    familyId: "bass",
    lane: "Hip-Hop",
    story: "Sample archaeology and voice as drum — borough to globe.",
    atmosphere: "concrete",
    energy: [4, 8],
    bpm: [70, 110],
    aliases: ["hip-hop", "hip hop", "hiphop", "rap", "boom bap", "trap"],
    keywords: ["hip-hop", "hip hop", "rap", "boom bap", "trap"],
    related: ["soul", "funk", "jazz", "grime"],
    cities: ["New York", "Atlanta", "Los Angeles"],
  },

  // ── Rock & roots ────────────────────────────────────────────
  {
    id: "rock",
    label: "Rock",
    familyId: "rock-roots",
    lane: "Rock",
    story: "Guitar lineages — garage to cathedral.",
    atmosphere: "concrete",
    energy: [5, 9],
    bpm: [90, 160],
    aliases: ["rock", "alternative", "indie", "indie rock", "punk", "post-punk", "grunge"],
    keywords: ["rock", "punk", "indie", "grunge"],
    related: ["metal", "folk", "soul"],
    cities: ["London", "Seattle", "New York"],
  },
  {
    id: "metal",
    label: "Metal",
    familyId: "rock-roots",
    lane: "Metal",
    story: "Distortion as cathedral — weight and precision.",
    atmosphere: "dark",
    energy: [7, 10],
    bpm: [80, 220],
    aliases: ["metal", "heavy metal", "thrash", "doom", "black metal"],
    keywords: ["metal", "thrash", "doom"],
    related: ["rock"],
    cities: ["Birmingham", "Gothenburg"],
  },
  {
    id: "folk",
    label: "Folk / Americana",
    familyId: "rock-roots",
    lane: "Country & Folk",
    story: "Cuts that travel by road and porch.",
    atmosphere: "dawn-haze",
    energy: [2, 5],
    bpm: [60, 120],
    aliases: ["folk", "americana", "country", "bluegrass", "singer-songwriter"],
    keywords: ["folk", "americana", "country", "bluegrass"],
    related: ["soul", "rock"],
    cities: ["Nashville", "Dublin"],
  },

  // ── Classical ───────────────────────────────────────────────
  {
    id: "classical",
    label: "Classical",
    familyId: "classical-score",
    lane: "Classical",
    story: "Composed form — chamber intimacy to orchestral weather.",
    atmosphere: "vault",
    energy: [1, 6],
    bpm: [40, 160],
    aliases: ["classical", "orchestra", "chamber", "baroque", "contemporary classical", "modern classical"],
    keywords: ["classical", "orchestra", "symphony", "quartet"],
    related: ["ambient", "jazz"],
    cities: ["Vienna", "Berlin", "Paris"],
  },
];

const SCENE_BY_ID = Object.fromEntries(SCENES.map((s) => [s.id, s]));
const ALIAS_TO_SCENE = {};
SCENES.forEach((s) => {
  s.aliases.forEach((a) => {
    ALIAS_TO_SCENE[a.toLowerCase()] = s.id;
  });
});

export function getScene(id) {
  return SCENE_BY_ID[id] || null;
}

export function familyForScene(sceneOrId) {
  const scene = typeof sceneOrId === "string" ? getScene(sceneOrId) : sceneOrId;
  if (!scene) return null;
  return SCENE_FAMILIES.find((f) => f.id === scene.familyId) || null;
}

export function relatedScenes(sceneId) {
  const scene = getScene(sceneId);
  if (!scene) return [];
  return (scene.related || []).map(getScene).filter(Boolean);
}

/** Exact / alias match from free-text genre. */
export function matchSceneFromText(raw) {
  if (raw == null) return null;
  const lower = String(raw).trim().toLowerCase().replace(/\s+/g, " ");
  if (!lower) return null;
  if (ALIAS_TO_SCENE[lower]) return getScene(ALIAS_TO_SCENE[lower]);

  // longest alias contains match (prefer specificity)
  let best = null;
  let bestLen = 0;
  Object.entries(ALIAS_TO_SCENE).forEach(([alias, id]) => {
    if (lower.includes(alias) && alias.length > bestLen) {
      best = id;
      bestLen = alias.length;
    }
  });
  return best ? getScene(best) : null;
}

function textBlob(track) {
  return [track.genre, track.artist, track.album, track.title]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function keywordHits(track, scene) {
  const blob = textBlob(track);
  return (scene.keywords || []).filter((k) => blob.includes(k.toLowerCase())).length;
}

function inBand(value, band, fallback = true) {
  if (value == null || !band) return fallback;
  return value >= band[0] && value <= band[1];
}

/**
 * Infer primary scene for a track.
 * Works even when genre was collapsed to a coarse lane (e.g. Electronic / legacy House).
 */
export function inferScene(track) {
  if (!track) return null;

  const BROAD_SCENE_IDS = new Set([
    "house", "hip-hop", "rock", "soul", "jazz", "rnb", "metal", "classical",
    "drum-and-bass", "folk", "reggae", "latin",
  ]);

  const fromGenre = matchSceneFromText(track.genre);
  const lane = normalizeGenre(track.genre);
  const rawGenre = String(track.genre || "").trim().toLowerCase();
  const genreIsCoarse =
    !track.genre ||
    CANONICAL_SET_LOCAL.has(rawGenre) ||
    (fromGenre && BROAD_SCENE_IDS.has(fromGenre.id));

  // Specific genre strings (UK Garage, Techno, Ambient…) win immediately
  if (fromGenre && !BROAD_SCENE_IDS.has(fromGenre.id)) {
    return fromGenre;
  }

  // Soft inference from coarse lane + BPM/energy (restores lost detail)
  const bpm = track.bpm;
  const energy = track.energy ?? 5;

  if (lane === "Electronic" || (!lane && genreIsCoarse)) {
    // DnB / jungle first when tempo is clearly break-science
    if (bpm && bpm >= 155) {
      if (bpm < 165) return getScene("jungle");
      return getScene("drum-and-bass");
    }
    if (bpm && bpm >= 128 && energy >= 7) return getScene("techno");
    if (bpm && bpm >= 130 && bpm <= 136 && energy >= 5 && energy <= 8) return getScene("uk-garage");
    if (bpm && bpm >= 128 && bpm <= 138 && energy >= 6) return getScene("tech-house");
    // Soft house BPM → deep; only drop to ambient when tempo is slow
    if (energy <= 5 && bpm && bpm >= 110 && bpm <= 126) return getScene("deep-house");
    if (energy <= 3 && (!bpm || bpm <= 105)) return getScene("ambient");
    if (energy <= 5 && !bpm) return getScene("deep-house");
    if (bpm && bpm < 118 && energy >= 5) return getScene("disco");
  }

  if (lane === "Hip-Hop") {
    if (bpm && bpm >= 135) return getScene("grime");
    return getScene("hip-hop");
  }

  if (lane === "R&B & Soul") {
    if (rawGenre.includes("r&b") || rawGenre.includes("rnb") || rawGenre === "r and b") {
      return getScene("rnb");
    }
    if (energy >= 6) return getScene("funk");
    if (energy <= 4) return getScene("neo-soul");
    return getScene("soul");
  }

  if (lane === "Jazz") return getScene("jazz");
  if (lane === "Classical") return getScene("classical");
  if (lane === "Metal") return getScene("metal");
  if (lane === "Rock") return getScene("rock");
  if (lane === "Country & Folk") return getScene("folk");
  if (lane === "Reggae") return getScene("reggae");
  if (lane === "Latin") return getScene("latin");
  if (lane === "Pop") return fromGenre || null;

  // Keyword scoring — ignore the broad lane name echoing itself
  const scored = SCENES.map((scene) => {
    let score = 0;
    const blob = textBlob(track);
    (scene.keywords || []).forEach((k) => {
      const key = k.toLowerCase();
      // Don't let genre:"House" crown the House scene via its own keyword
      if (BROAD_SCENE_IDS.has(scene.id) && key === rawGenre) return;
      if (blob.includes(key)) score += 3;
    });
    if (lane && scene.lane === lane) score += 0.5;
    if (inBand(track.bpm, scene.bpm, false)) score += 1.5;
    if (inBand(track.energy, scene.energy, false)) score += 1;
    return { scene, score };
  })
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score);

  if (scored[0]) return scored[0].scene;
  if (fromGenre) return fromGenre;
  if (lane === "Electronic") return getScene("house");
  return null;
}

// Local set mirroring canonical + legacy store values for coarse detection
const CANONICAL_SET_LOCAL = new Set([
  "electronic", "hip-hop", "r&b & soul", "pop", "rock", "metal", "jazz", "classical",
  "country & folk", "reggae", "latin",
  // legacy store values still in Firestore
  "house", "drum and bass", "soul", "r&b", "country",
]);

/** Secondary scene tags (related + weaker keyword hits). */
export function inferSceneTags(track, limit = 3) {
  const primary = inferScene(track);
  const tags = [];
  if (primary) tags.push(primary);

  SCENES.forEach((scene) => {
    if (primary && scene.id === primary.id) return;
    const hits = keywordHits(track, scene);
    if (hits >= 1) tags.push(scene);
  });

  if (primary) {
    relatedScenes(primary.id).forEach((r) => {
      if (!tags.find((t) => t.id === r.id)) tags.push(r);
    });
  }

  return tags.slice(0, limit);
}

/** Enrich track objects with `_scene` / `_scenes` (pure). */
export function enrichTracksWithScenes(tracks = []) {
  return tracks.map((t) => {
    const scene = inferScene(t);
    const tags = inferSceneTags(t, 4);
    return {
      ...t,
      _scene: scene
        ? { id: scene.id, label: scene.label, familyId: scene.familyId, lane: scene.lane }
        : null,
      _scenes: tags.map((s) => s.id),
    };
  });
}

/** Does track belong to scene? */
export function trackMatchesScene(track, sceneId) {
  const scene = getScene(sceneId);
  if (!scene) return false;
  const inferred = inferScene(track);
  if (inferred?.id === sceneId) return true;
  if ((track._scenes || []).includes(sceneId)) return true;
  if (matchSceneFromText(track.genre)?.id === sceneId) return true;
  // Soft: same lane + energy/bpm band when track already tagged to family
  if (inferred && inferred.familyId === scene.familyId) {
    const bpmOk = inBand(track.bpm, scene.bpm, !track.bpm);
    const energyOk = inBand(track.energy, scene.energy, true);
    if (bpmOk && energyOk && keywordHits(track, scene) > 0) return true;
  }
  return false;
}

/** Scene → Room destination definition. */
export function sceneAsRoom(scene) {
  return {
    id: `scene-${scene.id}`,
    label: scene.label,
    kind: "scene",
    desc: scene.cities?.length ? scene.cities.slice(0, 2).join(" · ") : scene.story.split("—")[0].trim(),
    story: scene.story,
    atmosphere: scene.atmosphere || "night-fog",
    sceneId: scene.id,
    familyId: scene.familyId,
    filter: (t) => trackMatchesScene(t, scene.id),
  };
}

/**
 * Prefer editorial culture Room ids when they already embody a scene
 * (e.g. uk-garage culture room vs scene-uk-garage).
 */
export function destinationIdForScene(sceneId, cultureIds = null) {
  if (!sceneId) return null;
  if (cultureIds instanceof Set && cultureIds.has(sceneId)) return sceneId;
  if (Array.isArray(cultureIds) && cultureIds.includes(sceneId)) return sceneId;
  // Known culture overlaps when caller doesn't pass the set
  if (sceneId === "uk-garage") return "uk-garage";
  return `scene-${sceneId}`;
}

export function allSceneRooms() {
  return SCENES.map(sceneAsRoom);
}

/** Group scenes for Dig / taxonomy browser. */
export function scenesByFamily(tracks = []) {
  const enriched = tracks.length && tracks[0]?._scene !== undefined ? tracks : enrichTracksWithScenes(tracks);
  return SCENE_FAMILIES.map((family) => {
    const scenes = SCENES.filter((s) => s.familyId === family.id).map((scene) => {
      const count = enriched.filter((t) => (t.duration || 0) <= 900 && trackMatchesScene(t, scene.id)).length;
      return { ...scene, count };
    }).filter((s) => s.count > 0 || tracks.length === 0);
    return { ...family, scenes };
  }).filter((f) => f.scenes.length > 0 || tracks.length === 0);
}

/** Scene graph edges for maps / paths. */
export function sceneGraph() {
  const nodes = SCENES.map((s) => ({
    id: s.id,
    label: s.label,
    familyId: s.familyId,
    lane: s.lane,
  }));
  const edges = [];
  SCENES.forEach((s) => {
    (s.related || []).forEach((rid) => {
      if (getScene(rid)) edges.push({ from: s.id, to: rid });
    });
  });
  return { nodes, edges };
}

/** Build a listening path along related scenes from a seed. */
export function sceneLineagePath(seedSceneId, depth = 4) {
  const start = getScene(seedSceneId);
  if (!start) return null;
  const visited = new Set([start.id]);
  const steps = [{ type: "room", id: destinationIdForScene(start.id), note: start.story.split("—")[0].trim() }];
  let current = start;
  for (let i = 0; i < depth - 1; i++) {
    const nextId = (current.related || []).find((id) => !visited.has(id) && getScene(id));
    if (!nextId) break;
    visited.add(nextId);
    current = getScene(nextId);
    steps.push({ type: "room", id: destinationIdForScene(current.id), note: current.cities?.[0] || current.label });
  }
  return {
    id: `lineage-${seedSceneId}`,
    title: `${start.label} lineage`,
    story: `Walk the related scenes around ${start.label} — culture as a path, not a filter chip.`,
    kind: "scene",
    steps,
  };
}

export function displaySceneLabel(track) {
  if (track?._scene?.label) return track._scene.label;
  return inferScene(track)?.label || normalizeGenre(track?.genre) || "";
}
