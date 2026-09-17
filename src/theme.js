// Design tokens — modern iPod / early-2000s iTunes.
// White-aluminum chassis, Aqua source-list blue, LCD-green playing signal.
// Lucida Grande / Helvetica Neue first (iTunes), Inter as the web fallback.

export const fontDisplay =
  '"Lucida Grande", "Lucida Sans Unicode", "Helvetica Neue", Helvetica, Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif';
export const font =
  '"Lucida Grande", "Lucida Sans Unicode", "Helvetica Neue", Helvetica, Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif';
export const fontMono =
  'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace';
/** Same as display — iTunes never swapped in a costume headline face. */
export const fontPoster = fontDisplay;
/** LCD / now-playing readout — iPod menu voice. */
export const fontLcd = font;

/**
 * iTunes / Aqua type scale.
 * Tracking is optical: tight on large titles, nearly 0 on captions.
 */
export const type = {
  largeTitle: {
    fontFamily: fontDisplay,
    fontSize: 34,
    fontWeight: 700,
    letterSpacing: -0.9,
    lineHeight: 1.12,
  },
  title1: {
    fontFamily: fontDisplay,
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: -0.6,
    lineHeight: 1.14,
  },
  title2: {
    fontFamily: fontDisplay,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.4,
    lineHeight: 1.18,
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
 * Brand palette — pearl aluminum, iPod menu ink, Aqua blue.
 * Not a dark studio. White chassis with a small LCD for now-playing.
 */
export const color = {
  ink: "#1C1F24",
  body: "#3E4550",
  muted: "#6B7380",
  faint: "#8E96A3",
  line: "rgba(28, 32, 40, 0.10)",
  lineStrong: "rgba(28, 32, 40, 0.16)",
  surface: "rgba(255, 255, 255, 0.72)",
  surfaceSolid: "rgba(247, 248, 250, 0.96)",
  surfaceRaised: "rgba(255, 255, 255, 0.98)",
  canvas: "#E6E9EF",
  canvasEdge: "#D4D8E0",
  /** iTunes / Aqua source-list blue */
  accent: "#1E6FE8",
  accentSoft: "rgba(30, 111, 232, 0.14)",
  accentGlow: "rgba(30, 111, 232, 0.28)",
  onAccent: "#FFFFFF",
  onDark: "#F4F6F8",
  onDarkMuted: "rgba(244,246,248,0.72)",
  /** Broadcast red — LIVE + destructive only */
  alert: "#E0314A",
  station: "#F4F5F7",
  /** Classic iTunes selected-row wash */
  select: "rgba(30, 111, 232, 0.12)",
  selectStrong: "rgba(30, 111, 232, 0.22)",
};

/**
 * Station / broadcast chrome — silver over pearl, LCD green for live.
 */
export const chrome = {
  hot: "#8B939F",
  bright: "#F7F8FA",
  steel: "#7A8290",
  plate: "#F4F5F7",
  deep: "#C5CAD3",
  live: "#E0314A",
  signal: "#6FBF3A",
  inkPlate: "#1C1F24",
  hotRgb: "139,147,159",
  brightRgb: "247,248,250",
  liveRgb: "224,49,74",
  cyanRgb: "111,191,58",
};

/**
 * Frosted iChat / iTunes light ice — station chat on a white chassis.
 */
export const ice = {
  frost: "rgba(255, 255, 255, 0.72)",
  frostStrong: "rgba(255, 255, 255, 0.88)",
  rim: "rgba(30, 111, 232, 0.22)",
  rimSoft: "rgba(30, 111, 232, 0.12)",
  glow: "rgba(30, 111, 232, 0.18)",
  mist: "rgba(230, 233, 239, 0.86)",
  pane: `
    linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 28%, transparent 58%),
    linear-gradient(165deg, rgba(244,246,250,0.96) 0%, rgba(230,233,239,0.94) 100%)
  `,
  thread: `
    radial-gradient(120% 80% at 50% -10%, rgba(30,111,232,0.08) 0%, transparent 46%),
    linear-gradient(180deg, #F7F8FA 0%, #E6E9EF 100%)
  `,
  bubble: "rgba(30, 111, 232, 0.08)",
  bubbleMine: "rgba(30, 111, 232, 0.16)",
  ink: "#1C1F24",
  mute: "rgba(62, 69, 80, 0.72)",
  pip: "#1E6FE8",
};

/**
 * Click-wheel aluminum + LCD green. No purple. No dark studio.
 */
export const y2k = {
  /** Aluminum / light metal — CTAs, active states, chrome faces */
  chrome: "#C5CAD3",
  chromeBright: "#F4F6F8",
  chromeMid: "#8B939F",
  chromeDeep: "#6B7380",
  chromeSoft: "rgba(197, 202, 211, 0.45)",
  chromeGlow: "rgba(30, 111, 232, 0.22)",
  chromeWash: "rgba(197, 202, 211, 0.28)",
  /** iPod LCD green — playing pip / tuner illumination */
  cyan: "#6FBF3A",
  cyanSoft: "rgba(111, 191, 58, 0.16)",
  cyanGlow: "rgba(111, 191, 58, 0.32)",
  /** Aqua blue — secondary readout / iTunes links */
  techBlue: "#1E6FE8",
  techBlueSoft: "rgba(30, 111, 232, 0.14)",
  /** Tiny highlighter — keep acid off chrome */
  neon: "#6FBF3A",
  neonSoft: "rgba(111, 191, 58, 0.16)",
  magenta: "#E0314A",
  magentaSoft: "rgba(224, 49, 74, 0.12)",
  /** Headline ink on the light chassis (legacy name: used as title color) */
  offWhite: "#1C1F24",
  charcoal: "#F4F5F7",
  charcoalRaised: "#FFFFFF",
  graphite: "#E6E9EF",
  nearBlack: "#1C1F24",
  metal: "#C5CAD3",
  lightMetal: "#F4F6F8",
  live: "#E0314A",
  /** Dark glass used on artwork overlays */
  inkGlass: "rgba(28, 32, 40, 0.72)",
  inkGlassSoft: "rgba(28, 32, 40, 0.48)",
  /** Hero / card art fallback — brushed pearl, not graphite */
  artGradient:
    "radial-gradient(120% 90% at 20% 0%, rgba(255,255,255,0.85) 0%, transparent 55%), radial-gradient(100% 80% at 90% 100%, rgba(197,202,211,0.55) 0%, transparent 60%), linear-gradient(160deg, #F7F8FA 0%, #D5DAE2 100%)",
};

/**
 * Radio / media-player module surfaces — iPod chassis + frosted glass.
 * LCD insets stay a small dark screen; everything around them is light metal.
 */
export const radio = {
  /** 8–14px engineered corners — never pill */
  radius: 14,
  radiusTight: 8,
  radiusControl: 10,
  radiusLcd: 6,
  border: "1px solid rgba(28,32,40,0.12)",
  borderLive: "1px solid rgba(111,191,58,0.45)",
  borderQuiet: "1px solid rgba(28,32,40,0.08)",
  borderChrome: "1px solid rgba(28,32,40,0.16)",
  /** Frosted white glass chassis */
  glassFace: `
    linear-gradient(165deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.45) 38%, transparent 68%),
    linear-gradient(145deg, rgba(247,248,250,0.92) 0%, rgba(230,233,239,0.88) 100%)
  `,
  glassFaceLive: `
    radial-gradient(120% 80% at 0% 0%, rgba(111,191,58,0.12) 0%, transparent 45%),
    radial-gradient(90% 70% at 100% 100%, rgba(30,111,232,0.08) 0%, transparent 50%),
    linear-gradient(165deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.5) 36%, transparent 70%),
    linear-gradient(145deg, rgba(247,248,250,0.94) 0%, rgba(230,233,239,0.9) 100%)
  `,
  glassBlur: "blur(28px) saturate(1.2)",
  glassShadow:
    "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(28,32,40,0.08), 0 12px 28px rgba(28,32,40,0.12), 0 0 0 1px rgba(28,32,40,0.06)",
  glassShadowLive:
    "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(28,32,40,0.08), 0 0 28px rgba(111,191,58,0.12), 0 14px 32px rgba(28,32,40,0.14), 0 0 0 1px rgba(111,191,58,0.16)",
  /** Classic iPod LCD — the one dark rectangle on a white body */
  lcdFace: `
    linear-gradient(180deg, rgba(111,191,58,0.08) 0%, transparent 40%),
    linear-gradient(160deg, #1A2218 0%, #121610 55%, #0C0E0B 100%)
  `,
  lcdBorder: "1px solid rgba(18, 22, 16, 0.55)",
  lcdShadow:
    "inset 0 2px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(111,191,58,0.12), 0 0 0 1px rgba(255,255,255,0.4)",
  /** Translucent pearl chassis with internal highlight */
  moduleFace: `
    linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.35) 36%, transparent 70%),
    linear-gradient(145deg, rgba(247,248,250,0.96) 0%, rgba(226,230,236,0.94) 100%)
  `,
  moduleFaceLive: `
    linear-gradient(180deg, rgba(111,191,58,0.08) 0%, transparent 42%),
    linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 36%, transparent 70%),
    linear-gradient(145deg, rgba(247,248,250,0.97) 0%, rgba(226,230,236,0.95) 100%)
  `,
  moduleShadow:
    "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(28,32,40,0.08), 0 8px 20px rgba(28,32,40,0.1)",
  moduleShadowLive:
    "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(28,32,40,0.08), 0 0 0 1px rgba(111,191,58,0.16), 0 0 22px rgba(111,191,58,0.1), 0 10px 24px rgba(28,32,40,0.12)",
  stripFace: `
    linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.2) 42%, transparent 100%),
    rgba(247,248,250,0.72)
  `,
  stripFaceLive: `
    linear-gradient(180deg, rgba(111,191,58,0.12) 0%, transparent 48%),
    linear-gradient(180deg, rgba(255,255,255,0.85) 0%, transparent 40%),
    rgba(247,248,250,0.8)
  `,
  stripShadow:
    "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(28,32,40,0.08), 0 4px 12px rgba(28,32,40,0.08)",
  stripShadowLive:
    "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(28,32,40,0.08), 0 0 18px rgba(111,191,58,0.14), 0 6px 14px rgba(28,32,40,0.1)",
  /** Metallic Tune-In key — click-wheel plastic */
  tuneFace: `
    linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.2) 34%, transparent 55%),
    linear-gradient(165deg, #F7F8FA 0%, #D8DCE3 42%, #B8BEC7 100%)
  `,
  tuneFacePressed: `
    linear-gradient(180deg, rgba(28,32,40,0.08) 0%, transparent 40%),
    linear-gradient(165deg, #D8DCE3 0%, #B8BEC7 50%, #8B939F 100%)
  `,
  tuneShadow:
    "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(28,32,40,0.16), 0 1px 0 rgba(255,255,255,0.6), 0 6px 14px rgba(28,32,40,0.14)",
  tuneShadowPressed:
    "inset 0 2px 4px rgba(28,32,40,0.22), inset 0 1px 0 rgba(28,32,40,0.1)",
  lcdTrack: "rgba(111,191,58,0.18)",
  lcdFill:
    "linear-gradient(90deg, rgba(111,191,58,0.55) 0%, rgba(111,191,58,0.95) 55%, rgba(244,246,248,0.95) 100%)",
  lcdGlow: "0 0 10px rgba(111,191,58,0.4)",
  label: {
    fontFamily: font,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: -0.08,
    textTransform: "none",
  },
};

/** Frosted white glass — iTunes window panes, hairline bezels, top light. */
export const glass = {
  fill: "rgba(255, 255, 255, 0.58)",
  fillStrong: "rgba(247, 248, 250, 0.88)",
  fillQuiet: "rgba(255, 255, 255, 0.42)",
  fillHeavy: "rgba(236, 238, 242, 0.94)",
  border: "rgba(28, 32, 40, 0.12)",
  borderSoft: "rgba(28, 32, 40, 0.08)",
  borderFaint: "rgba(28, 32, 40, 0.06)",
  highlight: "rgba(255, 255, 255, 0.92)",
  blur: "blur(32px) saturate(1.08)",
  blurSoft: "blur(20px) saturate(1.04)",
  blurHeavy: "blur(48px) saturate(1.06)",
  blurEdge: "blur(24px) saturate(1.06)",
  shadow: "0 14px 36px rgba(28, 32, 40, 0.14), 0 2px 8px rgba(28, 32, 40, 0.08)",
  shadowSoft: "0 8px 22px rgba(28, 32, 40, 0.1)",
  shadowLift: "0 18px 40px rgba(28, 32, 40, 0.16), 0 4px 12px rgba(28, 32, 40, 0.08)",
  /** Machined-aluminum control face — click-wheel finish */
  chrome:
    "linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(232,236,242,0.9) 42%, rgba(197,202,211,0.88) 100%)",
  /** Soft plate used by sheets / cards */
  plate:
    "linear-gradient(165deg, rgba(255,255,255,0.96) 0%, rgba(244,246,250,0.94) 55%, rgba(230,233,239,0.92) 100%)",
  /** Beveled hardware frame wash — iTunes titlebar */
  frame:
    "linear-gradient(180deg, #F7F8FA 0%, #E2E5EC 48%, #D0D5DE 100%)",
};

/** Hard, unblurred controls — click-wheel plastic, not dark metal. */
export const hardware = {
  radius: 4,
  keyFace:
    "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 38%, rgba(197,202,211,0.45) 100%), linear-gradient(145deg, #F7F8FA 0%, #E2E5EC 48%, #C5CAD3 100%)",
  keyRaised:
    "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(28,32,40,0.14), inset 1px 0 0 rgba(255,255,255,0.5), inset -1px 0 0 rgba(28,32,40,0.08)",
  keyPressed:
    "inset 0 2px 4px rgba(28,32,40,0.2), inset 0 1px 0 rgba(28,32,40,0.1)",
  plateEdge:
    "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(28,32,40,0.1)",
  rule:
    "linear-gradient(90deg, transparent, rgba(28,32,40,0.12), transparent)",
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
    border: "1px solid rgba(28,32,40,0.16)",
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
  };
}

/** Jewel-case shadow for album art — lit from a window, not a nightclub. */
export const artShadow = {
  quiet: "0 2px 4px rgba(28,32,40,0.12), 0 10px 22px rgba(28,32,40,0.14)",
  raised:
    "0 4px 8px rgba(28,32,40,0.12), 0 16px 32px rgba(28,32,40,0.16), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(28,32,40,0.1)",
  active: `0 0 0 2px rgba(30,111,232,0.85), 0 8px 18px rgba(28,32,40,0.16), 0 16px 32px rgba(28,32,40,0.12)`,
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
      active ? "rgba(30,111,232,0.45)" : "rgba(28,32,40,0.14)"
    }`,
    background: y2k.artGradient,
    boxShadow: active
      ? artShadow.active
      : `${artShadow.raised}, 0 0 0 1px rgba(255,255,255,0.4)`,
  };
}

/** Home rhythm — iTunes shelves: large title, tight title-to-rail. */
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
 * Section title — iTunes source / library shelf header.
 */
export const sectionTitle = {
  ...type.title2,
  color: color.ink,
  margin: 0,
  textTransform: "none",
};

/** Home band titles — same Lucida/Helvetica stack as every other shelf. */
export const sectionTitlePoster = {
  ...sectionTitle,
};

export const sectionSubtitle = {
  ...type.subhead,
  margin: "3px 0 0",
  color: color.muted,
};

/** Quiet label above a Home band title — iTunes date/caption. */
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

/** iPod bezel + LCD used by the Home stage and dock. */
export const broadcast = {
  bezelBorder: "1px solid rgba(28,32,40,0.14)",
  bezelShadow: `
    inset 0 1px 0 rgba(255,255,255,0.95),
    inset 0 -1px 0 rgba(28,32,40,0.1),
    inset 1px 0 0 rgba(255,255,255,0.5),
    inset -1px 0 0 rgba(28,32,40,0.06),
    0 18px 40px rgba(28,32,40,0.14)
  `,
  lcdTrack: "rgba(111,191,58,0.18)",
  lcdFill:
    "linear-gradient(90deg, rgba(111,191,58,0.6) 0%, rgba(111,191,58,0.95) 55%, rgba(244,246,248,0.95) 100%)",
  lcdGlow: "0 0 8px rgba(111,191,58,0.4)",
};

/** Circular chrome glass control — header / Explore / Charts. */
export function chromeIconButton(size = 36) {
  return {
    width: size,
    height: size,
    padding: 0,
    borderRadius: "50%",
    border: "1px solid rgba(28,32,40,0.12)",
    background:
      "linear-gradient(180deg, #FFFFFF 0%, #E8EBEF 55%, #D4D8E0 100%)",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.95), 0 1px 3px rgba(28,32,40,0.12)",
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

/** Frosted glass control — header buttons, view-all, CH bugs. */
export function glassPill(opts = {}) {
  const active = opts.active === true;
  const compact = opts.compact === true;
  return {
    border: `1px solid ${
      active ? "rgba(30,111,232,0.45)" : "rgba(28,32,40,0.12)"
    }`,
    background: active
      ? "linear-gradient(180deg, #6FB4F8 0%, #1E6FE8 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(232,236,242,0.78) 100%)",
    backdropFilter: "blur(18px) saturate(1.15)",
    WebkitBackdropFilter: "blur(18px) saturate(1.15)",
    boxShadow: active
      ? "inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 12px rgba(30,111,232,0.28)"
      : "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(28,32,40,0.08), 0 3px 10px rgba(28,32,40,0.08)",
    color: active ? "#FFFFFF" : color.ink,
    borderRadius: compact ? 980 : radius.md,
    WebkitTapHighlightColor: "transparent",
  };
}

/** Floating premium dock — aluminum iPod chassis for mini-player + tabs. */
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

/** Quiet elevated panel — hairline edge + blur over the aluminum floor. */
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
      inset 0 1px 0 rgba(255,255,255,0.9),
      inset 0 -1px 0 rgba(28,32,40,0.1),
      inset 1px 0 0 rgba(255,255,255,0.4),
      inset -1px 0 0 rgba(28,32,40,0.06),
      ${glass.shadow}
    `,
    backdropFilter: glass.blurSoft,
    WebkitBackdropFilter: glass.blurSoft,
  };
}

