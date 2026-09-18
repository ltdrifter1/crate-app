// Design tokens — alternate-2003 MP3 device.
// Light steel chassis, graphite inscription, no neon.
// IBM Plex Sans + Mono (technical, not costume iTunes Lucida).

/** Bump this when the visual OS changes. Copied into public/index.html + the shipped build. */
export const STYLE_CHASSIS = "steel-y2k-20260918";

export const fontDisplay =
  '"IBM Plex Sans", "Lucida Grande", "Helvetica Neue", Helvetica, Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif';
export const font = fontDisplay;
export const fontMono =
  '"IBM Plex Mono", ui-monospace, "SF Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace';
export const fontPoster = fontDisplay;
/** LCD / now-playing readout — firmware voice. */
export const fontLcd = fontMono;

/**
 * Compact device type scale.
 * Tracking is optical: tight on large titles, open on captions.
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
 * Brand palette — pearl steel, graphite ink. Album art supplies colour.
 * Acid green and Aqua are retired.
 */
export const color = {
  ink: "#1C2028",
  body: "#3E4552",
  muted: "#6B7380",
  faint: "#8B939F",
  line: "rgba(28, 32, 40, 0.12)",
  lineStrong: "rgba(28, 32, 40, 0.18)",
  surface: "rgba(247, 248, 250, 0.78)",
  surfaceSolid: "rgba(244, 245, 247, 0.96)",
  surfaceRaised: "#F7F8FA",
  canvas: "#E4E7EE",
  canvasEdge: "#D4D8E0",
  /** Graphite steel — glyphs, pip, progress, focus, selected */
  accent: "#5A6270",
  accentSoft: "rgba(90, 98, 112, 0.14)",
  accentGlow: "rgba(90, 98, 112, 0.22)",
  onAccent: "#F4F5F7",
  onDark: "#F4F6F8",
  onDarkMuted: "rgba(28,32,40,0.62)",
  /** Broadcast red — LIVE + destructive only */
  alert: "#E0314A",
  station: "#EEF0F4",
  /** Selected-row wash */
  select: "rgba(90, 98, 112, 0.12)",
  selectStrong: "rgba(90, 98, 112, 0.22)",
};

/**
 * Station / broadcast chrome — silver over pearl, graphite for signal.
 */
export const chrome = {
  hot: "#6B7380",
  bright: "#F7F8FA",
  steel: "#7A8290",
  plate: "#F2F3F6",
  deep: "#C5CAD3",
  live: "#E0314A",
  signal: "#5A6270",
  inkPlate: "#1C2028",
  hotRgb: "107,115,128",
  brightRgb: "247,248,250",
  liveRgb: "224,49,74",
  cyanRgb: "90,98,112",
};

/**
 * Frosted pearl glass — station chat on a steel chassis.
 */
export const ice = {
  frost: "rgba(247, 248, 250, 0.78)",
  frostStrong: "rgba(244, 245, 247, 0.94)",
  rim: "rgba(90, 98, 112, 0.28)",
  rimSoft: "rgba(90, 98, 112, 0.14)",
  glow: "rgba(90, 98, 112, 0.12)",
  mist: "rgba(228, 231, 238, 0.9)",
  pane: `
    linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(244,245,247,0.42) 28%, transparent 58%),
    linear-gradient(165deg, rgba(247,248,250,0.96) 0%, rgba(228,231,238,0.94) 100%)
  `,
  thread: `
    radial-gradient(120% 80% at 50% -10%, rgba(90,98,112,0.08) 0%, transparent 46%),
    linear-gradient(180deg, #F4F5F7 0%, #E4E7EE 100%)
  `,
  bubble: "rgba(90, 98, 112, 0.08)",
  bubbleMine: "rgba(90, 98, 112, 0.16)",
  ink: "#1C2028",
  mute: "rgba(62, 69, 82, 0.72)",
  pip: "#5A6270",
};

/**
 * Light metal + graphite signal. Cyan/neon aliases stay for existing call sites.
 */
