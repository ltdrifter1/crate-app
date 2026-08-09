// Design tokens — premium Y2K broadcast. Dark studio surfaces, machined
// aluminum controls, one ice-blue accent, a whisper of broadcast red for LIVE.
// MTV2 (2001–2005) x Braun x Teenage Engineering — restraint over nostalgia.

export const fontDisplay =
  '"Space Grotesk", "Avenir Next", "Segoe UI", "Helvetica Neue", Helvetica, sans-serif';
export const font =
  '"Space Grotesk", "Avenir Next", "Segoe UI", "Helvetica Neue", Helvetica, sans-serif';
export const fontMono =
  '"IBM Plex Mono", "SF Mono", ui-monospace, Menlo, Monaco, "Courier New", monospace';

/** Brand palette — dark broadcast studio, editorial contrast */
export const color = {
  ink: "#F7F8FA",
  body: "#C9CED6",
  muted: "#A4AAB4",
  faint: "#6E7683",
  line: "rgba(255, 255, 255, 0.08)",
  lineStrong: "rgba(255, 255, 255, 0.14)",
  surface: "rgba(24, 27, 32, 0.62)",
  surfaceSolid: "rgba(24, 27, 32, 0.92)",
  surfaceRaised: "rgba(30, 34, 40, 0.94)",
  canvas: "#0B0C0F",
  canvasEdge: "#08090B",
  /** Ice blue — the single accent signal */
  accent: "#A9C7E4",
  accentSoft: "rgba(169, 199, 228, 0.12)",
  accentGlow: "rgba(169, 199, 228, 0.22)",
  onAccent: "#0B0C0F",
  onDark: "#F2F4F7",
  onDarkMuted: "rgba(242,244,247,0.62)",
  /** Broadcast red — LIVE + destructive only, never chrome */
  alert: "#E03C4B",
  station: "#121417",
  /** Soft selection wash */
  select: "rgba(169, 199, 228, 0.08)",
  selectStrong: "rgba(169, 199, 228, 0.14)",
};

/**
 * Station / broadcast chrome — silvers over the dark studio.
 * hot = live / request / rank signal; bright = chart / highlight; steel = plates.
 */
export const chrome = {
  hot: "#8B939F",
  bright: "#D6DBE2",
  steel: "#5A6270",
  plate: "#2A2E36",
  deep: "#101216",
  live: "#E03C4B",
  signal: "#A9C7E4",
  inkPlate: "#08090B",
  /** rgba helpers for overlays */
  hotRgb: "139,147,159",
  brightRgb: "214,219,226",
  liveRgb: "224,60,75",
};

/**
 * Y2K underground — aluminum / charcoal broadcast branding + one neon signal.
 * Used by the Home redesign + dock. Black, charcoal, off-white, silver,
 * a whisper of neon. MTV meets pirate radio meets modern streaming.
 * Grey family only — no purple anywhere on player or home chrome.
 */
export const y2k = {
  /** Aluminum signal — CTAs, active states, live chrome (grey family) */
  chrome: "#B8C0CC",
  chromeBright: "#E8ECF2",
  chromeMid: "#8B939F",
  chromeDeep: "#3A414C",
  chromeSoft: "rgba(184, 192, 204, 0.16)",
  chromeGlow: "rgba(232, 236, 242, 0.28)",
  chromeWash: "rgba(184, 192, 204, 0.08)",
  /** Neon zap — tiny highlights only, never large surfaces */
  neon: "#C8F241",
  neonSoft: "rgba(200, 242, 65, 0.16)",
  /** Cool studio off-white for headline ink (not warm cream) */
  offWhite: "#F4F6F8",
  charcoal: "#14161A",
  charcoalRaised: "#1A1D23",
  /** Neutral ink used on glass bugs / lower-thirds */
  inkGlass: "rgba(10, 11, 13, 0.72)",
  inkGlassSoft: "rgba(12, 13, 16, 0.5)",
  /** Hero / card art fallback wash — brushed steel, no purple cast */
  artGradient:
    "radial-gradient(120% 90% at 20% 0%, rgba(184,192,204,0.28) 0%, transparent 55%), radial-gradient(100% 80% at 90% 100%, rgba(58,65,76,0.55) 0%, transparent 60%), linear-gradient(160deg, #1A1D23 0%, #0C0D10 100%)",
};

