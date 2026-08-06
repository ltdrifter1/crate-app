// Design tokens — Y2K liquid chrome + 90s MTG card-frame energy.
// Brushed steel, specular plates, cool greys only — no hot red / amber.

export const fontDisplay =
  '"Oxanium", "Orbitron", "Avenir Next", "Segoe UI", "Helvetica Neue", Helvetica, sans-serif';
export const font =
  '"Rajdhani", "Source Sans 3", "Avenir Next", "Segoe UI", "Helvetica Neue", Helvetica, sans-serif';
export const fontMono =
  '"IBM Plex Mono", "SF Mono", ui-monospace, Menlo, Monaco, "Courier New", monospace';

/** Brand palette — cool platinum + charcoal chrome (no chroma accents) */
export const color = {
  ink: "#12141A",
  body: "#3A404C",
  muted: "#6A7280",
  faint: "#959DAA",
  line: "rgba(18, 20, 26, 0.1)",
  lineStrong: "rgba(18, 20, 26, 0.16)",
  surface: "rgba(255, 255, 255, 0.55)",
  surfaceSolid: "rgba(255, 255, 255, 0.84)",
  surfaceRaised: "rgba(242, 245, 249, 0.9)",
  canvas: "#D8DEE8",
  canvasEdge: "#C4CCD8",
  /** Charcoal chrome — primary interactive signal */
  accent: "#2A2E38",
  accentSoft: "rgba(42, 46, 56, 0.1)",
  accentGlow: "rgba(42, 46, 56, 0.18)",
  onAccent: "#F4F6F9",
  onDark: "#F2F4F7",
  onDarkMuted: "rgba(242,244,247,0.62)",
  /** Destructive only — never station chrome */
  alert: "#8A6A66",
  station: "#EBEEF3",
  /** Soft aluminum list selection */
  select: "rgba(42, 46, 56, 0.08)",
  selectStrong: "rgba(42, 46, 56, 0.14)",
};

/**
 * Station / broadcast chrome — grey metal substitutes for former MTV reds.
 * hot = live / request / rank signal; bright = chart / highlight; steel = plates.
 */
export const chrome = {
  hot: "#8B939F",
  bright: "#C5CAD3",
  steel: "#5A6270",
  plate: "#A8B0BC",
  deep: "#1A1D24",
  live: "#B8C0CC",
  signal: "#D4DAE4",
  inkPlate: "#0C0E12",
  /** rgba helpers for overlays */
  hotRgb: "139,147,159",
  brightRgb: "197,202,211",
  liveRgb: "184,192,204",
};

/** Frosted Y2K aluminum — soft glass edges, cool grey chrome. */
export const glass = {
  fill: "rgba(255, 255, 255, 0.42)",
  fillStrong: "rgba(255, 255, 255, 0.7)",
  fillQuiet: "rgba(246, 248, 252, 0.34)",
  fillHeavy: "rgba(255, 255, 255, 0.84)",
  border: "rgba(18, 20, 26, 0.12)",
  borderSoft: "rgba(18, 20, 26, 0.08)",
  borderFaint: "rgba(18, 20, 26, 0.05)",
  highlight: "rgba(255, 255, 255, 0.94)",
  blur: "blur(32px) saturate(1.22)",
  blurSoft: "blur(20px) saturate(1.14)",
  blurHeavy: "blur(48px) saturate(1.18)",
  blurEdge: "blur(24px) saturate(1.16)",
  shadow: "0 14px 40px rgba(18, 20, 26, 0.12), 0 2px 8px rgba(18, 20, 26, 0.05)",
  shadowSoft: "0 8px 28px rgba(18, 20, 26, 0.08)",
  shadowLift: "0 18px 48px rgba(18, 20, 26, 0.14), 0 4px 12px rgba(18, 20, 26, 0.06)",
  /** Specular chrome edge for Y2K control plates */
  chrome:
    "linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(236,240,246,0.74) 42%, rgba(196,204,216,0.58) 100%)",
  /** Soft plate used by sheets / cards */
  plate:
    "linear-gradient(165deg, rgba(255,255,255,0.82) 0%, rgba(236,240,246,0.64) 55%, rgba(210,216,226,0.58) 100%)",
  /** Beveled MTG-style metal frame wash */
  frame:
    "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(210,216,226,0.7) 38%, rgba(168,176,188,0.55) 72%, rgba(232,236,242,0.8) 100%)",
};

