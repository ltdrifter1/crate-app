/**
 * Planet MP3 brand marks — exact lockup / mark assets in /public/brand.
 * Lockup master is the authentic Y2K stippled planet + PLANET MP3 wordmark
 * on the black plate (matches the brand export).
 *
 * Display-sized variants (256 / 512 + WebP) keep splash / chrome off the
 * multi‑megabyte master PNGs.
 */

export const BRAND_LOCKUP_SRC = "/brand/planet-mp3-lockup-512.png";
export const BRAND_LOCKUP_SRCSET =
  "/brand/planet-mp3-lockup-256.png 256w, /brand/planet-mp3-lockup-512.png 512w";
export const BRAND_LOCKUP_WEBP = "/brand/planet-mp3-lockup-512.webp";

/** Solid black-plate export — same lockup; use for filled dark marks. */
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
        style={style}
      />
    </picture>
  );
}

/**
 * App-icon mark — uses the exact black-plate lockup so chrome matches the brand.
 */
export function BrandGlyph({
  size = 28,
  title = "Planet MP3",
  inverse = false,
  rounded = true,
}) {
  const s = Math.max(12, size);
  return (
    <LockupPicture
      onBlack={!inverse}
      size={s}
      title={title}
      style={{
        width: s,
        height: s,
        display: "block",
        objectFit: "contain",
        borderRadius: rounded ? Math.round(s * 0.18) : 0,
        flexShrink: 0,
        userSelect: "none",
      }}
    />
  );
}

/**
 * Full lockup — hero / splash / sidebar. Exact black-plate brand asset.
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
      onBlack={onBlack || compact}
      size={size}
      title={title}
      style={{
        width: "100%",
        maxWidth: size,
        height: "auto",
        aspectRatio: "1 / 1",
        display: "block",
        objectFit: "contain",
        opacity,
        margin: glassHalo ? 0 : "0 auto",
        userSelect: "none",
        borderRadius: compact ? Math.round(size * 0.12) : 0,
        filter: compact
          ? "drop-shadow(0 4px 12px rgba(22,24,30,0.14))"
          : "drop-shadow(0 12px 28px rgba(22,24,30,0.18))",
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
          inset: "8%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 55% 35%, rgba(32,36,43,0.65) 0%, rgba(169,199,228,0.05) 45%, transparent 72%)",
          filter: "blur(16px)",
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
