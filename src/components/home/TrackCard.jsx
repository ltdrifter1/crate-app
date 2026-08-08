import { color, fontDisplay, fontMono, homeSpace, y2k } from "../../theme";
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
        radius={14}
      >
        {rank != null && (
          <span
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              minWidth: 26,
              height: 22,
              padding: "0 7px",
              borderRadius: 7,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(10,8,16,0.72)",
              border: "1px solid rgba(167,139,250,0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              fontFamily: fontDisplay,
              fontStyle: "italic",
              fontSize: 12,
              fontWeight: 800,
              color: y2k.purpleBright,
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
          marginTop: 9,
          fontSize: 13,
          fontWeight: 650,
          fontFamily: fontDisplay,
          letterSpacing: -0.2,
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
          fontSize: 11,
          fontWeight: 500,
          color: color.faint,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {reason ? (
          <span style={{ fontFamily: fontMono, fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase", color: y2k.purpleBright }}>
            {reason}
            <span style={{ color: color.faint }}> · </span>
          </span>
        ) : null}
        {track.artist}
      </span>
    </button>
  );
}
