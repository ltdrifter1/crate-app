// useEnergyQueue — React binding for the Energy Shift feature.
// The UI only ever dispatches increaseEnergy() / decreaseEnergy(); everything
// else (targets, sweep, scoring) happens in the background stores/engine.

import { useCallback, useSyncExternalStore } from "react";
import { playerEnergyStore } from "./lib/playerEnergyStore";

export function useEnergyQueue() {
  const energyShift = useSyncExternalStore(
    playerEnergyStore.subscribe,
    playerEnergyStore.getState,
    playerEnergyStore.getState
  );

  const increaseEnergy = useCallback((bpmStep = 10) => {
    playerEnergyStore.shiftEnergy(1, bpmStep);
  }, []);

  const decreaseEnergy = useCallback((bpmStep = 10) => {
    playerEnergyStore.shiftEnergy(-1, bpmStep);
  }, []);

  const applyPreset = useCallback((id) => {
    playerEnergyStore.applyPreset(id);
  }, []);

  const onTrackPlayed = useCallback((track) => {
    playerEnergyStore.onTrackPlayed(track);
  }, []);

  const resetEnergyShift = useCallback(() => playerEnergyStore.reset(), []);

  return { energyShift, increaseEnergy, decreaseEnergy, applyPreset, onTrackPlayed, resetEnergyShift };
}
