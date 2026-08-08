import { color, fontDisplay, fontMono, y2k } from "../../theme";
import CoverImage from "../ui/CoverImage";

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
  size = 138,
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
      <span
        style={{
          position: "relative",
          display: "block",
          width: size,
          height: size,
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${active ? "rgba(167,139,250,0.55)" : "rgba(255,255,255,0.08)"}`,
          background: y2k.artGradient,
          boxShadow: active
            ? `0 0 18px ${y2k.purpleGlow}, 0 10px 24px rgba(0,0,0,0.4)`
            : "0 10px 24px rgba(0,0,0,0.35)",
        }}
      >
        {track.albumCover && (
          <CoverImage
            src={track.albumCover}
            alt=""
            width={size}
            height={size}
          />
        )}
        {/* Artwork gradient foot for legibility of badges */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(8,6,14,0.18) 0%, transparent 30%)",
          }}
        />
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
            }}
          >
            #{rank}
          </span>
        )}
        {active && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              right: 8,
              bottom: 8,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: y2k.neon,
              boxShadow: `0 0 8px ${y2k.neon}`,
              animation: "stageLiveDot 1.6s ease-in-out infinite",
            }}
          />
        )}
      </span>
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
