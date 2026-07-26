// Design tokens — clean neutral listening UI.
// Black canvas, bone accent, quiet glass. No chromatic accent.

export const fontDisplay =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
export const font =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif';
export const fontMono =
  '"SF Mono", ui-monospace, Menlo, Monaco, "Courier New", monospace';

/** Brand palette — OLED black + cool ice (digital premium) */
export const color = {
  ink: "#F2F3F5",
  body: "#B4B8C0",
  muted: "#8A8F98",
  faint: "#565A62",
  line: "rgba(255, 255, 255, 0.08)",
  lineStrong: "rgba(255, 255, 255, 0.16)",
  surface: "rgba(255, 255, 255, 0.04)",
  surfaceSolid: "#0D0D0F",
  surfaceRaised: "#16161A",
  canvas: "#000000",
  canvasEdge: "#050506",
  accent: "#F2F3F5",
  accentSoft: "rgba(242, 243, 245, 0.12)",
  accentGlow: "rgba(242, 243, 245, 0.2)",
  onAccent: "#000000",
  onDark: "#F2F3F5",
  onDarkMuted: "rgba(242,243,245,0.58)",
  alert: "#B8BCC4",
  station: "#0A0A0C",
};

/** Subtle glass — cool digital edge. */
export const glass = {
  fill: "rgba(255, 255, 255, 0.05)",
  fillStrong: "rgba(255, 255, 255, 0.085)",
  fillQuiet: "rgba(255, 255, 255, 0.03)",
  border: "rgba(255, 255, 255, 0.14)",
  borderSoft: "rgba(255, 255, 255, 0.09)",
  borderFaint: "rgba(255, 255, 255, 0.05)",
  highlight: "rgba(255, 255, 255, 0.22)",
  blur: "blur(24px) saturate(1.15)",
  blurSoft: "blur(16px) saturate(1.1)",
  shadow: "0 12px 40px rgba(0, 0, 0, 0.32)",
  shadowSoft: "0 8px 28px rgba(0, 0, 0, 0.24)",
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
      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 18%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.1) 82%, transparent 100%)",
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
  const late = h >= 22 || h <= 4;
  const dawn = h >= 5 && h <= 8;
  const day = h >= 9 && h <= 16;
  if (late) {
    return `radial-gradient(ellipse at 50% -10%, #161614 0%, #0A0A0A 42%, #000000 100%)`;
  }
  if (dawn) {
    return `radial-gradient(ellipse at 70% 0%, #1A1916 0%, #100F0C 48%, #000000 100%)`;
  }
  if (day) {
    return `radial-gradient(ellipse at 40% -5%, #181714 0%, #0C0C0A 50%, #000000 100%)`;
  }
  return `radial-gradient(ellipse at 55% 0%, #161614 0%, #0A0A0A 45%, #000000 100%)`;
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
