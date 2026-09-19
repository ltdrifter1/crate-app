import {
  catalogSleeveUrl as sleeveFromPath,
  isChannelPictogram as isPictogramPath,
} from "./catalogSleeve";
import { HERO_IDLE_ART } from "./heroIdle";

export { HERO_IDLE_ART, HERO_IDLE_FOCUS } from "./heroIdle";

const CHANNEL_IDS = [
  "y2k-dance",
  "psychedelic-rock",
  "variety-mix",
  "local-pnw",
  "house",
  "techno",
  "uk-garage",
  "dubstep",
  "drum-and-bass",
  "shoegaze",
  "metal",
  "punk",
  "country-folk",
  "downtempo",
];

function publicChannelUrl(id) {
  const base = typeof process !== "undefined" && process.env.PUBLIC_URL ? process.env.PUBLIC_URL : "";
  return `${base}/channels/${id}.png`;
}

/**
 * PS1-style Channel Surfing plates (public URLs, not webpack PNG imports).
 * 256px palette PNGs so Home tiles fetch small files instead of album sleeves.
 */
export const CHANNEL_ART = Object.fromEntries(
  CHANNEL_IDS.map((id) => [id, publicChannelUrl(id)])
);
CHANNEL_ART["electronic-underground"] = CHANNEL_ART.techno;

/** Centered icons — no documentary crop. */
export const CHANNEL_ART_FOCUS = Object.fromEntries(
  [...CHANNEL_IDS, "electronic-underground"].map((id) => [id, "50% 50%"])
);

const PICTOGRAM_URLS = new Set([
  ...Object.values(CHANNEL_ART),
  HERO_IDLE_ART,
]);

/** Channel plates / idle cassette — bugs, never album covers. */
export function isChannelPictogram(url) {
  if (PICTOGRAM_URLS.has(url)) return true;
  return isPictogramPath(url);
}

/** Catalog sleeve URL, or null when the src is a channel pictogram / idle cassette. */
export function catalogSleeveUrl(url) {
  if (PICTOGRAM_URLS.has(url)) return null;
  return sleeveFromPath(url);
}

/**
 * Resolve a Channel Surfing icon without baking webpack image bytes into
 * the Home JS graph — files live under /channels/*.png.
 */
export function resolveChannelArt(channel) {
  if (!channel) return { src: null, focus: "center" };
  const src = channel.art || CHANNEL_ART[channel.id] || null;
  const focus = channel.artFocus || CHANNEL_ART_FOCUS[channel.id] || "center";
  return { src, focus };
}
