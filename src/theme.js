// Design tokens — broadcast glass MP3 player.
// Deep cool black, flat soft-filled controls, one silver signal, one broadcast red.
// Album art supplies all hue. Type does the MTV work: condensed caps, hard-edged plates.
// Legacy keys (trim.lime/teal/blue, neons.*, y2k.cyan) now all resolve to steel greys.

/** Bump this when the visual OS changes. Copied into public/index.html + the shipped build. */
export const STYLE_CHASSIS = "wavclub-night-20261028";

/** Chrome specular — cool pearl steel, never pure white. */
const SPEC = "241, 229, 215";
/** Deep shade — cooler than the canvas, never the retired void. */
const SHADE = "11, 9, 9";

export const fontDisplay =
  '"Nippo", "Outfit", "IBM Plex Sans", "Lucida Grande", "Helvetica Neue", Helvetica, Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif';
export const font = fontDisplay;
export const fontMono =
  '"Courier New", Courier, "IBM Plex Mono", ui-monospace, "SF Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace';
export const fontPoster =
  '"Tanker", "Barlow Condensed", "Nippo", "Outfit", sans-serif';
/** LCD / now-playing readout — firmware voice. */
export const fontLcd = fontMono;

/**
 * Compact device type scale.
 * Tracking is optical: tight on large titles, open on captions.
 */
