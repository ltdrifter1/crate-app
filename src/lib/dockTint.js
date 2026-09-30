import { glass } from "../theme";
import { hexToRgbStr } from "./harmony";

/** Track-colour wash on a dark plate. A pale cover must never turn the bar light: the text on it is light. */
export function dockTintStyle(track) {
  if (!track?.color) return undefined;
  const rgb = hexToRgbStr(track.color);
  return {
    background: `
      linear-gradient(165deg, rgba(${rgb},0.22) 0%, rgba(${rgb},0.06) 45%, transparent 75%),
      linear-gradient(180deg, rgba(24,29,36,0.94) 0%, rgba(14,17,22,0.97) 100%)
    `,
    backdropFilter: glass.blurHeavy,
    WebkitBackdropFilter: glass.blurHeavy,
  };
}
