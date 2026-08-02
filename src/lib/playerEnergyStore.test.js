import { createPlayerEnergyStore, ENERGY_PRESETS, PRESETS_UP, PRESETS_DOWN } from "./playerEnergyStore";

describe("playerEnergyStore", () => {
  let store;
  beforeEach(() => { store = createPlayerEnergyStore(); });

  test("rabbit nudge activates a +10 BPM sweep", () => {
    store.shiftEnergy(1, 10);
    const s = store.getState();
    expect(s.active).toBe(true);
    expect(s.direction).toBe(1);
    expect(s.bpmDelta).toBe(10);
    expect(s.lastAction.bpmStep).toBe(10);
  });

  test("nudges stack but cap at ±40 BPM", () => {
    for (let i = 0; i < 6; i++) store.shiftEnergy(1, 20);
    expect(store.getState().bpmDelta).toBe(40);
  });

  test("turtle after rabbit cancels out", () => {
    store.shiftEnergy(1, 10);
    store.shiftEnergy(-1, 10);
    const s = store.getState();
    expect(s.bpmDelta).toBe(0);
  });

  test("lawnmower: playing faster tracks consumes the sweep and settles", () => {
    store.onTrackPlayed({ id: "a", bpm: 120, energy: 6 });
    store.shiftEnergy(1, 20);
    store.onTrackPlayed({ id: "b", bpm: 128, energy: 7 }); // consumed 8 BPM
    expect(store.getState().bpmDelta).toBe(12);
    store.onTrackPlayed({ id: "c", bpm: 137, energy: 8 }); // consumed 9 more
    expect(store.getState().bpmDelta).toBe(3);
    store.onTrackPlayed({ id: "d", bpm: 141, energy: 8 });
    expect(store.getState().active).toBe(false); // target reached
  });

  test("movement against the sweep does not refill the target", () => {
    store.onTrackPlayed({ id: "a", bpm: 120, energy: 6 });
    store.shiftEnergy(1, 10);
    store.onTrackPlayed({ id: "b", bpm: 112, energy: 5 });
    expect(store.getState().bpmDelta).toBe(10);
  });

  test("presets map onto the same vector (future compatibility)", () => {
    expect(ENERGY_PRESETS.peakTime.bpm).toBeGreaterThan(0);
    store.applyPreset("coolDown");
    const s = store.getState();
    expect(s.active).toBe(true);
    expect(s.direction).toBe(-1);
    expect(s.lastAction.label).toBe("Cool down");
    expect(s.lastAction.emoji).toBe(ENERGY_PRESETS.coolDown.emoji);
  });

  test("menu preset lists point the right way", () => {
    PRESETS_UP.forEach((id) => expect(ENERGY_PRESETS[id].bpm).toBeGreaterThan(0));
    PRESETS_DOWN.forEach((id) => expect(ENERGY_PRESETS[id].bpm).toBeLessThan(0));
  });

  test("subscribe notifies and reset clears", () => {
    const seen = [];
    const un = store.subscribe((s) => seen.push(s.active));
    store.shiftEnergy(-1, 10);
    store.reset();
    un();
    expect(seen).toEqual([true, false]);
    expect(store.getState().bpmDelta).toBe(0);
  });
});
