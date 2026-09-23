/**
 * Dual-element playback deck — A/B HTMLAudioElement, preload, equal-power fade.
 * No React. App owns pick-next / queue / toasts and calls into this module.
 */
import {
  canAttemptPlay,
  finishAudioUnlock,
  isUnlockStubSrc,
} from "./audioUnlock";

export const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

export const RADIO_CROSSFADE_SECS = 15;
export const QUEUE_CROSSFADE_SECS = 6;
/** Kick preload this many seconds before the blend window. */
export const PRELOAD_LEAD_SECS = 20;
/** HAVE_CURRENT_DATA — enough to start without a cold fetch. */
export const READY_TO_PLAY = 2;
/** HAVE_FUTURE_DATA — warm enough to fade without a hole. */
export const READY_TO_FADE = 3;

export function configureAudioElement(el) {
  if (!el) return el;
  try {
    el.playsInline = true;
    el.setAttribute("playsinline", "true");
    el.setAttribute("webkit-playsinline", "true");
    el.preload = "auto";
  } catch {
    /* ignore */
  }
  return el;
}

/** Equal-power fade gains. t is 0..1. */
export function equalPowerVolumes(t, targetVol = 1) {
  const x = Math.max(0, Math.min(1, Number(t) || 0));
  const vol = Math.max(0, Math.min(1, Number(targetVol) || 0));
  return {
    out: vol * Math.cos((x * Math.PI) / 2),
    in: vol * Math.sin((x * Math.PI) / 2),
  };
}

export function elementSrc(el) {
  if (!el) return "";
  return String(el.getAttribute?.("src") || el.src || "").trim();
}

export function isWarmForUrl(el, url, minReady = READY_TO_PLAY) {
  if (!el || !url) return false;
  if (elementSrc(el) !== String(url).trim()) return false;
  return (el.readyState || 0) >= minReady;
}

/**
 * Point an element at `url` without clobbering a matching src (keeps buffer).
 * Returns true when a load() was issued.
 */
export function preloadSrc(el, url) {
  if (!el) return false;
  const next = String(url || "").trim();
  if (!next || isUnlockStubSrc(next)) return false;
  const current = elementSrc(el);
  if (current === next) return false;
  try {
    el.pause();
  } catch {
    /* ignore */
  }
  el.volume = 0;
  el.src = next;
  try {
    el.load();
  } catch {
    /* ignore */
  }
  return true;
}

export function unlockAudioPair(els, { silentWav = SILENT_WAV } = {}) {
  const list = (els || []).filter(Boolean);
  let pending = list.length;
  const markDone = () => {
    pending -= 1;
  };
  if (!pending) return { unlocking: false };
  list.forEach((el) => {
    try {
      configureAudioElement(el);
      const existing = elementSrc(el);
      if (!existing) el.src = silentWav;
      const wasMuted = el.muted;
      el.muted = true;
      const p = el.play();
      const finish = () => {
        finishAudioUnlock(el, { wasMuted });
        markDone();
      };
      if (p && typeof p.then === "function") {
        p.then(finish).catch(finish);
      } else {
        finish();
      }
    } catch {
      markDone();
    }
  });
  return { unlocking: pending > 0 };
}

/**
 * Swap primary/standby after a fade (or an instant skip into a warm standby).
 * `pair` is `{ primary, standby }` refs-as-object.
 */
export function swapDeck(pair) {
  if (!pair) return pair;
  const prevPrimary = pair.primary;
  pair.primary = pair.standby;
  pair.standby = prevPrimary;
  return pair;
}

export function remainingSeconds(el) {
  if (!el || !el.duration || !Number.isFinite(el.duration)) return Infinity;
  return el.duration - (el.currentTime || 0);
}

export function shouldStartPreload(el, fadeSecs, leadSecs = PRELOAD_LEAD_SECS) {
  const left = remainingSeconds(el);
  const fade = Math.max(0, Number(fadeSecs) || 0);
  const lead = Math.max(0, Number(leadSecs) || 0);
  return left <= fade + lead && left > fade;
}

export function shouldStartFade(el, fadeSecs) {
  const left = remainingSeconds(el);
  const fade = Math.max(0, Number(fadeSecs) || 0);
  return left <= fade && left > 0;
}

export function fadeSecondsForMode(isRadio) {
  return isRadio ? RADIO_CROSSFADE_SECS : QUEUE_CROSSFADE_SECS;
}

/**
 * Instant skip is legal when standby already holds `url` at HAVE_CURRENT_DATA.
 */
export function canInstantPromote(standby, url) {
  return isWarmForUrl(standby, url, READY_TO_PLAY);
}

export function createAudioPair() {
  const a = typeof Audio === "function" ? new Audio() : null;
  const b = typeof Audio === "function" ? new Audio() : null;
  configureAudioElement(a);
  configureAudioElement(b);
  if (a) a.volume = 1;
  if (b) b.volume = 0;
  return { primary: a, standby: b };
}
