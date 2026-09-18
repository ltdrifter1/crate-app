import { memo } from "react";
import { color, homeSpace, type, y2k } from "../../theme";
import { trackHasVideo } from "../../lib/video";
import ArtFrame from "../ui/ArtFrame";

/**
 * TrackCard — crate tile: jewel sleeve + title + artist.
 * Optional rank badge (countdown) and reason line (recommendations).
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
        radius={6}
      >
        {trackHasVideo(track) && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              height: 22,
              padding: "0 8px",
              borderRadius: 4,
              background: "rgba(0,0,0,0.55)",
              display: "inline-flex",
              alignItems: "center",
              ...type.caption,
              fontWeight: 600,
              color: color.onDark,
              zIndex: 1,
            }}
          >
            Video
          </span>
        )}
        {rank != null && (
          <span
            style={{
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
              background: "rgba(0,0,0,0.55)",
              ...type.caption,
              fontWeight: 700,
              color: color.onDark,
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
          marginTop: 8,
          ...type.tileTitle,
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
          marginTop: 2,
          ...type.tileMeta,
          color: color.muted,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {reason ? `${reason} · ` : null}
        {track.artist}
      </span>
    </button>
  );
}

export default memo(TrackCard);
