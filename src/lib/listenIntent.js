/**
 * Unified "Listen for…" intents — daypart radio + timed-mix vibes + browse focus.
 */

import { MIX_LANES, mixLaneById, mixLaneForDate } from "./mixLanes";
import { SESSION_PROFILES } from "./engine";
import {
  createListenIntent,
  resolveListenPool,
  listenPoolLabel,
  listenFocusLabel,
  resolveDaypart,
} from "./listenPool";

export {
  createListenIntent,
  resolveListenPool,
  listenPoolLabel,
  listenFocusLabel,
  resolveDaypart,
};

/** Clock dayparts as radio intents. */
export function daypartIntents() {
  return MIX_LANES.map((m) => ({
    id: m.id,
    kind: "daypart",
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
  const day = mixLaneById(id);
  if (MIX_LANES.some((m) => m.id === id)) {
    return { id: day.id, kind: "daypart", label: day.label, blurb: day.blurb };
  }
  const vibe = SESSION_PROFILES[id];
  if (vibe) return { id, kind: "vibe", label: vibe.label, blurb: vibe.blurb };
  return null;
}

/** Suggested daypart from the clock (for "Follow clock" UI). */
export function suggestedDaypart(dateOrHour = new Date()) {
  return mixLaneForDate(dateOrHour);
}
