// Design tokens — alternate-2003 MP3 device.
// One cool steel / chrome Y2K OS. No black void, no white page, no neon.
// IBM Plex Sans + Mono (technical, not costume iTunes Lucida).

/** Bump this when the visual OS changes. Copied into public/index.html + the shipped build. */
export const STYLE_CHASSIS = "steel-glass-20260918";

/** Chrome specular — cool pearl steel, never pure white. */
const SPEC = "216, 223, 232";
/** Graphite shade — cool metal, never pure black. */
const SHADE = "58, 66, 80";

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
 * Brand palette — one cool steel chassis. Album art supplies hue.
 * Acid green, Aqua, and black/white splits are retired.
 */
export const color = {
  ink: "#3D4654",
  body: "#4E5866",
  muted: "#6B7584",
  faint: "#87919F",
  line: "rgba(61, 70, 84, 0.16)",
  lineStrong: "rgba(61, 70, 84, 0.24)",
  surface: "rgba(206, 213, 222, 0.84)",
  surfaceSolid: "rgba(200, 208, 218, 0.96)",
  surfaceRaised: "#D0D6E0",
  canvas: "#C5CBD6",
  canvasEdge: "#B4BBC6",
  /** Cool steel — glyphs, pip, progress, focus, selected */
  accent: "#5B6574",
  accentSoft: "rgba(91, 101, 116, 0.18)",
  accentGlow: "rgba(91, 101, 116, 0.28)",
  onAccent: "#D8DFE8",
  onDark: "#D8DFE8",
  onDarkMuted: "rgba(61,70,84,0.62)",
  /** Broadcast live — the only non-steel signal */
  alert: "#E0314A",
  station: "#D0D6E0",
  select: "rgba(91, 101, 116, 0.14)",
  selectStrong: "rgba(91, 101, 116, 0.24)",
  /** Chrome glyphs on the recessed LCD well */
  lcdInk: "#D8DFE8",
  lcdMute: "#A7B1BE",
  /** Ice-glass LCD signal — luminous chrome, never green */
  lcdSignal: "#E8F1F8",
  lcdSignalGlow: "rgba(216, 223, 232, 0.62)",
  /** Meta on a light strip / dock (not the well) */
  stripInk: "#3D4654",
};

/**
 * Station / broadcast chrome — silver over steel, graphite for signal.
 */
export const chrome = {
  hot: "#6B7584",
  bright: "#D8DFE8",
  steel: "#7A8492",
  plate: "#D0D6E0",
  deep: "#A8B2C0",
  live: "#E0314A",
  signal: "#5B6574",
  inkPlate: "#3D4654",
  hotRgb: "107,117,132",
  brightRgb: "216,223,232",
  liveRgb: "224,49,74",
  cyanRgb: "91,101,116",
};

/**
 * Frosted steel glass — station chat on the same chassis.
 */
export const ice = {
  frost: "rgba(206, 213, 222, 0.78)",
  frostStrong: "rgba(200, 208, 218, 0.94)",
  rim: "rgba(91, 101, 116, 0.28)",
  rimSoft: "rgba(91, 101, 116, 0.14)",
  glow: "rgba(91, 101, 116, 0.12)",
  mist: "rgba(197, 203, 214, 0.9)",
  pane: `
    linear-gradient(180deg, rgba(${SPEC},0.55) 0%, rgba(208,214,224,0.32) 28%, transparent 58%),
    linear-gradient(165deg, rgba(208,214,224,0.96) 0%, rgba(197,203,214,0.94) 100%)
  `,
  thread: `
    radial-gradient(120% 80% at 50% -10%, rgba(91,101,116,0.08) 0%, transparent 46%),
    linear-gradient(180deg, #D0D6E0 0%, #C5CBD6 100%)
  `,
  bubble: "rgba(91, 101, 116, 0.08)",
  bubbleMine: "rgba(91, 101, 116, 0.16)",
  ink: "#3D4654",
  mute: "rgba(78, 88, 102, 0.72)",
  pip: "#5B6574",
};

