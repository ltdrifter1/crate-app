// React binding for the playback clock store.
// Only transport UI should subscribe — never the App root.

import { useSyncExternalStore } from "react";
import { playerPlaybackStore } from "./lib/playerPlaybackStore";

export function usePlayerPlayback() {
  return useSyncExternalStore(
    playerPlaybackStore.subscribe,
    playerPlaybackStore.getState,
    playerPlaybackStore.getState
  );
}

/** Imperative writers for audio engine / App actions. */
export const playbackClock = {
  setProgress: (n) => playerPlaybackStore.setProgress(n),
  setDuration: (n) => playerPlaybackStore.setDuration(n),
  setClock: (patch) => playerPlaybackStore.setClock(patch),
  reset: () => playerPlaybackStore.reset(),
  getState: () => playerPlaybackStore.getState(),
  subscribe: (fn) => playerPlaybackStore.subscribe(fn),
};
