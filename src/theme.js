// Design tokens — Music.app / modern iTunes.
// system-ui first so San Francisco paints on Apple OS and Segoe / Roboto
// elsewhere. No webfont costume. Named “SF Pro” is not a web font.

export const fontDisplay =
  'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif';
export const font =
  'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif';
export const fontMono =
  'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace';
/** Same as display — Music.app never swaps in a costume headline face. */
export const fontPoster = fontDisplay;
/** Same as text — keep the token so station chrome can restyle without LCD. */
export const fontLcd = font;

/**
 * App Store type scale (Dark Mode).
 * Tracking is optical, not costume: tight on large titles, nearly 0 on captions.
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

/** Brand palette — Music.app dark: black canvas, grouped surfaces, system blue. */
export const color = {
  ink: "#F5F5F7",
  body: "rgba(235, 235, 245, 0.78)",
  muted: "rgba(235, 235, 245, 0.6)",
  faint: "rgba(235, 235, 245, 0.38)",
  line: "rgba(84, 84, 88, 0.45)",
  lineStrong: "rgba(84, 84, 88, 0.65)",
  surface: "rgba(28, 28, 30, 0.72)",
  surfaceSolid: "#1C1C1E",
  surfaceRaised: "#2C2C2E",
  canvas: "#000000",
  canvasEdge: "#000000",
  /** iOS system blue — See All, links, focus */
  accent: "#0A84FF",
  accentSoft: "rgba(10, 132, 255, 0.18)",
  accentGlow: "rgba(10, 132, 255, 0.28)",
  onAccent: "#000000",
  onDark: "#F5F5F7",
  onDarkMuted: "rgba(235,235,245,0.6)",
  /** Live + destructive only, never chrome */
  alert: "#FF453A",
  station: "#1C1C1E",
  /** Soft selection wash — Music.app row highlight */
  select: "rgba(10, 132, 255, 0.18)",
  selectStrong: "rgba(10, 132, 255, 0.28)",
};

/**
 * Station / broadcast chrome — silvers over the dark studio.
 * hot = live / request / rank signal; bright = chart / highlight; steel = plates.
 */
export const chrome = {
  hot: "#8E8E93",
  bright: "#F5F5F7",
  steel: "#636366",
  plate: "#1C1C1E",
  deep: "#000000",
  live: "#FF453A",
  signal: "#0A84FF",
  inkPlate: "#000000",
  /** rgba helpers for overlays */
  hotRgb: "142,142,147",
  brightRgb: "245,245,247",
  liveRgb: "255,69,58",
  cyanRgb: "10,132,255",
};

/**
 * Y2K underground — graphite chassis, light metal, LCD cyan.
 * MTV meets pirate radio meets Japanese audio hardware.
 * No purple anywhere on player or home chrome.
 */
/** Messages-style pane for live station chat — grouped, not LCD. */
export const ice = {
  frost: "rgba(255, 255, 255, 0.08)",
  frostStrong: "rgba(255, 255, 255, 0.12)",
  rim: "rgba(255, 255, 255, 0.12)",
  rimSoft: "rgba(255, 255, 255, 0.06)",
  glow: "rgba(10, 132, 255, 0.18)",
  mist: "rgba(28, 28, 30, 0.82)",
  pane: "rgba(28, 28, 30, 0.88)",
  thread: "linear-gradient(180deg, #1C1C1E 0%, #000000 100%)",
  bubble: "rgba(44, 44, 46, 0.92)",
  bubbleMine: "rgba(10, 132, 255, 0.28)",
  ink: "#F5F5F7",
  mute: "rgba(235, 235, 245, 0.55)",
  pip: "#0A84FF",
};

export const y2k = {
  /** Quiet metal leftovers — mapped to Music.app labels, never LCD. */
  chrome: "#D1D1D6",
  chromeBright: "#F5F5F7",
  chromeMid: "#8E8E93",
  chromeDeep: "#3A3A3C",
  chromeSoft: "rgba(255, 255, 255, 0.08)",
  chromeGlow: "rgba(255, 255, 255, 0.08)",
  chromeWash: "rgba(255, 255, 255, 0.04)",
  /** Was LCD cyan — now system-blue adjacent, no glow */
  cyan: "#0A84FF",
  cyanSoft: "rgba(10, 132, 255, 0.14)",
  cyanGlow: "rgba(10, 132, 255, 0.18)",
  techBlue: "#0A84FF",
  techBlueSoft: "rgba(10, 132, 255, 0.14)",
  neon: "#F5F5F7",
  neonSoft: "rgba(255, 255, 255, 0.1)",
  magenta: "#FF375F",
  magentaSoft: "rgba(255, 55, 95, 0.14)",
  offWhite: "#F5F5F7",
  charcoal: "#1C1C1E",
  charcoalRaised: "#2C2C2E",
  graphite: "#1C1C1E",
  nearBlack: "#000000",
  metal: "#D1D1D6",
  lightMetal: "#F5F5F7",
  live: "#FF453A",
  inkGlass: "rgba(0, 0, 0, 0.62)",
  inkGlassSoft: "rgba(0, 0, 0, 0.42)",
  /** Cover fallback — dark grouped, no costume wash */
  artGradient:
    "linear-gradient(160deg, #3A3A3C 0%, #1C1C1E 55%, #000000 100%)",
};

