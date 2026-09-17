import { glass } from "../theme";
import { hexToRgbStr } from "./harmony";

/** Track-color wash for dark glass player docks. */
export function dockTintStyle(track) {
  if (!track?.color) return undefined;
  const rgb = hexToRgbStr(track.color);
  return {
    background: `
      linear-gradient(165deg, rgba(${rgb},0.28) 0%, rgba(${rgb},0.08) 42%, rgba(16,18,24,0.92) 78%),
      ${glass.fillHeavy}
    `,
  };
}