export const y2k = {
  chrome: "#C5CAD3",
  chromeBright: "#F7F8FA",
  chromeMid: "#8B939F",
  chromeDeep: "#6B7380",
  chromeSoft: "rgba(90, 98, 112, 0.12)",
  chromeGlow: "rgba(90, 98, 112, 0.18)",
  chromeWash: "rgba(197, 202, 211, 0.28)",
  cyan: "#5A6270",
  cyanSoft: "rgba(90, 98, 112, 0.14)",
  cyanGlow: "rgba(90, 98, 112, 0.22)",
  techBlue: "#5A6270",
  techBlueSoft: "rgba(90, 98, 112, 0.12)",
  neon: "#5A6270",
  neonSoft: "rgba(90, 98, 112, 0.14)",
  magenta: "#E0314A",
  magentaSoft: "rgba(224, 49, 74, 0.12)",
  /** Headline colour on the steel chassis (legacy name) */
  offWhite: "#1C2028",
  charcoal: "#F2F3F6",
  charcoalRaised: "#F7F8FA",
  graphite: "#E4E7EE",
  nearBlack: "#D4D8E0",
  metal: "#C5CAD3",
  lightMetal: "#F4F5F7",
  live: "#E0314A",
  inkGlass: "rgba(247, 248, 250, 0.82)",
  inkGlassSoft: "rgba(247, 248, 250, 0.55)",
  artGradient:
    "radial-gradient(120% 90% at 20% 0%, rgba(255,255,255,0.7) 0%, transparent 55%), radial-gradient(100% 80% at 90% 100%, rgba(90,98,112,0.08) 0%, transparent 60%), linear-gradient(160deg, #F4F5F7 0%, #D4D8E0 100%)",
};

/**
 * Radio / media-player module surfaces — iPod Mini chassis + frosted glass.
 * LCD is a graphite inset; chassis around it is light steel.
 */
export const radio = {
  /** 8–14px engineered corners — never pill */
  radius: 12,
  radiusTight: 8,
  radiusControl: 8,
  radiusLcd: 6,
  border: "1px solid rgba(28,32,40,0.12)",
  borderLive: "1px solid rgba(90,98,112,0.45)",
  borderQuiet: "1px solid rgba(28,32,40,0.08)",
  borderChrome: "1px solid rgba(28,32,40,0.16)",
  glassFace: `
    linear-gradient(165deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.18) 38%, transparent 68%),
    linear-gradient(145deg, rgba(247,248,250,0.96) 0%, rgba(212,216,224,0.92) 100%)
  `,
  glassFaceLive: `
    radial-gradient(120% 80% at 0% 0%, rgba(90,98,112,0.10) 0%, transparent 45%),
    linear-gradient(165deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 36%, transparent 70%),
    linear-gradient(145deg, rgba(247,248,250,0.96) 0%, rgba(212,216,224,0.94) 100%)
  `,
  glassBlur: "blur(28px) saturate(1.15)",
  glassShadow:
    "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.45), 0 12px 28px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)",
  glassShadowLive:
    "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.45), 0 0 28px rgba(90,98,112,0.12), 0 14px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(90,98,112,0.22)",
  lcdFace: `
    linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 40%),
    linear-gradient(160deg, #3A414C 0%, #2A2E38 55%, #1C2028 100%)
  `,
  lcdBorder: "1px solid rgba(90, 98, 112, 0.22)",
  lcdShadow:
    "inset 0 2px 8px rgba(0,0,0,0.65), inset 0 1px 0 rgba(90,98,112,0.16), 0 0 0 1px rgba(255,255,255,0.06)",
  moduleFace: `
    linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.12) 36%, transparent 70%),
    linear-gradient(145deg, rgba(247,248,250,0.96) 0%, rgba(220,224,232,0.94) 100%)
  `,
  moduleFaceLive: `
    linear-gradient(180deg, rgba(90,98,112,0.08) 0%, transparent 42%),
    linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.12) 36%, transparent 70%),
    linear-gradient(145deg, rgba(247,248,250,0.97) 0%, rgba(220,224,232,0.95) 100%)
  `,
  moduleShadow:
    "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.35)",
  moduleShadowLive:
    "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.4), 0 0 0 1px rgba(90,98,112,0.2), 0 0 22px rgba(90,98,112,0.1), 0 10px 24px rgba(0,0,0,0.4)",
  stripFace: `
    linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.12) 42%, transparent 100%),
    rgba(247,248,250,0.82)
  `,
  stripFaceLive: `
    linear-gradient(180deg, rgba(90,98,112,0.10) 0%, transparent 48%),
    linear-gradient(180deg, rgba(255,255,255,0.55) 0%, transparent 40%),
    rgba(244,245,247,0.9)
  `,
  stripShadow:
    "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.28)",
  stripShadowLive:
    "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.4), 0 0 18px rgba(90,98,112,0.14), 0 6px 14px rgba(0,0,0,0.32)",
  tuneFace: `
    linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.12) 34%, transparent 55%),
    linear-gradient(165deg, #F4F5F7 0%, #D8DCE4 42%, #C5CAD3 100%)
  `,
  tuneFacePressed: `
    linear-gradient(180deg, rgba(0,0,0,0.12) 0%, transparent 40%),
    linear-gradient(165deg, #D4D8E0 0%, #C5CAD3 50%, #B4BAC4 100%)
  `,
  tuneShadow:
    "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.5), 0 6px 14px rgba(0,0,0,0.4)",
  tuneShadowPressed:
    "inset 0 2px 4px rgba(0,0,0,0.55), inset 0 1px 0 rgba(0,0,0,0.3)",
  lcdTrack: "rgba(90,98,112,0.18)",
  lcdFill:
    "linear-gradient(90deg, rgba(90,98,112,0.55) 0%, rgba(90,98,112,0.95) 70%, rgba(232,234,238,0.85) 100%)",
  lcdGlow: "0 0 10px rgba(90,98,112,0.4)",
  label: {
    fontFamily: font,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: -0.08,
    textTransform: "none",
  },
};

