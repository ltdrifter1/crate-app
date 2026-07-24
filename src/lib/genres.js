// Canonical genre set for ROOMS — nothing outside this list is shown or stored after normalize.

export const CANONICAL_GENRES = [
  "Rock",
  "R&B",
  "Country",
  "Hip-Hop",
  "House",
  "Drum and Bass",
  "Soul",
  "Jazz",
  "Classical",
  "Metal",
];

const CANONICAL_SET = new Set(CANONICAL_GENRES.map((g) => g.toLowerCase()));

/** Alias / legacy → canonical. Keys are lowercased. */
export const GENRE_ALIASES = {
  // exact canonical
  rock: "Rock",
  "r&b": "R&B",
  rnb: "R&B",
  "r and b": "R&B",
  "r n b": "R&B",
  country: "Country",
  "hip-hop": "Hip-Hop",
  "hip hop": "Hip-Hop",
  hiphop: "Hip-Hop",
  rap: "Hip-Hop",
  house: "House",
  "drum and bass": "Drum and Bass",
  "drum & bass": "Drum and Bass",
  "drum&bass": "Drum and Bass",
  dnb: "Drum and Bass",
  "d&b": "Drum and Bass",
  "d & b": "Drum and Bass",
  jungle: "Drum and Bass",
  soul: "Soul",
  jazz: "Jazz",
  classical: "Classical",
  metal: "Metal",
  "heavy metal": "Metal",

  // electronic → House
  techno: "House",
  electronic: "House",
  electronica: "House",
  ambient: "House",
  disco: "House",
  garage: "House",
  "uk garage": "House",
  "ukg": "House",
  "deep house": "House",
  "tech house": "House",
  "progressive house": "House",
  breakbeat: "Drum and Bass",
  breaks: "Drum and Bass",

  // adjacent → Soul / R&B / Jazz
  funk: "Soul",
  blues: "Jazz",
  neo: "Soul",
  "neo-soul": "Soul",
  "neo soul": "Soul",
  gospel: "Soul",
  motown: "Soul",
  pop: "R&B",
  "indie pop": "R&B",

  // rock family
  alternative: "Rock",
  alt: "Rock",
  indie: "Rock",
  "indie rock": "Rock",
  punk: "Rock",
  "hard rock": "Rock",
  grunge: "Rock",
  folk: "Country",
  americana: "Country",
  bluegrass: "Country",

  // world-ish → closest lane
  reggae: "Soul",
  dancehall: "Soul",
  afrobeat: "Soul",
  afrobeats: "Soul",
  latin: "Jazz",
  world: "Jazz",
  experimental: "Jazz",
};

/**
 * Map any free-text genre to the canonical set, or "" if unknown/empty.
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

  // soft contains checks
  if (lower.includes("drum") && lower.includes("bass")) return "Drum and Bass";
  if (lower.includes("hip") && lower.includes("hop")) return "Hip-Hop";
  if (lower.includes("r&b") || lower.includes("rnb")) return "R&B";
  if (lower.includes("house") || lower.includes("techno") || lower.includes("electronic")) return "House";
  if (lower.includes("metal")) return "Metal";
  if (lower.includes("country") || lower.includes("folk")) return "Country";
  if (lower.includes("jazz")) return "Jazz";
  if (lower.includes("soul") || lower.includes("funk")) return "Soul";
  if (lower.includes("classical") || lower.includes("orchestra")) return "Classical";
  if (lower.includes("rock") || lower.includes("punk") || lower.includes("indie")) return "Rock";
  if (lower.includes("rap")) return "Hip-Hop";

  return "";
}

/** Soft PNW tones for genre tiles — only canonical keys. */
export const GENRE_TONES = {
  Rock: "#1A1818",
  "R&B": "#1A1C22",
  Country: "#1A1C18",
  "Hip-Hop": "#181A20",
  House: "#182028",
  "Drum and Bass": "#141820",
  Soul: "#1A1E24",
  Jazz: "#161A22",
  Classical: "#18181C",
  Metal: "#141416",
};