/** Dark glass — blurred studio panels, hairline borders, soft top light. */
export const glass = {
  fill: "rgba(24, 27, 32, 0.55)",
  fillStrong: "rgba(24, 27, 32, 0.82)",
  fillQuiet: "rgba(30, 34, 40, 0.4)",
  fillHeavy: "rgba(18, 20, 23, 0.9)",
  border: "rgba(255, 255, 255, 0.1)",
  borderSoft: "rgba(255, 255, 255, 0.08)",
  borderFaint: "rgba(255, 255, 255, 0.05)",
  highlight: "rgba(255, 255, 255, 0.09)",
  blur: "blur(32px) saturate(1.1)",
  blurSoft: "blur(20px) saturate(1.06)",
  blurHeavy: "blur(48px) saturate(1.08)",
  blurEdge: "blur(24px) saturate(1.08)",
  shadow: "0 14px 40px rgba(0, 0, 0, 0.42), 0 2px 8px rgba(0, 0, 0, 0.28)",
  shadowSoft: "0 8px 28px rgba(0, 0, 0, 0.32)",
  shadowLift: "0 18px 48px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)",
  /** Machined-aluminum control face — MiniDisc / iPod wheel finish */
  chrome:
    "linear-gradient(160deg, rgba(46,51,59,0.92) 0%, rgba(32,36,42,0.88) 42%, rgba(22,25,30,0.9) 100%)",
  /** Soft plate used by sheets / cards */
  plate:
    "linear-gradient(165deg, rgba(28,31,37,0.92) 0%, rgba(22,25,30,0.9) 55%, rgba(17,19,23,0.92) 100%)",
  /** Beveled hardware frame wash */
  frame:
    "linear-gradient(145deg, rgba(38,42,49,0.95) 0%, rgba(26,29,34,0.9) 38%, rgba(18,20,24,0.88) 72%, rgba(30,34,40,0.92) 100%)",
};

/** Hard, unblurred controls and plates used around playback chrome. */
export const hardware = {
  radius: 4,
  keyFace:
    "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.025) 38%, rgba(0,0,0,0.12) 100%), linear-gradient(145deg, #343A43 0%, #24282F 48%, #171A1F 100%)",
  keyRaised:
    "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.55), inset 1px 0 0 rgba(255,255,255,0.05), inset -1px 0 0 rgba(0,0,0,0.35)",
  keyPressed:
    "inset 0 2px 4px rgba(0,0,0,0.55), inset 0 1px 0 rgba(0,0,0,0.35)",
  plateEdge:
    "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.5)",
  rule:
    "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)",
};

/**
 * Raised aluminum key face. Intentionally excludes backdrop-filter so keys
 * read as physical controls instead of floating glass.
 */
export function hardwareKey(opts = { pressed: false, size: "md" }) {
  const pressed = opts?.pressed === true;
  const size = opts?.size || "md";
  const metrics = {
    sm: { minHeight: 32, padding: "0 10px" },
    md: { minHeight: 36, padding: "0 13px" },
    lg: { minHeight: 44, padding: "0 15px" },
  }[size] || { minHeight: 36, padding: "0 13px" };

  return {
    ...metrics,
    borderRadius: hardware.radius,
    border: "1px solid rgba(255,255,255,0.14)",
    background: hardware.keyFace,
    boxShadow: pressed ? hardware.keyPressed : hardware.keyRaised,
    color: pressed ? color.accent : color.body,
    fontFamily: fontMono,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  };
}

/** Deep jewel-case shadow for album art — lit from the studio above. */
export const artShadow = {
  quiet: "0 2px 4px rgba(0,0,0,0.3), 0 12px 28px rgba(0,0,0,0.45)",
  raised:
    "0 4px 10px rgba(0,0,0,0.35), 0 20px 44px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.35)",
  active: `0 0 0 1px rgba(232,236,242,0.42), 0 0 18px ${y2k.chromeGlow}, 0 8px 20px rgba(0,0,0,0.45), 0 18px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.14)`,
};

/**
 * Shared jewel-case art frame — dual-tone chrome edge, raised sleeve shadow.
 * Use on Home tiles, channels, stacks, and featured releases.
 */
export function artFrameStyle({
  size,
  active = false,
  radius: frameRadius = 12,
  width = null,
  height = null,
} = {}) {
  const w = width ?? size;
  const h = height ?? size;
  return {
    position: "relative",
    display: "block",
    width: w,
    height: h,
    borderRadius: frameRadius,
    overflow: "hidden",
    border: `1px solid ${
      active ? "rgba(232,236,242,0.5)" : "rgba(255,255,255,0.14)"
    }`,
    background: y2k.artGradient,
    boxShadow: active
      ? artShadow.active
      : artShadow.raised,
  };
}

/** Home rhythm — wider section breaks, consistent gutters. */
export const homeSpace = {
  gutter: 22,
  bandPadY: 44,
  sectionPadTop: 48,
  sectionPadBottom: 44,
  /** First shelf after a prior band/rule — keep tight; the break lives above. */
  sectionPadTopFirst: 8,
  shelfGap: 20,
  /** Default discovery tile — sleeve-first. */
  tile: 168,
  /** Featured / countdown / releases — asymmetric presence. */
  tileFeatured: 200,
};

