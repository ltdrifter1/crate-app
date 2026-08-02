// Player energy store — framework-independent state for the Energy Shift
// feature ("Rabbit" / "Turtle" transport controls).
//
// Holds the pending energy-shift vector (BPM / energy / Camelot deltas) that
// the recommendation engine sweeps through gradually — lawnmower traversal,
// not teleporting. UI dispatches nudges; the engine consumes movement as
// tracks are selected.
//
// Future controls (Build Up, Cool Down, Sunrise, Afterhours, Peak Time…)
// are presets over the same vector — see ENERGY_PRESETS.

const BPM_DELTA_CAP = 40; // never accumulate more than ±40 BPM of pending shift
const BPM_SETTLE = 3; // remaining |bpmDelta| below this = target reached
const ENERGY_SETTLE = 0.5;

/** Named shift presets — future modes plug in here without touching the UI. */
export const ENERGY_PRESETS = {
  rabbit: { label: "Picking up the pace", emoji: "\u26A1", bpm: +10, energy: +1.5, camelot: +2 },
  turtle: { label: "Slowing things down", emoji: "\uD83C\uDF19", bpm: -10, energy: -1.5, camelot: -2 },
  buildUp: { label: "Build up", blurb: "Steady climb", emoji: "\uD83D\uDD25", bpm: +16, energy: +2.5, camelot: +3 },
  coolDown: { label: "Cool down", blurb: "Bring it back", emoji: "\u2744\uFE0F", bpm: -16, energy: -2.5, camelot: -3 },
  sunrise: { label: "Sunrise", blurb: "Gentle lift", emoji: "\uD83C\uDF05", bpm: +6, energy: +1, camelot: +1 },
  afterhours: { label: "Afterhours", blurb: "Deep and dim", emoji: "\uD83C\uDF03", bpm: -8, energy: -2, camelot: -2 },
  peakTime: { label: "Peak time", blurb: "Full send", emoji: "\uD83E\uDE69", bpm: +20, energy: +3, camelot: +3 },
  rainyDay: { label: "Rainy day", blurb: "Soft and moody", emoji: "\uD83C\uDF27\uFE0F", bpm: -12, energy: -2, camelot: -1 },
};

/** Preset ids surfaced in the long-press menu, per direction. */
export const PRESETS_UP = ["buildUp", "peakTime", "sunrise"];
export const PRESETS_DOWN = ["coolDown", "afterhours", "rainyDay"];

function clampMag(value, cap) {
  return Math.max(-cap, Math.min(cap, value));
}

function initialState() {
  return {
    active: false,
    direction: 0, // -1 slowing · 0 idle · +1 lifting
    bpmDelta: 0, // remaining BPM shift still to sweep through
    energyDelta: 0, // remaining energy shift (catalog 1–10 scale)
    camelotDelta: 0, // remaining Camelot wheel steps
    // Last dispatched action — drives the feedback pill / trend chip.
    lastAction: null, // { direction, bpmStep, label, ts }
  };
}

function createPlayerEnergyStore() {
  let state = initialState();
  let lastTrack = null; // previous playing track, for measuring actual movement
  const listeners = new Set();

  function emit() {
    listeners.forEach((fn) => fn(state));
  }

  function setState(patch) {
    state = { ...state, ...patch };
    emit();
  }

  /** Nudge the target vector. direction: +1 (rabbit) or -1 (turtle). */
  function shiftEnergy(direction, bpmStep = 10, label = null, emoji = null) {
    const dir = direction >= 0 ? 1 : -1;
    const scale = Math.abs(bpmStep) / 10;
    const bpmDelta = clampMag(state.bpmDelta + dir * Math.abs(bpmStep), BPM_DELTA_CAP);
    setState({
      active: true,
      direction: bpmDelta === 0 ? dir : (bpmDelta > 0 ? 1 : -1),
      bpmDelta,
      energyDelta: clampMag(state.energyDelta + dir * 1.5 * scale, 6),
      camelotDelta: clampMag(state.camelotDelta + dir * Math.max(1, Math.round(2 * scale)), 6),
      lastAction: {
        direction: dir,
        bpmStep: dir * Math.abs(bpmStep),
        label: label || (dir > 0 ? ENERGY_PRESETS.rabbit.label : ENERGY_PRESETS.turtle.label),
        emoji: emoji || (dir > 0 ? ENERGY_PRESETS.rabbit.emoji : ENERGY_PRESETS.turtle.emoji),
        ts: Date.now(),
      },
    });
  }

  /** Apply a named preset (Build Up, Cool Down, …). */
  function applyPreset(id) {
    const p = ENERGY_PRESETS[id];
    if (!p) return;
    shiftEnergy(p.bpm >= 0 ? 1 : -1, Math.abs(p.bpm), p.label, p.emoji);
  }

  /**
   * Lawnmower step — called whenever a track starts playing. Measures how far
   * the music actually moved and shrinks the remaining deltas accordingly, so
   * the playlist approaches the target over several songs.
   */
  function onTrackPlayed(track) {
    const prev = lastTrack;
    lastTrack = track || lastTrack;
    if (!state.active || !track) return;

    let { bpmDelta, energyDelta, camelotDelta } = state;

    if (prev) {
      if (prev.bpm && track.bpm) {
        const moved = track.bpm - prev.bpm;
        // Only consume movement in the direction we're sweeping.
        if (moved * bpmDelta > 0) {
          bpmDelta = bpmDelta > 0 ? Math.max(0, bpmDelta - moved) : Math.min(0, bpmDelta - moved);
        }
      } else {
        // No tempo metadata — decay so the shift can't get stuck forever.
        bpmDelta *= 0.6;
      }
      const eMoved = (track.energy || 5) - (prev.energy || 5);
      if (eMoved * energyDelta > 0) {
        energyDelta = energyDelta > 0 ? Math.max(0, energyDelta - eMoved) : Math.min(0, energyDelta - eMoved);
      }
      // Camelot: consume one step per hop while sweeping.
      if (camelotDelta !== 0) camelotDelta -= Math.sign(camelotDelta);
    }

    // BPM is the master dimension — once tempo has swept to target, the shift
    // is done even if energy metadata lagged behind.
    const settled = Math.abs(bpmDelta) < BPM_SETTLE
      || (Math.abs(bpmDelta) < BPM_SETTLE * 2 && Math.abs(energyDelta) < ENERGY_SETTLE);
    setState(settled
      ? { active: false, direction: 0, bpmDelta: 0, energyDelta: 0, camelotDelta: 0 }
      : { bpmDelta, energyDelta, camelotDelta });
  }

  function reset() {
    setState({ ...initialState(), lastAction: state.lastAction });
  }

  return {
    getState: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    shiftEnergy,
    applyPreset,
    onTrackPlayed,
    reset,
    /** Test helper — restore pristine state. */
    _resetForTests() {
      state = initialState();
      lastTrack = null;
      emit();
    },
  };
}

export const playerEnergyStore = createPlayerEnergyStore();
export { createPlayerEnergyStore };
