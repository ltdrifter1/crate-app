// Design tokens — dark premium MP3 player.
// Obsidian charcoal canvas, neon-green signal, quiet violet/blue.
// Not Spotify, not a costume Discman. IBM Plex Mono stays on the LCD.

/** Bump this when the visual OS changes. Copied into public/index.html + the shipped build. */
export const STYLE_CHASSIS = "dark-premium-player-20260925";

/** Chrome specular — cool pearl steel, never pure white. */
const SPEC = "200, 210, 222";
/** Deep shade — cooler than the canvas, never the retired void. */
const SHADE = "6, 10, 16";

export const fontDisplay =
  '"Outfit", "IBM Plex Sans", "Lucida Grande", "Helvetica Neue", Helvetica, Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif';
export const font = fontDisplay;
export const fontMono =
  '"IBM Plex Mono", ui-monospace, "SF Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace';
export const fontPoster =
  '"Barlow Condensed", "Outfit", "IBM Plex Sans", "Lucida Grande", "Helvetica Neue", Helvetica, Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif';
/** LCD / now-playing readout — firmware voice. */
export const fontLcd = fontMono;

/**
 * Compact device type scale.
 * Tracking is optical: tight on large titles, open on captions.
 */
export const type = {
  largeTitle: {
    fontFamily: fontPoster,
    fontSize: 36,
    fontWeight: 800,
    letterSpacing: -0.6,
    lineHeight: 1.08,
  },
  title1: {
    fontFamily: fontPoster,
    fontSize: 30,
    fontWeight: 800,
    letterSpacing: -0.4,
    lineHeight: 1.1,
  },
  title2: {
    fontFamily: fontPoster,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.2,
    lineHeight: 1.14,
  },
  title3: {
    fontFamily: fontDisplay,
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: -0.32,
    lineHeight: 1.2,
  },
  headline: {
    fontFamily: font,
    fontSize: 17,
    fontWeight: 600,
    letterSpacing: -0.24,
    lineHeight: 1.25,
  },
  body: {
    fontFamily: font,
    fontSize: 17,
    fontWeight: 400,
    letterSpacing: -0.24,
    lineHeight: 1.35,
  },
  callout: {
    fontFamily: font,
    fontSize: 16,
    fontWeight: 400,
    letterSpacing: -0.2,
    lineHeight: 1.3,
  },
  subhead: {
    fontFamily: font,
    fontSize: 15,
    fontWeight: 400,
    letterSpacing: -0.16,
    lineHeight: 1.3,
  },
  footnote: {
    fontFamily: font,
    fontSize: 13,
    fontWeight: 400,
    letterSpacing: -0.08,
    lineHeight: 1.3,
  },
  caption: {
    fontFamily: font,
    fontSize: 12,
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.25,
  },
  /** Firmware / LCD metadata — BPM, key, time, catalog. */
  lcd: {
    fontFamily: fontMono,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.12,
    lineHeight: 1.2,
    textTransform: "uppercase",
  },
  tileTitle: {
    fontFamily: font,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: -0.14,
    lineHeight: 1.25,
  },
  tileMeta: {
    fontFamily: font,
    fontSize: 13,
    fontWeight: 400,
    letterSpacing: -0.08,
    lineHeight: 1.25,
  },
  seeAll: {
    fontFamily: font,
    fontSize: 17,
    fontWeight: 400,
    letterSpacing: -0.2,
    lineHeight: 1.2,
  },
};

/**
 * Signal trim — neon green with a quiet blue edge. Never a page fill.
 */
export const trim = {
  lime: "#A8FF6A",
  teal: "#6EA8FF",
  blue: "#6EA8FF",
  blueDeep: "#4B7FE0",
  gradient: "linear-gradient(90deg, #A8FF6A 0%, #7DFFB3 48%, #6EA8FF 100%)",
};

/**
 * Neon signal palette — border, glow, pip. Never a background fill.
 */
export const neons = {
  cyan:    "#6EA8FF",
  cyanGlow: "rgba(110,168,255,0.35)",
  violet:  "#B794F6",
  violetGlow: "rgba(183,148,246,0.32)",
  lime:    "#A8FF6A",
  limeGlow: "rgba(168,255,106,0.32)",
  red:     "#E0314A",
  redGlow: "rgba(224,49,74,0.32)",
  orange:  "#E05830",
  orangeGlow: "rgba(224,88,48,0.28)",
  phosphor: "#A8FF6A",
  phosphorGlow: "rgba(168,255,106,0.45)",
};

