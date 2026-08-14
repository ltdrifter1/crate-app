// Design tokens — premium Y2K broadcast hardware.
// Graphite chassis, LCD cyan, chrome plates, LIVE LED red.
// Early-2000s FM receiver × MiniDisc × underground label — engineered, not SaaS.

export const fontDisplay =
  '"Chakra Petch", "Space Grotesk", "Avenir Next", "Segoe UI", sans-serif';
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
  surface: "rgba(21, 24, 28, 0.72)",
  surfaceSolid: "rgba(21, 24, 28, 0.94)",
  surfaceRaised: "rgba(28, 32, 38, 0.96)",
  canvas: "#080A0D",
  canvasEdge: "#06070A",
  /** Technical blue — interface accent */
  accent: "#7BA7FF",
  accentSoft: "rgba(123, 167, 255, 0.12)",
  accentGlow: "rgba(123, 167, 255, 0.22)",
  onAccent: "#080A0D",
  onDark: "#F2F4F7",
  onDarkMuted: "rgba(242,244,247,0.62)",
  /** Broadcast red — LIVE + destructive only, never chrome */
  alert: "#FF334F",
  station: "#15181C",
  /** Soft selection wash */
  select: "rgba(101, 230, 255, 0.08)",
  selectStrong: "rgba(101, 230, 255, 0.14)",
};

/**
 * Station / broadcast chrome — silvers over the dark studio.
 * hot = live / request / rank signal; bright = chart / highlight; steel = plates.
 */
export const chrome = {
  hot: "#8B939F",
  bright: "#E7EBF0",
  steel: "#5A6270",
  plate: "#15181C",
  deep: "#0C0E12",
  live: "#FF334F",
  signal: "#65E6FF",
  inkPlate: "#080A0D",
  /** rgba helpers for overlays */
  hotRgb: "139,147,159",
  brightRgb: "231,235,240",
  liveRgb: "255,51,79",
  cyanRgb: "101,230,255",
};

/**
 * Y2K underground — graphite chassis, light metal, LCD cyan.
 * MTV meets pirate radio meets Japanese audio hardware.
 * No purple anywhere on player or home chrome.
 */
export const y2k = {
  /** Aluminum / light metal — CTAs, active states, chrome faces */
  chrome: "#B8BEC7",
  chromeBright: "#E7EBF0",
  chromeMid: "#8B939F",
  chromeDeep: "#3A414C",
  chromeSoft: "rgba(184, 190, 199, 0.16)",
  chromeGlow: "rgba(231, 235, 240, 0.28)",
  chromeWash: "rgba(184, 190, 199, 0.08)",
  /** Electric cyan — LCD / tuner illumination */
  cyan: "#65E6FF",
  cyanSoft: "rgba(101, 230, 255, 0.14)",
  cyanGlow: "rgba(101, 230, 255, 0.32)",
  /** Technical blue — secondary readout */
  techBlue: "#7BA7FF",
  techBlueSoft: "rgba(123, 167, 255, 0.14)",
  /** Neon zap / acid — tiny highlights only */
  neon: "#C8F241",
  neonSoft: "rgba(200, 242, 65, 0.16)",
  /** Optional Y2K magenta — sparingly */
  magenta: "#FF4FD8",
  magentaSoft: "rgba(255, 79, 216, 0.14)",
  /** Cool studio off-white for headline ink */
  offWhite: "#F4F6F8",
  charcoal: "#15181C",
  charcoalRaised: "#1C2026",
  graphite: "#15181C",
  nearBlack: "#080A0D",
  metal: "#B8BEC7",
  lightMetal: "#E7EBF0",
  live: "#FF334F",
  /** Neutral ink used on glass bugs / lower-thirds */
  inkGlass: "rgba(8, 10, 13, 0.78)",
  inkGlassSoft: "rgba(8, 10, 13, 0.52)",
  /** Hero / card art fallback wash — brushed steel, no purple cast */
  artGradient:
    "radial-gradient(120% 90% at 20% 0%, rgba(184,190,199,0.28) 0%, transparent 55%), radial-gradient(100% 80% at 90% 100%, rgba(58,65,76,0.55) 0%, transparent 60%), linear-gradient(160deg, #1C2026 0%, #080A0D 100%)",
};

