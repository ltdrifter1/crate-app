// Canonical genre set — 11 taste lanes. Scenes/styles live in the background.

import shared from "./genre-normalize.shared.cjs";

export const CANONICAL_GENRES = shared.CANONICAL_GENRES;
export const GENRE_ALIASES = shared.GENRE_ALIASES;
export const normalizeGenre = shared.normalizeGenre;
export const migratePreferredGenres = shared.migratePreferredGenres;

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
