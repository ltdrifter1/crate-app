/**
 * Planet MP3 brand marks — the exact lockup / mark assets in /public/brand.
 * No placeholder glyphs; the Y2K dithered planet is the brand.
 */

import { glass } from "../../theme";

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

/**
 * Full square lockup — hero / watermark / splash.
 * glassHalo: wraps the mark in a frosted Y2K grey glass disc with soft blur edge.
 */
export function BrandLockup({
  size = 280,
  title = "Planet MP3",
  opacity = 1,
  glassHalo = false,
}) {
  const face = (
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
        margin: glassHalo ? 0 : "0 auto",
        userSelect: "none",
        borderRadius: "22%",
        filter: glassHalo
          ? "drop-shadow(0 22px 48px rgba(22,24,30,0.28))"
          : "drop-shadow(0 18px 40px rgba(22,24,30,0.18))",
      }}
    />
  );

  if (!glassHalo) return face;

  const pad = Math.round(size * 0.12);
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
      {/* Soft grey bloom behind the glass */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "6%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 55% 35%, rgba(255,255,255,0.7) 0%, rgba(190,198,210,0.35) 42%, rgba(150,160,176,0.12) 70%, transparent 100%)",
          filter: "blur(18px)",
          pointerEvents: "none",
        }}
      />
      {/* Frosted glass disc */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "4%",
          borderRadius: "50%",
          background: glass.fill,
          border: `1px solid ${glass.borderSoft}`,
          boxShadow: `
            inset 0 1px 0 ${glass.highlight},
            inset 0 -20px 40px rgba(22,24,30,0.04),
            0 24px 56px rgba(22,24,30,0.14)
          `,
          backdropFilter: glass.blurHeavy || glass.blur,
          WebkitBackdropFilter: glass.blurHeavy || glass.blur,
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
