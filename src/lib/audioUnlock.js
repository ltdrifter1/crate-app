/**
 * iOS / Chrome autoplay unlock helpers.
 * The silent-WAV handshake must never pause or wipe a real cut that loaded
 * while the stub play() promise was still settling.
 */

export function isUnlockStubSrc(src) {
  const s = String(src || "").trim();
  return !s || s.startsWith("data:audio");
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
