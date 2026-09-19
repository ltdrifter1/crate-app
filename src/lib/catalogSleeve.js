/**
 * Catalog sleeve URLs without importing Channel Surfing PNGs.
 * Home / Explore must not pull the pictogram graph just to reject it.
 */

const PICTOGRAM_FILE =
  "y2k-dance|psychedelic-rock|variety-mix|local-pnw|house|techno|uk-garage|dubstep|drum-and-bass|shoegaze|metal|punk|country-folk|downtempo|hero-idle";

const STATIC_MEDIA_RE = new RegExp(
  `/static/media/(?:${PICTOGRAM_FILE})\\.`,
  "i"
);
const BARE_FILE_RE = new RegExp(`^(?:${PICTOGRAM_FILE})\\.(?:png|jpe?g|webp)$`, "i");

/** Game Icons / channel plates / idle cassette — bugs, never album covers. */
export function isChannelPictogram(url) {
  if (!url || typeof url !== "string") return false;
  if (/\/channels\/[^/?#]+\.(png|jpe?g|webp)$/i.test(url)) return true;
  if (STATIC_MEDIA_RE.test(url)) return true;
  if (BARE_FILE_RE.test(url)) return true;
  return false;
}

/** Catalog sleeve URL, or null when the src is a channel pictogram / idle cassette. */
export function catalogSleeveUrl(url) {
  if (!url || typeof url !== "string") return null;
  if (isChannelPictogram(url)) return null;
  return url;
}
