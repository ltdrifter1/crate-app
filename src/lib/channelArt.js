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
import heroIdle from "../assets/editorial/hero-idle.png";

/**
 * Original Channel Surfing icons (hashed URLs in production).
 * Flat MTV-'90s / iTunes-2000 pictograms — not photographs.
 * Channel Surfing must not depend on /channels/* existing on the host.
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

/** Idle Home hero — original iPod pictogram, not a club still. */
export const HERO_IDLE_ART = heroIdle;
export const HERO_IDLE_FOCUS = "50% 50%";

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
