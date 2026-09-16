import { color, fontDisplay, homeSpace, y2k } from "../../theme";
import ArtFrame from "../ui/ArtFrame";

/**
 * Album sleeve tile. No overlay labels — the cover is the point.
 * `variant` changes shape so a band of albums doesn't read as copy-paste rows.
 *   lead  — large sleeve, title + artist + track count
 *   tile  — square sleeve, title + artist
 *   count — square sleeve, title + track count
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
  const count = album?.count || 0;
  const isLead = variant === "lead";
  const showArtist = variant !== "count";
  const showCount = isLead || variant === "count";
  const frame = isLead ? 168 : size;

  const titleStyle = {
    display: "block",
    marginTop: isLead ? 0 : 8,
    fontSize: isLead ? 17 : 13,
    fontWeight: isLead ? 700 : 650,
    fontFamily: fontDisplay,
    letterSpacing: isLead ? -0.35 : -0.2,
    lineHeight: 1.2,
    color: y2k.offWhite,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: isLead ? "normal" : "nowrap",
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
  const meta = [
    showArtist ? artist : null,
    showCount && count ? `${count} tracks` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      aria-label={`Open album ${title}${artist ? ` by ${artist}` : ""}`}
      onClick={onClick || undefined}
      className={`pmp-lift pmp-release pmp-release--${variant}`}
      style={{
        width: "100%",
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
          radius={isLead ? 12 : 10}
          eager={isLead}
          style={{ width: "100%", height: "auto", aspectRatio: "1 / 1" }}
        />
      </span>
      <span className="pmp-release-copy">
        <span style={titleStyle}>{title}</span>
        {meta ? <span style={metaStyle}>{meta}</span> : null}
      </span>
    </button>
  );
}

/** Mixed album band — one large sleeve, then tiles that don't all look the same. */
export function ReleasesBand({ albums = [], onOpenAlbum = null, onPlayTrack = null }) {
  if (!albums.length) return null;

  const open = (album) => {
    if (onOpenAlbum) onOpenAlbum(album.slug);
    else if (album.coverTrack) onPlayTrack?.(album.coverTrack, album.tracks);
  };

  const [lead, ...rest] = albums;

  return (
    <div className="pmp-releases">
      <ReleaseCard album={lead} variant="lead" onClick={() => open(lead)} />
      {rest.map((album, i) => (
        <ReleaseCard
          key={album.slug}
          album={album}
          variant={i % 2 === 0 ? "tile" : "count"}
          size={i % 3 === 0 ? 148 : 128}
          onClick={() => open(album)}
        />
      ))}
    </div>
  );
}