/**
 * Cool metal + chrome signal. Cyan/neon aliases stay for existing call sites.
 */
export const y2k = {
  chrome: "#A8B2C0",
  chromeBright: "#D8DFE8",
  chromeMid: "#87919F",
  chromeDeep: "#6B7584",
  chromeSoft: "rgba(91, 101, 116, 0.12)",
  chromeGlow: "rgba(91, 101, 116, 0.18)",
  chromeWash: "rgba(168, 178, 192, 0.28)",
  cyan: "#5B6574",
  cyanSoft: "rgba(91, 101, 116, 0.14)",
  cyanGlow: "rgba(91, 101, 116, 0.22)",
  techBlue: "#5B6574",
  techBlueSoft: "rgba(91, 101, 116, 0.12)",
  neon: "#5B6574",
  neonSoft: "rgba(91, 101, 116, 0.14)",
  magenta: "#E0314A",
  magentaSoft: "rgba(224, 49, 74, 0.12)",
  /** Page inscription (legacy name — graphite on steel, not white) */
  offWhite: "#3D4654",
  charcoal: "#D0D6E0",
  charcoalRaised: "#D8DFE8",
  graphite: "#C5CBD6",
  nearBlack: "#B4BBC6",
  metal: "#A8B2C0",
  lightMetal: "#D0D6E0",
  live: "#E0314A",
  inkGlass: "rgba(208, 214, 224, 0.82)",
  inkGlassSoft: "rgba(208, 214, 224, 0.55)",
  artGradient:
    "radial-gradient(120% 90% at 20% 0%, rgba(216,223,232,0.55) 0%, transparent 55%), radial-gradient(100% 80% at 90% 100%, rgba(91,101,116,0.10) 0%, transparent 60%), linear-gradient(160deg, #D0D6E0 0%, #B4BBC6 100%)",
};

/**
 * Radio / media-player module surfaces — one aluminum chassis.
 * LCD is a smoked-steel inset; chassis around it is the same cool metal as the page.
 */