/**
 * Steel face with an ice-phosphor stroke (2px default).
 * Use on primary buttons, playing transport, identity pills.
 */
export function trimStroke(face, width = 2) {
  return {
    border: `${width}px solid transparent`,
    background: `${face} padding-box, ${trim.gradient} border-box`,
    backgroundOrigin: "border-box",
    backgroundClip: "padding-box, border-box",
  };
}

/**
 * Brand palette — one cool steel chassis. Album art supplies hue.
 * Color is a trim: ice LCD CTAs and rings. Not a fill.
 */
export const color = {
  ink: "#E8EDF4",
  body: "#C5CBD6",
  muted: "#8A94A3",
  faint: "#6B7584",
  line: "rgba(200, 210, 222, 0.12)",
  lineStrong: "rgba(200, 210, 222, 0.22)",
  surface: "rgba(36, 42, 51, 0.84)",
  surfaceSolid: "rgba(36, 42, 51, 0.96)",
  surfaceRaised: "#2A323C",
  canvas: "#1C222B",
  canvasEdge: "#161B22",
  /** Neon green — pip, progress, selected */
  accent: "#A8FF6A",
  accentSoft: "rgba(168, 255, 106, 0.16)",
  accentGlow: "rgba(168, 255, 106, 0.32)",
  onAccent: "#1C222B",
  cta: "#A8FF6A",
  onCta: "#121417",
  onDark: "#E8EDF4",
  onDarkMuted: "rgba(200,210,222,0.62)",
  /** Broadcast live — the only non-steel signal */
  alert: "#E0314A",
  station: "#242A33",
  select: "rgba(168, 255, 106, 0.12)",
  selectStrong: "rgba(168, 255, 106, 0.22)",
  lcdInk: "#E8FFD0",
  lcdMute: "#7A9A72",
  lcdSignal: "#A8FF6A",
  lcdSignalGlow: "rgba(168, 255, 106, 0.7)",
  lcdSignalSoft: "rgba(168, 255, 106, 0.28)",
  /** Meta on the dark metal strip / dock (not the well) */
  stripInk: "#D8DFE8",
};

/**
 * Station / broadcast chrome — pearl over obsidian, ice for signal.
 */
export const chrome = {
  hot: "#A8B2C0",
  bright: "#E8EDF4",
  steel: "#7A8492",
  plate: "#242A33",
  deep: "#161B22",
  live: "#E0314A",
  signal: "#A8FF6A",
  inkPlate: "#E8EDF4",
  hotRgb: "168,178,192",
  brightRgb: "232,237,244",
  liveRgb: "224,49,74",
  cyanRgb: "90,168,184",
};

/**
 * Smoked steel glass — station chat on the same night chassis.
 */
export const ice = {
  frost: "rgba(36, 42, 51, 0.78)",
  frostStrong: "rgba(42, 50, 60, 0.94)",
  rim: "rgba(90, 168, 184, 0.32)",
  rimSoft: "rgba(200, 210, 222, 0.12)",
  glow: "rgba(90, 196, 214, 0.14)",
  mist: "rgba(28, 34, 43, 0.9)",
  pane: `
    linear-gradient(180deg, rgba(${SPEC},0.14) 0%, rgba(36,42,51,0.32) 28%, transparent 58%),
    linear-gradient(165deg, rgba(42,50,60,0.96) 0%, rgba(28,34,43,0.94) 100%)
  `,
  thread: `
    radial-gradient(120% 80% at 50% -10%, rgba(90,196,214,0.08) 0%, transparent 46%),
    linear-gradient(180deg, #242A33 0%, #1C222B 100%)
  `,
  bubble: "rgba(90, 168, 184, 0.10)",
  bubbleMine: "rgba(90, 196, 214, 0.16)",
  ink: "#E8EDF4",
  mute: "rgba(197, 203, 214, 0.62)",
  pip: "#A8FF6A",
};

/**
 * Cool metal + ice signal. Cyan is ice on dark — never a page fill.
 */
