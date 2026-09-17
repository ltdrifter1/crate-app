import { memo } from "react";
import { color, fontDisplay, homeSpace } from "../../theme";
import ArtFrame from "../ui/ArtFrame";

/**
 * Circular artist face for Explore — not used on Home.
 */
function ArtistCard({
  artist,
  onClick = null,
  size = homeSpace.tile,
}) {
  const name = artist?.name || "Unknown";
  const cover = artist?.coverTrack?.albumCover || null;
  return (
    <button
      type="button"
      aria-label={`Open artist ${name}`}
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
        textAlign: "center",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <ArtFrame src={cover} size={size} radius={Math.round(size / 2)} />
      <span
        style={{
          display: "block",
          marginTop: 8,
          fontFamily: fontDisplay,
          fontSize: 13,
          fontWeight: 650,
          letterSpacing: -0.2,
          color: color.ink,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </span>
    </button>
  );
}

export default memo(ArtistCard);
