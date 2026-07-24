// Design tokens — premium minimal listening UI.
// Apple Music / iTunes iOS typography (SF Pro system stack). Quiet surfaces, one accent.

export const fontDisplay =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
export const font =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif';
export const fontMono =
  '"SF Mono", ui-monospace, Menlo, Monaco, "Courier New", monospace';

export const color = {
  ink: "#F5F5F7",
  body: "#A1A1A6",
  muted: "#8E8E93",
  faint: "#636366",
  line: "rgba(255, 255, 255, 0.08)",
  lineStrong: "rgba(255, 255, 255, 0.14)",
  surface: "rgba(255, 255, 255, 0.04)",
  surfaceSolid: "#1C1C1E",
  surfaceRaised: "#2C2C2E",
  canvas: "#000000",
  canvasEdge: "#0A0A0A",
  // Apple Music red — clear, singular accent
  accent: "#FA243C",
  accentSoft: "rgba(250, 36, 60, 0.16)",
  accentGlow: "rgba(250, 36, 60, 0.28)",
  onAccent: "#FFFFFF",
  onDark: "#F5F5F7",
  onDarkMuted: "rgba(245,245,247,0.55)",
  alert: "#FF453A",
  station: "#0A0A0A",
};

export const radius = { sm: 10, md: 12, lg: 16, xl: 22 };

export const space = (n) => n * 4;

/** Quiet elevated panel — soft inset, no heavy glass. */
export const panel = {
  background: color.surfaceRaised,
  border: `1px solid ${color.line}`,
  boxShadow: "none",
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

/** Soft atmosphere that shifts with the hour — subtle, never busy. */
export function timeOfDayGradient(date = new Date()) {
  const h = date.getHours();
  const late = h >= 22 || h <= 4;
  const dawn = h >= 5 && h <= 8;
  const day = h >= 9 && h <= 16;
  if (late) {
    return `radial-gradient(ellipse at 50% -10%, #1C1C1E 0%, #0A0A0A 42%, #000000 100%)`;
  }
  if (dawn) {
    return `radial-gradient(ellipse at 70% 0%, #222224 0%, #111113 48%, #000000 100%)`;
  }
  if (day) {
    return `radial-gradient(ellipse at 40% -5%, #1A1A1C 0%, #0C0C0E 50%, #000000 100%)`;
  }
  return `radial-gradient(ellipse at 55% 0%, #1C1C1E 0%, #0A0A0A 45%, #000000 100%)`;
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
  background: color.surfaceSolid,
  color: color.ink,
  fontSize: 17,
  fontFamily: font,
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
  border: `1px solid ${color.lineStrong}`,
  background: color.surface,
  color: color.body,
  fontSize: 17,
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

/** Product brand. */
export const BRAND_NAME = "ROOMS";
export const BRAND_TAGLINE = "Listen";

/** Admin UID — keep in sync with firestore.rules until custom claims exist. */
export const ADMIN_UID = "5lPAI9N1jkMbVkUyIqLTqBvBf1t1";
