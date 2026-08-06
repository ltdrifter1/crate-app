// React bindings for the human-state / aura signal plane.

import { useSyncExternalStore } from "react";
import { playerSignalStore } from "./lib/playerSignalStore";

export function useSignalState() {
  return useSyncExternalStore(
    playerSignalStore.subscribe,
    playerSignalStore.getState,
    playerSignalStore.getState
  );
}

export function useSignalLabel() {
  return useSyncExternalStore(
    playerSignalStore.subscribe,
    () => playerSignalStore.getState().label,
    () => "Just started"
  );
}

export const signalFlags = {
  setSignal: (s) => playerSignalStore.setSignal(s),
  reset: () => playerSignalStore.reset(),
  getState: () => playerSignalStore.getState(),
  subscribe: (fn) => playerSignalStore.subscribe(fn),
};
