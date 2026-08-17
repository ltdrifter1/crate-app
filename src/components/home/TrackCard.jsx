import { color, fontDisplay, fontMono, glassPill, homeSpace, y2k } from "../../theme";
import ArtFrame from "../ui/ArtFrame";

/**
 * TrackCard — square artwork tile for Discover / Recently Played rails.
 * Optional rank badge (countdown) and reason chip (recommendations).
 */
export default function TrackCard({
  track,
  onClick = null,
  rank = null,
  reason = null,
  active = false,
  size = homeSpace.tile,
}) {
  return (
    <button
      type="button"
      aria-label={`Play ${track.title} by ${track.artist}`}
      onClick={onClick || undefined}
      className="pmp-lift"
      style={{
        flex: "0 0 auto",
        scrollSnapAlign: "start",
        width: size,
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <ArtFrame
        src={track.albumCover || null}
        size={size}
        active={active}
        radius={16}
      >
        {rank != null && (
          <span
            style={{
              ...glassPill({ compact: true }),
              position: "absolute",
              top: 8,
              left: 8,
              minWidth: 28,
              height: 24,
              padding: "0 8px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fontDisplay,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: -0.2,
              color: y2k.chromeBright,
              zIndex: 1,
            }}
          >
            #{rank}
          </span>
        )}
      </ArtFrame>
      <span
        style={{
          display: "block",
          marginTop: 10,
          fontSize: 14,
          fontWeight: 650,
          fontFamily: fontDisplay,
          letterSpacing: -0.25,
          color: y2k.offWhite,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {track.title}
      </span>
      <span
        style={{
          display: "block",
          marginTop: 3,
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: -0.05,
          color: color.muted,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {reason ? (
          <span style={{ fontFamily: fontMono, fontSize: 9, letterSpacing: 1.1, textTransform: "uppercase", color: y2k.chromeBright }}>
            {reason}
            <span style={{ color: color.muted }}> · </span>
          </span>
        ) : null}
        {track.artist}
      </span>
    </button>
  );
}
