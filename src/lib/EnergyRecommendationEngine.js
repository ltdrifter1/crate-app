// Energy Recommendation Engine — pure functions, no React / Firebase / DOM.
//
// Given the current track and a pending energy-shift vector (from
// playerEnergyStore), ranks candidate tracks by weighted musical distance to a
// per-step target. The step target only moves part of the way toward the full
// shift ("lawnmower" traversal), so a +30 BPM request lifts the room over
// three or four songs instead of one jump — like a DJ reading the floor.

import { parseCamelot, camelotCompatible } from "./harmony";
import { normalizeGenre } from "./genres";

// Per-song sweep limits — one selection never moves more than this.
const STEP_BPM = 10;
const STEP_ENERGY = 1.5;
const STEP_CAMELOT = 2;

// Weighted distance (lower = better). Mirrors classic harmonic-mixing intuition:
// tempo first, key second, then energy, mood, genre.
const W = { bpm: 0.35, camelot: 0.3, energy: 0.2, mood: 0.1, genre: 0.05 };

function clampMag(value, cap) {
  return Math.max(-cap, Math.min(cap, value));
}

/**
 * Distance on the Camelot wheel (0 = same slot). Crossing modes (A↔B) at the
 * same number is a cheap 0.5 hop; mode mismatch elsewhere adds a penalty.
 * Missing metadata returns a neutral middle distance.
 */
export function camelotDistance(keyA, keyB) {
  const a = parseCamelot(keyA);
  const b = parseCamelot(keyB);
  if (!a || !b) return 1.5;
  const raw = Math.abs(a.num - b.num);
  const wheel = Math.min(raw, 12 - raw);
  if (wheel === 0) return a.mode === b.mode ? 0 : 0.5;
  return wheel + (a.mode === b.mode ? 0 : 1);
}

/** Signed Camelot steps from a toward b along the shorter arc (-6..+6). */
function camelotSignedSteps(a, b) {
  let d = b - a;
  if (d > 6) d -= 12;
  if (d < -6) d += 12;
  return d;
}

/** 0 (same mood) → 1 (opposite). Falls back to energy/danceability proximity. */
export function moodDistance(a, b) {
  const ma = (a?.mood || "").toLowerCase().trim();
  const mb = (b?.mood || "").toLowerCase().trim();
  if (ma && mb) return ma === mb ? 0 : 1;
  const da = a?.danceability;
  const db = b?.danceability;
  if (da != null && db != null) {
    const span = Math.max(Math.abs(da), Math.abs(db)) > 1 ? 100 : 1;
    return Math.min(1, Math.abs(da - db) / span);
  }
  return Math.min(1, Math.abs((a?.energy || 5) - (b?.energy || 5)) / 9);
}

/**
 * Compute this step's target from the current track + pending shift.
 * Moves at most STEP_* per dimension — the lawnmower sweep.
 */
export function stepTarget(current, shift) {
  const bpm = (current?.bpm || 120) + clampMag(shift?.bpmDelta || 0, STEP_BPM);
  const energy = Math.max(1, Math.min(10,
    (current?.energy || 5) + clampMag(shift?.energyDelta || 0, STEP_ENERGY)));
  const key = parseCamelot(current?.camelot);
  let camelotNum = key ? key.num : null;
  if (key && shift?.camelotDelta) {
    camelotNum = ((key.num - 1 + clampMag(Math.round(shift.camelotDelta), STEP_CAMELOT)) % 12 + 12) % 12 + 1;
  }
  return { bpm, energy, camelotNum, camelotMode: key ? key.mode : null };
}

/**
 * Weighted distance of a candidate to the step target. Lower is better.
 * Direction-aware: moving with the sweep beats standing still; moving against
 * it is penalized. Harmonically incompatible jumps are pushed to the bottom
 * so they only surface when nothing else exists.
 */
export function scoreCandidate(candidate, current, target, shift) {
  const dir = shift?.direction || Math.sign(shift?.bpmDelta || 0) || 0;

  // BPM — normalized against the per-step sweep size.
  let bpmDist;
  if (candidate.bpm && target.bpm) {
    bpmDist = Math.abs(candidate.bpm - target.bpm) / STEP_BPM;
    // Penalize candidates that move opposite to the sweep direction.
    if (dir !== 0 && current?.bpm && (candidate.bpm - current.bpm) * dir < 0) bpmDist += 0.75;
  } else {
    bpmDist = 1.25; // unknown tempo — usable but not preferred
  }

  // Camelot — distance to the target slot, normalized to ~0..1 per 3 steps.
  let keyDist;
  const ck = parseCamelot(candidate.camelot);
  if (ck && target.camelotNum != null) {
    const steps = Math.abs(camelotSignedSteps(target.camelotNum, ck.num));
    // Crossing modes off-slot (e.g. 8A → 10B) is a rough blend — penalize hard.
    keyDist = (steps + (ck.mode === target.camelotMode ? 0 : steps === 0 ? 0.5 : 2)) / 3;
  } else {
    keyDist = 0.5;
  }

  const energyDist = Math.abs((candidate.energy || 5) - target.energy) / 3;
  const mood = moodDistance(candidate, current);
  const genre = (normalizeGenre(candidate.genre) || candidate.genre) ===
    (normalizeGenre(current?.genre) || current?.genre) ? 0 : 1;

  let score =
    W.bpm * Math.min(bpmDist, 3) +
    W.camelot * Math.min(keyDist, 3) +
    W.energy * Math.min(energyDist, 3) +
    W.mood * mood +
    W.genre * genre;

  // Hard harmonic guard: outside acceptable mixing range → only as last resort.
  if (current?.camelot && candidate.camelot && !camelotCompatible(current.camelot, candidate.camelot, 3)) {
    score += 2;
  }
  return score;
}

/** Rank a pool against the sweep target. Returns [{ track, score }] ascending. */
export function rankEnergyCandidates(pool, current, shift, limit = 12) {
  const target = stepTarget(current, shift);
  return pool
    .filter((t) => t && t.id !== current?.id)
    .map((t) => ({ track: t, score: scoreCandidate(t, current, target, shift) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}

/**
 * Pick the next track under an active energy shift. Softly randomized among
 * the strongest candidates so repeated sweeps don't feel deterministic.
 */
export function pickEnergyTrack(pool, current, shift, rng = Math.random) {
  if (!pool?.length || !shift?.active) return null;
  const ranked = rankEnergyCandidates(pool, current, shift, 5);
  if (!ranked.length) return null;
  // Weighted toward the best: [4, 3, 2, 1, 1]
  const weights = [4, 3, 2, 1, 1].slice(0, ranked.length);
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < ranked.length; i++) {
    r -= weights[i];
    if (r <= 0) return ranked[i].track;
  }
  return ranked[0].track;
}
