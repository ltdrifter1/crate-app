/**
 * iOS / Chrome autoplay unlock helpers.
 * The silent-WAV handshake must never pause or wipe a real cut that loaded
 * while the stub play() promise was still settling.
 */

export const PLAY_REJECTED_TOAST = "Playback blocked. Tap play again.";
export const MISSING_AUDIO_TOAST = "This cut has no audio yet.";
export const AUDIO_LOAD_TIMEOUT_MS = 6000;

export function isUnlockStubSrc(src) {
  const s = String(src || "").trim();
  return !s || s.startsWith("data:audio");
}

export function hasPlayableAudio(track) {
  return Boolean(String(track?.audioUrl || "").trim());
}

/** Autoplay policy / navigation interrupts — not a real failure. */
export function isBenignPlayReject(err) {
  const msg = `${err?.name || ""} ${err?.message || err || ""}`;
  return /interrupted|AbortError/i.test(msg);
}

/** Handshake pause/play must not flip the transport UI. */
export function shouldIgnoreUnlockTransportEvent({ unlocking = false, src = "" } = {}) {
  return !!unlocking || isUnlockStubSrc(src);
}

export function canAttemptPlay(el) {
  if (!el) return false;
  const src = el.getAttribute?.("src") || el.src || "";
  return !isUnlockStubSrc(src);
}

/**
 * Finish the muted stub play used to unlock A/B elements.
 * If a real audioUrl took over during unlock, leave that element alone.
 */
export function finishAudioUnlock(el, { wasMuted = false } = {}) {
  if (!el) return { tookOver: false };
  const now = el.getAttribute?.("src") || el.src || "";
  if (!isUnlockStubSrc(now)) {
    try { el.muted = wasMuted; } catch { /* ignore */ }
    return { tookOver: true };
  }
  try {
    el.pause();
    el.currentTime = 0;
  } catch { /* ignore */ }
  try { el.muted = wasMuted; } catch { /* ignore */ }
  try {
    el.removeAttribute("src");
    el.src = "";
    el.load();
  } catch { /* ignore */ }
  return { tookOver: false };
}
