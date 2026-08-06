// React bindings for transport flags (playing / buffering / track id).
// Prefer these in leaf chrome — never subscribe from App root.

import { useSyncExternalStore } from "react";
import { playerTransportStore } from "./lib/playerTransportStore";

export function usePlayerTransport() {
  return useSyncExternalStore(
    playerTransportStore.subscribe,
    playerTransportStore.getState,
    playerTransportStore.getState
  );
}

export function useIsBuffering() {
  return useSyncExternalStore(
    playerTransportStore.subscribe,
    () => playerTransportStore.getState().isBuffering,
    () => false
  );
}

/** Imperative writers for the audio engine / App actions. */
export const transportFlags = {
  setPlaying: (v) => playerTransportStore.setPlaying(v),
  setBuffering: (v) => playerTransportStore.setBuffering(v),
  setTrackId: (id) => playerTransportStore.setTrackId(id),
  sync: (patch) => playerTransportStore.sync(patch),
  reset: () => playerTransportStore.reset(),
  getState: () => playerTransportStore.getState(),
  subscribe: (fn) => playerTransportStore.subscribe(fn),
};
