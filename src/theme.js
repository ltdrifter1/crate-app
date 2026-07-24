// Design tokens — ultra-minimal listening UI.
// Prefer these over one-off inline colors/blurs.

export const font =
  "-apple-system, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";
export const fontMono = "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace";

export const color = {
  ink: "#14161C",
  body: "#3D4450",
  muted: "#6B7280",
  faint: "#9AA0AA",
  line: "rgba(20, 22, 28, 0.08)",
  lineStrong: "rgba(20, 22, 28, 0.14)",
  surface: "rgba(255, 255, 255, 0.72)",
  surfaceSolid: "#FFFFFF",
  canvas: "#F4F5F7",
  canvasEdge: "#E4E6EB",
  onDark: "#FFFFFF",
  onDarkMuted: "rgba(255,255,255,0.55)",
  alert: "#E5484D",
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 24 };

export const space = (n) => n * 4;

/** Soft panel — prefer over heavy multi-layer glass. */
export const panel = {
  background: color.surface,
  backdropFilter: "blur(24px) saturate(140%)",
  WebkitBackdropFilter: "blur(24px) saturate(140%)",
  border: `1px solid ${color.line}`,
  boxShadow: "0 1px 2px rgba(20,22,28,0.04)",
};

export const panelQuiet = {
  background: "rgba(255,255,255,0.45)",
  border: `1px solid ${color.line}`,
};

export const motion = {
  fast: "0.12s",
  base: "0.18s",
  ease: "cubic-bezier(0.4, 0, 0.2, 1)",
};

export function timeOfDayGradient(date = new Date()) {
  const h = date.getHours();
  const warm = h >= 6 && h <= 10;
  const cool = (h >= 18 && h <= 23) || (h >= 0 && h <= 5);
  if (warm) return `radial-gradient(ellipse at 50% 40%, #FAF9F7 0%, #EEECEA 55%, #E5E3DF 100%)`;
  if (cool) return `radial-gradient(ellipse at 50% 40%, #F5F6F9 0%, #E8E9EF 55%, #DCDEE6 100%)`;
  return `radial-gradient(ellipse at 50% 40%, #F7F8FA 0%, #EBEDF1 55%, #E0E2E8 100%)`;
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
  background: "rgba(255,255,255,0.85)",
  color: color.ink,
  fontSize: 15,
  fontFamily: font,
};

export const BTN_PRIMARY = {
  width: "100%",
  padding: "14px 20px",
  borderRadius: radius.md,
  border: "none",
  background: color.ink,
  color: color.onDark,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: font,
};

export const BTN_SECONDARY = {
  width: "100%",
  padding: "14px 20px",
  borderRadius: radius.md,
  border: `1px solid ${color.lineStrong}`,
  background: "rgba(255,255,255,0.7)",
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