export const y2k = {
  chrome: "#A8B2C0",
  chromeBright: "#E8EDF4",
  chromeMid: "#8A94A3",
  chromeDeep: "#5B6574",
  chromeSoft: "rgba(168, 178, 192, 0.12)",
  chromeGlow: "rgba(168, 178, 192, 0.22)",
  chromeWash: "rgba(168, 178, 192, 0.18)",
  cyan: "#A8FF6A",
  cyanSoft: "rgba(168, 255, 106, 0.16)",
  cyanGlow: "rgba(168, 255, 106, 0.28)",
  techBlue: "#6EA8FF",
  techBlueSoft: "rgba(110, 168, 255, 0.14)",
  neon: "#A8FF6A",
  neonSoft: "rgba(168, 255, 106, 0.16)",
  magenta: "#E0314A",
  magentaSoft: "rgba(224, 49, 74, 0.14)",
  /** Pearl inscription on obsidian */
  offWhite: "#E8EDF4",
  charcoal: "#242A33",
  charcoalRaised: "#2C3440",
  graphite: "#1C222B",
  nearBlack: "#161B22",
  metal: "#3A4450",
  lightMetal: "#4A5462",
  live: "#E0314A",
  inkGlass: "rgba(28, 34, 43, 0.86)",
  inkGlassSoft: "rgba(28, 34, 43, 0.58)",
  artGradient:
    "radial-gradient(120% 90% at 20% 0%, rgba(200,210,222,0.16) 0%, transparent 55%), radial-gradient(100% 80% at 90% 100%, rgba(90,196,214,0.10) 0%, transparent 60%), linear-gradient(160deg, #2A323C 0%, #161B22 100%)",
};

/**
 * Radio / media-player module surfaces — one aluminum chassis.
 * LCD is a smoked-steel inset; chassis around it is the same cool metal as the page.
 */
