/**
 * Planet MP3 brand marks — exact lockup / mark assets in /public/brand.
 * Primary chrome uses the transparent lockup (planet + rings + wordmark)
 * so the mark sits on the UI without a black plate.
 *
 * Display-sized variants (256 / 512 + WebP) keep splash / chrome off the
 * master PNGs. On-black masters are reserved for app icons / OG.
 */

export const BRAND_LOCKUP_SRC = "/brand/planet-mp3-lockup-512.png";
export const BRAND_LOCKUP_SRCSET =
  "/brand/planet-mp3-lockup-256.png 256w, /brand/planet-mp3-lockup-512.png 512w";
export const BRAND_LOCKUP_WEBP = "/brand/planet-mp3-lockup-512.webp";

/** Solid black-plate export — app icons, OG, filled dark marks only. */
export const BRAND_LOCKUP_ON_BLACK_SRC = "/brand/planet-mp3-lockup-on-black-512.png";
export const BRAND_LOCKUP_ON_BLACK_SRCSET =
  "/brand/planet-mp3-lockup-on-black-256.png 256w, /brand/planet-mp3-lockup-on-black-512.png 512w";
export const BRAND_LOCKUP_ON_BLACK_WEBP = "/brand/planet-mp3-lockup-on-black-512.webp";

export const BRAND_MARK_SRC = "/brand/logo-mark-128.png";
export const BRAND_MARK_INVERSE_SRC = "/brand/logo-mark-inverse-128.png";

/** Masters kept for OG / high-DPI print — not used in app chrome. */
export const BRAND_LOCKUP_MASTER_SRC = "/brand/planet-mp3-lockup.png";
export const BRAND_LOCKUP_ON_BLACK_MASTER_SRC = "/brand/planet-mp3-lockup-on-black.png";

function LockupPicture({
  onBlack = false,
  size,
  title,
  style,
  draggable = false,
}) {
  const png = onBlack ? BRAND_LOCKUP_ON_BLACK_SRC : BRAND_LOCKUP_SRC;
  const srcSet = onBlack ? BRAND_LOCKUP_ON_BLACK_SRCSET : BRAND_LOCKUP_SRCSET;
  const webp = onBlack ? BRAND_LOCKUP_ON_BLACK_WEBP : BRAND_LOCKUP_WEBP;
  const sizes = `${Math.max(12, Math.round(Number(size) || 280))}px`;

  return (
    <picture>
      <source type="image/webp" srcSet={webp} sizes={sizes} />
      <img
        src={png}
        srcSet={srcSet}
        sizes={sizes}
        alt={title || ""}
        width={Math.max(12, Math.round(Number(size) || 280))}
        height={Math.max(12, Math.round(Number(size) || 280))}
        draggable={draggable}
        decoding="async"
        fetchPriority="low"
        style={style}
      />
    </picture>
  );
}

/**
 * App-icon mark — transparent lockup so chrome stays clean on dark UI.
 */
export function BrandGlyph({
  size = 28,
  title = "Planet MP3",
  inverse = false, // kept for callers; mark is already light-on-clear
  rounded = false,
}) {
  void inverse;
  const s = Math.max(12, size);
  return (
    <LockupPicture
      onBlack={false}
      size={s}
      title={title}
      style={{
        width: s,
        height: s,
        display: "block",
        objectFit: "contain",
        background: "transparent",
        borderRadius: rounded ? Math.round(s * 0.18) : 0,
        flexShrink: 0,
        userSelect: "none",
      }}
    />
  );
}

/**
 * Full lockup — hero / splash / sidebar. Transparent unless onBlack is set.
 */
export function BrandLockup({
  size = 280,
  title = "Planet MP3",
  opacity = 1,
  glassHalo = false,
  onBlack = false,
  /** Quieter shadow for chrome / sidebar marks */
  compact = false,
}) {
  const face = (
    <LockupPicture
      onBlack={onBlack}
      size={size}
      title={title}
      style={{
        width: "100%",
        maxWidth: size,
        height: "auto",
        aspectRatio: "1 / 1",
        display: "block",
        objectFit: "contain",
        background: "transparent",
        opacity,
        margin: glassHalo ? 0 : "0 auto",
        userSelect: "none",
        borderRadius: 0,
        filter: compact
          ? "drop-shadow(0 8px 18px rgba(0,0,0,0.45))"
          : "drop-shadow(0 14px 32px rgba(0,0,0,0.55))",
      }}
    />
  );

  if (!glassHalo) return face;

  const pad = Math.round(size * 0.08);
  const outer = size + pad * 2;

  return (
    <div
      aria-label={title || undefined}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: outer,
        aspectRatio: "1 / 1",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "10%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 42% 32%, rgba(255,255,255,0.16) 0%, rgba(101,230,255,0.07) 38%, transparent 70%)",
          filter: "blur(18px)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, width: `calc(100% - ${pad * 2}px)`, maxWidth: size }}>
        {face}
      </div>
    </div>
  );
}

/** @deprecated alias kept for old imports */
export function PlaceholderPlanetGlyph(props) {
  return <BrandGlyph size={props.size} title={props.title} />;
}
