import { glass } from "../theme";
import { hexToRgbStr } from "./harmony";

/** Soft track-color wash for glass player docks. */
export function dockTintStyle(track) {
  if (!track?.color) return undefined;
  const rgb = hexToRgbStr(track.color);
  return {
    background: `
      linear-gradient(165deg, rgba(${rgb},0.18) 0%, rgba(${rgb},0.06) 36%, rgba(18,20,24,0.92) 78%),
      ${glass.fillHeavy}
    `,
  };
}