export const radio = {
  radius: 18,
  radiusTight: 12,
  radiusControl: 980,
  radiusLcd: 14,
  border: "1px solid rgba(200,210,222,0.12)",
  borderLive: "1px solid rgba(90,196,214,0.42)",
  borderQuiet: "1px solid rgba(200,210,222,0.08)",
  borderChrome: "1px solid rgba(200,210,222,0.18)",
  glassFace: `
    linear-gradient(165deg, rgba(${SPEC},0.16) 0%, rgba(${SPEC},0.04) 38%, transparent 68%),
    linear-gradient(145deg, rgba(42,50,60,0.96) 0%, rgba(28,34,43,0.94) 100%)
  `,
  glassFaceLive: `
    radial-gradient(120% 80% at 0% 0%, rgba(90,196,214,0.12) 0%, transparent 45%),
    linear-gradient(165deg, rgba(${SPEC},0.18) 0%, rgba(${SPEC},0.05) 36%, transparent 70%),
    linear-gradient(145deg, rgba(42,50,60,0.96) 0%, rgba(28,34,43,0.94) 100%)
  `,
  glassBlur: "blur(28px) saturate(1.08)",
  glassShadow:
    `inset 0 1px 0 rgba(${SPEC},0.18), inset 0 -1px 0 rgba(${SHADE},0.55), 0 12px 28px rgba(${SHADE},0.55), 0 0 0 1px rgba(${SPEC},0.08)`,
  glassShadowLive:
    `inset 0 1px 0 rgba(${SPEC},0.18), inset 0 -1px 0 rgba(${SHADE},0.55), 0 0 28px rgba(90,196,214,0.14), 0 14px 32px rgba(${SHADE},0.5), 0 0 0 1px rgba(90,196,214,0.22)`,
  lcdFace: `
    radial-gradient(90% 70% at 18% 0%, rgba(183,228,238,0.22) 0%, transparent 52%),
    linear-gradient(180deg, rgba(${SPEC},0.1) 0%, transparent 42%),
    linear-gradient(160deg, #3F4B56 0%, #323C46 55%, #2A333C 100%)
  `,
  lcdBorder: "1px solid rgba(90, 196, 214, 0.38)",
  lcdShadow:
    `inset 0 2px 10px rgba(${SHADE},0.55), inset 0 1px 0 rgba(183,228,238,0.22), 0 0 18px rgba(90,196,214,0.18)`,
  moduleFace: `
    linear-gradient(180deg, rgba(${SPEC},0.14) 0%, rgba(${SPEC},0.04) 36%, transparent 70%),
    linear-gradient(145deg, rgba(42,50,60,0.96) 0%, rgba(28,34,43,0.94) 100%)
  `,
  moduleFaceLive: `
    linear-gradient(180deg, rgba(90,196,214,0.10) 0%, transparent 42%),
    linear-gradient(180deg, rgba(${SPEC},0.14) 0%, rgba(${SPEC},0.04) 36%, transparent 70%),
    linear-gradient(145deg, rgba(42,50,60,0.97) 0%, rgba(28,34,43,0.95) 100%)
  `,
  moduleShadow:
    `inset 0 1px 0 rgba(${SPEC},0.16), inset 0 -1px 0 rgba(${SHADE},0.5), 0 8px 20px rgba(${SHADE},0.4)`,
  moduleShadowLive:
    `inset 0 1px 0 rgba(${SPEC},0.16), inset 0 -1px 0 rgba(${SHADE},0.5), 0 0 0 1px rgba(90,196,214,0.2), 0 0 22px rgba(90,196,214,0.12), 0 10px 24px rgba(${SHADE},0.42)`,
  stripFace: `
    linear-gradient(180deg, rgba(${SPEC},0.12) 0%, rgba(${SPEC},0.03) 42%, transparent 100%),
    rgba(36,42,51,0.94)
  `,
  stripFaceLive: `
    linear-gradient(180deg, rgba(90,196,214,0.10) 0%, transparent 48%),
    linear-gradient(180deg, rgba(${SPEC},0.10) 0%, transparent 40%),
    rgba(36,42,51,0.96)
  `,
  stripShadow:
    `inset 0 1px 0 rgba(${SPEC},0.14), inset 0 -1px 0 rgba(${SHADE},0.45), 0 4px 12px rgba(${SHADE},0.36)`,
  stripShadowLive:
    `inset 0 1px 0 rgba(${SPEC},0.14), inset 0 -1px 0 rgba(${SHADE},0.45), 0 0 18px rgba(90,196,214,0.14), 0 6px 14px rgba(${SHADE},0.4)`,
  tuneFace: `
    linear-gradient(180deg, rgba(${SPEC},0.16) 0%, rgba(${SPEC},0.04) 34%, transparent 55%),
    linear-gradient(165deg, #2A323C 0%, #242A33 42%, #1C222B 100%)
  `,
  tuneFacePressed: `
    linear-gradient(180deg, rgba(${SHADE},0.4) 0%, transparent 40%),
    linear-gradient(165deg, #1C222B 0%, #161B22 50%, #12161C 100%)
  `,
  tuneShadow:
    `inset 0 1px 0 rgba(${SPEC},0.18), inset 0 -1px 0 rgba(${SHADE},0.5), 0 6px 14px rgba(${SHADE},0.42)`,
  tuneShadowPressed:
    `inset 0 2px 4px rgba(${SHADE},0.7), inset 0 1px 0 rgba(${SHADE},0.4)`,
  lcdTrack: "rgba(6,10,16,0.55)",
  lcdFill:
    "linear-gradient(90deg, #A8FF6A 0%, #7DFFB3 62%, #6EA8FF 100%)",
  lcdGlow: "0 0 16px rgba(168, 255, 106, 0.55)",
  label: {
    fontFamily: font,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: -0.08,
    textTransform: "none",
  },
};

/** Smoked steel glass — hairline bezels, pearl top light, night radio. */
export const glass = {
  fill: "rgba(36, 42, 51, 0.62)",
  fillStrong: "rgba(42, 50, 60, 0.86)",
  fillQuiet: "rgba(28, 34, 43, 0.42)",
  fillHeavy: "rgba(36, 42, 51, 0.92)",
  border: "rgba(200, 210, 222, 0.14)",
  borderSoft: "rgba(200, 210, 222, 0.10)",
  borderFaint: "rgba(200, 210, 222, 0.07)",
  highlight: `rgba(${SPEC}, 0.22)`,
  blur: "none",
  blurSoft: "blur(12px) saturate(1.08)",
  blurHeavy: "blur(18px) saturate(1.1)",
  blurEdge: "blur(14px) saturate(1.08)",
  shadow: `0 14px 36px rgba(${SHADE}, 0.55), 0 2px 8px rgba(${SHADE}, 0.4)`,
  shadowSoft: `0 8px 22px rgba(${SHADE}, 0.42)`,
  shadowLift: `0 18px 40px rgba(${SHADE}, 0.58), 0 4px 12px rgba(${SHADE}, 0.36)`,
  chrome:
    `linear-gradient(160deg, rgba(${SPEC},0.18) 0%, rgba(42,50,60,0.92) 42%, rgba(28,34,43,0.96) 100%)`,
  plate:
    `linear-gradient(165deg, rgba(42,50,60,0.96) 0%, rgba(36,42,51,0.96) 55%, rgba(22,27,34,0.94) 100%)`,
  frame:
    "linear-gradient(180deg, #2A323C 0%, #1C222B 48%, #161B22 100%)",
};

