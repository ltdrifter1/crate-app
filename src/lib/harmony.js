// src/lib/harmony.js
// Pure, dependency-free helpers extracted from App.jsx so they can be
// reused and unit-tested in isolation. No React, no Firebase, no DOM.

// ── CAMELOT ──────────────────────────────────────────────────────────────────
// Two tracks mix harmonically when their Camelot key numbers are within `range`
// steps on the wheel (wrapping around 12). Missing/invalid keys are permissive.
export function camelotCompatible(keyA, keyB, range = 2) {
  if (!keyA || !keyB) return true;
  const numA = parseInt(keyA), numB = parseInt(keyB);
  if (isNaN(numA) || isNaN(numB)) return true;
  const diff = Math.abs(numA - numB);
  return Math.min(diff, 12 - diff) <= range;
}

// ── TIME → ENERGY ────────────────────────────────────────────────────────────
// Maps an hour (0–23) to a sensible [min, max] energy window for that time.
export function getEnergyRangeForHour(h) {
  const m = {
    0:[7,9],1:[5,7],2:[2,4],3:[2,4],4:[2,4],5:[2,4],6:[2,4],7:[2,4],8:[2,4],
    9:[4,6],10:[4,6],11:[4,6],12:[5,8],13:[5,8],14:[5,8],15:[5,8],
    16:[4,8],17:[4,8],18:[4,8],19:[4,8],20:[4,8],21:[4,8],22:[7,9],23:[7,9],
  };
  return m[h] ?? [1,10];
}

// ── FORMAT SECONDS → M:SS ─────────────────────────────────────────────────────
export function fmtTime(s) {
  if (!s || isNaN(s)) return "0:00";
  return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,"0")}`;
}

// ── HEX → "r,g,b" STRING (for rgba() glow tints) ──────────────────────────────
export function hexToRgbStr(hex) {
  if (!hex || hex.length < 7) return "160,165,175";
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}
