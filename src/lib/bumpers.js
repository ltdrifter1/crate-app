/**
 * Station bumpers & idents — produced moments between cuts.
 */

export const STATION_IDENTS = [
  { id: "planet-id", kicker: "STATION ID", title: "PLANET MP3", subtitle: "Your world, your music.", tone: "id" },
  { id: "on-air", kicker: "IDENT", title: "STILL ON AIR", subtitle: "Don’t touch that dial.", tone: "id" },
  { id: "request-line", kicker: "STATION", title: "REQUEST LINE OPEN", subtitle: "Bump it. Dedicate it. Climb it.", tone: "promo" },
];

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
      accent: show.host?.accent || "#FF3B4E",
    };
  }

  if (sceneChannel && slot === 2) {
    return {
      id: `scene-${sceneChannel.id}`,
      kicker: "SCENE SURF",
      title: sceneChannel.title,
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
      accent: "#FFB020",
    };
  }

  if (nextTrack) {
    return {
      id: "up-next",
      kicker: "UP NEXT",
      title: nextTrack.title || "Next cut",
      subtitle: nextTrack.artist || "",
      tone: "upnext",
      accent: "#5C8CFF",
    };
  }

  return STATION_IDENTS[0];
}

export const BUMPER_DURATION_MS = 2400;
