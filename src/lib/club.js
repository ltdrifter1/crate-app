// Club / floor helpers — pure (except optional Web Audio arrival cue).

/** Night-of phases for the radio floor. */
export function getFloorPhase(hour = new Date().getHours()) {
  if (hour >= 21 || hour <= 1) {
    return { id: "peak", label: "PEAK", blurb: "Hands up. The room is open." };
  }
  if (hour >= 2 && hour <= 5) {
    return { id: "afterhours", label: "AFTERHOURS", blurb: "Lights down. Keep it moving." };
  }
  if (hour >= 6 && hour <= 9) {
    return { id: "closing", label: "CLOSING", blurb: "Last dances. Soft exit." };
  }
  if (hour >= 17 && hour <= 20) {
    return { id: "warmup", label: "WARMUP", blurb: "Doors cracked. Build the floor." };
  }
  return { id: "floor", label: "FLOOR OPEN", blurb: "The hour shapes the set." };
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

const ARRIVAL_KEY = "crate-arrival-sound";

export function getArrivalSoundEnabled() {
  try {
    return localStorage.getItem(ARRIVAL_KEY) === "1";
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

// ── Place tone — quiet continuous bed between spaces ─────────────────────────

const TONE_PROFILES = {
  dawn: { freq: 90, filter: 280, gain: 0.018 },
  day: { freq: 70, filter: 220, gain: 0.012 },
  dusk: { freq: 85, filter: 260, gain: 0.016 },
  night: { freq: 55, filter: 180, gain: 0.014 },
  floor: { freq: 65, filter: 240, gain: 0.015 },
  room: { freq: 75, filter: 200, gain: 0.013 },
  booth: { freq: 50, filter: 160, gain: 0.01 },
};

let toneCtx = null;
let toneNodes = null; // { noise, filter, gain, osc, oscGain }
let toneProfile = "night";
let toneDucked = false;

function ensureToneCtx() {
  if (toneCtx) return toneCtx;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    toneCtx = new Ctx();
    return toneCtx;
  } catch {
    return null;
  }
}

function buildNoiseBuffer(ctx, seconds = 2) {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.4;
  }
  return buffer;
}

/**
 * Start or morph the quiet place-tone bed.
 * Respects doors preference — no tone when muted.
 */
export function setPlaceTone(profileId = "night", { force = false } = {}) {
  if (!getArrivalSoundEnabled() && !force) {
    stopPlaceTone();
    return;
  }
  const profile = TONE_PROFILES[profileId] || TONE_PROFILES.night;
  toneProfile = profileId;
  const ctx = ensureToneCtx();
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") ctx.resume();
  } catch {
    /* ignore */
  }

  const targetGain = toneDucked ? profile.gain * 0.15 : profile.gain;
  const now = ctx.currentTime;

  if (!toneNodes) {
    const noise = ctx.createBufferSource();
    noise.buffer = buildNoiseBuffer(ctx, 2.5);
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = profile.filter;
    filter.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, targetGain), now + 1.2);

    // Soft sub hum
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = profile.freq;
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.exponentialRampToValueAtTime(Math.max(0.0002, targetGain * 0.45), now + 1.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    noise.start();
    osc.start();
    toneNodes = { noise, filter, gain, osc, oscGain };
    return;
  }

  // Morph existing
  try {
    toneNodes.filter.frequency.exponentialRampToValueAtTime(
      Math.max(80, profile.filter),
      now + 1.6
    );
    toneNodes.osc.frequency.exponentialRampToValueAtTime(Math.max(30, profile.freq), now + 1.6);
    toneNodes.gain.gain.cancelScheduledValues(now);
    toneNodes.gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, targetGain), now + 1.2);
    toneNodes.oscGain.gain.cancelScheduledValues(now);
    toneNodes.oscGain.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, targetGain * 0.45),
      now + 1.4
    );
  } catch {
    /* ignore */
  }
}

/** Duck place tone under music playback. */
export function setPlaceToneDucked(ducked) {
  toneDucked = !!ducked;
  if (!toneNodes || !toneCtx) return;
  const profile = TONE_PROFILES[toneProfile] || TONE_PROFILES.night;
  const target = toneDucked ? profile.gain * 0.15 : profile.gain;
  const now = toneCtx.currentTime;
  try {
    toneNodes.gain.gain.cancelScheduledValues(now);
    toneNodes.gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, target), now + 0.6);
    toneNodes.oscGain.gain.cancelScheduledValues(now);
    toneNodes.oscGain.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, target * 0.45),
      now + 0.6
    );
  } catch {
    /* ignore */
  }
}

export function stopPlaceTone() {
  if (!toneNodes) return;
  const nodes = toneNodes;
  toneNodes = null;
  try {
    const now = toneCtx?.currentTime || 0;
    nodes.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    nodes.oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    setTimeout(() => {
      try {
        nodes.noise.stop();
        nodes.osc.stop();
      } catch {
        /* ignore */
      }
    }, 600);
  } catch {
    /* ignore */
  }
}

/**
 * Soft place-to-place transition (quieter than doors).
 * No-op when doors preference is off.
 */
export function playPlaceTransition() {
  if (!getArrivalSoundEnabled()) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const noiseLen = 0.22;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * noiseLen), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * (1 - t) * 0.35;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(360, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + noiseLen);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + noiseLen);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + noiseLen);
    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        /* ignore */
      }
    }, 400);
    hapticTap(8);
  } catch {
    /* ignore */
  }
}
