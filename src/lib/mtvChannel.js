/**
 * Late-90s MTV / MuchMusic channel grammar —
 * callsigns, CH-bugs, daypart plates.
 */

export const STATION_CALLSIGN = "PMP3";
export const STATION_FREQ = "98.3";

/** Main live feed when not locked to a scene channel. */
export const MAIN_CHANNEL = {
  id: "planet-live",
  num: 1,
  slug: "LIVE",
  shortTitle: "Planet Live",
  title: "Planet MP3 Live",
  accent: "#8B939F",
};

/** Zero-padded dial label — CH-03 */
export function formatChannelNum(num) {
  const n = Number(num);
  if (!Number.isFinite(n) || n < 0) return "CH-01";
  return `CH-${String(Math.floor(n)).padStart(2, "0")}`;
}

/**
 * Resolve the on-screen channel bug from scene lock or main feed.
 * @param {{ sceneChannel?: object|null, show?: object|null }} opts
 */
export function resolveChannelBug({ sceneChannel = null, show = null } = {}) {
  if (sceneChannel?.num != null || sceneChannel?.id) {
    const num = sceneChannel.num ?? MAIN_CHANNEL.num;
    const slug = (sceneChannel.dialSlug || sceneChannel.shortTitle || sceneChannel.title || sceneChannel.slug || "SCENE")
      .replace(/&/g, "")
      .trim()
      .toUpperCase()
      .slice(0, 14);
    return {
      id: sceneChannel.id || "scene",
      num,
      ch: formatChannelNum(num),
      slug,
      label: sceneChannel.shortTitle || sceneChannel.title || slug,
      accent: sceneChannel.accent || MAIN_CHANNEL.accent,
      callsign: STATION_CALLSIGN,
    };
  }

  if (show) {
    const num = show.channelNum ?? MAIN_CHANNEL.num;
    const slug = (show.shortTitle || show.title || "SHOW")
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, "")
      .trim()
      .slice(0, 14);
    return {
      id: show.id || "show",
      num,
      ch: formatChannelNum(num),
      slug,
      label: show.shortTitle || show.title || slug,
      accent: show.host?.accent || MAIN_CHANNEL.accent,
      callsign: STATION_CALLSIGN,
    };
  }

  return {
    id: MAIN_CHANNEL.id,
    num: MAIN_CHANNEL.num,
    ch: formatChannelNum(MAIN_CHANNEL.num),
    slug: MAIN_CHANNEL.slug,
    label: MAIN_CHANNEL.shortTitle,
    accent: MAIN_CHANNEL.accent,
    callsign: STATION_CALLSIGN,
  };
}

/** Compact top-right bug copy: CH-03 · RAP CITY */
export function channelBugLine(bug) {
  if (!bug) return `${formatChannelNum(MAIN_CHANNEL.num)} · ${MAIN_CHANNEL.slug}`;
  return `${bug.ch} · ${bug.slug}`;
}
