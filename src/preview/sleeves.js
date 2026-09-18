/**
 * Preview-only catalog sleeves. Channel pictograms stay bugs —
 * these drawings are stand-in records so Explore / Home / Charts
 * can show magazine-scale art without Firestore.
 * Cool steel hues only — no green fills.
 */
function hashSeed(s) {
  let h = 0;
  const str = String(s || "");
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const HUES = [210, 18, 32, 278, 44, 196, 8, 262, 340, 220, 200, 230];

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function previewSleeve(seed, label = "") {
  const hue = HUES[hashSeed(seed) % HUES.length];
  const safe = escapeXml(String(label || seed || "").slice(0, 18));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="hsl(${hue},36%,34%)"/><rect x="18" y="18" width="364" height="364" fill="none" stroke="rgba(216,223,232,0.38)" stroke-width="3"/><rect x="18" y="18" width="364" height="70" fill="rgba(58,66,80,0.35)"/><text x="32" y="62" fill="#D8DFE8" font-family="IBM Plex Sans, sans-serif" font-size="22" font-weight="700">${safe}</text></svg>`;
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
