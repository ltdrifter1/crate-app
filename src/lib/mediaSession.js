/**
 * Navigator Media Session — lock screen / headset / Bluetooth transport.
 * Best-effort: missing API or artwork errors are ignored.
 */

export function artworkForTrack(track) {
  const src = String(track?.albumCover || "").trim();
  if (!src) return [];
  return [
    { src, sizes: "96x96", type: "image/jpeg" },
    { src, sizes: "256x256", type: "image/jpeg" },
    { src, sizes: "512x512", type: "image/jpeg" },
  ];
}

export function mediaMetadataForTrack(track) {
  if (!track) return null;
  const MediaMetadataCtor =
    typeof window !== "undefined" ? window.MediaMetadata : undefined;
  if (typeof MediaMetadataCtor !== "function") {
    return {
      title: String(track.title || "Planet MP3"),
      artist: String(track.artist || ""),
      album: String(track.album || "Planet MP3"),
      artwork: artworkForTrack(track),
    };
  }
  try {
    return new MediaMetadataCtor({
      title: String(track.title || "Planet MP3"),
      artist: String(track.artist || ""),
      album: String(track.album || "Planet MP3"),
      artwork: artworkForTrack(track),
    });
  } catch {
    return null;
  }
}

export function getMediaSession(win = typeof window !== "undefined" ? window : null) {
  return win?.navigator?.mediaSession || null;
}

export function syncMediaSession(track, { playing = false } = {}) {
  const session = getMediaSession();
  if (!session) return false;
  try {
    session.metadata = track ? mediaMetadataForTrack(track) : null;
  } catch {
    /* ignore */
  }
  try {
    if (typeof session.playbackState === "string" || session.playbackState === "") {
      session.playbackState = !track ? "none" : playing ? "playing" : "paused";
    }
  } catch {
    /* ignore */
  }
  return true;
}

export function syncMediaPosition(
  { duration = 0, position = 0, playbackRate = 1 } = {},
  win = typeof window !== "undefined" ? window : null
) {
  const session = getMediaSession(win);
  if (!session || typeof session.setPositionState !== "function") return false;
  const dur = Number(duration) || 0;
  if (!Number.isFinite(dur) || dur <= 0) return false;
  const pos = Math.max(0, Math.min(dur, Number(position) || 0));
  const rate = Number.isFinite(Number(playbackRate)) && Number(playbackRate) > 0
    ? Number(playbackRate)
    : 1;
  try {
    session.setPositionState({ duration: dur, position: pos, playbackRate: rate });
    return true;
  } catch {
    return false;
  }
}

const ACTION_MAP = {
  play: "play",
  pause: "pause",
  previoustrack: "prev",
  nexttrack: "next",
  seekto: "seek",
};

/**
 * Bind lock-screen / headset handlers. Returns an unbind function.
 * `handlers`: { play, pause, next, prev, seek(seconds) }
 */
export function bindMediaSessionHandlers(handlers = {}, win = typeof window !== "undefined" ? window : null) {
  const session = getMediaSession(win);
  if (!session || typeof session.setActionHandler !== "function") {
    return () => {};
  }
  const bound = [];
  Object.keys(ACTION_MAP).forEach((action) => {
    const key = ACTION_MAP[action];
    const fn = handlers[key];
    if (typeof fn !== "function") return;
    try {
      const wrapped =
        action === "seekto"
          ? (details) => {
              const t = details?.seekTime;
              if (Number.isFinite(t)) fn(t);
            }
          : () => fn();
      session.setActionHandler(action, wrapped);
      bound.push(action);
    } catch {
      /* some browsers reject seekto */
    }
  });
  return () => {
    bound.forEach((action) => {
      try {
        session.setActionHandler(action, null);
      } catch {
        /* ignore */
      }
    });
  };
}
