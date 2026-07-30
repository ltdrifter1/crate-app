/**
 * Unified listen intents — clock mix lanes + timed-mix vibes + browse focus.
 */

import { MIX_LANES, mixLaneById, mixLaneForDate } from "./mixLanes";
import { SESSION_PROFILES } from "./engine";
import {
  createListenIntent,
  resolveListenPool,
  listenPoolLabel,
  listenFocusLabel,
  resolveMixLane,
} from "./listenPool";

export {
  createListenIntent,
  resolveListenPool,
  listenPoolLabel,
  listenFocusLabel,
  resolveMixLane,
};

/** Clock mix lanes as radio intents. */
export function mixLaneIntents() {
  return MIX_LANES.map((m) => ({
    id: m.id,
    kind: "mixLane",
    label: m.label,
    blurb: m.blurb,
  }));
}

/** Activity vibes as timed-mix intents. */
export function vibeIntents() {
  return Object.entries(SESSION_PROFILES).map(([id, prof]) => ({
    id,
    kind: "vibe",
    label: prof.label,
    blurb: prof.blurb,
  }));
}

export function listenIntentById(id) {
  const lane = mixLaneById(id);
  if (MIX_LANES.some((m) => m.id === id)) {
    return { id: lane.id, kind: "mixLane", label: lane.label, blurb: lane.blurb };
  }
  const vibe = SESSION_PROFILES[id];
  if (vibe) return { id, kind: "vibe", label: vibe.label, blurb: vibe.blurb };
  return null;
}

/** Suggested mix lane from the clock. */
export function suggestedMixLane(dateOrHour = new Date()) {
  return mixLaneForDate(dateOrHour);
}
