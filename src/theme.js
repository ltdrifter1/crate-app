// 4AM design tokens — late-night editorial listening UI.
// Warm sodium accent on deep charcoal. Prefer these over one-off colors.

export const fontDisplay =
  "'Syne', 'Avenir Next', 'Segoe UI', sans-serif";
export const font =
  "'DM Sans', 'Avenir Next', 'Segoe UI', sans-serif";
export const fontMono =
  "'IBM Plex Mono', 'SF Mono', 'Menlo', 'Monaco', monospace";

export const color = {
  ink: "#F2F0EB",
  body: "#C8C4BC",
  muted: "#8E8A82",
  faint: "#5E5A54",
  line: "rgba(242, 240, 235, 0.08)",
  lineStrong: "rgba(242, 240, 235, 0.14)",
  surface: "rgba(255, 255, 255, 0.045)",
  surfaceSolid: "#141416",
  surfaceRaised: "#1A1A1E",
  canvas: "#09090B",
  canvasEdge: "#101012",
  accent: "#E2A83A",
  accentSoft: "rgba(226, 168, 58, 0.14)",
  onAccent: "#0A0A0B",
  onDark: "#F2F0EB",
  onDarkMuted: "rgba(242,240,235,0.55)",
  alert: "#E5484D",
  station: "#0E0E10",
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 24 };

export const space = (n) => n * 4;

/** Quiet elevated panel — no heavy glass. */
export const panel = {
  background: color.surfaceRaised,
  border: `1px solid ${color.line}`,
  boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset",
};

export const panelQuiet = {
  background: color.surface,
  border: `1px solid ${color.line}`,
};

export const motion = {
  fast: "0.12s",
  base: "0.2s",
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
};

/** Night atmosphere that shifts with the hour — always dark, never flat. */
export function timeOfDayGradient(date = new Date()) {
  const h = date.getHours();
  const late = h >= 22 || h <= 4;
  const dawn = h >= 5 && h <= 8;
  const day = h >= 9 && h <= 16;
  if (late) {
    return `radial-gradient(ellipse at 50% -10%, #1A1410 0%, #0C0C0E 42%, #09090B 100%)`;
  }
  if (dawn) {
    return `radial-gradient(ellipse at 70% 0%, #1C1812 0%, #0E0E10 48%, #09090B 100%)`;
  }
  if (day) {
    return `radial-gradient(ellipse at 40% -5%, #14161A 0%, #0B0B0D 50%, #09090B 100%)`;
  }
  return `radial-gradient(ellipse at 55% 0%, #16120E 0%, #0C0C0E 45%, #09090B 100%)`;
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

/** Admin UID — keep in sync with firestore.rules until custom claims exist. */
export const ADMIN_UID = "5lPAI9N1jkMbVkUyIqLTqBvBf1t1";