/**
 * Radio / media-player module surfaces — physical plates, not website cards.
 * Use for ON AIR receiver, schedule strip, hardware CTAs.
 */
export const radio = {
  /** 8–14px engineered corners — never pill */
  radius: 12,
  radiusTight: 8,
  radiusControl: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  borderLive: "1px solid rgba(101,230,255,0.42)",
  borderQuiet: "1px solid rgba(255,255,255,0.1)",
  /** Translucent graphite chassis with internal highlight */
  moduleFace: `
    linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 36%, transparent 70%),
    linear-gradient(145deg, rgba(36,40,46,0.95) 0%, rgba(21,24,28,0.96) 48%, rgba(14,16,20,0.98) 100%)
  `,
  moduleFaceLive: `
    linear-gradient(180deg, rgba(101,230,255,0.08) 0%, transparent 42%),
    linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 36%, transparent 70%),
    linear-gradient(145deg, rgba(40,46,54,0.97) 0%, rgba(22,26,32,0.98) 50%, rgba(12,14,18,0.99) 100%)
  `,
  moduleShadow:
    "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.45), inset 1px 0 0 rgba(255,255,255,0.04), inset -1px 0 0 rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.4)",
  moduleShadowLive:
    "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.5), 0 0 0 1px rgba(101,230,255,0.12), 0 0 28px rgba(101,230,255,0.1), 0 10px 28px rgba(0,0,0,0.45)",
  stripFace: `
    linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.015) 40%, transparent 100%),
    linear-gradient(160deg, #1C2026 0%, #12151A 55%, #0E1014 100%)
  `,
  stripFaceLive: `
    linear-gradient(180deg, rgba(101,230,255,0.1) 0%, transparent 45%),
    linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 40%),
    linear-gradient(160deg, #222830 0%, #15191F 55%, #0E1116 100%)
  `,
  stripShadow:
    "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.4), 0 4px 14px rgba(0,0,0,0.32)",
  stripShadowLive:
    "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.45), 0 0 18px rgba(101,230,255,0.12), 0 6px 16px rgba(0,0,0,0.36)",
  /** Metallic Tune-In key */
  tuneFace: `
    linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.08) 38%, transparent 55%),
    linear-gradient(165deg, #F2F4F7 0%, #C5CBD4 42%, #8A929E 100%)
  `,
  tuneFacePressed: `
    linear-gradient(180deg, rgba(0,0,0,0.08) 0%, transparent 40%),
    linear-gradient(165deg, #D8DDE4 0%, #A8B0BB 50%, #6E7683 100%)
  `,
  tuneShadow:
    "inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -1px 0 rgba(0,0,0,0.22), 0 1px 0 rgba(255,255,255,0.12), 0 6px 16px rgba(0,0,0,0.35)",
  tuneShadowPressed:
    "inset 0 2px 4px rgba(0,0,0,0.28), inset 0 1px 0 rgba(0,0,0,0.12)",
  lcdTrack: "rgba(255,255,255,0.06)",
  lcdFill:
    "linear-gradient(90deg, rgba(101,230,255,0.55) 0%, rgba(123,167,255,0.95) 55%, rgba(231,235,240,0.9) 100%)",
  lcdGlow: "0 0 10px rgba(101,230,255,0.35)",
  label: {
    fontFamily: fontMono,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
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
    color: pressed ? y2k.chromeBright : color.body,
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
  active: `0 0 0 1px rgba(232,236,242,0.5), 0 0 20px ${y2k.chromeGlow}, 0 8px 20px rgba(0,0,0,0.45), 0 18px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.16)`,
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
      active ? "rgba(232,236,242,0.55)" : "rgba(184,192,204,0.28)"
    }`,
    background: y2k.artGradient,
    boxShadow: active
      ? artShadow.active
      : `${artShadow.raised}, 0 0 0 1px rgba(184,192,204,0.06)`,
  };
}

/** Home rhythm — denser shelves, title sits closer to its row. */
export const homeSpace = {
  gutter: 20,
  bandPadY: 32,
  sectionPadTop: 36,
  sectionPadBottom: 28,
  /** First shelf after a prior band/rule — keep tight; the break lives above. */
  sectionPadTopFirst: 8,
  /** Gap between Home MusicSection bands (row → next title). */
  sectionGap: 20,
  /** First Home shelf after the broadcast hero. */
  sectionGapFirst: 18,
  shelfGap: 16,
  /** Default discovery tile — sleeve-first. */
  tile: 168,
  /** Featured / countdown / releases — asymmetric presence. */
  tileFeatured: 200,
  /** Space under section title stack before the rail. */
  titleToRail: 14,
};

/**
 * Section title — compact premium, flush with rail gutter.
 * Keep size modest so every shelf shares one optical left edge.
 */
export const sectionTitle = {
  fontFamily: fontDisplay,
  fontSize: 17,
  fontWeight: 650,
  letterSpacing: 0.2,
  lineHeight: 1.2,
  color: y2k.offWhite,
  margin: 0,
  textTransform: "none",
};

export const sectionSubtitle = {
  margin: "3px 0 0",
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: -0.06,
  lineHeight: 1.35,
  color: color.muted,
};

/** Frosted glass control — header buttons, view-all, CH bugs. */
export function glassPill(opts = {}) {
  const active = opts.active === true;
  const compact = opts.compact === true;
  return {
    border: `1px solid ${
      active ? "rgba(232,236,242,0.42)" : "rgba(255,255,255,0.16)"
    }`,
    background: active
      ? "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 100%), rgba(28,32,38,0.55)"
      : "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%), rgba(18,20,24,0.42)",
    backdropFilter: "blur(18px) saturate(1.35)",
    WebkitBackdropFilter: "blur(18px) saturate(1.35)",
    boxShadow: active
      ? `inset 0 1px 0 rgba(255,255,255,0.28), 0 0 16px ${y2k.chromeGlow}, 0 6px 18px rgba(0,0,0,0.35)`
      : "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.35), 0 4px 14px rgba(0,0,0,0.28)",
    color: active ? y2k.chromeBright : y2k.offWhite,
    borderRadius: compact ? 980 : radius.md,
    WebkitTapHighlightColor: "transparent",
  };
}

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

/** Prefer radio.radius for media modules; keep these for sheets / legacy chrome. */
export const radius = { sm: 8, md: 12, lg: 14, xl: 16, pill: 980 };

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
    return `radial-gradient(ellipse at 50% -10%, #15181C 0%, #0C0E12 42%, #080A0D 100%)`;
  }
  if (dawn) {
    return `radial-gradient(ellipse at 70% 0%, #171B22 0%, #080A0D 48%, #0C0E12 100%)`;
  }
  if (day) {
    return `radial-gradient(ellipse at 40% -5%, #1A1F27 0%, #0C0E12 50%, #080A0D 100%)`;
  }
  return `radial-gradient(ellipse at 55% 0%, #161A20 0%, #0C0E11 45%, #080A0D 100%)`;
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

/** App shell — graphite chassis with quiet cyan atmosphere. */
export const APP_STYLE = {
  fontFamily: font,
  background: `
    radial-gradient(ellipse 110% 65% at 50% -18%, rgba(101,230,255,0.045) 0%, transparent 55%),
    radial-gradient(ellipse 70% 45% at 100% 100%, rgba(123,167,255,0.04) 0%, transparent 50%),
    radial-gradient(ellipse 55% 40% at 0% 85%, rgba(255,255,255,0.02) 0%, transparent 45%),
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
    linear-gradient(180deg, rgba(255,255,255,0.38) 0%, transparent 42%),
    linear-gradient(165deg, #E7EBF0 0%, #B8BEC7 100%)
  `,
  color: color.onAccent,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: font,
  letterSpacing: -0.15,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.6), ${glass.shadowSoft}`,
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
