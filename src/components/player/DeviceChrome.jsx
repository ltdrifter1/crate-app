/**
 * Shared MP3-device chrome — LCD, seek groove, hardware keys.
 * Used by immersive, Home hero, dock, and desktop mini. Tokens only.
 */
import { color, fontDisplay, fontPoster, hardware, motion, radio, type } from "../../theme";
import { fmtTime } from "../../lib/harmony";
import { useEnergyQueue } from "../../useEnergyQueue";
import ScanlineWash from "../home/ScanlineWash";
import Icon from "../ui/Icon";

/** MP3 as format glyph; real kbps when the catalog has a number. */
export function formatBitrate(track) {
  const raw = track?.bitrate;
  if (raw == null || raw === "") return "MP3";
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return `${Math.round(n)} kbps`;
  const s = String(raw).trim();
  if (!s) return "MP3";
  if (/kbps|mp3/i.test(s)) return s.replace(/\s+/g, " ");
  const parsed = parseInt(s, 10);
  if (Number.isFinite(parsed) && parsed > 0) return `${parsed} kbps`;
  return s;
}

export function trackLcdBits(track, extra = []) {
  if (!track) return extra.filter(Boolean);
  return [
    track.bpm ? `${Math.round(Number(track.bpm))} BPM` : null,
    track.camelot || null,
    track.energy != null && track.energy !== "" ? `E${track.energy}` : null,
    ...extra,
  ].filter(Boolean);
}

/** BPM + key only — for list rows where energy would crowd the line. */
export function trackBrowseBits(track) {
  if (!track) return [];
  return [
    track.bpm ? `${Math.round(Number(track.bpm))} BPM` : null,
    track.camelot || null,
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
      className={`pmp-hw-key${lit ? " pmp-hw-key--lit" : ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: hardware.radius,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: lit ? color.lcdSignal : color.ink,
        background: hardware.keyFace,
        border: `1px solid ${lit ? "rgba(110,168,255,0.42)" : "rgba(255,255,255,0.10)"}`,
        boxShadow: lit
          ? `${hardware.keyPressed}, 0 0 10px ${color.lcdSignalGlow}`
          : hardware.keyRaised,
        transition: `transform ${motion.fast} ${motion.ease}, color ${motion.fast}, background ${motion.base}, box-shadow ${motion.fast}`,
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
  ticks = false,
}) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) * 100 : 0;
  return (
    <div className="pmp-seek">
      <div
        aria-hidden="true"
        className="pmp-seek__well"
        style={{ height }}
      >
        {ticks ? (
          <div className="pmp-seek__ticks">
            {[25, 50, 75].map((mark) => (
              <span key={mark} style={{ left: `${mark}%` }} />
            ))}
          </div>
        ) : null}
        <div
          className="pmp-seek__fill"
          style={{
            width: `${pct}%`,
            background: radio.lcdFill,
            boxShadow: radio.lcdGlow,
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
          height: 32,
          background: "transparent",
          cursor: "pointer",
          zIndex: 1,
        }}
      />
    </div>
  );
}

export function LcdTimes({ progress = 0, duration = 0, tone = "well", on }) {
  const surface = on || (tone === "strip" ? "metal" : "lcd");
  const ink = surface === "metal" ? (color.stripInk || color.accent) : color.lcdInk;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        ...type.lcd,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: 0.08,
        color: ink,
        padding: "0 1px",
      }}
    >
      <span>{fmtTime(progress)}</span>
      <span>{duration ? fmtTime(duration) : "—:—"}</span>
    </div>
  );
}

/** Seek groove with elapsed / remaining times on the flanks. */
export function LcdTimeline({
  progress = 0,
  duration = 0,
  onChange,
  label = "Seek",
  stopPropagation = false,
  height,
  on = "metal",
}) {
  const ink = on === "metal" ? (color.stripInk || color.accent) : color.lcdInk;
  const timeStyle = {
    ...type.lcd,
    color: ink,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: 0.1,
    textTransform: "none",
    flexShrink: 0,
    minWidth: 38,
  };
  return (
    <div
      className="pmp-timeline"
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
      }}
    >
      <span style={timeStyle}>{fmtTime(progress)}</span>
      <LcdSeek
        value={progress}
        max={duration || 1}
        onChange={onChange}
        label={label}
        stopPropagation={stopPropagation}
        height={height ?? 10}
        ticks
      />
      <span style={{ ...timeStyle, textAlign: "right" }}>
        {duration ? fmtTime(duration) : "—:—"}
      </span>
    </div>
  );
}

/** on: "lcd" = pearl on smoked well; "metal" = graphite on aluminum. tone: "strip"|"well" alias. */
export function LcdMetaLine({ bits = [], tone = "well", on }) {
  const { energyShift } = useEnergyQueue();
  const pace = energyShift?.active
    ? (energyShift.direction > 0 ? "FAST" : "SLOW")
    : null;
  const all = pace ? [...bits.filter(Boolean), pace] : bits.filter(Boolean);
  if (!all.length) return null;
  const surface = on || (tone === "strip" ? "metal" : "lcd");
  const ink = surface === "metal" ? (color.stripInk || color.accent) : color.lcdInk;
  return (
    <div
      style={{
        ...type.lcd,
        color: ink,
        letterSpacing: 0.14,
        lineHeight: 1.35,
      }}
    >
      {all.join(" · ")}
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
            background: color.lcdSignal,
            boxShadow: radio.lcdGlow,
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
  const text = typeof children === "string" ? children : "";
  const marquee = text.length > 22;
  return (
    <Tag
      className={marquee ? "pmp-lcd-marquee" : "pmp-lcd-title"}
      style={{
        fontFamily: fontPoster,
        fontSize: 20,
        fontWeight: 800,
        letterSpacing: -0.4,
        color: color.lcdInk,
        overflow: "hidden",
        textOverflow: marquee ? undefined : "ellipsis",
        whiteSpace: "nowrap",
        margin: 0,
      }}
    >
      <span>{children}</span>
      {marquee ? <span aria-hidden="true">{children}</span> : null}
    </Tag>
  );
}

export function LcdArtist({ children }) {
  return (
    <div
      style={{
        marginTop: 2,
        fontFamily: fontDisplay,
        fontSize: 15,
        fontWeight: 500,
        color: color.lcdMute,
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