/** Pearl glass — hairline steel bezels, faint top light. */
export const glass = {
  fill: "rgba(247, 248, 250, 0.7)",
  fillStrong: "rgba(244, 245, 247, 0.92)",
  fillQuiet: "rgba(255, 255, 255, 0.45)",
  fillHeavy: "rgba(247, 248, 250, 0.96)",
  border: "rgba(28, 32, 40, 0.12)",
  borderSoft: "rgba(28, 32, 40, 0.08)",
  borderFaint: "rgba(28, 32, 40, 0.06)",
  highlight: "rgba(255, 255, 255, 0.72)",
  blur: "blur(32px) saturate(1.12)",
  blurSoft: "blur(20px) saturate(1.08)",
  blurHeavy: "blur(48px) saturate(1.1)",
  blurEdge: "blur(24px) saturate(1.08)",
  shadow: "0 14px 36px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.28)",
  shadowSoft: "0 8px 22px rgba(0, 0, 0, 0.32)",
  shadowLift: "0 18px 40px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)",
  chrome:
    "linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(228,231,238,0.88) 42%, rgba(212,216,224,0.94) 100%)",
  plate:
    "linear-gradient(165deg, rgba(247,248,250,0.96) 0%, rgba(236,238,243,0.94) 55%, rgba(228,231,238,0.92) 100%)",
  frame:
    "linear-gradient(180deg, #F7F8FA 0%, #E8EAEE 48%, #D4D8E0 100%)",
};

