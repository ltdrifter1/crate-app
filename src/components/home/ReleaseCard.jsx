import { color, fontDisplay, homeSpace, y2k } from "../../theme";
import ArtFrame from "../ui/ArtFrame";

/**
 * Album sleeve tile. The cover is the point — title and artist sit under it.
 */
export default function ReleaseCard({
  album,
  onClick = null,
  variant = "tile",
  size = homeSpace.tile,
}) {
  const cover = album?.coverTrack?.albumCover || null;
  const title = album?.title || "Untitled";
  const artist = album?.artist || "";
  const isLead = variant === "lead";
  const frame = isLead ? 168 : size;

  const titleStyle = {
    display: "block",
    marginTop: 8,
    fontSize: isLead ? 16 : 13,
    fontWeight: isLead ? 700 : 650,
    fontFamily: fontDisplay,
    letterSpacing: isLead ? -0.3 : -0.2,
    lineHeight: 1.2,
    color: y2k.offWhite,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };
  const metaStyle = {
    display: "block",
    marginTop: 4,
    fontSize: isLead ? 13 : 12,
    fontWeight: 500,
    color: color.faint,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  return (
    <button
      type="button"
      aria-label={`Open album ${title}${artist ? ` by ${artist}` : ""}`}
      onClick={onClick || undefined}
      className={`pmp-lift pmp-release pmp-release--${variant}`}
      style={{
        width: "100%",
        minWidth: 0,
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span className="pmp-release-art">
        <ArtFrame
          src={cover}
          size={frame}
          radius={10}
          eager={isLead}
          style={{ width: "100%", height: "auto", aspectRatio: "1 / 1" }}
        />
      </span>
      <span className="pmp-release-copy">
        <span style={titleStyle}>{title}</span>
        {artist ? <span style={metaStyle}>{artist}</span> : null}
      </span>
    </button>
  );
}

/** Even sleeve wall — one size, title + artist, no lead spanning rows. */
export function ReleasesBand({ albums = [], onOpenAlbum = null, onPlayTrack = null }) {
  if (!albums.length) return null;

  const open = (album) => {
    if (onOpenAlbum) onOpenAlbum(album.slug);
    else if (album.coverTrack) onPlayTrack?.(album.coverTrack, album.tracks);
  };

  return (
    <div className="pmp-releases">
      {albums.map((album) => (
        <ReleaseCard
          key={album.slug}
          album={album}
          variant="tile"
          onClick={() => open(album)}
        />
      ))}
    </div>
  );
}
