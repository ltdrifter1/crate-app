/**
 * Planet MP3 brand marks — the exact lockup / mark assets in /public/brand.
 * No placeholder glyphs; the Y2K dithered planet is the brand.
 */

export const BRAND_LOCKUP_SRC = "/brand/planet-mp3-lockup.png";
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

/** Full square lockup — hero / watermark / splash. */
export function BrandLockup({
  size = 240,
  title = "Planet MP3",
  opacity = 1,
}) {
  return (
    <img
      src={BRAND_LOCKUP_SRC}
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
        margin: "0 auto",
        userSelect: "none",
        filter: "drop-shadow(0 18px 40px rgba(26,29,36,0.18))",
      }}
    />
  );
}

/** @deprecated alias kept for old imports */
export function PlaceholderPlanetGlyph(props) {
  return <BrandGlyph size={props.size} title={props.title} />;
}
