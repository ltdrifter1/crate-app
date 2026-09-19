import { memo } from "react";
import { color, homeSpace, type, y2k, fontMono, hardware } from "../../theme";
import { trackHasVideo } from "../../lib/video";
import ArtFrame from "../ui/ArtFrame";
import { trackLcdBits } from "../player/DeviceChrome";

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
  const lcd = trackLcdBits(track);
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
              background: "rgba(58,66,80,0.55)",
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
            className="pmp-rank-stamp"
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              minWidth: 30,
              height: 22,
              padding: "0 7px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 3,
              background: hardware.keyFace,
              border: "1px solid rgba(216,223,232,0.45)",
              boxShadow: hardware.keyRaised,
              fontFamily: fontMono,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.4,
              color: color.ink,
              zIndex: 1,
            }}
          >
            #{String(rank).padStart(2, "0")}
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
      {lcd.length > 0 && (
        <span
          style={{
            display: "block",
            marginTop: 3,
            fontFamily: fontMono,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.1,
            textTransform: "uppercase",
            color: color.accent,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {lcd.join(" · ")}
        </span>
      )}
    </button>
  );
}

export default memo(TrackCard);
