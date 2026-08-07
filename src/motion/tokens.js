// Motion tokens — kept in sync with theme.motion (see identity.test.js).
// Durations in seconds; easings tuned for music-adjacent UI.

export const duration = {
  instant: 0.08,
  fast: 0.12,
  base: 0.2,
  settle: 0.32,
  enter: 0.55,
  ambient: 6,
  art: 8,
};

export const ease = {
  // Standard exit/enter for navigation
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  // Softer for overlays / sheets
  soft: "cubic-bezier(0.33, 1, 0.68, 1)",
  // Snappy micro-interactions
  snap: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  // Linear for progress / vinyl spin only
  linear: "linear",
};

/** Prefer importing motion from theme.js in UI; this mirrors for Rooms / older imports. */
export const motion = {
  fast: `${duration.fast}s`,
  base: `${duration.base}s`,
  settle: `${duration.settle}s`,
  enter: `${duration.enter}s`,
  ease: ease.out,
  soft: ease.soft,
  snap: ease.snap,
};

/** Stagger delay for editorial lists (seconds). Caps to avoid long waits. */
export function stagger(index, step = 0.04, cap = 0.28) {
  return Math.min(index * step, cap);
}

/** CSS transition shorthand helpers. */
export const transition = {
  fade: `opacity ${duration.settle}s ${ease.out}`,
  rise: `opacity ${duration.enter}s ${ease.out}, transform ${duration.enter}s ${ease.out}`,
  color: `color ${duration.fast}s ${ease.snap}, background ${duration.base}s ${ease.out}`,
  press: `transform ${duration.instant}s ${ease.snap}, opacity ${duration.fast}s ${ease.snap}`,
};

/**
 * Motion principles for designers & engineers:
 * 1. Rhythm over bounce — no elastic overshoot.
 * 2. Atmosphere moves slower than chrome.
 * 3. Track changes fade; rooms crossfade.
 * 4. Respect prefers-reduced-motion (handled globally).
 */
export const PRINCIPLES = [
  "Rhythm over bounce",
  "Atmosphere slower than chrome",
  "Track changes fade; rooms crossfade",
  "Honor reduced motion",
];
