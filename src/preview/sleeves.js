/**
 * Preview-only catalog sleeves. Channel pictograms stay bugs —
 * these drawings are stand-in records so Explore / Home / Charts
 * can show magazine-scale art without Firestore.
 */
function hashSeed(s) {
  let h = 0;
  const str = String(s || "");
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const HUES = [210, 18, 32, 152, 278, 44, 196, 8, 262, 124, 88, 340];

export function previewSleeve(seed, label = "") {
  const hue = HUES[hashSeed(seed) % HUES.length];
  const safe = String(label || seed || "")
    .slice(0, 18)
    .replace(/[<>&]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="hsl(${hue},36%,34%)"/><rect x="18" y="18" width="364" height="364" fill="none" stroke="rgba(216,223,232,0.38)" stroke-width="3"/><rect x="18" y="18" width="364" height="70" fill="rgba(58,66,80,0.35)"/><text x="32" y="62" fill="#D8DFE8" font-family="IBM Plex Sans, sans-serif" font-size="22" font-weight="700">${safe}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
