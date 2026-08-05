// Design tokens — premium Y2K chrome with glassmorphism.
// Frosted platinum glass, soft blur edges, brushed aluminum — no selection blue.

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
  line: "rgba(22, 24, 30, 0.09)",
  lineStrong: "rgba(22, 24, 30, 0.14)",
  surface: "rgba(255, 255, 255, 0.55)",
  surfaceSolid: "rgba(255, 255, 255, 0.82)",
  surfaceRaised: "rgba(245, 247, 250, 0.88)",
  canvas: "#E2E6ED",
  canvasEdge: "#CFD5DF",
  /** Charcoal chrome — primary interactive signal */
  accent: "#2A2E38",
  accentSoft: "rgba(42, 46, 56, 0.1)",
  accentGlow: "rgba(42, 46, 56, 0.16)",
  onAccent: "#F4F6F9",
  onDark: "#F2F4F7",
  onDarkMuted: "rgba(242,244,247,0.62)",
  alert: "#C45C3E",
  station: "#EBEEF3",
  /** Soft aluminum list selection */
  select: "rgba(42, 46, 56, 0.08)",
  selectStrong: "rgba(42, 46, 56, 0.14)",
};

/** Frosted Y2K aluminum — soft glass edges, cool grey chrome. */
export const glass = {
  fill: "rgba(255, 255, 255, 0.42)",
  fillStrong: "rgba(255, 255, 255, 0.68)",
  fillQuiet: "rgba(246, 248, 252, 0.32)",
  fillHeavy: "rgba(255, 255, 255, 0.82)",
  border: "rgba(22, 24, 30, 0.1)",
  borderSoft: "rgba(22, 24, 30, 0.065)",
  borderFaint: "rgba(22, 24, 30, 0.04)",
  highlight: "rgba(255, 255, 255, 0.92)",
  blur: "blur(32px) saturate(1.28)",
  blurSoft: "blur(20px) saturate(1.18)",
  blurHeavy: "blur(48px) saturate(1.22)",
  blurEdge: "blur(24px) saturate(1.2)",
  shadow: "0 14px 40px rgba(22, 24, 30, 0.1), 0 2px 8px rgba(22, 24, 30, 0.04)",
  shadowSoft: "0 8px 28px rgba(22, 24, 30, 0.07)",
  shadowLift: "0 18px 48px rgba(22, 24, 30, 0.12), 0 4px 12px rgba(22, 24, 30, 0.05)",
  /** Specular chrome edge for Y2K control plates */
  chrome:
    "linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(236,240,246,0.72) 42%, rgba(210,216,226,0.55) 100%)",
  /** Soft plate used by sheets / cards */
  plate:
    "linear-gradient(165deg, rgba(255,255,255,0.78) 0%, rgba(242,245,249,0.62) 55%, rgba(232,236,242,0.55) 100%)",
};

/** Soft jewel-case shadow for album art — Cover Flow memory. */
export const artShadow = {
  quiet: "0 2px 4px rgba(26,29,36,0.05), 0 12px 28px rgba(26,29,36,0.1)",
  raised: "0 4px 10px rgba(26,29,36,0.07), 0 20px 44px rgba(26,29,36,0.14)",
  active: `0 0 0 2px ${color.ink}, 0 8px 20px rgba(22,24,30,0.12), 0 18px 40px rgba(26,29,36,0.12)`,
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
  radius: 18,
  tabH: 54,
  playerH: 66,
  /** Content clearances (tabs only / with player), excluding safe-area. */
  clearTabs: 88,
  clearPlayer: 176,
};

export const radius = { sm: 10, md: 12, lg: 16, xl: 22, pill: 980 };

export const space = (n) => n * 4;

/** Quiet elevated panel — soft aluminum edge + blur. */
export const panel = {
  background: glass.plate,
  border: `1px solid ${glass.borderSoft}`,
  borderRadius: radius.lg,
  boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
  backdropFilter: glass.blur,
  WebkitBackdropFilter: glass.blur,
};

export const panelQuiet = {
  background: glass.fillQuiet,
  border: `1px solid ${glass.borderFaint}`,
  borderRadius: radius.md,
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
};

