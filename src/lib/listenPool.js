/**
 * One intent → one pool.
 *
 * Listen focus (genre / scene / vibe) and clock mix lanes share this
 * resolver so labels match what actually plays.
 */

import { normalizeGenre } from "./genres";
import { mixLaneForDate, trackFitsMixLane } from "./mixLanes";
import { getScene, trackMatchesScene } from "./scenes";
import { SESSION_PROFILES } from "./engine";

/** Normalize partial intent into a stable shape. */
export function createListenIntent(partial = {}) {
  return {
    mixLane: partial.mixLane ?? null, // null → resolve from clock when applied
    vibe: partial.vibe ?? null,
    genre: partial.genre ? (normalizeGenre(partial.genre) || partial.genre) : null,
    scene: partial.scene ?? null,
  };
}

export function resolveMixLane(intent = {}, dateOrHour = new Date()) {
  if (intent?.mixLane && ["daytime", "nighttime"].includes(intent.mixLane)) {
    return intent.mixLane;
  }
  return mixLaneForDate(dateOrHour).id;
}

function playableSingles(tracks = []) {
  return tracks.filter((t) => (t.duration || 0) <= 900);
}

function withAudio(tracks = []) {
  return tracks.filter((t) => String(t.audioUrl || "").trim());
}

/**
 * Resolve a listening pool from catalog + intent.
 *
 * Filter order: playable → (scene | genre) → mix lane (soft) → audio (optional).
 * Mix lane is skipped when it would empty an already-focused scene/genre pool.
 */
export function resolveListenPool(catalog = [], intentPartial = {}, options = {}) {
  const {
    requireAudio = false,
    applyMixLane = true,
    dateOrHour = new Date(),
  } = options;

  const intent = createListenIntent(intentPartial);
  const mixLane = resolveMixLane(intent, dateOrHour);
  const applied = [];

  let pool = playableSingles(catalog);

  if (intent.scene) {
    pool = pool.filter((t) => trackMatchesScene(t, intent.scene));
    applied.push("scene");
  } else if (intent.genre) {
    pool = pool.filter((t) => normalizeGenre(t.genre) === intent.genre);
    applied.push("genre");
  }

  let mixLaneApplied = false;
  let mixLaneSkipped = false;
  if (applyMixLane) {
    const laneFiltered = pool.filter((t) => trackFitsMixLane(t, mixLane));
    if (laneFiltered.length) {
      pool = laneFiltered;
      mixLaneApplied = true;
      applied.push("mixLane");
    } else if (intent.scene || intent.genre) {
      // Keep focus pool — mix lane would erase the user's browse choice
      mixLaneSkipped = true;
    } else {
      // Unfocused empty lane → fall back to all playable
      mixLaneSkipped = true;
    }
  }

  if (requireAudio) {
    const audible = withAudio(pool);
    if (audible.length) pool = audible;
    else if (!intent.scene && !intent.genre) {
      pool = withAudio(playableSingles(catalog));
    } else {
      pool = audible;
    }
    applied.push("audio");
  }

  return {
    tracks: pool,
    intent,
    mixLane,
    mixLaneApplied,
    mixLaneSkipped,
    applied,
    label: listenPoolLabel(intent, { mixLane, dateOrHour }),
  };
}

/** Human label for Cover Stage / toasts — never surfaces day/night mix lanes. */
export function listenPoolLabel(intentPartial = {}, opts = {}) {
  const intent = createListenIntent(intentPartial);
  const parts = [];

  if (intent.scene) {
    parts.push(getScene(intent.scene)?.label || intent.scene);
  } else if (intent.genre) {
    parts.push(intent.genre);
  }

  if (intent.vibe && SESSION_PROFILES[intent.vibe]) {
    parts.push(SESSION_PROFILES[intent.vibe].label);
  }

  return parts.join(" · ") || "What's in the mix?";
}

/** Short focus-only label (scene or genre), or null. */
export function listenFocusLabel(intentPartial = {}) {
  const intent = createListenIntent(intentPartial);
  if (intent.scene) return getScene(intent.scene)?.label || intent.scene;
  if (intent.genre) return intent.genre;
  return null;
}
