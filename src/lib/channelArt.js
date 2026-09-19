import y2kDance from "../assets/channels/y2k-dance.png";
import psychedelicRock from "../assets/channels/psychedelic-rock.png";
import varietyMix from "../assets/channels/variety-mix.png";
import localPnw from "../assets/channels/local-pnw.png";
import house from "../assets/channels/house.png";
import techno from "../assets/channels/techno.png";
import ukGarage from "../assets/channels/uk-garage.png";
import dubstep from "../assets/channels/dubstep.png";
import drumAndBass from "../assets/channels/drum-and-bass.png";
import shoegaze from "../assets/channels/shoegaze.png";
import metal from "../assets/channels/metal.png";
import punk from "../assets/channels/punk.png";
import countryFolk from "../assets/channels/country-folk.png";
import downtempo from "../assets/channels/downtempo.png";
import {
  catalogSleeveUrl as sleeveFromPath,
  isChannelPictogram as isPictogramPath,
} from "./catalogSleeve";
import { HERO_IDLE_ART } from "./heroIdle";

export { HERO_IDLE_ART, HERO_IDLE_FOCUS } from "./heroIdle";

/**
 * Original Channel Surfing icons (hashed URLs in production).
 * Published Game Icons drawings on steel plates — not photographs,
 * not generated stickers.
 *
 * Channel Surfing must not depend on /channels/* existing on the host.
 * Home / Explore tiles do not import this module — pictograms stay in
 * onboarding / tests so first paint is sleeves + disc fallback only.
 */
export const CHANNEL_ART = {
  "y2k-dance": y2kDance,
  "psychedelic-rock": psychedelicRock,
  "variety-mix": varietyMix,
  "local-pnw": localPnw,
  house,
  techno,
  "electronic-underground": techno,
  "uk-garage": ukGarage,
  dubstep,
  "drum-and-bass": drumAndBass,
  shoegaze,
  metal,
  punk,
  "country-folk": countryFolk,
  downtempo,
};

/** Centered icons — no documentary crop. */
export const CHANNEL_ART_FOCUS = {
  "y2k-dance": "50% 50%",
  "psychedelic-rock": "50% 50%",
  "variety-mix": "50% 50%",
  "local-pnw": "50% 50%",
  house: "50% 50%",
  techno: "50% 50%",
  "electronic-underground": "50% 50%",
  "uk-garage": "50% 50%",
  dubstep: "50% 50%",
  "drum-and-bass": "50% 50%",
  shoegaze: "50% 50%",
  metal: "50% 50%",
  punk: "50% 50%",
  "country-folk": "50% 50%",
  downtempo: "50% 50%",
};

const PICTOGRAM_URLS = new Set([
  ...Object.values(CHANNEL_ART),
  HERO_IDLE_ART,
]);

/** Game Icons / channel plates — bugs, never album covers. */
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
 * Resolve a Channel Surfing icon without baking webpack image URLs into
 * the scene-channel catalog module (that module is on App's critical path).
 */
export function resolveChannelArt(channel) {
  if (!channel) return { src: null, focus: "center" };
  const src = channel.art || CHANNEL_ART[channel.id] || null;
  const focus = channel.artFocus || CHANNEL_ART_FOCUS[channel.id] || "center";
  return { src, focus };
}
