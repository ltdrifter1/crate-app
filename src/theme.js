// Design tokens — modern premium library UI.
// Early iTunes memory: aluminum chrome, blue selection, album-first.
// Cool platinum (not cream), no OLED black, no Spotify green.

export const fontDisplay =
  '"Outfit", "Avenir Next", "Segoe UI", "Helvetica Neue", Helvetica, sans-serif';
export const font =
  '"Source Sans 3", "Source Sans Pro", "Avenir Next", "Segoe UI", "Helvetica Neue", Helvetica, sans-serif';
export const fontMono =
  '"IBM Plex Mono", "SF Mono", ui-monospace, Menlo, Monaco, "Courier New", monospace';

/** Brand palette — platinum library + classic selection blue */
export const color = {
  ink: "#1A1D24",
  body: "#3D4450",
  muted: "#6B7380",
  faint: "#9AA1AB",
  line: "rgba(26, 29, 36, 0.1)",
  lineStrong: "rgba(26, 29, 36, 0.16)",
  surface: "rgba(255, 255, 255, 0.62)",
  surfaceSolid: "#FFFFFF",
  surfaceRaised: "#F2F4F7",
  canvas: "#E6E9EF",
  canvasEdge: "#D5DAE3",
  accent: "#0A7CFF",
  accentSoft: "rgba(10, 124, 255, 0.12)",
  accentGlow: "rgba(10, 124, 255, 0.22)",
  onAccent: "#FFFFFF",
  onDark: "#F4F6F9",
  onDarkMuted: "rgba(244,246,249,0.62)",
  alert: "#C45C3E",
  station: "#EEF1F5",
  /** Classic Mac list selection wash */
  select: "rgba(10, 124, 255, 0.16)",
  selectStrong: "rgba(10, 124, 255, 0.28)",
};

/** Frosted aluminum — light chrome, not dark glass. */
export const glass = {
  fill: "rgba(255, 255, 255, 0.55)",
  fillStrong: "rgba(255, 255, 255, 0.78)",
  fillQuiet: "rgba(255, 255, 255, 0.38)",
  border: "rgba(26, 29, 36, 0.12)",
  borderSoft: "rgba(26, 29, 36, 0.08)",
  borderFaint: "rgba(26, 29, 36, 0.05)",
  highlight: "rgba(255, 255, 255, 0.85)",
  blur: "blur(22px) saturate(1.2)",
  blurSoft: "blur(14px) saturate(1.1)",
  shadow: "0 10px 28px rgba(26, 29, 36, 0.1)",
  shadowSoft: "0 6px 18px rgba(26, 29, 36, 0.07)",
};

/** Soft jewel-case shadow for album art — Cover Flow memory. */
export const artShadow = {
  quiet: "0 2px 4px rgba(26,29,36,0.06), 0 10px 24px rgba(26,29,36,0.12)",
  raised: "0 4px 8px rgba(26,29,36,0.08), 0 18px 40px rgba(26,29,36,0.16)",
  active: `0 0 0 2px ${color.accent}, 0 8px 20px rgba(10,124,255,0.18), 0 18px 40px rgba(26,29,36,0.14)`,
};

/** Home rhythm — wider section breaks, consistent gutters. */
export const homeSpace = {
  gutter: 22,
  bandPadY: 40,
  sectionPadTop: 44,
  sectionPadBottom: 40,
  /** First shelf after a prior band/rule — keep tight; the break lives above. */
  sectionPadTopFirst: 8,
  shelfGap: 20,
  tile: 148,
};

/** Floating chrome dock — inset shell for mini-player + tabs. */
export const dock = {
  insetX: 14,
  insetBottom: 12,
  radius: 16,
  tabH: 54,
  playerH: 64,
  /** Content clearances (tabs only / with player), excluding safe-area. */
  clearTabs: 88,
  clearPlayer: 172,
};

export const radius = { sm: 8, md: 10, lg: 14, xl: 18 };

export const space = (n) => n * 4;

/** Quiet elevated panel — soft aluminum edge. */
export const panel = {
  background: glass.fillStrong,
  border: `1px solid ${glass.borderSoft}`,
  boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
};

export const panelQuiet = {
  background: glass.fillQuiet,
  border: `1px solid ${glass.borderFaint}`,
};

/** Interactive glass control — playlists, chips, sheets. */
export const glassControl = {
  background: glass.fillStrong,
  border: `1px solid ${glass.border}`,
  boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
  backdropFilter: glass.blur,
  WebkitBackdropFilter: glass.blur,
};

/** Soft aluminum section rule. */
export function sectionRule(inset = homeSpace.gutter) {
  return {
    height: 1,
    margin: `0 ${inset}px`,
    border: "none",
    background:
      "linear-gradient(90deg, transparent 0%, rgba(26,29,36,0.08) 18%, rgba(26,29,36,0.14) 50%, rgba(26,29,36,0.08) 82%, transparent 100%)",
  };
}

export const motion = {
  fast: "0.12s",
  base: "0.2s",
  settle: "0.35s",
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
};

/** Soft atmosphere that shifts with the hour — cool platinum, never OLED. */
export function timeOfDayGradient(date = new Date()) {
  const h = date.getHours();
  const late = h >= 22 || h <= 4;
  const dawn = h >= 5 && h <= 8;
  const day = h >= 9 && h <= 16;
  if (late) {
    return `radial-gradient(ellipse at 50% -10%, #DDE3EC 0%, #E4E8EF 42%, #E6E9EF 100%)`;
  }
  if (dawn) {
    return `radial-gradient(ellipse at 70% 0%, #E8E4DC 0%, #E6E9EF 48%, #E2E6ED 100%)`;
  }
  if (day) {
    return `radial-gradient(ellipse at 40% -5%, #F0F3F8 0%, #E6E9EF 50%, #E0E4EB 100%)`;
  }
  return `radial-gradient(ellipse at 55% 0%, #E4E8F0 0%, #E6E9EF 45%, #DDE2EA 100%)`;
}

/** Brushed aluminum wash for chrome bands / Cover Stage. */
export function aluminumGradient() {
  return `
    linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0) 42%),
    linear-gradient(135deg, #F4F6F9 0%, #E6E9EF 48%, #D8DDE6 100%)
  `;
}

export const APP_STYLE = {
  fontFamily: font,
  background: color.canvas,
  color: color.ink,
  minHeight: "100dvh",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  overflow: "hidden",
};

export const INPUT_ST = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: radius.md,
  border: `1px solid ${glass.border}`,
  background: color.surfaceSolid,
  color: color.ink,
  fontSize: 16,
  fontFamily: font,
  boxShadow: `inset 0 1px 0 ${glass.highlight}`,
};

export const BTN_PRIMARY = {
  width: "100%",
  padding: "13px 20px",
  borderRadius: radius.md,
  border: "none",
  background: color.accent,
  color: color.onAccent,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: font,
};

export const BTN_SECONDARY = {
  width: "100%",
  padding: "13px 20px",
  borderRadius: radius.md,
  border: `1px solid ${glass.border}`,
  background: glass.fillStrong,
  color: color.body,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: font,
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
};

export const CTRL_BTN = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/** Product brand — name + tagline from identity config. */
export {
  BRAND_NAME,
  BRAND_NAME_SHORT,
  BRAND_TAGLINE,
  activeBrandName,
  brandStoragePrefix,
} from "./brand/identity";

/** Admin UID — keep in sync with firestore.rules until custom claims exist. */
export const ADMIN_UID = "5lPAI9N1jkMbVkUyIqLTqBvBf1t1";
