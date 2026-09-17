import { memo } from "react";
import { color, fontDisplay, glassPill, homeSpace, y2k } from "../../theme";
import { trackHasVideo } from "../../lib/video";
import ArtFrame from "../ui/ArtFrame";

/**
 * TrackCard — square artwork tile for Discover / Recently Played rails.
 * Optional rank badge (countdown) and reason chip (recommendations).
 */
function TrackCard({
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
        {trackHasVideo(track) && (
          <span
            aria-hidden="true"
            style={{
              ...glassPill({ compact: true }),
              position: "absolute",
              top: 8,
              right: 8,
              height: 22,
              padding: "0 8px",
              display: "inline-flex",
              alignItems: "center",
              fontFamily: fontDisplay,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              textTransform: "none",
              color: y2k.chromeBright,
              zIndex: 1,
            }}
          >
            Video
          </span>
        )}
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
              borderRadius: 4,
              background: "rgba(8,10,13,0.72)",
              border: "1px solid rgba(101,230,255,0.4)",
              fontFamily: fontDisplay,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: y2k.cyan,
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
          fontSize: 13,
          fontWeight: 600,
          fontFamily: fontDisplay,
          letterSpacing: "-0.016em",
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
          <span style={{ fontFamily: fontDisplay, fontSize: 12, letterSpacing: "-0.01em", color: color.muted }}>
            {reason}
            <span style={{ color: color.muted }}> · </span>
          </span>
        ) : null}
        {track.artist}
      </span>
    </button>
  );
}

export default memo(TrackCard);