/** Soft jewel-case shadow for album art — Cover Flow memory. */
export const artShadow = {
  quiet: "0 2px 4px rgba(18,20,26,0.06), 0 12px 28px rgba(18,20,26,0.12)",
  raised: "0 4px 10px rgba(18,20,26,0.08), 0 20px 44px rgba(18,20,26,0.16)",
  active: `0 0 0 2px ${color.ink}, 0 8px 20px rgba(18,20,26,0.14), 0 18px 40px rgba(18,20,26,0.14)`,
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

export const radius = { sm: 8, md: 10, lg: 14, xl: 18, pill: 980 };

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

/**
 * 90s MTG card-frame plate — beveled metal inset for home bands / featured CTAs.
 */
export function chromeFrame(opts = {}) {
  const sharp = opts.sharp !== false;
  return {
    border: `1px solid ${glass.border}`,
    borderRadius: sharp ? 2 : radius.lg,
    background: glass.frame,
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.95),
      inset 0 -1px 0 rgba(18,20,26,0.1),
      inset 1px 0 0 rgba(255,255,255,0.4),
      inset -1px 0 0 rgba(18,20,26,0.08),
      ${glass.shadow}
    `,
    backdropFilter: glass.blurSoft,
    WebkitBackdropFilter: glass.blurSoft,
  };
}

/** Soft aluminum section rule. */
export function sectionRule(inset = homeSpace.gutter) {
  return {
    height: 1,
    margin: `0 ${inset}px`,
    border: "none",
    background:
      "linear-gradient(90deg, transparent 0%, rgba(18,20,26,0.07) 18%, rgba(18,20,26,0.14) 50%, rgba(18,20,26,0.07) 82%, transparent 100%)",
  };
}

export const motion = {
  fast: "0.12s",
  base: "0.2s",
  settle: "0.35s",
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
};

/** Soft atmosphere that shifts with the hour — cool Y2K steel, never OLED. */
export function timeOfDayGradient(date = new Date()) {
  const h = date.getHours();
  const late = h >= 22 || h <= 4;
  const dawn = h >= 5 && h <= 8;
  const day = h >= 9 && h <= 16;
  if (late) {
    return `radial-gradient(ellipse at 50% -10%, #C8D0DC 0%, #D4DAE4 42%, #D8DEE8 100%)`;
  }
  if (dawn) {
    return `radial-gradient(ellipse at 70% 0%, #D6DAE2 0%, #D8DEE8 48%, #CCD4E0 100%)`;
  }
  if (day) {
    return `radial-gradient(ellipse at 40% -5%, #E4E8F0 0%, #D8DEE8 50%, #C8D0DC 100%)`;
  }
  return `radial-gradient(ellipse at 55% 0%, #D0D8E4 0%, #D8DEE8 45%, #C4CCD8 100%)`;
}

/** Brushed aluminum wash for chrome bands / Cover Stage — cooler Y2K steel. */
export function aluminumGradient() {
  return `
    linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0) 44%),
    linear-gradient(135deg, #F0F3F8 0%, #D8DEE8 48%, #B8C0CC 100%)
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
    radial-gradient(ellipse 120% 70% at 50% -20%, rgba(255,255,255,0.75) 0%, transparent 55%),
    radial-gradient(ellipse 80% 50% at 100% 100%, rgba(168,176,188,0.32) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 0% 80%, rgba(196,204,216,0.22) 0%, transparent 45%),
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
  boxShadow: `inset 0 1px 0 ${glass.highlight}, inset 0 2px 6px rgba(18,20,26,0.04)`,
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
  border: `1px solid rgba(18, 20, 26, 0.22)`,
  background: `
    linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 42%),
    linear-gradient(165deg, #4A5160 0%, #16181E 100%)
  `,
  color: color.onAccent,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: font,
  letterSpacing: -0.15,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.3), ${glass.shadowSoft}`,
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
