/**
 * Shared full-bleed Room poster atmosphere.
 * Distinct per atmosphere via roomPosterStyle — not one blurred-cover recipe.
 */
import { roomPosterStyle } from "../../lib/rooms";

export default function RoomPosterBackdrop({
  room,
  atmosphere,
  coverUrl,
  children,
  style = {},
  minHeight,
  className,
  onClick,
  onContextMenu,
  role,
  tabIndex,
  onKeyDown,
}) {
  const poster = roomPosterStyle(room || atmosphere);
  const wash = poster.wash;

  return (
    <div
      className={className}
      onClick={onClick}
      onContextMenu={onContextMenu}
      role={role}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: minHeight || undefined,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        ...style,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: poster.gradient,
        }}
      />
      {coverUrl && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${coverUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: `blur(${poster.coverBlur}px) saturate(${poster.coverSat}%) brightness(${poster.coverBright})`,
            transform: `scale(${poster.coverScale})`,
            opacity: poster.coverOpacity,
            animation: poster.coverAnim,
          }}
        />
      )}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: poster.overlay,
        }}
      />
      {poster.texture && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            opacity: poster.textureOpacity,
            backgroundImage: poster.texture,
            backgroundSize: poster.textureSize || "auto",
            mixBlendMode: poster.textureBlend || "soft-light",
            pointerEvents: "none",
          }}
        />
      )}
      {wash && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: wash.top,
            left: wash.left,
            right: wash.right,
            width: wash.size,
            height: wash.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${wash.color} 0%, transparent 68%)`,
            pointerEvents: "none",
            animation: `breathe ${poster.ambientDuration}s ease-in-out infinite`,
          }}
        />
      )}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          minHeight: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function posterTitleStyle(poster, overrides = {}) {
  return {
    fontSize: poster.titleSize,
    fontWeight: poster.fontWeight,
    letterSpacing: poster.letterSpacing,
    lineHeight: poster.lineHeight,
    fontFamily: "var(--font-display)",
    color: "var(--ink, #EDE8E1)",
    ...overrides,
  };
}