/** Floating premium dock — blurred shell for mini-player + tabs. */
export const dock = {
  insetX: 14,
  insetBottom: 12,
  radius: 20,
  tabH: 54,
  playerH: 66,
  /** Content clearances (tabs only / with player), excluding safe-area. */
  clearTabs: 88,
  clearPlayer: 176,
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 20, pill: 980 };

export const space = (n) => n * 4;

/** Quiet elevated panel — hairline edge + blur over the studio floor. */
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
 * Machined hardware plate — beveled inset for home bands / featured CTAs.
 */
export function chromeFrame(opts = {}) {
  const sharp = opts.sharp === true;
  return {
    border: `1px solid ${glass.border}`,
    borderRadius: sharp ? 2 : radius.xl,
    background: glass.frame,
    boxShadow: `
      inset 0 1px 0 rgba(255,255,255,0.1),
      inset 0 -1px 0 rgba(0,0,0,0.35),
      inset 1px 0 0 rgba(255,255,255,0.05),
      inset -1px 0 0 rgba(0,0,0,0.25),
      ${glass.shadow}
    `,
    backdropFilter: glass.blurSoft,
    WebkitBackdropFilter: glass.blurSoft,
  };
}

/** Hairline broadcast separator. */
export function sectionRule(inset = homeSpace.gutter) {
  return {
    height: 1,
    margin: `0 ${inset}px`,
    border: "none",
    background:
      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 18%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.05) 82%, transparent 100%)",
  };
}

export const motion = {
  fast: "0.15s",
  base: "0.24s",
  settle: "0.32s",
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
};

/** Studio atmosphere that shifts with the hour — always deep, never OLED-flat. */
export function timeOfDayGradient(date = new Date()) {
  const h = date.getHours();
  const late = h >= 22 || h <= 4;
  const dawn = h >= 5 && h <= 8;
  const day = h >= 9 && h <= 16;
  if (late) {
    return `radial-gradient(ellipse at 50% -10%, #14171D 0%, #0D0F13 42%, #0B0C0F 100%)`;
  }
  if (dawn) {
    return `radial-gradient(ellipse at 70% 0%, #15181E 0%, #0B0C0F 48%, #0D0F14 100%)`;
  }
  if (day) {
    return `radial-gradient(ellipse at 40% -5%, #181C23 0%, #0C0E12 50%, #0B0C0F 100%)`;
  }
  return `radial-gradient(ellipse at 55% 0%, #161A20 0%, #0C0D11 45%, #0A0B0E 100%)`;
}

/** Brushed dark-aluminum wash for chrome bands / Cover Stage. */
export function aluminumGradient() {
  return `
    linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 44%),
    linear-gradient(135deg, #23272E 0%, #14171C 48%, #0E1013 100%)
  `;
}

/**
 * Soft glass disc behind the planet lockup — modern blur edge, quiet halo.
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

/** App shell — deep broadcast canvas with a faint studio key light. */
export const APP_STYLE = {
  fontFamily: font,
  background: `
    radial-gradient(ellipse 120% 70% at 50% -20%, rgba(169,199,228,0.06) 0%, transparent 55%),
    radial-gradient(ellipse 80% 50% at 100% 100%, rgba(255,255,255,0.025) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 0% 80%, rgba(255,255,255,0.02) 0%, transparent 45%),
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
  background: "rgba(24,27,32,0.7)",
  color: color.ink,
  fontSize: 16,
  fontFamily: font,
  boxShadow: `inset 0 1px 0 ${glass.highlight}, inset 0 2px 6px rgba(0,0,0,0.25)`,
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
  outline: "none",
  transition: `border-color ${motion.base} ${motion.ease}, box-shadow ${motion.base} ${motion.ease}, background ${motion.base}`,
};

/** Primary CTA — machined-silver hero plate, dark inscription. */
export const BTN_PRIMARY = {
  width: "100%",
  padding: "14px 22px",
  borderRadius: radius.lg,
  border: `1px solid rgba(255, 255, 255, 0.18)`,
  background: `
    linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 42%),
    linear-gradient(165deg, #EDF0F4 0%, #C4CBD4 100%)
  `,
  color: color.onAccent,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: font,
  letterSpacing: -0.15,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), ${glass.shadowSoft}`,
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
  transition: `transform ${motion.fast} ${motion.ease}, box-shadow ${motion.base}, opacity ${motion.fast}`,
};

/** Secondary CTA — dark glass plate. */
export const BTN_SECONDARY = {
  width: "100%",
  padding: "14px 22px",
  borderRadius: radius.lg,
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
