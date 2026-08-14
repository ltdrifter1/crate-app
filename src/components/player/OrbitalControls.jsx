import { useRef } from "react";
import Icon from "../ui/Icon";
import { AlbumArt } from "../listen/AlbumArt";
import { color, glass, motion } from "../../theme";

// ─── Shared transport primitives (soft modern play + linear-friendly progress) ─

/** Soft circular primary play — shared by hero, dock, immersive, desktop. */
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
          ? "rgba(40,44,52,0.9)"
          : "rgba(247,248,250,0.96)",
        border: `1px solid ${disabled ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.55)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: disabled ? color.faint : color.onAccent,
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
        boxShadow: disabled
          ? "none"
          : glowing
            ? `0 0 0 1px rgba(169,199,228,0.35), 0 10px 28px rgba(0,0,0,0.4), 0 0 28px rgba(169,199,228,0.22)`
            : `0 8px 22px rgba(0,0,0,0.38)`,
        transition: `transform ${motion.fast} ${motion.ease}, box-shadow ${motion.base} ${motion.ease}, background ${motion.fast} ${motion.ease}`,
      }}
    >
      <Icon name={isPlaying ? "pause" : "play"} size={iSize} />
    </button>
  );
}

/**
 * Album art with a thin progress ring — dock scrub language (kept light).
 */
export function OrbitalArtRing({
  track,
  progress = 0,
  duration = 0,
  size = 40,
  onSeek,
  artRadius = 10,
}) {
  const scrubRef = useRef(null);
  const pct = duration > 0 ? Math.max(0, Math.min(1, progress / duration)) : 0;
  const stroke = 2;
  const pad = 5;
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
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={stroke}
        />
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={r}
          fill="none"
          stroke="rgba(247,248,250,0.92)"
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
 * Play control with optional orbital seek — immersive / full-player transport.
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
  const ring = size + 16;
  const stroke = 2.2;
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
        <circle cx={ring / 2} cy={ring / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={r}
          fill="none"
          stroke="rgba(247,248,250,0.9)"
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
          isPlaying={isPlaying}
          onClick={onToggle}
          size={size}
          stopPropagation
          glowing={glowing}
        />
      </div>
    </div>
  );
}