/** Sheet / modal glass surface. */
export const glassSheet = {
  background: glass.plate,
  border: `1px solid ${glass.border}`,
  borderRadius: `${radius.xl}px ${radius.xl}px 0 0`,
  boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowLift}`,
  backdropFilter: glass.blurHeavy,
  WebkitBackdropFilter: glass.blurHeavy,
};

/** Interactive glass control — playlists, chips, sheets. */
export const glassControl = {
  background: glass.chrome,
  border: `1px solid ${glass.border}`,
  borderRadius: radius.md,
  boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
  backdropFilter: glass.blurEdge,
  WebkitBackdropFilter: glass.blurEdge,
};

/** Soft aluminum section rule. */
export function sectionRule(inset = homeSpace.gutter) {
  return {
    height: 1,
    margin: `0 ${inset}px`,
    border: "none",
    background:
      "linear-gradient(90deg, transparent 0%, rgba(26,29,36,0.06) 18%, rgba(26,29,36,0.12) 50%, rgba(26,29,36,0.06) 82%, transparent 100%)",
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
    linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0) 44%),
    linear-gradient(135deg, #F2F5FA 0%, #E2E6ED 48%, #CDD4E0 100%)
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

/** App shell — atmospheric canvas, not a flat slab. */
export const APP_STYLE = {
  fontFamily: font,
  background: `
    radial-gradient(ellipse 120% 70% at 50% -20%, rgba(255,255,255,0.7) 0%, transparent 55%),
    radial-gradient(ellipse 80% 50% at 100% 100%, rgba(190,198,210,0.28) 0%, transparent 50%),
    ${color.canvas}
  `,
  color: color.ink,
  minHeight: "100dvh",
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
  background: "rgba(255,255,255,0.58)",
  color: color.ink,
  fontSize: 16,
  fontFamily: font,
  boxShadow: `inset 0 1px 0 ${glass.highlight}, inset 0 2px 6px rgba(22,24,30,0.03)`,
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
  outline: "none",
  transition: `border-color ${motion.base} ${motion.ease}, box-shadow ${motion.base} ${motion.ease}, background ${motion.base}`,
};

/** Primary CTA — charcoal chrome glass plate. */
export const BTN_PRIMARY = {
  width: "100%",
  padding: "14px 22px",
  borderRadius: radius.md,
  border: `1px solid rgba(22, 24, 30, 0.2)`,
  background: `
    linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 42%),
    linear-gradient(165deg, #454B58 0%, #1A1D24 100%)
  `,
  color: color.onAccent,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: font,
  letterSpacing: -0.15,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), ${glass.shadowSoft}`,
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
  transition: `transform ${motion.fast} ${motion.ease}, box-shadow ${motion.base}, opacity ${motion.fast}`,
};

/** Secondary CTA — frosted glass plate. */
export const BTN_SECONDARY = {
  width: "100%",
  padding: "14px 22px",
  borderRadius: radius.md,
  border: `1px solid ${glass.border}`,
  background: glass.chrome,
  color: color.body,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: font,
  letterSpacing: -0.15,
  backdropFilter: glass.blurEdge,
  WebkitBackdropFilter: glass.blurEdge,
  boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
  transition: `transform ${motion.fast} ${motion.ease}, box-shadow ${motion.base}, background ${motion.base}`,
};

/** Quiet tertiary control — glass chip. */
export const BTN_GHOST = {
  padding: "10px 14px",
  borderRadius: radius.md,
  border: `1px solid ${glass.borderSoft}`,
  background: glass.fillQuiet,
  color: color.muted,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: font,
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
  boxShadow: `inset 0 1px 0 ${glass.highlight}`,
};

export const CTRL_BTN = {
  background: glass.fillQuiet,
  border: `1px solid ${glass.borderFaint}`,
  borderRadius: radius.sm,
  cursor: "pointer",
  padding: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: color.muted,
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
  boxShadow: `inset 0 1px 0 ${glass.highlight}`,
  transition: `background ${motion.base}, color ${motion.fast}, transform ${motion.fast}`,
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
