import { glass } from "../theme";
import { hexToRgbStr } from "./harmony";

/** Soft track-color wash for glass player docks. */
export function dockTintStyle(track) {
  if (!track?.color) return undefined;
  const rgb = hexToRgbStr(track.color);
  return {
    background: `
      linear-gradient(165deg, rgba(${rgb},0.16) 0%, rgba(${rgb},0.05) 42%, rgba(247,248,250,0.92) 78%),
      ${glass.fillHeavy}
    `,
  };
}
