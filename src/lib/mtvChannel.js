/**
 * Late-90s MTV / MuchMusic channel grammar —
 * callsigns, CH-bugs, daypart plates.
 */

export const STATION_CALLSIGN = "PMP3";

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

function relLuminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
  if (!m) return null;
  const c = [0, 2, 4]
    .map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** WCAG contrast ratio between two #rrggbb colours (1–21). null if either is not a hex colour. */
export function contrastRatio(a, b) {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  if (la == null || lb == null) return null;
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const INK_LIGHT = "#F4F7FB";
const INK_DARK = "#0C0F13";

/**
 * Label colour for text printed on a station ink: pearl or near-black, whichever reads better.
 * White on House gold is 2.3:1; near-black on it is 7.9:1. A fixed white label fails 11 of 14 inks.
 */
export function onInk(ink) {
  const light = contrastRatio(INK_LIGHT, ink);
  const dark = contrastRatio(INK_DARK, ink);
  if (light == null || dark == null) return INK_LIGHT;
  return dark > light ? INK_DARK : INK_LIGHT;
}