export const radio = {
  /** 8–14px engineered corners — never pill */
  radius: 12,
  radiusTight: 8,
  radiusControl: 8,
  radiusLcd: 6,
  border: "1px solid rgba(61,70,84,0.16)",
  borderLive: "1px solid rgba(91,101,116,0.45)",
  borderQuiet: "1px solid rgba(61,70,84,0.10)",
  borderChrome: "1px solid rgba(61,70,84,0.20)",
  glassFace: `
    linear-gradient(165deg, rgba(${SPEC},0.55) 0%, rgba(${SPEC},0.12) 38%, transparent 68%),
    linear-gradient(145deg, rgba(208,214,224,0.96) 0%, rgba(180,187,198,0.92) 100%)
  `,
  glassFaceLive: `
    radial-gradient(120% 80% at 0% 0%, rgba(91,101,116,0.10) 0%, transparent 45%),
    linear-gradient(165deg, rgba(${SPEC},0.6) 0%, rgba(${SPEC},0.14) 36%, transparent 70%),
    linear-gradient(145deg, rgba(208,214,224,0.96) 0%, rgba(180,187,198,0.94) 100%)
  `,
  glassBlur: "blur(28px) saturate(1.08)",
  glassShadow:
    `inset 0 1px 0 rgba(${SPEC},0.45), inset 0 -1px 0 rgba(${SHADE},0.18), 0 12px 28px rgba(${SHADE},0.22), 0 0 0 1px rgba(${SPEC},0.18)`,
  glassShadowLive:
    `inset 0 1px 0 rgba(${SPEC},0.45), inset 0 -1px 0 rgba(${SHADE},0.18), 0 0 28px rgba(91,101,116,0.12), 0 14px 32px rgba(${SHADE},0.22), 0 0 0 1px rgba(91,101,116,0.22)`,
  lcdFace: `
    linear-gradient(180deg, rgba(${SPEC},0.14) 0%, transparent 42%),
    linear-gradient(160deg, #6A7482 0%, #545E6C 55%, #4A5360 100%)
  `,
  lcdBorder: "1px solid rgba(91, 101, 116, 0.35)",
  lcdShadow:
    `inset 0 2px 8px rgba(${SHADE},0.35), inset 0 1px 0 rgba(${SPEC},0.18), 0 0 0 1px rgba(${SPEC},0.12)`,
  moduleFace: `
    linear-gradient(180deg, rgba(${SPEC},0.5) 0%, rgba(${SPEC},0.08) 36%, transparent 70%),
    linear-gradient(145deg, rgba(208,214,224,0.96) 0%, rgba(184,191,202,0.94) 100%)
  `,
  moduleFaceLive: `
    linear-gradient(180deg, rgba(91,101,116,0.08) 0%, transparent 42%),
    linear-gradient(180deg, rgba(${SPEC},0.5) 0%, rgba(${SPEC},0.08) 36%, transparent 70%),
    linear-gradient(145deg, rgba(208,214,224,0.97) 0%, rgba(184,191,202,0.95) 100%)
  `,
  moduleShadow:
    `inset 0 1px 0 rgba(${SPEC},0.45), inset 0 -1px 0 rgba(${SHADE},0.16), 0 8px 20px rgba(${SHADE},0.18)`,
  moduleShadowLive:
    `inset 0 1px 0 rgba(${SPEC},0.45), inset 0 -1px 0 rgba(${SHADE},0.16), 0 0 0 1px rgba(91,101,116,0.2), 0 0 22px rgba(91,101,116,0.1), 0 10px 24px rgba(${SHADE},0.2)`,
  stripFace: `
    linear-gradient(180deg, rgba(${SPEC},0.5) 0%, rgba(${SPEC},0.08) 42%, transparent 100%),
    rgba(208,214,224,0.92)
  `,
  stripFaceLive: `
    linear-gradient(180deg, rgba(91,101,116,0.10) 0%, transparent 48%),
    linear-gradient(180deg, rgba(${SPEC},0.4) 0%, transparent 40%),
    rgba(208,214,224,0.94)
  `,
  stripShadow:
    `inset 0 1px 0 rgba(${SPEC},0.4), inset 0 -1px 0 rgba(${SHADE},0.14), 0 4px 12px rgba(${SHADE},0.16)`,
  stripShadowLive:
    `inset 0 1px 0 rgba(${SPEC},0.4), inset 0 -1px 0 rgba(${SHADE},0.14), 0 0 18px rgba(91,101,116,0.14), 0 6px 14px rgba(${SHADE},0.18)`,
  tuneFace: `
    linear-gradient(180deg, rgba(${SPEC},0.6) 0%, rgba(${SPEC},0.08) 34%, transparent 55%),
    linear-gradient(165deg, #D0D6E0 0%, #B8C0CC 42%, #A8B2C0 100%)
  `,
  tuneFacePressed: `
    linear-gradient(180deg, rgba(${SHADE},0.16) 0%, transparent 40%),
    linear-gradient(165deg, #B4BBC6 0%, #A8B2C0 50%, #98A2B0 100%)
  `,
  tuneShadow:
    `inset 0 1px 0 rgba(${SPEC},0.5), inset 0 -1px 0 rgba(${SHADE},0.2), 0 6px 14px rgba(${SHADE},0.2)`,
  tuneShadowPressed:
    `inset 0 2px 4px rgba(${SHADE},0.28), inset 0 1px 0 rgba(${SHADE},0.16)`,
  lcdTrack: "rgba(61,70,84,0.28)",
  lcdFill:
    "linear-gradient(90deg, #8B95A4 0%, #C5CDD8 70%, #D8DFE8 100%)",
  lcdGlow: "0 0 14px rgba(216,223,232,0.55)",
  label: {
    fontFamily: font,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: -0.08,
    textTransform: "none",
  },
};

