// Canonical genre set — 11 taste lanes. Scenes/styles live in the background.
// App bundle uses this ESM module. Node scripts use genre-normalize.shared.cjs (keep in sync).

export const CANONICAL_GENRES = [
  "Electronic",
  "Hip-Hop",
  "R&B & Soul",
  "Pop",
  "Rock",
  "Metal",
  "Jazz",
  "Classical",
  "Country & Folk",
  "Reggae",
  "Latin",
];

const CANONICAL_SET = new Set(CANONICAL_GENRES.map((g) => g.toLowerCase()));

/** Alias / legacy → canonical. Keys are lowercased. */
export const GENRE_ALIASES = {
  electronic: "Electronic",
  "hip-hop": "Hip-Hop",
  "hip hop": "Hip-Hop",
  hiphop: "Hip-Hop",
  "r&b & soul": "R&B & Soul",
  "rnb & soul": "R&B & Soul",
  "r and b and soul": "R&B & Soul",
  pop: "Pop",
  rock: "Rock",
  metal: "Metal",
  jazz: "Jazz",
  classical: "Classical",
  "country & folk": "Country & Folk",
  "country and folk": "Country & Folk",
  reggae: "Reggae",
  latin: "Latin",
  house: "Electronic",
  techno: "Electronic",
  electronica: "Electronic",
  edm: "Electronic",
  electro: "Electronic",
  ambient: "Electronic",
  disco: "Electronic",
  garage: "Electronic",
  "uk garage": "Electronic",
  ukg: "Electronic",
  "deep house": "Electronic",
  "tech house": "Electronic",
  "progressive house": "Electronic",
  trance: "Electronic",
  acid: "Electronic",
  "acid house": "Electronic",
  minimal: "Electronic",
  amapiano: "Electronic",
  footwork: "Electronic",
  juke: "Electronic",
  industrial: "Electronic",
  downtempo: "Electronic",
  "drum and bass": "Electronic",
  "drum & bass": "Electronic",
  "drum&bass": "Electronic",
  dnb: "Electronic",
  "d&b": "Electronic",
  "d & b": "Electronic",
  jungle: "Electronic",
  liquid: "Electronic",
  "liquid dnb": "Electronic",
  dubstep: "Electronic",
  breakbeat: "Electronic",
  breaks: "Electronic",
  "afro house": "Electronic",
  rap: "Hip-Hop",
  trap: "Hip-Hop",
  "boom bap": "Hip-Hop",
  drill: "Hip-Hop",
  grime: "Hip-Hop",
  "lo-fi hip-hop": "Hip-Hop",
  "lofi hip-hop": "Hip-Hop",
  "lofi hip hop": "Hip-Hop",
  "r&b": "R&B & Soul",
  rnb: "R&B & Soul",
  "r and b": "R&B & Soul",
  "r n b": "R&B & Soul",
  soul: "R&B & Soul",
  funk: "R&B & Soul",
  "neo-soul": "R&B & Soul",
  "neo soul": "R&B & Soul",
  neosoul: "R&B & Soul",
  neo: "R&B & Soul",
  gospel: "R&B & Soul",
  motown: "R&B & Soul",
  "quiet storm": "R&B & Soul",
  "contemporary r&b": "R&B & Soul",
  christian: "R&B & Soul",
  "christian music": "R&B & Soul",
  "indie pop": "Pop",
  "synth-pop": "Pop",
  "synth pop": "Pop",
  synthpop: "Pop",
  "dance pop": "Pop",
  hyperpop: "Pop",
  "k-pop": "Pop",
  kpop: "Pop",
  afrobeats: "Pop",
  afrobeat: "Pop",
  alternative: "Rock",
  alt: "Rock",
  indie: "Rock",
  "indie rock": "Rock",
  punk: "Rock",
  "post-punk": "Rock",
  "post punk": "Rock",
  "hard rock": "Rock",
  grunge: "Rock",
  "classic rock": "Rock",
  "folk rock": "Rock",
  "heavy metal": "Metal",
  thrash: "Metal",
  doom: "Metal",
  "death metal": "Metal",
  "black metal": "Metal",
  metalcore: "Metal",
  blues: "Jazz",
  bebop: "Jazz",
  "cool jazz": "Jazz",
  "spiritual jazz": "Jazz",
  fusion: "Jazz",
  "jazz fusion": "Jazz",
  orchestra: "Classical",
  chamber: "Classical",
  baroque: "Classical",
  "contemporary classical": "Classical",
  soundtrack: "Classical",
  score: "Classical",
  "film music": "Classical",
  "film score": "Classical",
  opera: "Classical",
  country: "Country & Folk",
  folk: "Country & Folk",
  americana: "Country & Folk",
  bluegrass: "Country & Folk",
  "singer-songwriter": "Country & Folk",
  "singer songwriter": "Country & Folk",
  "alt-country": "Country & Folk",
  "alt country": "Country & Folk",
  dancehall: "Reggae",
  dub: "Reggae",
  rocksteady: "Reggae",
  ska: "Reggae",
  roots: "Reggae",
  "roots reggae": "Reggae",
  ragga: "Reggae",
  salsa: "Latin",
  bachata: "Latin",
  reggaeton: "Latin",
  "latin pop": "Latin",
  "latin jazz": "Latin",
  "regional mexican": "Latin",
  tropical: "Latin",
  cumbia: "Latin",
  "bossa nova": "Latin",
  bossanova: "Latin",
  mambo: "Latin",
  world: "Latin",
};