/** Hairline iTunes separator. */
export function sectionRule(inset = homeSpace.gutter) {
  return {
    height: 1,
    margin: `0 ${inset}px`,
    border: "none",
    background:
      "linear-gradient(90deg, transparent 0%, rgba(28,32,40,0.06) 18%, rgba(28,32,40,0.14) 50%, rgba(28,32,40,0.06) 82%, transparent 100%)",
  };
}

export const motion = {
  fast: "0.15s",
  base: "0.24s",
  settle: "0.32s",
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
};

/** Daylight aluminum that shifts with the hour — always light, never OLED. */
export function timeOfDayGradient(date = new Date()) {
  const h = date.getHours();
  const late = h >= 22 || h <= 4;
  const dawn = h >= 5 && h <= 8;
  const day = h >= 9 && h <= 16;
  if (late) {
    return `radial-gradient(ellipse at 50% -10%, #EEF1F6 0%, #DDE2EA 42%, #E6E9EF 100%)`;
  }
  if (dawn) {
    return `radial-gradient(ellipse at 70% 0%, #F6F1EA 0%, #E6E9EF 48%, #E3E7EE 100%)`;
  }
  if (day) {
    return `radial-gradient(ellipse at 40% -5%, #F7F8FA 0%, #E8EBEF 50%, #E6E9EF 100%)`;
  }
  return `radial-gradient(ellipse at 55% 0%, #F0F3F8 0%, #E2E6ED 45%, #E6E9EF 100%)`;
}

