/**
 * Shared MP3-device chrome — LCD, seek groove, hardware keys.
 * Used by immersive, Home hero, dock, and desktop mini. Tokens only.
 */
import { color, fontDisplay, hardware, motion, radio, type } from "../../theme";
import { fmtTime } from "../../lib/harmony";
import ScanlineWash from "../home/ScanlineWash";
import Icon from "../ui/Icon";

export function trackLcdBits(track, extra = []) {
  if (!track) return extra.filter(Boolean);
  return [
    track.bpm ? `${Math.round(Number(track.bpm))} BPM` : null,
    track.camelot || null,
    track.energy != null && track.energy !== "" ? `E${track.energy}` : null,
    ...extra,
  ].filter(Boolean);
}

export function HardwareIconButton({
  onClick,
  label,
  pressed = false,
  active = false,
  children,
  size = 44,
  stopPropagation = false,
}) {
  const lit = active || pressed;
  return (
    <button
      type="button"
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        onClick?.(e);
      }}
      aria-label={label}
      aria-pressed={pressed || active || undefined}
      style={{
        width: size,
        height: size,
        borderRadius: hardware.radius + 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: lit ? color.onAccent : color.ink,
        background: lit
          ? `linear-gradient(180deg, ${color.accent} 0%, ${color.accent} 100%)`
          : hardware.keyFace,
        border: `1px solid ${lit ? color.accentGlow : "rgba(232,234,238,0.14)"}`,
        boxShadow: lit ? hardware.keyPressed : hardware.keyRaised,
        transition: `transform ${motion.fast} ${motion.ease}, color ${motion.fast}, background ${motion.base}`,
        padding: 0,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

export function LcdSeek({
  value = 0,
  max = 1,
  onChange,
  label = "Seek",
  valueText,
  stopPropagation = false,
  height = 6,
}) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) * 100 : 0;
  return (
    <div style={{ width: "100%", position: "relative" }}>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height,
          marginTop: -(height / 2),
          borderRadius: 2,
          background: radio.lcdTrack,
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.55)",
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 2,
            background: radio.lcdFill,
            boxShadow: radio.lcdGlow,
            transition: "width 0.08s linear",
          }}
        />
      </div>
      <input
        type="range"
        className="chrome-seek"
        min={0}
        max={max || 1}
        step={0.1}
        value={value}
        onChange={(e) => onChange?.(parseFloat(e.target.value))}
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          if (!onChange || !max) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left) / Math.max(1, rect.width);
          onChange(Math.max(0, Math.min(1, x)) * max);
        }}
        aria-label={label}
        aria-valuetext={valueText}
        style={{
          position: "relative",
          width: "100%",
          margin: 0,
          height: 28,
          background: "transparent",
          cursor: "pointer",
          zIndex: 1,
        }}
      />
    </div>
  );
}

export function LcdTimes({ progress = 0, duration = 0 }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        ...type.lcd,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: 0.08,
        color: color.accent,
        padding: "0 1px",
      }}
    >
      <span>{fmtTime(progress)}</span>
      <span>{duration ? fmtTime(duration) : "—:—"}</span>
    </div>
  );
}

export function LcdMetaLine({ bits = [] }) {
  if (!bits.length) return null;
  return (
    <div
      style={{
        ...type.lcd,
        color: color.accent,
        letterSpacing: 0.14,
        lineHeight: 1.35,
      }}
    >
      {bits.join(" · ")}
    </div>
  );
}

export function LcdPanel({ children, live = false, style = {} }) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: radio.radiusLcd,
        background: radio.lcdFace,
        border: radio.lcdBorder,
        boxShadow: radio.lcdShadow,
        ...style,
      }}
    >
      <ScanlineWash />
      {live && (
        <span
          aria-hidden="true"
          className="pmp-lcd-pip"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color.accent,
            boxShadow: `0 0 8px ${color.accentGlow}`,
            zIndex: 2,
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
    </div>
  );
}

export function DeviceCatalogMark({ style = {} }) {
  return (
    <span
      style={{
        ...type.lcd,
        color: color.accent,
        letterSpacing: 0.16,
        flexShrink: 0,
        ...style,
      }}
    >
      PLANET / 003
    </span>
  );
}

export function LcdTitle({ children, as: Tag = "div" }) {
  return (
    <Tag
      className="pmp-lcd-title"
      style={{
        fontFamily: fontDisplay,
        fontSize: 16,
        fontWeight: 700,
        letterSpacing: -0.3,
        color: color.ink,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        margin: 0,
      }}
    >
      {children}
    </Tag>
  );
}

export function LcdArtist({ children }) {
  return (
    <div
      style={{
        marginTop: 2,
        fontFamily: fontDisplay,
        fontSize: 13,
        fontWeight: 500,
        color: color.body,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

export function DeviceTransport({
  isPlaying,
  buffering = false,
  onTogglePlay,
  onPrev,
  onSkip,
  PlayControl,
  paddlesLeft,
  paddlesRight,
  playSize = 56,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: "100%",
      }}
    >
      {paddlesLeft}
      <HardwareIconButton onClick={onPrev} label="Previous" size={44} stopPropagation>
        <Icon name="prev" size={18} />
      </HardwareIconButton>
      <PlayControl
        isPlaying={isPlaying}
        buffering={buffering}
        onClick={onTogglePlay}
        size={playSize}
        glowing={isPlaying && !buffering}
        stopPropagation
      />
      <HardwareIconButton onClick={onSkip} label="Next" size={44} stopPropagation>
        <Icon name="skip" size={18} />
      </HardwareIconButton>
      {paddlesRight}
    </div>
  );
}
