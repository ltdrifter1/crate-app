import { color, fontDisplay, fontMono, homeSpace, y2k } from "../../theme";
import ArtFrame from "../ui/ArtFrame";
import { formatTrackMeta } from "../player/DeviceLcd";

/**
 * Poster-scale countdown / featured cut — not another equal square in a rail.
 */
export default function FeaturedPoster({
  track,
  rank = null,
  reason = null,
  active = false,
  onClick = null,
}) {
  if (!track) return null;
  const bits = formatTrackMeta(track, rank != null ? [`#${rank}`] : []);
  return (
    <button
      type="button"
      aria-label={`Play ${track.title} by ${track.artist}`}
      onClick={onClick || undefined}
      className="pmp-lift"
      style={{
        width: "100%",
        display: "flex",
        alignItems: "stretch",
        gap: 16,
        padding: 0,
        margin: `0 ${homeSpace.gutter}px`,
        background: "none",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
        maxWidth: `calc(100% - ${homeSpace.gutter * 2}px)`,
      }}
    >
      <ArtFrame
        src={track.albumCover || null}
        size={220}
        width={220}
        height={220}
        active={active}
        radius={6}
        eager
        style={{ flexShrink: 0, width: "min(42vw, 220px)", height: "auto", aspectRatio: "1 / 1" }}
      />
      <span
        style={{
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "4px 0",
        }}
      >
        {reason || rank != null ? (
          <span
            style={{
              fontFamily: fontMono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.12,
              textTransform: "uppercase",
              color: color.accent,
              marginBottom: 8,
            }}
          >
            {rank != null ? `#${rank}  ·  ` : null}
            {reason || "Featured"}
          </span>
        ) : null}
        <span
          style={{
            fontFamily: fontDisplay,
            fontSize: "clamp(22px, 5vw, 30px)",
            fontWeight: 700,
            letterSpacing: -0.6,
            lineHeight: 1.08,
            color: y2k.offWhite,
          }}
        >
          {track.title}
        </span>
        <span
          style={{
            marginTop: 6,
            fontSize: 15,
            fontWeight: 600,
            color: color.body,
          }}
        >
          {track.artist}
        </span>
        {bits.length ? (
          <span
            style={{
              marginTop: 10,
              fontFamily: fontMono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.1,
              textTransform: "uppercase",
              color: color.accent,
            }}
          >
            {bits.join("  ·  ")}
          </span>
        ) : null}
      </span>
    </button>
  );
}
