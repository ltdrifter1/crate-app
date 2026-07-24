// ROOMS design tokens — warm underground editorial listening UI.
// Charcoal canvas, muted brass accent, fog atmosphere. Places, not dashboards.

export const fontDisplay =
  "'Syne', 'Avenir Next', 'Segoe UI', sans-serif";
export const font =
  "'DM Sans', 'Avenir Next', 'Segoe UI', sans-serif";
export const fontMono =
  "'IBM Plex Mono', 'SF Mono', 'Menlo', 'Monaco', monospace";

export const color = {
  ink: "#EDE8E1",
  body: "#B8B0A6",
  muted: "#817870",
  faint: "#5A544E",
  line: "rgba(237, 232, 225, 0.08)",
  lineStrong: "rgba(237, 232, 225, 0.14)",
  surface: "rgba(255, 248, 240, 0.04)",
  surfaceSolid: "#12100E",
  surfaceRaised: "#181512",
  canvas: "#0C0B0A",
  canvasEdge: "#100E0C",
  // Muted brass / warm tungsten — human, never neon
  accent: "#A8926A",
  accentSoft: "rgba(168, 146, 106, 0.16)",
  accentGlow: "rgba(168, 146, 106, 0.28)",
  onAccent: "#0C0B0A",
  onDark: "#EDE8E1",
  onDarkMuted: "rgba(237,232,225,0.55)",
  alert: "#E5484D",
  station: "#0E0C0A",
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 24 };

export const space = (n) => n * 4;

/** Quiet elevated panel — soft inset, no heavy glass. */
export const panel = {
  background: color.surfaceRaised,
  border: `1px solid ${color.line}`,
  boxShadow: "0 1px 0 rgba(255,248,240,0.03) inset",
};

export const panelQuiet = {
  background: color.surface,
  border: `1px solid ${color.line}`,
};

export const motion = {
  fast: "0.12s",
  base: "0.2s",
  settle: "0.35s",
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
};

/** Atmosphere that shifts with the hour — warm fog, not cool steel. */
export function timeOfDayGradient(date = new Date()) {
  const h = date.getHours();
  const late = h >= 22 || h <= 4;
  const dawn = h >= 5 && h <= 8;
  const day = h >= 9 && h <= 16;
  if (late) {
    return `radial-gradient(ellipse at 50% -10%, #1A1612 0%, #100E0C 42%, #0C0B0A 100%)`;
  }
  if (dawn) {
    return `radial-gradient(ellipse at 70% 0%, #1C1814 0%, #12100E 48%, #0C0B0A 100%)`;
  }
  if (day) {
    return `radial-gradient(ellipse at 40% -5%, #161410 0%, #0E0C0A 50%, #0C0B0A 100%)`;
  }
  return `radial-gradient(ellipse at 55% 0%, #1A1612 0%, #100E0C 45%, #0C0B0A 100%)`;
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
  border: `1px solid ${color.lineStrong}`,
  background: color.surfaceRaised,
  color: color.ink,
  fontSize: 15,
  fontFamily: font,
};

export const BTN_PRIMARY = {
  width: "100%",
  padding: "14px 20px",
  borderRadius: radius.md,
  border: "none",
  background: color.accent,
  color: color.onAccent,
  fontSize: 15,
  fontWeight: 650,
  cursor: "pointer",
  fontFamily: font,
};

export const BTN_SECONDARY = {
  width: "100%",
  padding: "14px 20px",
  borderRadius: radius.md,
  border: `1px solid ${color.lineStrong}`,
  background: color.surface,
  color: color.body,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: font,
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

/** Product brand — ROOMS. Legacy 4AM floor lives as a time Room. */
export const BRAND_NAME = "ROOMS";
export const BRAND_TAGLINE = "Music you inhabit";

/** Admin UID — keep in sync with firestore.rules until custom claims exist. */
export const ADMIN_UID = "5lPAI9N1jkMbVkUyIqLTqBvBf1t1";
