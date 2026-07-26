/**
 * Planet MP3 — product identity.
 * Tagline: YOUR WORLD, YOUR MUSIC.
 */
export const BRAND_TAGLINE = "YOUR WORLD, YOUR MUSIC.";

export const BRAND_NAME = "Planet MP3";
export const BRAND_NAME_SHORT = "Planet MP3";

export function brandStoragePrefix() {
  return "planetmp3";
}

export const brandWordmark = {
  letterSpacing: -0.2,
  weight: 700,
  transform: "none",
};

export const brandTaglineStyle = {
  font: "mono",
  letterSpacing: 0.12,
  transform: "uppercase",
  size: 11,
};

/** @deprecated single-brand app — kept for imports */
export function activeBrandName() {
  return { key: "planetmp3", name: BRAND_NAME, direction: "planet" };
}

export function activeBrandDirection() {
  return { wordmark: brandWordmark, tagline: brandTaglineStyle };
}

export const ACTIVE_BRAND_DIRECTION = "planet";
