import { glass } from "../theme";
import { hexToRgbStr } from "./harmony";

/** Track-color wash for ice-glass player docks — never a dark plate. */
export function dockTintStyle(track) {
  if (!track?.color) return undefined;
  const rgb = hexToRgbStr(track.color);
  return {
    background: `
      linear-gradient(165deg, rgba(${rgb},0.16) 0%, rgba(${rgb},0.05) 38%, transparent 72%),
      linear-gradient(180deg, rgba(216,223,232,0.5) 0%, rgba(200,208,218,0.78) 100%)
    `,
    backdropFilter: glass.blurHeavy,
    WebkitBackdropFilter: glass.blurHeavy,
  };
}
