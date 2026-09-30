/**
 * Music video helpers — Station TV mode.
 * Audio element stays source of truth; video is a synced, muted visual plane.
 */

export function trackHasVideo(track) {
  return !!(track && String(track.videoUrl || "").trim());
}

export function resolveVideoUrl(track) {
  const url = String(track?.videoUrl || "").trim();
  return url || null;
}

/** Keep video clock near audio progress without fighting the decoder every frame. */
export function syncVideoToProgress(videoEl, progressSec, { playing = false, tolerance = 0.45 } = {}) {
  if (!videoEl || !Number.isFinite(progressSec)) return;
  try {
    const drift = Math.abs((videoEl.currentTime || 0) - progressSec);
    if (drift > tolerance) {
      videoEl.currentTime = Math.max(0, progressSec);
    }
    if (playing && videoEl.paused) {
      const p = videoEl.play();
      if (p?.catch) p.catch(() => {});
    }
    if (!playing && !videoEl.paused) {
      videoEl.pause();
    }
  } catch {
    /* ignore seek/play races */
  }
}