/** Frosted steel — hairline bezels, chrome top light, modern glass. */
export const glass = {
  fill: "rgba(206, 213, 222, 0.58)",
  fillStrong: "rgba(200, 208, 218, 0.82)",
  fillQuiet: "rgba(216, 223, 232, 0.32)",
  fillHeavy: "rgba(208, 214, 224, 0.88)",
  border: "rgba(61, 70, 84, 0.16)",
  borderSoft: "rgba(61, 70, 84, 0.10)",
  borderFaint: "rgba(61, 70, 84, 0.08)",
  highlight: `rgba(${SPEC}, 0.62)`,
  blur: "blur(40px) saturate(1.16)",
  blurSoft: "blur(24px) saturate(1.1)",
  blurHeavy: "blur(56px) saturate(1.18)",
  blurEdge: "blur(28px) saturate(1.12)",
  shadow: `0 14px 36px rgba(${SHADE}, 0.22), 0 2px 8px rgba(${SHADE}, 0.14)`,
  shadowSoft: `0 8px 22px rgba(${SHADE}, 0.16)`,
  shadowLift: `0 18px 40px rgba(${SHADE}, 0.24), 0 4px 12px rgba(${SHADE}, 0.14)`,
  chrome:
    `linear-gradient(160deg, rgba(${SPEC},0.72) 0%, rgba(197,203,214,0.88) 42%, rgba(180,187,198,0.94) 100%)`,
  plate:
    `linear-gradient(165deg, rgba(208,214,224,0.96) 0%, rgba(197,203,214,0.94) 55%, rgba(180,187,198,0.92) 100%)`,
  frame:
    "linear-gradient(180deg, #D8DFE8 0%, #C5CBD6 48%, #B4BBC6 100%)",
};

