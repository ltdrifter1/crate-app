import y2kDance from "../assets/channels/y2k-dance.jpg";
import varietyMix from "../assets/channels/variety-mix.jpg";
import localPnw from "../assets/channels/local-pnw.jpg";
import electronic from "../assets/channels/electronic.jpg";
import drumAndBass from "../assets/channels/drum-and-bass.jpg";
import shoegaze from "../assets/channels/shoegaze.jpg";
import metal from "../assets/channels/metal.jpg";
import punk from "../assets/channels/punk.jpg";
import countryFolk from "../assets/channels/country-folk.jpg";
import downtempo from "../assets/channels/downtempo.jpg";
import heroIdle from "../assets/editorial/hero-idle.jpg";

/**
 * Webpack-bundled station photos (hashed URLs in production).
 * Channel Surfing must not depend on /channels/* existing on the host.
 * All files are licensed documentary photography, graded for late-90s print —
 * see docs/IMAGE_CREDITS.md.
 */
export const CHANNEL_ART = {
  "y2k-dance": y2kDance,
  "variety-mix": varietyMix,
  "local-pnw": localPnw,
  "electronic-underground": electronic,
  "drum-and-bass": drumAndBass,
  shoegaze,
  metal,
  punk,
  "country-folk": countryFolk,
  downtempo,
};

/**
 * object-position per channel so square tiles and the landscape
 * showcase crop keep decks, faces, and crowds in frame.
 */
export const CHANNEL_ART_FOCUS = {
  "y2k-dance": "52% 58%",
  "variety-mix": "38% 42%",
  "local-pnw": "50% 36%",
  "electronic-underground": "58% 48%",
  "drum-and-bass": "58% 42%",
  shoegaze: "52% 42%",
  metal: "38% 48%",
  punk: "28% 40%",
  "country-folk": "48% 40%",
  downtempo: "48% 42%",
};

/** Idle Home hero — club documentary, not a catalog sleeve. */
export const HERO_IDLE_ART = heroIdle;
export const HERO_IDLE_FOCUS = "52% 46%";

/**
 * Resolve a Channel Surfing photo without baking webpack image URLs into
 * the scene-channel catalog module (that module is on App's critical path).
 */
export function resolveChannelArt(channel) {
  if (!channel) return { src: null, focus: "center" };
  const src = channel.art || CHANNEL_ART[channel.id] || null;
  const focus = channel.artFocus || CHANNEL_ART_FOCUS[channel.id] || "center";
  return { src, focus };
}
