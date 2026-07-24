// Pure harmonic / time / format helpers — no React, no Firebase.

/** Parse "8A" / "12B" → { num, mode } or null. */
export function parseCamelot(key) {
  if (!key) return null;
  const m = String(key).trim().toUpperCase().match(/^(\d{1,2})\s*([AB])$/);
  if (!m) return null;
  const num = parseInt(m[1], 10);
  if (num < 1 || num > 12) return null;
  return { num, mode: m[2] };
}

/**
 * Camelot compatibility:
 * - Missing/invalid keys are permissive (true)
 * - Same number (incl. relative major/minor 8A↔8B) always mixes
 * - Number steps within `range` require the same letter (A/A or B/B)
 */
export function camelotCompatible(keyA, keyB, range = 2) {
  const a = parseCamelot(keyA);
  const b = parseCamelot(keyB);
  if (!a || !b) return true;

  const raw = Math.abs(a.num - b.num);
  const diff = Math.min(raw, 12 - raw);

  if (diff === 0) return true; // same slot — incl. A↔B relative
  if (diff <= range && a.mode === b.mode) return true;
  return false;
}

export function getEnergyRangeForHour(h) {
  const m = {
    0:[7,9],1:[5,7],2:[2,4],3:[2,4],4:[2,4],5:[2,4],6:[2,4],7:[2,4],8:[2,4],
    9:[4,6],10:[4,6],11:[4,6],12:[5,8],13:[5,8],14:[5,8],15:[5,8],
    16:[4,8],17:[4,8],18:[4,8],19:[4,8],20:[4,8],21:[4,8],22:[7,9],23:[7,9],
  };
  return m[h] ?? [1,10];
}

export function fmtTime(s) {
  if (!s || isNaN(s)) return "0:00";
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

export function hexToRgbStr(hex) {
  if (!hex || hex.length < 7) return "160,165,175";
  return `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`;
}
