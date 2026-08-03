// Design tokens — Y2K chrome library UI.
// Light grey glass, brushed aluminum, blurred edges — no selection blue.

export const fontDisplay =
  '"Outfit", "Avenir Next", "Segoe UI", "Helvetica Neue", Helvetica, sans-serif';
export const font =
  '"Source Sans 3", "Source Sans Pro", "Avenir Next", "Segoe UI", "Helvetica Neue", Helvetica, sans-serif';
export const fontMono =
  '"IBM Plex Mono", "SF Mono", ui-monospace, Menlo, Monaco, "Courier New", monospace';

/** Brand palette — cool platinum + charcoal chrome (no blue accents) */
export const color = {
  ink: "#16181E",
  body: "#3A404C",
  muted: "#6A7280",
  faint: "#959DAA",
  line: "rgba(22, 24, 30, 0.1)",
  lineStrong: "rgba(22, 24, 30, 0.16)",
  surface: "rgba(255, 255, 255, 0.58)",
  surfaceSolid: "#FFFFFF",
  surfaceRaised: "#EEF1F5",
  canvas: "#E2E6ED",
  canvasEdge: "#CFD5DF",
  /** Charcoal chrome — primary interactive signal */
  accent: "#2A2E38",
  accentSoft: "rgba(42, 46, 56, 0.1)",
  accentGlow: "rgba(42, 46, 56, 0.18)",
  onAccent: "#F4F6F9",
  onDark: "#F2F4F7",
  onDarkMuted: "rgba(242,244,247,0.62)",
  alert: "#C45C3E",
  station: "#EBEEF3",
  /** Soft aluminum list selection */
  select: "rgba(42, 46, 56, 0.1)",
  selectStrong: "rgba(42, 46, 56, 0.18)",
};

/** Frosted Y2K aluminum — soft glass edges, cool grey chrome. */
export const glass = {
  fill: "rgba(246, 248, 252, 0.52)",
  fillStrong: "rgba(255, 255, 255, 0.72)",
  fillQuiet: "rgba(246, 248, 252, 0.34)",
  border: "rgba(22, 24, 30, 0.11)",
  borderSoft: "rgba(22, 24, 30, 0.07)",
  borderFaint: "rgba(22, 24, 30, 0.045)",
  highlight: "rgba(255, 255, 255, 0.88)",
  blur: "blur(28px) saturate(1.2)",
  blurSoft: "blur(18px) saturate(1.12)",
  blurHeavy: "blur(40px) saturate(1.15)",
  shadow: "0 12px 36px rgba(22, 24, 30, 0.11)",
  shadowSoft: "0 8px 24px rgba(22, 24, 30, 0.08)",
  /** Specular chrome edge for Y2K control plates */
  chrome:
    "linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(236,240,246,0.7) 42%, rgba(210,216,226,0.55) 100%)",
};

/** Soft jewel-case shadow for album art — Cover Flow memory. */
export const artShadow = {
  quiet: "0 2px 4px rgba(26,29,36,0.06), 0 10px 24px rgba(26,29,36,0.12)",
  raised: "0 4px 8px rgba(26,29,36,0.08), 0 18px 40px rgba(26,29,36,0.16)",
  active: `0 0 0 2px ${color.ink}, 0 8px 20px rgba(22,24,30,0.14), 0 18px 40px rgba(26,29,36,0.14)`,
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

/** Soft atmosphere that shifts with the hour — cool Y2K grey, never OLED. */
export function timeOfDayGradient(date = new Date()) {
  const h = date.getHours();
  const late = h >= 22 || h <= 4;
  const dawn = h >= 5 && h <= 8;
  const day = h >= 9 && h <= 16;
  if (late) {
    return `radial-gradient(ellipse at 50% -10%, #D4DBE6 0%, #DEE3EB 42%, #E2E6ED 100%)`;
  }
  if (dawn) {
    return `radial-gradient(ellipse at 70% 0%, #E2E0DC 0%, #E2E6ED 48%, #D9DEE8 100%)`;
  }
  if (day) {
    return `radial-gradient(ellipse at 40% -5%, #EBEEF4 0%, #E2E6ED 50%, #D6DBE5 100%)`;
  }
  return `radial-gradient(ellipse at 55% 0%, #DCE2EC 0%, #E2E6ED 45%, #D4DAE4 100%)`;
}

/** Brushed aluminum wash for chrome bands / Cover Stage — cooler Y2K grey. */
export function aluminumGradient() {
  return `
    linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0) 44%),
    linear-gradient(135deg, #F0F3F8 0%, #E2E6ED 48%, #CDD4E0 100%)
  `;
}

/**
 * Soft glass disc behind the planet lockup — modern blur edge, Y2K grey halo.
 * size: pixel diameter of the logo face.
 */
export function brandGlassHalo(size = 280) {
  const pad = Math.round(size * 0.14);
  return {
    position: "relative",
    width: size + pad * 2,
    height: size + pad * 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
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
  background: "rgba(255,255,255,0.72)",
  color: color.ink,
  fontSize: 16,
  fontFamily: font,
  boxShadow: `inset 0 1px 0 ${glass.highlight}`,
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
};

/** Primary CTA — charcoal chrome plate, not blue fill. */
export const BTN_PRIMARY = {
  width: "100%",
  padding: "13px 20px",
  borderRadius: radius.md,
  border: `1px solid rgba(22, 24, 30, 0.22)`,
  background: `
    linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 42%),
    linear-gradient(165deg, #3A404C 0%, #1A1D24 100%)
  `,
  color: color.onAccent,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: font,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22), ${glass.shadowSoft}`,
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
  boxShadow: `inset 0 1px 0 ${glass.highlight}`,
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
