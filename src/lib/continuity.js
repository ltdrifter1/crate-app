/**
 * Listening continuity — persist the player session locally so a
 * returning listener can pick up where they left off.
 */

const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const MAX_QUEUE_IDS = 50;

const storageKey = (prefix) => `${prefix}.listening`;

/**
 * Persist a listening snapshot.
 * state: { trackId, position, queueIds, isRadioMode, mixLane }
 */
export function saveListeningState(prefix, state) {
  if (!state?.trackId) return;
  try {
    localStorage.setItem(
      storageKey(prefix),
      JSON.stringify({
        trackId: state.trackId,
        position: Math.max(0, Math.floor(state.position || 0)),
        queueIds: (state.queueIds || []).slice(0, MAX_QUEUE_IDS),
        isRadioMode: !!state.isRadioMode,
        mixLane: state.mixLane || null,
        ts: Date.now(),
      })
    );
  } catch {
    /* storage unavailable — continuity is best-effort */
  }
}

/** Load a saved snapshot, or null when missing/stale/corrupt. */
export function loadListeningState(prefix) {
  try {
    const raw = localStorage.getItem(storageKey(prefix));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.trackId) return null;
    if (typeof parsed.ts === "number" && Date.now() - parsed.ts > MAX_AGE_MS) {
      clearListeningState(prefix);
      return null;
    }
    return {
      trackId: parsed.trackId,
      position: Math.max(0, Math.floor(parsed.position || 0)),
      queueIds: Array.isArray(parsed.queueIds) ? parsed.queueIds : [],
      isRadioMode: !!parsed.isRadioMode,
      mixLane: parsed.mixLane || null,
      ts: parsed.ts || 0,
    };
  } catch {
    return null;
  }
}

export function clearListeningState(prefix) {
  try {
    localStorage.removeItem(storageKey(prefix));
  } catch {
    /* ignore */
  }
}
