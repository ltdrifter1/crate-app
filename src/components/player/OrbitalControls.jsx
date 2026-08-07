import { useRef } from "react";
import Icon from "../ui/Icon";
import { AlbumArt } from "../listen/AlbumArt";
import { color, glass, motion } from "../../theme";

// ─── Shared transport primitives (ice orb + orbital progress) ─────────────────
/** Circular ice primary play — shared by hero, dock, immersive, desktop. */
export function IceOrbPlay({
  isPlaying = false,
  onClick,
  size = 58,
  iconSize = null,
  disabled = false,
  glowing = false,
  ariaLabel,
  stopPropagation = false,
}) {
  const iSize = iconSize ?? Math.round(size * 0.38);
  return (
    <button
      type="button"
      className="play-primary"
      aria-label={ariaLabel || (isPlaying ? "Pause" : "Play")}
      disabled={disabled}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        onClick?.(e);
      }}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: disabled
          ? color.surfaceRaised
          : `
            linear-gradient(160deg, rgba(56,62,72,0.96) 0%, rgba(28,32,38,0.88) 48%, rgba(214,220,230,0.78) 100%)
          `,
        border: `1px solid ${disabled ? glass.borderSoft : glass.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: disabled ? color.faint : color.ink,
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
        backdropFilter: disabled ? "none" : glass.blur,
        WebkitBackdropFilter: disabled ? "none" : glass.blur,
        boxShadow: disabled
          ? "none"
          : glowing
            ? `inset 0 1px 0 ${glass.highlight}, inset 0 -1px 0 rgba(0,0,0,0.35), 0 0 0 5px ${color.accentSoft}, 0 12px 32px rgba(0,0,0,0.45)`
            : `inset 0 1px 0 ${glass.highlight}, inset 0 -1px 0 rgba(0,0,0,0.3), 0 10px 28px rgba(0,0,0,0.4)`,
        transition: `transform ${motion.fast} ${motion.ease}, box-shadow ${motion.base} ${motion.ease}`,
      }}
    >
      <Icon name={isPlaying ? "pause" : "play"} size={iSize} />
    </button>
  );
}

/**
 * Album art wrapped in an orbital progress ring — dock / desktop scrub language.
 */
export function OrbitalArtRing({
  track,
  progress = 0,
  duration = 0,
  size = 40,
  onSeek,
  artRadius = 8,
}) {
  const scrubRef = useRef(null);
  const pct = duration > 0 ? Math.max(0, Math.min(1, progress / duration)) : 0;
  const stroke = 2.4;
  const pad = 6;
  const svgSize = size + pad * 2;
  const r = (svgSize - stroke) / 2 - 0.5;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  function seekFromPoint(clientX, clientY) {
    if (!duration || !onSeek || !scrubRef.current) return;
    const rect = scrubRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let deg = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    onSeek(Math.floor((deg / 360) * duration));
  }

  return (
    <div
      ref={scrubRef}
      role={onSeek ? "slider" : undefined}
      aria-label={onSeek ? "Seek" : undefined}
      aria-valuemin={onSeek ? 0 : undefined}
      aria-valuemax={onSeek ? duration || 0 : undefined}
      aria-valuenow={onSeek ? progress : undefined}
      onClick={(e) => {
        e.stopPropagation();
        seekFromPoint(e.clientX, e.clientY);
      }}
      style={{
        position: "relative",
        width: svgSize,
        height: svgSize,
        flexShrink: 0,
        cursor: onSeek ? "pointer" : "default",
      }}
    >
      <svg
        width={svgSize}
        height={svgSize}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
      >
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth={stroke}
        />
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={r}
          fill="none"
          stroke={color.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${Math.max(0, circ - dash)}`}
          style={{ transition: "stroke-dasharray 0.25s linear" }}
        />
      </svg>
      <div style={{
        position: "absolute",
        left: pad,
        top: pad,
        width: size,
        height: size,
        borderRadius: artRadius,
        overflow: "hidden",
        boxShadow: `0 0 0 1px ${glass.borderSoft}`,
      }}>
        <AlbumArt track={track} size={size} borderRadius={artRadius} />
      </div>
    </div>
  );
}

/**
 * Play orb with orbital seek ring — immersive / full-player transport.
 */
export function OrbitalPlayControl({
  isPlaying,
  onToggle,
  progress = 0,
  duration = 0,
  onSeek,
  size = 64,
  glowing = false,
}) {
  const scrubRef = useRef(null);
  const pct = duration > 0 ? Math.max(0, Math.min(1, progress / duration)) : 0;
  const ring = size + 18;
  const stroke = 2.6;
  const r = (ring - stroke) / 2 - 1;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  function seekFromPoint(clientX, clientY) {
    if (!duration || !onSeek || !scrubRef.current) return;
    const rect = scrubRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let deg = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    onSeek(Math.floor((deg / 360) * duration));
  }

  return (
    <div
      ref={scrubRef}
      style={{
        position: "relative",
        width: ring,
        height: ring,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width={ring}
        height={ring}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)", pointerEvents: "none" }}
      >
        <circle cx={ring / 2} cy={ring / 2} r={r} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={stroke} />
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={r}
          fill="none"
          stroke={color.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${Math.max(0, circ - dash)}`}
          style={{ transition: "stroke-dasharray 0.2s linear" }}
        />
      </svg>
      <button
        type="button"
        aria-label="Seek"
        onClick={(e) => {
          e.stopPropagation();
          seekFromPoint(e.clientX, e.clientY);
        }}
        style={{
          position: "absolute",
          inset: 0,
          background: "none",
          border: "none",
          cursor: onSeek ? "pointer" : "default",
          borderRadius: "50%",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <IceOrbPlay
         
          onClick={onToggle}
          size={size}
          stopPropagation
          glowing={glowing}
        />
      </div>
    </div>
  );
}

