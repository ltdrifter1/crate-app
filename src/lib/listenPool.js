/**
 * One intent → one pool.
 *
 * Listen for… (daypart / vibe) and Search Browse (genre / scene) share this
 * resolver so labels match what actually plays.
 */

import { normalizeGenre } from "./genres";
import { mixLaneById, mixLaneForDate, trackFitsMixLane } from "./mixLanes";
import { getScene, trackMatchesScene } from "./scenes";
import { SESSION_PROFILES } from "./engine";

/** Normalize partial intent into a stable shape. */
export function createListenIntent(partial = {}) {
  return {
    daypart: partial.daypart ?? null, // null → resolve from clock when applied
    vibe: partial.vibe ?? null,
    genre: partial.genre ? (normalizeGenre(partial.genre) || partial.genre) : null,
    scene: partial.scene ?? null,
  };
}

export function resolveDaypart(intent = {}, dateOrHour = new Date()) {
  if (intent?.daypart && ["daytime", "nighttime"].includes(intent.daypart)) {
    return intent.daypart;
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
 * Filter order: playable → (scene | genre) → daypart (soft) → audio (optional).
 * Daypart is skipped when it would empty an already-focused scene/genre pool.
 */
export function resolveListenPool(catalog = [], intentPartial = {}, options = {}) {
  const {
    requireAudio = false,
    applyDaypart = true,
    dateOrHour = new Date(),
  } = options;

  const intent = createListenIntent(intentPartial);
  const daypart = resolveDaypart(intent, dateOrHour);
  const applied = [];

  let pool = playableSingles(catalog);

  if (intent.scene) {
    pool = pool.filter((t) => trackMatchesScene(t, intent.scene));
    applied.push("scene");
  } else if (intent.genre) {
    pool = pool.filter((t) => normalizeGenre(t.genre) === intent.genre);
    applied.push("genre");
  }

  let daypartApplied = false;
  let daypartSkipped = false;
  if (applyDaypart) {
    const dayFiltered = pool.filter((t) => trackFitsMixLane(t, daypart));
    if (dayFiltered.length) {
      pool = dayFiltered;
      daypartApplied = true;
      applied.push("daypart");
    } else if (intent.scene || intent.genre) {
      // Keep focus pool — daypart would erase the user's browse choice
      daypartSkipped = true;
    } else {
      // Unfocused empty daypart → fall back to all playable
      daypartSkipped = true;
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
    daypart,
    daypartApplied,
    daypartSkipped,
    applied,
    label: listenPoolLabel(intent, { daypart, dateOrHour }),
  };
}

/** Human label for Cover Stage / toasts / Listen for sheet. */
export function listenPoolLabel(intentPartial = {}, opts = {}) {
  const intent = createListenIntent(intentPartial);
  const daypart = opts.daypart || resolveDaypart(intent, opts.dateOrHour);
  const parts = [];

  if (intent.scene) {
    parts.push(getScene(intent.scene)?.label || intent.scene);
  } else if (intent.genre) {
    parts.push(intent.genre);
  }

  if (intent.vibe && SESSION_PROFILES[intent.vibe]) {
    parts.push(SESSION_PROFILES[intent.vibe].label);
  } else {
    parts.push(mixLaneById(daypart).label);
  }

  return parts.join(" · ");
}

/** Short focus-only label (scene or genre), or null. */
export function listenFocusLabel(intentPartial = {}) {
  const intent = createListenIntent(intentPartial);
  if (intent.scene) return getScene(intent.scene)?.label || intent.scene;
  if (intent.genre) return intent.genre;
  return null;
}
