/**
 * Planet MP3 brand marks — exact lockup / mark assets in /public/brand.
 * Lockup master is the authentic Y2K stippled planet + PLANET MP3 wordmark.
 */

export const BRAND_LOCKUP_SRC = "/brand/planet-mp3-lockup.png";
/** Solid black-plate export — dark surfaces that need a filled mark. */
export const BRAND_LOCKUP_ON_BLACK_SRC = "/brand/planet-mp3-lockup-on-black.png";
export const BRAND_MARK_SRC = "/brand/logo-mark.png";
export const BRAND_MARK_INVERSE_SRC = "/brand/logo-mark-inverse.png";

/**
 * Square app-icon mark (planet + ring + PLANET MP3).
 * Prefer this in chrome; use BrandLockup for hero moments.
 */
export function BrandGlyph({
  size = 28,
  title = "Planet MP3",
  inverse = false,
  rounded = true,
}) {
  const s = Math.max(12, size);
  return (
    <img
      src={inverse ? BRAND_MARK_INVERSE_SRC : BRAND_MARK_SRC}
      alt={title || ""}
      width={s}
      height={s}
      draggable={false}
      style={{
        width: s,
        height: s,
        display: "block",
        objectFit: "contain",
        borderRadius: rounded ? Math.round(s * 0.22) : 0,
        flexShrink: 0,
        userSelect: "none",
      }}
    />
  );
}

/**
 * Full lockup — hero / splash. Renders the exact brand asset (no redraws).
 * Prefer no glassHalo so the stippled lockup reads cleanly.
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
    <img
      src={onBlack ? BRAND_LOCKUP_ON_BLACK_SRC : BRAND_LOCKUP_SRC}
      alt={title || ""}
      draggable={false}
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
            "radial-gradient(circle at 55% 35%, rgba(255,255,255,0.55) 0%, rgba(190,198,210,0.22) 45%, transparent 72%)",
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
