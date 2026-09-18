/**
 * Dev-preview album sleeves — glass plates, not Channel Surfing pictograms.
 */

const PALETTES = [
  ["#3D4654", "#6B7584", "#D0D6E0"],
  ["#4A5360", "#8B95A4", "#E8F1F8"],
  ["#5B6574", "#A8B2C0", "#D8DFE8"],
  ["#545E6C", "#87919F", "#C5CDD8"],
  ["#4E5866", "#7A8492", "#B4BBC6"],
  ["#3A4250", "#6A7482", "#C5CBD6"],
  ["#5A6472", "#98A2B0", "#D8DFE8"],
  ["#4A5260", "#87919F", "#E8F1F8"],
  ["#3D4654", "#A8B2C0", "#D0D6E0"],
  ["#6B7584", "#B4BBC6", "#E8F1F8"],
];

function hash(s) {
  let h = 0;
  const str = String(s || "");
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Square glass sleeve as a data-URI SVG. */
export function previewSleeve(id, title = "") {
  const pal = PALETTES[hash(id) % PALETTES.length];
  const label = String(title || id || "").slice(0, 18);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${pal[2]}"/>
        <stop offset="46%" stop-color="${pal[1]}"/>
        <stop offset="100%" stop-color="${pal[0]}"/>
      </linearGradient>
      <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.46"/>
        <stop offset="40%" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="640" height="640" fill="url(#g)"/>
    <rect width="640" height="640" fill="url(#s)"/>
    <rect x="28" y="28" width="584" height="584" fill="none" stroke="rgba(232,241,248,0.5)" stroke-width="2"/>
    <circle cx="508" cy="118" r="64" fill="rgba(232,241,248,0.18)"/>
    <text x="48" y="580" fill="#E8F1F8" font-family="IBM Plex Sans, Helvetica, Arial, sans-serif" font-size="36" font-weight="700">${escapeXml(label)}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const PREVIEW_SLEEVES = {
  electronic: previewSleeve("electronic", "Night Shift"),
  y2k: previewSleeve("y2k", "Afterglow"),
  variety: previewSleeve("variety", "Y2K"),
  pnw: previewSleeve("pnw", "Highways"),
  dnb: previewSleeve("dnb", "Weight"),
  shoe: previewSleeve("shoe", "Walls"),
  metal: previewSleeve("metal", "Gain"),
  punk: previewSleeve("punk", "Unpolished"),
  folk: previewSleeve("folk", "Open Road"),
  down: previewSleeve("down", "Late"),
};
