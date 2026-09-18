/**
 * Station bumpers & idents — sparse produced moments between cuts.
 * Most track changes should pass silently; the player already has Up Next chrome.
 */

export const STATION_IDENTS = [
  { id: "planet-id", kicker: "STATION ID", title: "PLANET MP3", subtitle: "Your world, your music.", tone: "id" },
  { id: "on-air", kicker: "IDENT", title: "STILL ON AIR", subtitle: "Don’t touch that dial.", tone: "id" },
  { id: "request-line", kicker: "STATION", title: "REQUEST LINE OPEN", subtitle: "Bump it. Dedicate it. Climb it.", tone: "promo" },
];

/** Full-screen interstitial length. */
export const BUMPER_DURATION_MS = 2400;

/** Minimum gap between full-screen bumpers so skips don't restage the same plate. */
export const BUMPER_COOLDOWN_MS = 10 * 60 * 1000;

export function shouldFireTrackBumper({
  lastFiredAt = 0,
  now = Date.now(),
  cooldownMs = BUMPER_COOLDOWN_MS,
} = {}) {
  if (!lastFiredAt) return true;
  return now - Number(lastFiredAt) >= cooldownMs;
}

/**
 * Pick a rare ident / show sting, or null to keep the cut uninterrupted.
 * Clock slots rotate the *kind* of sting; they used to fall through to a
 * full-screen UP NEXT on every other minute, which fired on every song change.
 */
export function pickTrackBumper({
  show = null,
  nextTrack = null,
  countdownTop = null,
  sceneChannel = null,
  date = new Date(),
} = {}) {
  const minute = date.getMinutes();
  const slot = minute % 5;

  if (slot === 0) {
    return STATION_IDENTS[minute % STATION_IDENTS.length];
  }

  if (show?.bumpers?.length && slot === 1) {
    const line = show.bumpers[Math.floor(minute / 5) % show.bumpers.length];
    return {
      id: `show-${show.id}`,
      kicker: show.shortTitle || show.title,
      title: line,
      subtitle: show.host?.name ? `with ${show.host.name}` : "Live block",
      tone: "show",
      accent: show.host?.accent || "#8B939F",
    };
  }

  if (sceneChannel && slot === 2) {
    const ch = sceneChannel.num != null
      ? `CH-${String(sceneChannel.num).padStart(2, "0")}`
      : "CHANNEL";
    return {
      id: `scene-${sceneChannel.id}`,
      kicker: ch,
      title: sceneChannel.dialSlug || sceneChannel.shortTitle || sceneChannel.title,
      subtitle: sceneChannel.tagline,
      tone: "scene",
      accent: sceneChannel.accent,
    };
  }

  if (countdownTop?.track && slot === 3) {
    return {
      id: "chart-sting",
      kicker: "CHART STING",
      title: `#1 — ${countdownTop.track.title}`,
      subtitle: countdownTop.track.artist,
      tone: "chart",
      accent: "#A8B2C0",
    };
  }

  // nextTrack is used by the player dock — do not restage it as a modal.
  void nextTrack;
  return null;
}