/**
 * Map any free-text genre to the canonical set, or "" if unknown/empty.
 * Legacy store values (House, Soul, Country…) normalize into the 11.
 */
export function normalizeGenre(raw) {
  if (raw == null) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase().replace(/\s+/g, " ");
  if (CANONICAL_SET.has(lower)) {
    return CANONICAL_GENRES.find((g) => g.toLowerCase() === lower) || trimmed;
  }
  if (GENRE_ALIASES[lower]) return GENRE_ALIASES[lower];

  if (lower.includes("drum") && lower.includes("bass")) return "Electronic";
  if (lower.includes("hip") && lower.includes("hop")) return "Hip-Hop";
  if (lower.includes("reggaeton") || lower.includes("salsa") || lower.includes("bachata")) return "Latin";
  if (lower.includes("reggae") || lower.includes("dancehall") || lower.includes("dub")) return "Reggae";
  if (lower.includes("country") || lower.includes("bluegrass") || lower.includes("americana")) {
    return "Country & Folk";
  }
  if (lower.includes("folk") && !lower.includes("folk metal")) return "Country & Folk";
  if (lower.includes("k-pop") || lower.includes("kpop") || lower.includes("afrobeats")) return "Pop";
  if (lower.includes("r&b") || lower.includes("rnb") || lower.includes("soul") || lower.includes("funk") || lower.includes("gospel")) {
    return "R&B & Soul";
  }
  if (
    lower.includes("house") ||
    lower.includes("techno") ||
    lower.includes("electronic") ||
    lower.includes("trance") ||
    lower.includes("ambient") ||
    lower.includes("dnb") ||
    lower.includes("jungle") ||
    lower.includes("garage")
  ) {
    return "Electronic";
  }
  if (lower.includes("metal")) return "Metal";
  if (lower.includes("jazz") || lower.includes("blues")) return "Jazz";
  if (lower.includes("classical") || lower.includes("orchestra") || lower.includes("soundtrack") || lower.includes("score")) {
    return "Classical";
  }
  if (lower.includes("latin") || lower.includes("cumbia") || lower.includes("mambo")) return "Latin";
  if (lower.includes("pop") && !lower.includes("popular")) return "Pop";
  if (lower.includes("rock") || lower.includes("punk") || lower.includes("indie") || lower.includes("grunge")) {
    return "Rock";
  }
  if (lower.includes("rap") || lower.includes("trap") || lower.includes("grime")) return "Hip-Hop";

  return "";
}

/** Map a list of preferred genres (possibly legacy) onto the current 11. */
export function migratePreferredGenres(genres = []) {
  const out = [];
  const seen = new Set();
  (genres || []).forEach((g) => {
    const n = normalizeGenre(g);
    if (n && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  });
  return out;
}

/** Warm charcoal tones for genre tiles — only canonical keys. */
export const GENRE_TONES = {
  Electronic: "#1A1612",
  "Hip-Hop": "#181614",
  "R&B & Soul": "#1C1814",
  Pop: "#1A1816",
  Rock: "#1A1614",
  Metal: "#141210",
  Jazz: "#1A1612",
  Classical: "#181614",
  "Country & Folk": "#1A1814",
  Reggae: "#1A1812",
  Latin: "#1A1614",
};
