// Club / floor helpers — pure (except optional Web Audio arrival cue).

/** Time-of-day mood for the radio hero. */
export function getFloorPhase(hour = new Date().getHours()) {
  if (hour >= 21 || hour <= 1) {
    return { id: "peak", label: "Tonight", blurb: "High energy for the night." };
  }
  if (hour >= 2 && hour <= 5) {
    return { id: "afterhours", label: "Late night", blurb: "Keep it going — slower and deeper." };
  }
  if (hour >= 6 && hour <= 9) {
    return { id: "closing", label: "Morning", blurb: "Ease into the day." };
  }
  if (hour >= 17 && hour <= 20) {
    return { id: "warmup", label: "Evening", blurb: "Warming up for the night." };
  }
  return { id: "floor", label: "Daytime", blurb: "Music for right now." };
}

/** Tonight's rooms — Discover dig model (energy-first, not genre-first). */
export const CLUB_ROOMS = [
  {
    id: "warmup",
    label: "Warmup",
    desc: "Ease the room in",
    filter: (t) => {
      const e = t.energy || 5;
      return e >= 3 && e <= 5;
    },
  },
  {
    id: "peak",
    label: "Peak",
    desc: "Floor pressure",
    filter: (t) => {
      const e = t.energy || 5;
      return e >= 7 && e <= 10;
    },
  },
  {
    id: "dark",
    label: "Dark Room",
    desc: "Low light, locked groove",
    filter: (t) => {
      const e = t.energy || 5;
      const g = (t.genre || "").toLowerCase();
      return e >= 4 && e <= 7 && (g.includes("house") || g.includes("drum") || g.includes("hip"));
    },
  },
  {
    id: "afterhours",
    label: "Afterhours",
    desc: "Deep & unhurried",
    filter: (t) => {
      const e = t.energy || 5;
      return e >= 2 && e <= 4;
    },
  },
  {
    id: "closing",
    label: "Closing",
    desc: "Soft landing",
    filter: (t) => {
      const e = t.energy || 5;
      return e <= 3;
    },
  },
];

export function roomForFloorPhase(phaseId) {
  const map = {
    peak: "Peak",
    afterhours: "Afterhours",
    closing: "Closing",
    warmup: "Warmup",
    floor: "Warmup",
  };
  return map[phaseId] || "Warmup";
}

const ARRIVAL_KEY = "rooms-arrival-sound";
const ARRIVAL_KEY_LEGACY = "crate-arrival-sound";

export function getArrivalSoundEnabled() {
  try {
    const next = localStorage.getItem(ARRIVAL_KEY);
    if (next === "1" || next === "0") return next === "1";
    return localStorage.getItem(ARRIVAL_KEY_LEGACY) === "1";
  } catch {
    return false;
  }
}

export function setArrivalSoundEnabled(on) {
  try {
    localStorage.setItem(ARRIVAL_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** Soft door whoosh + click. No-op if muted / unsupported. */
export function playArrivalSound() {
  if (!getArrivalSoundEnabled()) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;

    // Low whoosh
    const noiseLen = 0.35;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * noiseLen), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * (1 - t) * 0.55;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(420, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + noiseLen);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + noiseLen);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + noiseLen);

    // Soft click
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);
    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.0001, now + 0.08);
    clickGain.gain.exponentialRampToValueAtTime(0.08, now + 0.1);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(clickGain);
    clickGain.connect(ctx.destination);
    osc.start(now + 0.08);
    osc.stop(now + 0.24);

    setTimeout(() => {
      try { ctx.close(); } catch { /* ignore */ }
    }, 500);
  } catch {
    /* ignore */
  }
}

/** Light tap — optional, silent if unsupported. */
export function hapticTap(ms = 12) {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ms);
  } catch {
    /* ignore */
  }
}

/** Enter a Room — doors sound + soft haptic. */
export function enterRoomCue() {
  playArrivalSound();
  hapticTap(12);
}
