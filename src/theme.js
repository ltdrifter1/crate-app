// Design tokens — a warm, light music-library surface.
// Inspired by the clarity of early iTunes and the restraint of modern macOS. No chromatic accent.

export const fontDisplay =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
export const font =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif';
export const fontMono =
  '"SF Mono", ui-monospace, Menlo, Monaco, "Courier New", monospace';

/** Brand palette — OLED black + cool ice (digital premium) */
export const color = {
  ink: "#1D1D1F",
  body: "#4A4945",
  muted: "#76736D",
  faint: "#A39D95",
  line: "rgba(36, 33, 29, 0.12)",
  lineStrong: "rgba(36, 33, 29, 0.2)",
  surface: "rgba(255, 255, 255, 0.72)",
  surfaceSolid: "#FFFFFF",
  surfaceRaised: "#FFFEFC",
  canvas: "#F4F2ED",
  canvasEdge: "#ECE9E3",
  accent: "#3D607D",
  accentSoft: "rgba(61, 96, 125, 0.1)",
  accentGlow: "rgba(61, 96, 125, 0.18)",
  onAccent: "#FFFFFF",
  onDark: "#FFFFFF",
  onDarkMuted: "rgba(255,255,255,0.72)",
  alert: "#8A5A43",
  station: "#F9F7F3",
};

/** Subtle glass — cool digital edge. */
export const glass = {
  fill: "rgba(255, 255, 255, 0.76)",
  fillStrong: "rgba(255, 255, 255, 0.92)",
  fillQuiet: "rgba(255, 255, 255, 0.5)",
  border: "rgba(36, 33, 29, 0.14)",
  borderSoft: "rgba(36, 33, 29, 0.1)",
  borderFaint: "rgba(36, 33, 29, 0.065)",
  highlight: "rgba(255, 255, 255, 0.9)",
  blur: "blur(24px) saturate(1.08)",
  blurSoft: "blur(16px) saturate(1.04)",
  shadow: "0 18px 50px rgba(54, 45, 34, 0.12)",
  shadowSoft: "0 8px 24px rgba(54, 45, 34, 0.09)",
};

/** Home rhythm — wider section breaks, consistent gutters. */
export const homeSpace = {
  gutter: 22,
  bandPadY: 48,
  sectionPadTop: 60,
  sectionPadBottom: 56,
  /** First shelf after a prior band/rule — keep tight; the break lives above. */
  sectionPadTopFirst: 8,
  shelfGap: 18,
  tile: 152,
};

/** Floating glass dock — inset shell for mini-player + tabs. */
export const dock = {
  insetX: 12,
  insetBottom: 10,
  radius: 22,
  tabH: 54,
  playerH: 62,
  /** Content clearances (tabs only / with player), excluding safe-area. */
  clearTabs: 88,
  clearPlayer: 168,
};

export const radius = { sm: 10, md: 12, lg: 16, xl: 22 };

export const space = (n) => n * 4;

/** Quiet elevated panel — soft glass edge. */
export const panel = {
  background: glass.fillStrong,
  border: `1px solid ${glass.borderSoft}`,
  boxShadow: `inset 0 1px 0 ${glass.highlight}`,
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
};

export const panelQuiet = {
  background: glass.fillQuiet,
  border: `1px solid ${glass.borderFaint}`,
};

/** Interactive glass control — Make a playlist, chips, sheets. */
export const glassControl = {
  background: glass.fillStrong,
  border: `1px solid ${glass.border}`,
  boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
  backdropFilter: glass.blur,
  WebkitBackdropFilter: glass.blur,
};

/** Faded rule that dissolves at the edges — premium section break. */
export function sectionRule(inset = homeSpace.gutter) {
  return {
    height: 1,
    margin: `0 ${inset}px`,
    border: "none",
    background:
      "linear-gradient(90deg, transparent 0%, rgba(36,33,29,0.08) 18%, rgba(36,33,29,0.16) 50%, rgba(36,33,29,0.08) 82%, transparent 100%)",
  };
}

export const motion = {
  fast: "0.12s",
  base: "0.2s",
  settle: "0.35s",
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
};

/** Soft atmosphere that shifts with the hour — subtle, never busy. */
export function timeOfDayGradient(date = new Date()) {
  const h = date.getHours();
  const dawn = h >= 5 && h <= 8;
  const day = h >= 9 && h <= 16;
  if (dawn) return "radial-gradient(ellipse at 72% -8%, #FFF8EB 0%, #F6F1E8 46%, #ECE9E3 100%)";
  if (day) return "radial-gradient(ellipse at 35% -10%, #FFFFFF 0%, #F6F3ED 48%, #ECE9E3 100%)";
  return "radial-gradient(ellipse at 58% -8%, #FBF8F2 0%, #F2EFE8 52%, #E9E5DD 100%)";
}

export const APP_STYLE = {
  fontFamily: font,
  background: color.canvas,
  color: color.ink,
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  overflow: "hidden",
};

export const INPUT_ST = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: radius.md,
  border: `1px solid ${glass.border}`,
  background: glass.fillStrong,
  color: color.ink,
  fontSize: 17,
  fontFamily: font,
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
  boxShadow: `inset 0 1px 0 ${glass.highlight}`,
};

export const BTN_PRIMARY = {
  width: "100%",
  padding: "14px 20px",
  borderRadius: radius.md,
  border: "none",
  background: color.accent,
  color: color.onAccent,
  fontSize: 17,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: font,
};

export const BTN_SECONDARY = {
  width: "100%",
  padding: "14px 20px",
  borderRadius: radius.md,
  border: `1px solid ${glass.border}`,
  background: glass.fill,
  color: color.body,
  fontSize: 17,
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
