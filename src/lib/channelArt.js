import y2kDance from "../assets/channels/y2k-dance.png";
import varietyMix from "../assets/channels/variety-mix.png";
import localPnw from "../assets/channels/local-pnw.png";
import electronic from "../assets/channels/electronic.png";
import drumAndBass from "../assets/channels/drum-and-bass.png";
import shoegaze from "../assets/channels/shoegaze.png";
import metal from "../assets/channels/metal.png";
import punk from "../assets/channels/punk.png";
import countryFolk from "../assets/channels/country-folk.png";
import downtempo from "../assets/channels/downtempo.png";

/**
 * Webpack-bundled station photos (hashed URLs in production).
 * Channel Surfing must not depend on /channels/*.png existing on the host.
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