export const type = {
  largeTitle: {
    fontFamily: fontPoster,
    fontSize: 64,
    fontWeight: 400,
    letterSpacing: -0.4,
    lineHeight: 0.84,
  },
  title1: {
    fontFamily: fontPoster,
    fontSize: 44,
    fontWeight: 400,
    letterSpacing: -0.3,
    lineHeight: 0.86,
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
    fontSize: 12,
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
 * Signal trim — silver. Never a page fill.
 * `lime` is a legacy key; it is steel so PlayKey (`color.lcdSignal`) never matches it.
 */
export const trim = {
  lime: "#C4B5A6",
  teal: "#F74D7A",
  blue: "#F74D7A",
  blueDeep: "#E4D5C6",
  gradient: "linear-gradient(90deg, #C4B5A6 0%, #E4D5C6 50%, #F1E5D7 100%)",
};

/**
 * Neon signal palette — thin border, glow, pip. Never a background fill.
 */
export const neons = {
  cyan:    "#C4B5A6",
  cyanGlow: "rgba(168,180,198,0.22)",
  violet:  "#C4B5A6",
  violetGlow: "rgba(154,164,182,0.20)",
  lime:    "#C4B5A6",
  limeGlow: "rgba(154,164,182,0.20)",
  red:     "#F74D7A",
  redGlow: "rgba(224,49,74,0.32)",
  orange:  "#E05830",
  orangeGlow: "rgba(224,88,48,0.28)",
  phosphor: "#C4B5A6",
  phosphorGlow: "rgba(168,180,198,0.26)",
};

/**
 * Steel face with a quiet neon stroke (2px default).
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
 * Color is a trim: quiet-blue LCD rings. Not a fill.
 */
export const color = {
  ink: "#F1E5D7",
  body: "#E4D5C6",
  muted: "#C4B5A6",
  /** Quietest text grey — still ≥4.5:1 on every dark surface (canvas → raised). */
  faint: "#A89888",
  line: "rgba(241, 229, 215, 0.22)",
  lineStrong: "rgba(241, 229, 215, 0.48)",
  surface: "rgba(24, 29, 36, 0.84)",
  surfaceSolid: "rgba(24, 29, 36, 0.96)",
  surfaceRaised: "#221C19",
  canvas: "#0B0909",
  canvasEdge: "#070605",
  /** Silver signal — pip, progress, selected. Never a page fill. */
  accent: "#F74D7A",
  accentSoft: "rgba(247, 77, 122, 0.16)",
  accentGlow: "rgba(247, 77, 122, 0.34)",
  onAccent: "#141414",
  cta: "#F74D7A",
  onCta: "#141414",
  onDark: "#F1E5D7",
  onDarkMuted: "rgba(200,210,222,0.62)",
  /** Live — the only non-grey signal */
  alert: "#F74D7A",
  station: "#161311",
  select: "rgba(168,180,198, 0.10)",
  selectStrong: "rgba(168,180,198, 0.18)",
  lcdInk: "#F1E5D7",
  lcdMute: "#C4B5A6",
  lcdSignal: "#F74D7A",
  lcdSignalGlow: "rgba(247, 77, 122, 0.42)",
  lcdSignalSoft: "rgba(247, 77, 122, 0.18)",
  /** Meta on the dark metal strip / dock (not the well) */
  stripInk: "#D8DFE8",
};

/**
 * Station / broadcast chrome — pearl over obsidian, ice for signal.
 */
export const chrome = {
  hot: "#F74D7A",
  bright: "#F1E5D7",
  steel: "#A89888",
  plate: "#161311",
  deep: "#070605",
  live: "#F74D7A",
  signal: "#F74D7A",
  inkPlate: "#F1E5D7",
  hotRgb: "247,77,122",
  brightRgb: "241,229,215",
  liveRgb: "247,77,122",
  cyanRgb: "247,77,122",
};

/**
 * Smoked steel glass — station chat on the same night chassis.
 */
export const ice = {
  frost: "rgba(24, 29, 36, 0.78)",
  frostStrong: "rgba(30, 36, 44, 0.94)",
  rim: "rgba(168,180,198, 0.22)",
  rimSoft: "rgba(200, 210, 222, 0.12)",
  glow: "rgba(168,180,198, 0.10)",
  mist: "rgba(18, 22, 28, 0.9)",
  pane: `
    linear-gradient(180deg, rgba(${SPEC},0.14) 0%, rgba(24,29,36,0.32) 28%, transparent 58%),
    linear-gradient(165deg, rgba(30,36,44,0.96) 0%, rgba(18,22,28,0.94) 100%)
  `,
  thread: `
    radial-gradient(120% 80% at 50% -10%, rgba(168,180,198,0.06) 0%, transparent 46%),
    linear-gradient(180deg, #161311 0%, #0B0909 100%)
  `,
  bubble: "rgba(168,180,198, 0.08)",
  bubbleMine: "rgba(168,180,198, 0.12)",
  ink: "#F1E5D7",
  mute: "rgba(197, 203, 214, 0.62)",
  pip: "#C4B5A6",
};

/**
 * Cool metal + ice signal. Cyan is ice on dark — never a page fill.
 */
export const y2k = {
  chrome: "#E4D5C6",
  chromeBright: "#F1E5D7",
  chromeMid: "#C4B5A6",
  chromeDeep: "#A89888",
  chromeSoft: "rgba(168, 178, 192, 0.12)",
  chromeGlow: "rgba(168, 178, 192, 0.22)",
  chromeWash: "rgba(168, 178, 192, 0.18)",
  cyan: "#C4B5A6",
  cyanSoft: "rgba(168,180,198, 0.12)",
  cyanGlow: "rgba(168,180,198, 0.20)",
  techBlue: "#C4B5A6",
  techBlueSoft: "rgba(168,180,198, 0.12)",
  neon: "#C4B5A6",
  neonSoft: "rgba(154,164,182, 0.12)",
  magenta: "#F74D7A",
  magentaSoft: "rgba(224, 49, 74, 0.14)",
  /** Pearl inscription on obsidian */
  offWhite: "#F1E5D7",
  charcoal: "#161311",
  charcoalRaised: "#2A2420",
  graphite: "#0B0909",
  nearBlack: "#070605",
  metal: "#221C19",
  lightMetal: "#2A2420",
  live: "#F74D7A",
  inkGlass: "rgba(18, 22, 28, 0.86)",
  inkGlassSoft: "rgba(18, 22, 28, 0.58)",
  artGradient:
    "radial-gradient(120% 90% at 20% 0%, rgba(200,210,222,0.16) 0%, transparent 55%), radial-gradient(100% 80% at 90% 100%, rgba(168,180,198,0.10) 0%, transparent 60%), linear-gradient(160deg, #221C19 0%, #070605 100%)",
};

/**
 * Radio / media-player module surfaces — one aluminum chassis.
 * LCD is a smoked-steel inset; chassis around it is the same cool metal as the page.
 */
export const radio = {
  radius: 4,
  radiusTight: 12,
  radiusControl: 980,
  radiusLcd: 14,
  border: "1px solid rgba(200,210,222,0.12)",
  borderLive: "1px solid rgba(168,180,198,0.28)",
  borderQuiet: "1px solid rgba(200,210,222,0.08)",
  borderChrome: "1px solid rgba(200,210,222,0.18)",
  glassFace: `
    linear-gradient(165deg, rgba(${SPEC},0.05) 0%, rgba(${SPEC},0.04) 38%, transparent 68%),
    linear-gradient(145deg, rgba(30,36,44,0.96) 0%, rgba(18,22,28,0.94) 100%)
  `,
  glassFaceLive: `
    radial-gradient(120% 80% at 0% 0%, rgba(168,180,198,0.12) 0%, transparent 45%),
    linear-gradient(165deg, rgba(${SPEC},0.05) 0%, rgba(${SPEC},0.05) 36%, transparent 70%),
    linear-gradient(145deg, rgba(30,36,44,0.96) 0%, rgba(18,22,28,0.94) 100%)
  `,
  glassBlur: "blur(28px) saturate(1.08)",
  glassShadow:
    `inset 0 1px 0 rgba(${SPEC},0.05), inset 0 -1px 0 rgba(${SHADE},0.55), 0 12px 28px rgba(${SHADE},0.55), 0 0 0 1px rgba(${SPEC},0.08)`,
  glassShadowLive:
    `inset 0 1px 0 rgba(${SPEC},0.05), inset 0 -1px 0 rgba(${SHADE},0.55), 0 0 28px rgba(168,180,198,0.14), 0 14px 32px rgba(${SHADE},0.5), 0 0 0 1px rgba(168,180,198,0.22)`,
  lcdFace: `
    radial-gradient(90% 70% at 18% 0%, rgba(213,220,230,0.07) 0%, transparent 55%),
    linear-gradient(180deg, #100E0C 0%, #0B0909 100%)
  `,
  lcdBorder: "1px solid rgba(255,255,255,0.08)",
  lcdShadow:
    `inset 0 2px 8px rgba(${SHADE},0.6), 0 0 0 1px rgba(${SHADE},0.35)`,
  moduleFace: `
    linear-gradient(180deg, rgba(${SPEC},0.05) 0%, rgba(${SPEC},0.04) 36%, transparent 70%),
    linear-gradient(145deg, rgba(30,36,44,0.96) 0%, rgba(18,22,28,0.94) 100%)
  `,
  moduleFaceLive: `
    linear-gradient(180deg, rgba(168,180,198,0.10) 0%, transparent 42%),
    linear-gradient(180deg, rgba(${SPEC},0.05) 0%, rgba(${SPEC},0.04) 36%, transparent 70%),
    linear-gradient(145deg, rgba(30,36,44,0.97) 0%, rgba(18,22,28,0.95) 100%)
  `,
  moduleShadow:
    `inset 0 1px 0 rgba(${SPEC},0.05), inset 0 -1px 0 rgba(${SHADE},0.5), 0 8px 20px rgba(${SHADE},0.4)`,
  moduleShadowLive:
    `inset 0 1px 0 rgba(${SPEC},0.05), inset 0 -1px 0 rgba(${SHADE},0.5), 0 0 0 1px rgba(168,180,198,0.2), 0 0 22px rgba(168,180,198,0.12), 0 10px 24px rgba(${SHADE},0.42)`,
  stripFace: `
    linear-gradient(180deg, rgba(${SPEC},0.05) 0%, rgba(${SPEC},0.03) 42%, transparent 100%),
    rgba(24,29,36,0.94)
  `,
  stripFaceLive: `
    linear-gradient(180deg, rgba(168,180,198,0.10) 0%, transparent 48%),
    linear-gradient(180deg, rgba(${SPEC},0.05) 0%, transparent 40%),
    rgba(24,29,36,0.96)
  `,
  stripShadow:
    `inset 0 1px 0 rgba(${SPEC},0.05), inset 0 -1px 0 rgba(${SHADE},0.45), 0 4px 12px rgba(${SHADE},0.36)`,
  stripShadowLive:
    `inset 0 1px 0 rgba(${SPEC},0.05), inset 0 -1px 0 rgba(${SHADE},0.45), 0 0 18px rgba(168,180,198,0.14), 0 6px 14px rgba(${SHADE},0.4)`,
  tuneFace: `
    linear-gradient(180deg, rgba(${SPEC},0.05) 0%, rgba(${SPEC},0.04) 34%, transparent 55%),
    linear-gradient(165deg, #221C19 0%, #161311 42%, #0B0909 100%)
  `,
  tuneFacePressed: `
    linear-gradient(180deg, rgba(${SHADE},0.4) 0%, transparent 40%),
    linear-gradient(165deg, #0B0909 0%, #070605 50%, #050403 100%)
  `,
  tuneShadow:
    `inset 0 1px 0 rgba(${SPEC},0.05), inset 0 -1px 0 rgba(${SHADE},0.5), 0 6px 14px rgba(${SHADE},0.42)`,
  tuneShadowPressed:
    `inset 0 2px 4px rgba(${SHADE},0.7), inset 0 1px 0 rgba(${SHADE},0.4)`,
  lcdTrack: "rgba(6,10,16,0.55)",
  lcdFill:
    "linear-gradient(90deg, #F74D7A 0%, #F1E5D7 100%)",
  lcdGlow: "0 0 12px rgba(213,220,230, 0.32)",
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
  fill: "rgba(24, 29, 36, 0.62)",
  fillStrong: "rgba(30, 36, 44, 0.86)",
  fillQuiet: "rgba(18, 22, 28, 0.42)",
  fillHeavy: "rgba(24, 29, 36, 0.92)",
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
    `linear-gradient(160deg, rgba(${SPEC},0.18) 0%, rgba(30,36,44,0.92) 42%, rgba(18,22,28,0.96) 100%)`,
  plate:
    `linear-gradient(165deg, rgba(30,36,44,0.96) 0%, rgba(24,29,36,0.96) 55%, rgba(12,15,19,0.94) 100%)`,
  frame:
    "linear-gradient(180deg, #221C19 0%, #0B0909 48%, #070605 100%)",
};

/** Flat, unblurred controls — soft white-on-black fills, no chamfer. */
export const hardware = {
  radius: 0,
  keyFace:
    `linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)`,
  keyRaised:
    `inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 2px rgba(${SHADE},0.4)`,
  keyPressed:
    `inset 0 2px 5px rgba(${SHADE},0.6)`,
  plateEdge:
    `inset 0 1px 0 rgba(${SPEC},0.16), inset 0 -1px 0 rgba(${SHADE},0.45)`,
  rule:
    `linear-gradient(90deg, transparent, rgba(168,180,198,0.22), transparent)`,
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
    border: "1px solid rgba(255,255,255,0.10)",
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

/** Sleeves float — soft depth, no bevel. The art is the colour. */
export const artShadow = {
  quiet: "4px 4px 0 #F1E5D7",
  raised: "6px 6px 0 #F1E5D7",
  active: "6px 6px 0 #F74D7A",
};

/**
 * Shared art frame — hairline edge, soft floating shadow.
 * Use on Home tiles, channels, stacks, and featured releases.
 */
export function artFrameStyle({
  size,
  active = false,
  radius: frameRadius = 0,
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
    border: `3px solid ${active ? color.lcdSignal : "#F1E5D7"}`,
    background: y2k.artGradient,
    boxShadow: active ? artShadow.active : artShadow.raised,
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

/** Home band titles — music-television block lettering. */
export const sectionTitlePoster = {
  ...sectionTitle,
  fontFamily: fontPoster,
  fontSize: 42,
  fontWeight: 400,
  letterSpacing: -0.2,
  lineHeight: 0.86,
  textTransform: "uppercase",
  textShadow: "0.045em 0.045em 0 #F74D7A",
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
    "linear-gradient(90deg, #F74D7A 0%, #F1E5D7 100%)",
  lcdGlow: "0 0 12px rgba(213,220,230, 0.32)",
};

/** Hardware icon key — header / Explore / Charts. */
export function chromeIconButton(size = 36) {
  return {
    width: size,
    height: size,
    padding: 0,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.09)",
    background: "rgba(255,255,255,0.07)",
    boxShadow: "none",
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

/**
 * Chip / tab. Flat soft fill at rest; the selected one is a solid pearl plate
 * with dark ink — unmistakable at a glance, and no blur to paint.
 */
export function glassPill(opts = {}) {
  const active = opts.active === true;
  const compact = opts.compact === true;
  return {
    border: `2px solid ${active ? color.ink : "rgba(241,229,215,0.45)"}`,
    background: active ? color.ink : "transparent",
    boxShadow: active ? "3px 3px 0 #F1E5D7" : "none",
    color: active ? color.onAccent : color.ink,
    borderRadius: 0,
    WebkitTapHighlightColor: "transparent",
  };
}

/** Floating dock — frosted mini-device + tabs. */
export const dock = {
  insetX: 0,
  insetBottom: 0,
  radius: 2,
  tabH: 54,
  /** Compact now-playing bar (cover + title + play). Pace lives on the full decks. */
  playerH: 56,
  /** Content clearances (tabs only / with player), excluding safe-area. */
  clearTabs: 80,
  clearPlayer: 148,
};

/** Prefer radio.radius for media modules; keep these for sheets / legacy chrome. */
export const radius = { sm: 0, md: 2, lg: 2, xl: 2, pill: 0 };

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
  borderRadius: 0,
  border: "2px solid #F1E5D7",
  background: "#0B0909",
  boxShadow: "6px 6px 0 #F1E5D7",
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
      "linear-gradient(90deg, transparent 0%, rgba(168,180,198,0.06) 18%, rgba(200,210,222,0.18) 50%, rgba(168,180,198,0.06) 82%, transparent 100%)",
  };
}

/** MTV broadcast graphics — hard-edged plates and one hot red. Type does the rest. */
export const mtv = {
  hot: color.alert,
  hotRgb: "247,77,122",
  plate: "#F1E5D7",
  plateInk: "#141414",
  /** Condensed-caps tracking for bugs, IDs and crawls. */
  caps: 0.14,
};

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
    return `radial-gradient(ellipse at 50% -10%, #161311 0%, #0B0909 42%, #070605 100%)`;
  }
  if (dawn) {
    return `radial-gradient(ellipse at 70% 0%, #221C19 0%, #0B0909 48%, #100E0C 100%)`;
  }
  if (day) {
    return `radial-gradient(ellipse at 40% -5%, #2A2420 0%, #0B0909 50%, #070605 100%)`;
  }
  return `radial-gradient(ellipse at 55% 0%, #1A1614 0%, #0B0909 45%, #070605 100%)`;
}

/** Brushed steel wash for chrome bands / Cover Stage. */
export function aluminumGradient() {
  return `
    linear-gradient(180deg, rgba(${SPEC},0.10) 0%, transparent 44%),
    linear-gradient(180deg, #221C19 0%, #0B0909 48%, #070605 100%)
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
  background: "rgba(12, 15, 19, 0.88)",
  color: color.ink,
  fontSize: 16,
  fontFamily: font,
  boxShadow: `inset 0 1px 0 ${glass.highlight}, inset 0 2px 6px rgba(${SHADE},0.16)`,
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
  outline: "none",
  transition: `border-color ${motion.base} ${motion.ease}, box-shadow ${motion.base} ${motion.ease}, background ${motion.base}`,
};

/** Primary CTA — wavclub spot pink, near-black type, hard offset. */
export const BTN_PRIMARY = {
  width: "100%",
  padding: "10px 20px 8px",
  borderRadius: 0,
  border: "3px solid #141414",
  background: "#F74D7A",
  color: "#141414",
  fontSize: 22,
  fontWeight: 400,
  cursor: "pointer",
  fontFamily: fontPoster,
  letterSpacing: 0.02,
  textTransform: "uppercase",
  boxShadow: "4px 4px 0 #141414",
  transition: `transform ${motion.fast} ${motion.ease}, box-shadow ${motion.base}`,
};

/** Dark pill used by Find / Search fields. */
export const SEARCH_FIELD = {
  ...INPUT_ST,
  borderRadius: 0,
  border: "3px solid #F1E5D7",
  background: "transparent",
  boxShadow: "none",
};

/** Secondary CTA — outlined cream plate with a hard offset. */
export const BTN_SECONDARY = {
  width: "100%",
  padding: "10px 18px 8px",
  borderRadius: 0,
  border: "3px solid #F1E5D7",
  background: "transparent",
  color: "#F1E5D7",
  fontSize: 18,
  fontWeight: 400,
  cursor: "pointer",
  fontFamily: fontPoster,
  letterSpacing: 0.02,
  textTransform: "uppercase",
  boxShadow: "3px 3px 0 #F1E5D7",
  transition: `transform ${motion.fast} ${motion.ease}, box-shadow ${motion.base}`,
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