/** Hard, unblurred controls — PS1 chamfered obsidian keys. */
export const hardware = {
  radius: 12,
  keyFace:
    `linear-gradient(145deg, rgba(${SPEC},0.22) 0%, rgba(${SPEC},0.05) 36%, transparent 62%), linear-gradient(165deg, #2C3440 0%, #242A33 46%, #1C222B 100%)`,
  keyRaised:
    `inset 0 2px 0 rgba(${SPEC},0.22), inset 0 -3px 4px rgba(${SHADE},0.55), inset 2px 0 0 rgba(${SPEC},0.08), inset -2px 0 0 rgba(${SHADE},0.4), 0 3px 0 rgba(${SHADE},0.35), 0 6px 12px rgba(${SHADE},0.4)`,
  keyPressed:
    `inset 0 3px 5px rgba(${SHADE},0.7), inset 0 1px 0 rgba(${SHADE},0.4)`,
  plateEdge:
    `inset 0 1px 0 rgba(${SPEC},0.16), inset 0 -1px 0 rgba(${SHADE},0.45)`,
  rule:
    `linear-gradient(90deg, transparent, rgba(90,196,214,0.22), transparent)`,
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
    border: "1px solid rgba(200,210,222,0.16)",
    background: hardware.keyFace,
    boxShadow: pressed ? hardware.keyPressed : hardware.keyRaised,
    color: pressed ? color.ink : color.body,
    fontFamily: font,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: -0.1,
    textTransform: "none",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    transition: "transform 0.08s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.08s ease",
    transform: pressed ? "scale(0.97)" : "none",
  };
}

/** Jewel-case shadow — sleeves float over cool steel. */
export const artShadow = {
  quiet: `0 2px 4px rgba(${SHADE},0.45), 0 10px 22px rgba(${SHADE},0.5)`,
  raised:
    `0 6px 10px rgba(${SHADE},0.45), 0 18px 36px rgba(${SHADE},0.5), inset 0 1px 0 rgba(${SPEC},0.18), inset 0 -2px 5px rgba(${SHADE},0.45)`,
  active: `0 0 0 2px ${color.lcdSignal}, 0 10px 22px rgba(${SHADE},0.22), 0 0 20px rgba(90,196,214,0.36)`,
};

/**
 * Shared jewel-case art frame — dual-tone chrome edge, raised sleeve shadow.
 * Use on Home tiles, channels, stacks, and featured releases.
 */
export function artFrameStyle({
  size,
  active = false,
  radius: frameRadius = 6,
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
    border: `1.5px solid ${
      active ? color.lcdSignal : "rgba(200,210,222,0.22)"
    }`,
    background: y2k.artGradient,
    boxShadow: active
      ? artShadow.active
      : `${artShadow.raised}, 0 0 0 1px rgba(${SPEC},0.2)`,
  };
}

/** Home rhythm — shelf title, tight title-to-rail. */
export const homeSpace = {
  gutter: 20,
  bandPadY: 32,
  sectionPadTop: 36,
  sectionPadBottom: 28,
  /** First shelf after a prior band/rule — keep tight; the break lives above. */
  sectionPadTopFirst: 8,
  /** Gap between Home MusicSection bands (row → next title). */
  sectionGap: 28,
  /** First Home shelf after header / prior hero band. */
  sectionGapFirst: 12,
  shelfGap: 14,
  /** Default discovery tile — sleeve-first. */
  tile: 160,
  /** Featured / countdown / releases — asymmetric presence. */
  tileFeatured: 200,
  /** Channel surfing station tile — art-first, not a ticket stub. */
  tileTicket: 168,
  /** Space under section title stack before the rail. */
  titleToRail: 12,
};

/**
 * Section title — library shelf header.
 */