/** Hard, unblurred controls — aluminum keys. */
export const hardware = {
  radius: 6,
  keyFace:
    "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.15) 38%, transparent 100%), linear-gradient(145deg, #F4F5F7 0%, #D8DCE4 48%, #C5CAD3 100%)",
  keyRaised:
    "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.45), inset 1px 0 0 rgba(255,255,255,0.06), inset -1px 0 0 rgba(0,0,0,0.25)",
  keyPressed:
    "inset 0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(0,0,0,0.3)",
  plateEdge:
    "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.4)",
  rule:
    "linear-gradient(90deg, transparent, rgba(232,234,238,0.12), transparent)",
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
    border: "1px solid rgba(232,234,238,0.14)",
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

/** Jewel-case shadow — sleeves float over the dark studio. */
export const artShadow = {
  quiet: "0 2px 4px rgba(0,0,0,0.35), 0 10px 22px rgba(0,0,0,0.4)",
  raised:
    "0 4px 8px rgba(0,0,0,0.4), 0 16px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.4)",
  active: `0 0 0 2px rgba(90,98,112,0.9), 0 8px 18px rgba(0,0,0,0.4), 0 0 24px rgba(90,98,112,0.18)`,
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
    border: `1px solid ${
      active ? "rgba(90,98,112,0.55)" : "rgba(232,234,238,0.12)"
    }`,
    background: y2k.artGradient,
    boxShadow: active
      ? artShadow.active
      : `${artShadow.raised}, 0 0 0 1px rgba(255,255,255,0.06)`,
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
  bezelBorder: "1px solid rgba(232,234,238,0.12)",
  bezelShadow: `
    inset 0 1px 0 rgba(255,255,255,0.1),
    inset 0 -1px 0 rgba(0,0,0,0.45),
    0 18px 40px rgba(0,0,0,0.4)
  `,
  lcdTrack: "rgba(90,98,112,0.18)",
  lcdFill:
    "linear-gradient(90deg, rgba(90,98,112,0.65) 0%, rgba(90,98,112,0.95) 70%, rgba(232,234,238,0.85) 100%)",
  lcdGlow: "0 0 8px rgba(90,98,112,0.4)",
};

/** Hardware icon key — header / Explore / Charts. */
export function chromeIconButton(size = 36) {
  return {
    width: size,
    height: size,
    padding: 0,
    borderRadius: 8,
    border: "1px solid rgba(232,234,238,0.12)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.2) 55%, transparent 100%), linear-gradient(180deg, #F4F5F7 0%, #D4D8E0 100%)",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.14), 0 1px 3px rgba(0,0,0,0.4)",
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
      active ? "rgba(90,98,112,0.45)" : "rgba(232,234,238,0.12)"
    }`,
    background: active
      ? "rgba(90,98,112,0.12)"
      : "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(228,231,238,0.88) 100%)",
    backdropFilter: "blur(18px) saturate(1.15)",
    WebkitBackdropFilter: "blur(18px) saturate(1.15)",
    boxShadow: active
      ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(90,98,112,0.28)"
      : "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.4), 0 3px 10px rgba(0,0,0,0.28)",
    color: active ? color.accent : color.ink,
    borderRadius: compact ? 8 : radius.md,
    WebkitTapHighlightColor: "transparent",
  };
}

/** Floating dock — light metal chassis for mini-player + tabs. */
export const dock = {
  insetX: 14,
  insetBottom: 12,
  radius: 16,
  tabH: 54,
  playerH: 88,
  /** Content clearances (tabs only / with player), excluding safe-area. */
  clearTabs: 88,
  clearPlayer: 198,
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
      inset 0 1px 0 rgba(255,255,255,0.1),
      inset 0 -1px 0 rgba(0,0,0,0.4),
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
      "linear-gradient(90deg, transparent 0%, rgba(232,234,238,0.04) 18%, rgba(232,234,238,0.14) 50%, rgba(232,234,238,0.04) 82%, transparent 100%)",
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
    return `radial-gradient(ellipse at 50% -10%, #EEF0F4 0%, #E4E7EE 42%, #D8DCE4 100%)`;
  }
  if (dawn) {
    return `radial-gradient(ellipse at 70% 0%, #F2EFEA 0%, #E8EAEE 48%, #E4E7EE 100%)`;
  }
  if (day) {
    return `radial-gradient(ellipse at 40% -5%, #F7F8FA 0%, #E8EAEE 50%, #E4E7EE 100%)`;
  }
  return `radial-gradient(ellipse at 55% 0%, #ECEEF3 0%, #E4E7EE 45%, #D8DCE4 100%)`;
}

/** Brushed steel wash for chrome bands / Cover Stage. */
export function aluminumGradient() {
  return `
    linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 44%),
    linear-gradient(180deg, #F4F5F7 0%, #E4E7EE 48%, #D4D8E0 100%)
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

/** App shell — light steel chassis, graphite signal. */
export const APP_STYLE = {
  fontFamily: font,
  background: `
    radial-gradient(ellipse 110% 55% at 50% -18%, rgba(255,255,255,0.55) 0%, transparent 52%),
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
  background: "rgba(255, 255, 255, 0.88)",
  color: color.ink,
  fontSize: 16,
  fontFamily: font,
  boxShadow: `inset 0 1px 0 ${glass.highlight}, inset 0 2px 6px rgba(0,0,0,0.35)`,
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
  outline: "none",
  transition: `border-color ${motion.base} ${motion.ease}, box-shadow ${motion.base} ${motion.ease}, background ${motion.base}`,
};

/** Primary CTA — steel plate, pearl inscription. */
export const BTN_PRIMARY = {
  width: "100%",
  padding: "14px 22px",
  borderRadius: 8,
  border: `1px solid rgba(90, 98, 112, 0.55)`,
  background: `
    linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 42%),
    #5A6270
  `,
  color: color.onAccent,
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: font,
  letterSpacing: -0.15,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), 0 6px 16px rgba(90,98,112,0.18)`,
  transition: `transform ${motion.fast} ${motion.ease}, box-shadow ${motion.base}, opacity ${motion.fast}`,
};

/** Secondary CTA — dark metal plate. */
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