/** Brushed light-aluminum wash for chrome bands / Cover Stage / iTunes titlebar. */
export function aluminumGradient() {
  return `
    linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 44%),
    linear-gradient(180deg, #F7F8FA 0%, #D8DCE3 48%, #C5CAD3 100%)
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

/** App shell — pearl iTunes window, no neon bloom. */
export const APP_STYLE = {
  fontFamily: font,
  background: `
    radial-gradient(ellipse 110% 55% at 50% -18%, rgba(255,255,255,0.7) 0%, transparent 52%),
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
  background: "rgba(255,255,255,0.88)",
  color: color.ink,
  fontSize: 16,
  fontFamily: font,
  boxShadow: `inset 0 1px 0 ${glass.highlight}, inset 0 2px 6px rgba(28,32,40,0.06)`,
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
  outline: "none",
  transition: `border-color ${motion.base} ${motion.ease}, box-shadow ${motion.base} ${motion.ease}, background ${motion.base}`,
};

/** Primary CTA — Aqua iTunes button, white inscription. */
export const BTN_PRIMARY = {
  width: "100%",
  padding: "14px 22px",
  borderRadius: radius.lg,
  border: `1px solid rgba(18, 64, 150, 0.35)`,
  background: `
    linear-gradient(180deg, rgba(255,255,255,0.28) 0%, transparent 42%),
    linear-gradient(180deg, #6FB4F8 0%, #1E6FE8 100%)
  `,
  color: color.onAccent,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: font,
  letterSpacing: -0.15,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.45), 0 6px 16px rgba(30,111,232,0.28)`,
  transition: `transform ${motion.fast} ${motion.ease}, box-shadow ${motion.base}, opacity ${motion.fast}`,
};

/** Secondary CTA — click-wheel aluminum plate. */
export const BTN_SECONDARY = {
  width: "100%",
  padding: "14px 22px",
  borderRadius: radius.lg,
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