export const sectionTitle = {
  ...type.title2,
  color: color.ink,
  margin: 0,
  textTransform: "none",
};

/** Home band titles — same stack as every other shelf. */
export const sectionTitlePoster = {
  ...sectionTitle,
};

export const sectionSubtitle = {
  ...type.subhead,
  margin: "3px 0 0",
  color: color.muted,
};

/** Quiet label above a Home band title. */
export const sectionEyebrow = {
  ...type.footnote,
  fontWeight: 600,
  textTransform: "none",
  color: color.muted,
  margin: "0 0 4px",
};

export const sectionEyebrowLcd = {
  ...sectionEyebrow,
};

/** Device bezel + LCD used by the Home stage and dock. */
export const broadcast = {
  bezelBorder: "1px solid rgba(200,210,222,0.16)",
  bezelShadow: `
    inset 0 1px 0 rgba(${SPEC},0.16),
    inset 0 -1px 0 rgba(${SHADE},0.5),
    0 18px 40px rgba(${SHADE},0.5)
  `,
  lcdTrack: "rgba(6,10,16,0.55)",
  lcdFill:
    "linear-gradient(90deg, #A8FF6A 0%, #7DFFB3 62%, #6EA8FF 100%)",
  lcdGlow: "0 0 16px rgba(168, 255, 106, 0.55)",
};

/** Hardware icon key — header / Explore / Charts. */
export function chromeIconButton(size = 36) {
  return {
    width: size,
    height: size,
    padding: 0,
    borderRadius: 8,
    border: "1px solid rgba(200,210,222,0.16)",
    background:
      `linear-gradient(180deg, rgba(${SPEC},0.16) 0%, rgba(${SPEC},0.04) 55%, transparent 100%), linear-gradient(180deg, #2A323C 0%, #1C222B 100%)`,
    boxShadow:
      `inset 0 1px 0 rgba(${SPEC},0.16), 0 1px 3px rgba(${SHADE},0.4)`,
    backdropFilter: "none",
    WebkitBackdropFilter: "none",
    color: color.ink,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    WebkitTapHighlightColor: "transparent",
  };
}

/** Steel glass control — header buttons, view-all, CH bugs. */
export function glassPill(opts = {}) {
  const active = opts.active === true;
  const compact = opts.compact === true;
  return {
    border: `1px solid ${
      active ? "rgba(168,255,106,0.45)" : "rgba(200,210,222,0.14)"
    }`,
    background: active
      ? "rgba(168,255,106,0.14)"
      : `linear-gradient(180deg, rgba(${SPEC},0.12) 0%, rgba(36,42,51,0.92) 100%)`,
    backdropFilter: "blur(18px) saturate(1.08)",
    WebkitBackdropFilter: "blur(18px) saturate(1.08)",
    boxShadow: active
      ? `inset 0 1px 0 rgba(${SPEC},0.35), 0 0 0 1px ${color.lcdSignal}`
      : `inset 0 1px 0 rgba(${SPEC},0.4), inset 0 -1px 0 rgba(${SHADE},0.14), 0 3px 10px rgba(${SHADE},0.14)`,
    color: active ? color.lcdSignal : color.ink,
    borderRadius: compact ? 12 : 980,
    WebkitTapHighlightColor: "transparent",
  };
}

/** Floating dock — frosted mini-device + tabs. */
export const dock = {
  insetX: 12,
  insetBottom: 8,
  radius: 16,
  tabH: 54,
  /** Compact now-playing bar (cover + title + play). Pace lives on the full decks. */
  playerH: 56,
  /** Content clearances (tabs only / with player), excluding safe-area. */
  clearTabs: 80,
  clearPlayer: 148,
};

/** Prefer radio.radius for media modules; keep these for sheets / legacy chrome. */
export const radius = { sm: 10, md: 14, lg: 18, xl: 22, pill: 980 };

export const space = (n) => n * 4;

/** Quiet elevated panel — hairline edge + blur over the aluminum floor. */
export const panel = {
  background: glass.plate,
  border: `1px solid ${glass.borderSoft}`,
  borderRadius: radius.lg,
  boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
};