/**
 * Media module surfaces — Music.app grouped containers.
 * Soft fill, hairline, no LCD / bezel / machined aluminum.
 */
export const radio = {
  radius: 16,
  radiusTight: 10,
  radiusControl: 12,
  radiusLcd: 8,
  border: "1px solid rgba(255,255,255,0.08)",
  borderLive: "1px solid rgba(255,255,255,0.12)",
  borderQuiet: "1px solid rgba(255,255,255,0.06)",
  borderChrome: "1px solid rgba(255,255,255,0.08)",
  glassFace: "rgba(28, 28, 30, 0.72)",
  glassFaceLive: "rgba(28, 28, 30, 0.82)",
  glassBlur: "blur(40px) saturate(1.4)",
  glassShadow: "0 8px 28px rgba(0,0,0,0.28)",
  glassShadowLive: "0 10px 32px rgba(0,0,0,0.32)",
  lcdFace: "rgba(44, 44, 46, 0.9)",
  lcdBorder: "1px solid rgba(255,255,255,0.08)",
  lcdShadow: "none",
  moduleFace: "rgba(28, 28, 30, 0.72)",
  moduleFaceLive: "rgba(28, 28, 30, 0.82)",
  moduleShadow: "0 8px 24px rgba(0,0,0,0.22)",
  moduleShadowLive: "0 10px 28px rgba(0,0,0,0.28)",
  stripFace: "rgba(44, 44, 46, 0.55)",
  stripFaceLive: "rgba(44, 44, 46, 0.65)",
  stripShadow: "none",
  stripShadowLive: "none",
  tuneFace: "#F5F5F7",
  tuneFacePressed: "#E5E5EA",
  tuneShadow: "0 4px 14px rgba(0,0,0,0.22)",
  tuneShadowPressed: "none",
  lcdTrack: "rgba(255,255,255,0.14)",
  lcdFill: "rgba(255,255,255,0.92)",
  lcdGlow: "none",
  label: {
    fontFamily: font,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: -0.08,
    textTransform: "none",
  },
};

/** Dark glass — Music.app frosted panes, hairline only, no bevel. */
export const glass = {
  fill: "rgba(28, 28, 30, 0.62)",
  fillStrong: "rgba(28, 28, 30, 0.82)",
  fillQuiet: "rgba(44, 44, 46, 0.45)",
  fillHeavy: "rgba(28, 28, 30, 0.92)",
  border: "rgba(255, 255, 255, 0.1)",
  borderSoft: "rgba(255, 255, 255, 0.08)",
  borderFaint: "rgba(255, 255, 255, 0.05)",
  highlight: "rgba(255, 255, 255, 0.06)",
  blur: "blur(40px) saturate(1.4)",
  blurSoft: "blur(24px) saturate(1.2)",
  blurHeavy: "blur(50px) saturate(1.5)",
  blurEdge: "blur(28px) saturate(1.3)",
  shadow: "0 12px 36px rgba(0, 0, 0, 0.35)",
  shadowSoft: "0 8px 24px rgba(0, 0, 0, 0.28)",
  shadowLift: "0 16px 44px rgba(0, 0, 0, 0.4)",
  chrome: "rgba(44, 44, 46, 0.72)",
  plate: "rgba(28, 28, 30, 0.78)",
  frame: "rgba(28, 28, 30, 0.72)",
};

/** Soft iOS fills for playback chrome — no machined keys. */
export const hardware = {
  radius: 10,
  keyFace: "rgba(255,255,255,0.1)",
  keyRaised: "none",
  keyPressed: "inset 0 0 0 1000px rgba(255,255,255,0.06)",
  plateEdge: "none",
  rule: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
};

/**
 * Soft iOS control. Intentionally excludes backdrop-filter so keys
 * stay cheap to paint over scrolling shelves.
 */
