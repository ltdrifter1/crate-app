/**
 * Product naming — pick one active name (not ROOMS).
 * Tagline is fixed: YOUR WORLD, YOUR MUSIC.
 *
 * Set ACTIVE_BRAND_NAME_KEY to: "resonance" | "radius" | "signal"
 */
export const BRAND_TAGLINE = "YOUR WORLD, YOUR MUSIC.";

export const BRAND_NAME_OPTIONS = {
  resonance: {
    key: "resonance",
    name: "RESONANCE",
    pronunciation: "reh-ZON-ance",
    pitch: "What hits you — your taste, reflected back with care.",
    direction: "lumen",
    /** Keeps the geometric R portal mark */
    mark: "letter-r",
  },
  radius: {
    key: "radius",
    name: "RADIUS",
    pronunciation: "RAY-dee-us",
    pitch: "You at the center — music orbiting your world.",
    direction: "orbit",
    mark: "letter-r",
  },
  signal: {
    key: "signal",
    name: "SIGNAL",
    pronunciation: "SIG-nul",
    pitch: "Clear, curated flow — digital precision, human taste.",
    direction: "signal",
    mark: "waveform",
  },
};

/** Change this to preview another name in the app. */
export const ACTIVE_BRAND_NAME_KEY = "resonance";

export function activeBrandName() {
  return BRAND_NAME_OPTIONS[ACTIVE_BRAND_NAME_KEY] || BRAND_NAME_OPTIONS.resonance;
}

export const BRAND_NAME = activeBrandName().name;

export function brandStoragePrefix() {
  return activeBrandName().key;
}

export const BRAND_DIRECTIONS = {
  lumen: {
    id: "lumen",
    name: "Lumen Deck",
    summary: "OLED black, ice type, chrome frame mark — high-end streaming deck.",
    wordmark: {
      letterSpacing: 0.22,
      weight: 700,
      transform: "uppercase",
    },
    tagline: {
      font: "mono",
      letterSpacing: 0.14,
      transform: "uppercase",
      size: 11,
    },
  },
  orbit: {
    id: "orbit",
    name: "Orbit Spatial",
    summary: "Layered glass, orbital arcs, wide wordmark — spatial / immersive listening.",
    wordmark: {
      letterSpacing: 0.38,
      weight: 600,
      transform: "uppercase",
    },
    tagline: {
      font: "sans",
      letterSpacing: 0.06,
      transform: "none",
      size: 15,
    },
  },
  signal: {
    id: "signal",
    name: "Signal Index",
    summary: "Precision grid, waveform ring, mono metadata — mastering-suite digital.",
    wordmark: {
      letterSpacing: 0.12,
      weight: 800,
      transform: "uppercase",
    },
    tagline: {
      font: "mono",
      letterSpacing: 0.08,
      transform: "uppercase",
      size: 10,
    },
  },
};

export function activeBrandDirection() {
  const name = activeBrandName();
  return BRAND_DIRECTIONS[name.direction] || BRAND_DIRECTIONS.lumen;
}

export const ACTIVE_BRAND_DIRECTION = activeBrandName().direction;
