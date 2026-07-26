/**
 * ROOMS — three premium digital brand directions.
 * Tagline is shared across all: YOUR WORLD, YOUR MUSIC.
 *
 * Set ACTIVE_BRAND_DIRECTION to preview a direction in the app.
 */
export const BRAND_TAGLINE = "YOUR WORLD, YOUR MUSIC.";

export const BRAND_DIRECTIONS = {
  lumen: {
    id: "lumen",
    name: "Lumen Deck",
    summary: "OLED black, ice type, chrome frame mark — high-end streaming deck.",
    wordmark: {
      letterSpacing: 0.28,
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
      letterSpacing: 0.42,
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

/** Change to "orbit" or "signal" to preview another direction. */
export const ACTIVE_BRAND_DIRECTION = "lumen";

export function activeBrandDirection() {
  return BRAND_DIRECTIONS[ACTIVE_BRAND_DIRECTION] || BRAND_DIRECTIONS.lumen;
}
