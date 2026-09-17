import { color, fontDisplay, fontMono, radio } from "../../theme";

export function formatTrackMeta(track = null, extras = []) {
  if (!track && !extras.length) return [];
  return [
    track?.bpm ? `${Math.round(Number(track.bpm))} BPM` : null,
    track?.camelot || null,
    track?.energy != null ? `E${track.energy}` : null,
    ...extras,
  ].filter(Boolean);
}

/**
 * Compact LCD readout — title, artist, technical meta.
 */
export default function DeviceLcd({
  title = "",
  artist = "",
  bits = [],
  timeText = null,
  live = false,
  compact = false,
}) {
  const meta = [...bits, timeText].filter(Boolean).join("  ·  ");
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: compact ? "4px 8px" : "8px 10px",
        borderRadius: radio.radiusLcd,
        background: radio.lcdFace,
        border: radio.lcdBorder,
        boxShadow: radio.lcdShadow,
      }}
    >
      <div
        style={{
          fontFamily: fontDisplay,
          fontSize: compact ? 13 : 15,
          fontWeight: 650,
          letterSpacing: -0.2,
          color: color.ink,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {live ? (
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: color.alert,
              marginRight: 7,
              verticalAlign: "middle",
              animation: "stageLiveDot 1.6s ease-in-out infinite",
            }}
          />
        ) : null}
        {title}
      </div>
      {artist ? (
        <div
          style={{
            marginTop: 2,
            fontSize: compact ? 11 : 13,
            fontWeight: 500,
            color: color.body,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {artist}
        </div>
      ) : null}
      {meta ? (
        <div
          style={{
            marginTop: compact ? 3 : 5,
            fontFamily: fontMono,
            fontSize: compact ? 9 : 10,
            fontWeight: 700,
            letterSpacing: 0.1,
            textTransform: "uppercase",
            color: color.accent,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {meta}
        </div>
      ) : null}
    </div>
  );
}
