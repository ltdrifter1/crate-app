import { color, fontDisplay, fontMono, homeSpace, y2k } from "../../theme";
import ArtFrame from "../ui/ArtFrame";

/**
 * ReleaseCard — featured album sleeve for the Home releases band.
 */
export default function ReleaseCard({
  album,
  onClick = null,
  size = homeSpace.tileFeatured,
}) {
  const cover = album?.coverTrack?.albumCover || null;
  const title = album?.title || "Untitled";
  const artist = album?.artist || "";
  const count = album?.count || 0;

  return (
    <button
      type="button"
      aria-label={`Open album ${title} by ${artist}`}
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
      <ArtFrame src={cover} size={size} radius={14} priority={false}>
        <span
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 1,
            fontFamily: fontMono,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: y2k.offWhite,
            padding: "5px 8px",
            borderRadius: 6,
            background: "rgba(10,8,16,0.72)",
            border: "1px solid rgba(255,255,255,0.14)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          Release
        </span>
      </ArtFrame>
      <span
        style={{
          display: "block",
          marginTop: 9,
          fontSize: 14,
          fontWeight: 700,
          fontFamily: fontDisplay,
          letterSpacing: -0.25,
          color: y2k.offWhite,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
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
        {artist}
        {count ? ` · ${count} cuts` : ""}
      </span>
    </button>
  );
}