export function hardwareKey(opts = { pressed: false, size: "md" }) {
  const pressed = opts?.pressed === true;
  const size = opts?.size || "md";
  const metrics = {
    sm: { minHeight: 32, padding: "0 12px" },
    md: { minHeight: 36, padding: "0 14px" },
    lg: { minHeight: 44, padding: "0 16px" },
  }[size] || { minHeight: 36, padding: "0 14px" };

  return {
    ...metrics,
    borderRadius: hardware.radius,
    border: "1px solid rgba(255,255,255,0.08)",
    background: pressed ? "rgba(255,255,255,0.16)" : hardware.keyFace,
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

/** Soft album-art shadow — Music.app sleeve, not a jewel case. */
export const artShadow = {
  quiet: "0 4px 14px rgba(0,0,0,0.28)",
  raised: "0 8px 22px rgba(0,0,0,0.38)",
  active: "0 0 0 3px rgba(255,255,255,0.92), 0 10px 28px rgba(0,0,0,0.4)",
};

/**
 * Shared cover frame — modest radius, soft drop shadow, no chrome bevel.
 * Use on Home tiles, channels, stacks, and featured releases.
 */
export function artFrameStyle({
  size,
  active = false,
  radius: frameRadius = 8,
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
    border: "none",
    background: y2k.artGradient,
    boxShadow: active ? artShadow.active : artShadow.raised,
  };
}

/** Home rhythm — Music.app shelves: large title, cover-first tiles. */
export const homeSpace = {
  gutter: 22,
  bandPadY: 28,
  sectionPadTop: 32,
  sectionPadBottom: 24,
  sectionPadTopFirst: 8,
  sectionGap: 32,
  sectionGapFirst: 16,
  shelfGap: 16,
  /** Default discovery tile — sleeve-first. */
  tile: 172,
  /** Featured / countdown / releases — asymmetric presence. */
  tileFeatured: 220,
  /** Channel surfing station tile — art-first. */
  tileTicket: 176,
  titleToRail: 14,
};

/**
 * Section title — App Store “Apps We Love” / Music shelf header.
 * Shared optical left edge across Channel Surfing / shelves / tonight.
 */
export const sectionTitle = {
  ...type.title2,
  color: y2k.offWhite,
  margin: 0,
  textTransform: "none",
};

/** Home band titles — same SF Pro stack as every other shelf. */
export const sectionTitlePoster = {
  ...sectionTitle,
};

export const sectionSubtitle = {
  ...type.subhead,
  margin: "3px 0 0",
  color: color.muted,
};

/** Quiet label above a Home band title — App Store date/caption, not a stamp. */
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

/** Soft stage used by the Home now-playing card and dock. */
export const broadcast = {
  bezelBorder: "1px solid rgba(255,255,255,0.08)",
  bezelShadow: "0 12px 36px rgba(0,0,0,0.32)",
  lcdTrack: "rgba(255,255,255,0.14)",
  lcdFill: "rgba(255,255,255,0.92)",
  lcdGlow: "none",
};

/** Circular glass control — header / Explore / Charts. */
export function chromeIconButton(size = 36) {
  return {
    width: size,
    height: size,
    padding: 0,
    borderRadius: "50%",
    border: "none",
    background: "rgba(255,255,255,0.1)",
    boxShadow: "none",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    color: y2k.offWhite,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    WebkitTapHighlightColor: "transparent",
  };
}

/** Frosted glass control — header buttons, view-all, chips. */
export function glassPill(opts = {}) {
  const active = opts.active === true;
  const compact = opts.compact === true;
  return {
    border: "none",
    background: active ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px) saturate(1.4)",
    WebkitBackdropFilter: "blur(20px) saturate(1.4)",
    boxShadow: "none",
    color: active ? y2k.chromeBright : y2k.offWhite,
    borderRadius: compact ? 980 : radius.md,
    WebkitTapHighlightColor: "transparent",
  };
}

/** Floating Music.app dock — frosted shell for mini-player + tabs. */
export const dock = {
  insetX: 12,
  insetBottom: 10,
  radius: 16,
  tabH: 52,
  playerH: 64,
  clearTabs: 84,
  clearPlayer: 168,
};

/** Prefer radio.radius for media modules; keep these for sheets / legacy chrome. */
export const radius = { sm: 8, md: 12, lg: 16, xl: 18, pill: 980 };

export const space = (n) => n * 4;

/** Quiet elevated panel — grouped iOS fill. */
export const panel = {
  background: glass.plate,
  border: `1px solid ${glass.borderSoft}`,
  borderRadius: radius.lg,
  boxShadow: glass.shadowSoft,
  backdropFilter: glass.blur,
  WebkitBackdropFilter: glass.blur,
};

export const panelQuiet = {
  background: glass.fillQuiet,
  border: "none",
  borderRadius: radius.md,
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
};

/** Sheet / modal glass surface. */
export const glassSheet = {
  background: glass.plate,
  border: `1px solid ${glass.border}`,
  borderRadius: `${radius.xl}px ${radius.xl}px 0 0`,
  boxShadow: glass.shadowLift,
  backdropFilter: glass.blurHeavy,
  WebkitBackdropFilter: glass.blurHeavy,
};

/** Interactive glass control — playlists, chips, sheets. */
export const glassControl = {
  background: glass.chrome,
  border: "none",
  borderRadius: radius.md,
  boxShadow: "none",
  backdropFilter: glass.blurEdge,
  WebkitBackdropFilter: glass.blurEdge,
};

/**
 * Soft grouped plate — Home bands / featured CTAs.
 */
export function chromeFrame(opts = {}) {
  const sharp = opts.sharp === true;
  return {
    border: `1px solid ${glass.borderSoft}`,
    borderRadius: sharp ? 8 : radius.xl,
    background: glass.frame,
    boxShadow: glass.shadowSoft,
    backdropFilter: glass.blurSoft,
    WebkitBackdropFilter: glass.blurSoft,
  };
}

/** Hairline Music.app separator. */
export function sectionRule(inset = homeSpace.gutter) {
  return {
    height: 1,
    margin: `0 ${inset}px`,
    border: "none",
    background: "rgba(84, 84, 88, 0.45)",
  };
}

export const motion = {
  fast: "0.15s",
  base: "0.24s",
  settle: "0.32s",
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
};

/** Music.app atmosphere — always black, a quiet lift toward the header. */
export function timeOfDayGradient(date = new Date()) {
  const h = date.getHours();
  const late = h >= 22 || h <= 4;
  const dawn = h >= 5 && h <= 8;
  const day = h >= 9 && h <= 16;
  if (late) {
    return `radial-gradient(ellipse at 50% -10%, #1C1C1E 0%, #000000 52%)`;
  }
  if (dawn) {
    return `radial-gradient(ellipse at 70% 0%, #2C2C2E 0%, #000000 55%)`;
  }
  if (day) {
    return `radial-gradient(ellipse at 40% -5%, #2C2C2E 0%, #000000 55%)`;
  }
  return `radial-gradient(ellipse at 55% 0%, #1C1C1E 0%, #000000 52%)`;
}

/** Quiet dark wash for Cover Stage — no brushed aluminum. */
export function aluminumGradient() {
  return `
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(44,44,46,0.55) 0%, transparent 60%),
    #000000
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

/** App shell — Music.app black canvas. */
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
  padding: "14px 16px",
  borderRadius: radius.md,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(44,44,46,0.72)",
  color: color.ink,
  fontSize: 16,
  fontFamily: font,
  boxShadow: "none",
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
  outline: "none",
  transition: `border-color ${motion.base} ${motion.ease}, box-shadow ${motion.base} ${motion.ease}, background ${motion.base}`,
};

/** Primary CTA — Music.app filled white play plate. */
export const BTN_PRIMARY = {
  width: "100%",
  padding: "14px 22px",
  borderRadius: radius.pill,
  border: "none",
  background: "#F5F5F7",
  color: color.onAccent,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: font,
  letterSpacing: -0.2,
  boxShadow: "0 4px 16px rgba(0,0,0,0.28)",
  transition: `transform ${motion.fast} ${motion.ease}, box-shadow ${motion.base}, opacity ${motion.fast}`,
};

/** Secondary CTA — grouped fill. */
export const BTN_SECONDARY = {
  width: "100%",
  padding: "14px 22px",
  borderRadius: radius.pill,
  border: "none",
  background: "rgba(255,255,255,0.1)",
  color: color.body,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: font,
  letterSpacing: -0.2,
  backdropFilter: glass.blurEdge,
  WebkitBackdropFilter: glass.blurEdge,
  boxShadow: "none",
  transition: `transform ${motion.fast} ${motion.ease}, box-shadow ${motion.base}, background ${motion.base}`,
};

/** Quiet tertiary control — glass chip. */
export const BTN_GHOST = {
  padding: "10px 14px",
  borderRadius: radius.pill,
  border: "none",
  background: "rgba(255,255,255,0.06)",
  color: color.muted,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: font,
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
  boxShadow: "none",
};

export const CTRL_BTN = {
  background: "rgba(255,255,255,0.08)",
  border: "none",
  borderRadius: radius.pill,
  cursor: "pointer",
  padding: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: color.muted,
  backdropFilter: glass.blurSoft,
  WebkitBackdropFilter: glass.blurSoft,
  boxShadow: "none",
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