/** Hard, unblurred controls — aluminum keys. */
export const hardware = {
  radius: 6,
  keyFace:
    `linear-gradient(180deg, rgba(${SPEC},0.65) 0%, rgba(${SPEC},0.10) 38%, transparent 100%), linear-gradient(145deg, #D0D6E0 0%, #B8C0CC 48%, #A8B2C0 100%)`,
  keyRaised:
    `inset 0 1px 0 rgba(${SPEC},0.55), inset 0 -1px 0 rgba(${SHADE},0.18), inset 1px 0 0 rgba(${SPEC},0.18), inset -1px 0 0 rgba(${SHADE},0.12)`,
  keyPressed:
    `inset 0 2px 4px rgba(${SHADE},0.28), inset 0 1px 0 rgba(${SHADE},0.16)`,
  plateEdge:
    `inset 0 1px 0 rgba(${SPEC},0.4), inset 0 -1px 0 rgba(${SHADE},0.16)`,
  rule:
    `linear-gradient(90deg, transparent, rgba(91,101,116,0.22), transparent)`,
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
    border: "1px solid rgba(91,101,116,0.22)",
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

/** Jewel-case shadow — sleeves float over cool steel. */
export const artShadow = {
  quiet: `0 2px 4px rgba(${SHADE},0.18), 0 10px 22px rgba(${SHADE},0.2)`,
  raised:
    `0 4px 8px rgba(${SHADE},0.18), 0 16px 32px rgba(${SHADE},0.22), inset 0 1px 0 rgba(${SPEC},0.4), inset 0 -1px 0 rgba(${SHADE},0.16)`,
  active: `0 0 0 2px rgba(91,101,116,0.85), 0 8px 18px rgba(${SHADE},0.2), 0 0 24px rgba(91,101,116,0.18)`,
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
      active ? "rgba(91,101,116,0.55)" : "rgba(91,101,116,0.18)"
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
  bezelBorder: "1px solid rgba(91,101,116,0.22)",
  bezelShadow: `
    inset 0 1px 0 rgba(${SPEC},0.45),
    inset 0 -1px 0 rgba(${SHADE},0.16),
    0 18px 40px rgba(${SHADE},0.22)
  `,
  lcdTrack: "rgba(61,70,84,0.28)",
  lcdFill:
    "linear-gradient(90deg, #8B95A4 0%, #C5CDD8 70%, #D8DFE8 100%)",
  lcdGlow: "0 0 12px rgba(216,223,232,0.5)",
};

/** Hardware icon key — header / Explore / Charts. */
export function chromeIconButton(size = 36) {
  return {
    width: size,
    height: size,
    padding: 0,
    borderRadius: 8,
    border: "1px solid rgba(91,101,116,0.22)",
    background:
      `linear-gradient(180deg, rgba(${SPEC},0.55) 0%, rgba(${SPEC},0.08) 55%, transparent 100%), linear-gradient(180deg, #D0D6E0 0%, #B4BBC6 100%)`,
    boxShadow:
      `inset 0 1px 0 rgba(${SPEC},0.45), 0 1px 3px rgba(${SHADE},0.18)`,
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
      active ? "rgba(91,101,116,0.45)" : "rgba(91,101,116,0.18)"
    }`,
    background: active
      ? "rgba(91,101,116,0.14)"
      : `linear-gradient(180deg, rgba(${SPEC},0.5) 0%, rgba(197,203,214,0.88) 100%)`,
    backdropFilter: "blur(18px) saturate(1.08)",
    WebkitBackdropFilter: "blur(18px) saturate(1.08)",
    boxShadow: active
      ? `inset 0 1px 0 rgba(${SPEC},0.35), 0 0 0 1px rgba(91,101,116,0.28)`
      : `inset 0 1px 0 rgba(${SPEC},0.4), inset 0 -1px 0 rgba(${SHADE},0.14), 0 3px 10px rgba(${SHADE},0.14)`,
    color: active ? color.accent : color.ink,
    borderRadius: compact ? 8 : radius.md,
    WebkitTapHighlightColor: "transparent",
  };
}

/** Floating dock — frosted mini-device + tabs. */
export const dock = {
  insetX: 14,
  insetBottom: 12,
  radius: 16,
  tabH: 54,
  playerH: 112,
  /** Content clearances (tabs only / with player), excluding safe-area. */
  clearTabs: 88,
  clearPlayer: 228,
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
      "linear-gradient(90deg, transparent 0%, rgba(91,101,116,0.06) 18%, rgba(91,101,116,0.22) 50%, rgba(91,101,116,0.06) 82%, transparent 100%)",
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
    return `radial-gradient(ellipse at 50% -10%, #D0D6E0 0%, #C5CBD6 42%, #B4BBC6 100%)`;
  }
  if (dawn) {
    return `radial-gradient(ellipse at 70% 0%, #D2D6DC 0%, #C5CBD6 48%, #B8BFC8 100%)`;
  }
  if (day) {
    return `radial-gradient(ellipse at 40% -5%, #D8DFE8 0%, #C5CBD6 50%, #B4BBC6 100%)`;
  }
  return `radial-gradient(ellipse at 55% 0%, #D0D6E0 0%, #C5CBD6 45%, #B4BBC6 100%)`;
}

/** Brushed steel wash for chrome bands / Cover Stage. */
export function aluminumGradient() {
  return `
    linear-gradient(180deg, rgba(${SPEC},0.28) 0%, transparent 44%),
    linear-gradient(180deg, #D0D6E0 0%, #C5CBD6 48%, #B4BBC6 100%)
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
    radial-gradient(ellipse 110% 55% at 50% -18%, rgba(${SPEC},0.42) 0%, transparent 52%),
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
  background: "rgba(208, 214, 224, 0.88)",
  color: color.ink,
  fontSize: 16,
  fontFamily: font,
  boxShadow: `inset 0 1px 0 ${glass.highlight}, inset 0 2px 6px rgba(${SHADE},0.16)`,
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
  border: `1px solid rgba(91, 101, 116, 0.55)`,
  background: `
    linear-gradient(180deg, rgba(${SPEC},0.28) 0%, transparent 42%),
    #5B6574
  `,
  color: color.onAccent,
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: font,
  letterSpacing: -0.15,
  boxShadow: `inset 0 1px 0 rgba(${SPEC},0.4), 0 6px 16px rgba(91,101,116,0.22)`,
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