export const panelQuiet = {
  background: glass.fillQuiet,
  border: `1px solid ${glass.borderFaint}`,
  borderRadius: radius.md,
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
 * Premium home stage — frosted plate with a soft, blurred rim.
 * Used by the hero player and On Tonight.
 */
export const glassStage = {
  position: "relative",
  isolation: "isolate",
  overflow: "hidden",
  borderRadius: 22,
  border: "1px solid rgba(200,210,222,0.16)",
  background: `
    linear-gradient(165deg, rgba(200,210,222,0.10) 0%, rgba(36,42,51,0.55) 46%, rgba(22,27,34,0.72) 100%)
  `,
  boxShadow: `
    inset 0 1px 0 rgba(200,210,222,0.16),
    inset 0 -1px 0 rgba(6,10,16,0.45),
    0 24px 56px rgba(6,10,16,0.5),
    0 2px 10px rgba(6,10,16,0.28)
  `,
  backdropFilter: glass.blur,
  WebkitBackdropFilter: glass.blur,
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
      inset 0 1px 0 rgba(${SPEC},0.4),
      inset 0 -1px 0 rgba(${SHADE},0.16),
      ${glass.shadow}
    `,
    backdropFilter: glass.blurSoft,
    WebkitBackdropFilter: glass.blurSoft,
  };
}

/** Hairline shelf separator. */
export function sectionRule(inset = homeSpace.gutter) {
  return {
    height: 1,
    margin: `0 ${inset}px`,
    border: "none",
    background:
      "linear-gradient(90deg, transparent 0%, rgba(90,196,214,0.06) 18%, rgba(200,210,222,0.18) 50%, rgba(90,196,214,0.06) 82%, transparent 100%)",
  };
}

export const motion = {
  fast: "0.15s",
  base: "0.24s",
  settle: "0.32s",
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
};

/** Steel wash that shifts slightly with the hour. */
export function timeOfDayGradient(date = new Date()) {
  const h = date.getHours();
  const late = h >= 22 || h <= 4;
  const dawn = h >= 5 && h <= 8;
  const day = h >= 9 && h <= 16;
  if (late) {
    return `radial-gradient(ellipse at 50% -10%, #242A33 0%, #1C222B 42%, #161B22 100%)`;
  }
  if (dawn) {
    return `radial-gradient(ellipse at 70% 0%, #2A323C 0%, #1C222B 48%, #181E26 100%)`;
  }
  if (day) {
    return `radial-gradient(ellipse at 40% -5%, #2C3440 0%, #1C222B 50%, #161B22 100%)`;
  }
  return `radial-gradient(ellipse at 55% 0%, #262E38 0%, #1C222B 45%, #161B22 100%)`;
}

/** Brushed steel wash for chrome bands / Cover Stage. */
export function aluminumGradient() {
  return `
    linear-gradient(180deg, rgba(${SPEC},0.10) 0%, transparent 44%),
    linear-gradient(180deg, #2A323C 0%, #1C222B 48%, #161B22 100%)
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

/** App shell — obsidian steel chassis, ice signal. */
export const APP_STYLE = {
  fontFamily: font,
  background: `
    radial-gradient(ellipse 110% 55% at 50% -18%, rgba(${SPEC},0.10) 0%, transparent 52%),
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
  background: "rgba(22, 27, 34, 0.88)",
  color: color.ink,
  fontSize: 16,
  fontFamily: font,
  boxShadow: `inset 0 1px 0 ${glass.highlight}, inset 0 2px 6px rgba(${SHADE},0.16)`,
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
  outline: "none",
  transition: `border-color ${motion.base} ${motion.ease}, box-shadow ${motion.base} ${motion.ease}, background ${motion.base}`,
};

/** Primary CTA — neon green pill, dark inscription. */
export const BTN_PRIMARY = {
  width: "100%",
  padding: "14px 22px",
  borderRadius: 980,
  border: "1px solid rgba(168, 255, 106, 0.45)",
  background: color.cta,
  color: color.onCta,
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: font,
  letterSpacing: -0.15,
  boxShadow: `0 0 18px rgba(168,255,106,0.28), ${radio.lcdShadow}`,
  transition: `transform ${motion.fast} ${motion.ease}, box-shadow ${motion.base}, opacity ${motion.fast}`,
};

/** Secondary CTA — dark plate pill. */
export const BTN_SECONDARY = {
  width: "100%",
  padding: "14px 22px",
  borderRadius: 980,
  border: `1px solid ${glass.border}`,
  background: glass.chrome,
  color: color.ink,
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

/** Quiet tertiary control — frosted chip. */
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
