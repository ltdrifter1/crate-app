import { useMemo } from "react";
import { color, fontDisplay, fontMono, fontPoster, homeSpace } from "../../theme";
import { AlbumArt } from "../listen/AlbumArt";
import { buildArtists } from "../../lib/catalog";
import { displayGenre } from "../../lib/genres";
import { inkForTrack } from "../../lib/board";

/**
 * Artists in the crate — a wall of sleeves, each with its station ink along
 * the foot. The same tile the artist page uses for Same shelf, so the two
 * read as one shop. Opens the artist page.
 */
export default function ArtistIndex({
  tracks = [],
  onOpenArtist = null,
  limit = 48,
}) {
  const artists = useMemo(() => {
    const list = buildArtists(tracks);
    return list
      .slice()
      .sort((a, b) => b.totalPlays - a.totalPlays || b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, limit);
  }, [tracks, limit]);

  if (!artists.length) {
    return (
      <p
        style={{
          margin: 0,
          padding: `16px ${homeSpace.gutter}px`,
          fontSize: 14,
          color: color.muted,
        }}
      >
        Artists show up here once names land on the sleeves.
      </p>
    );
  }

  return (
    <section aria-label="Artists" style={{ marginTop: 12 }}>
      <div
        style={{
          padding: `0 ${homeSpace.gutter}px 12px`,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: fontPoster,
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: 0.3,
            textTransform: "uppercase",
            lineHeight: 1,
            color: color.ink,
          }}
        >
          Artists
        </h2>
        <span
          style={{
            fontFamily: fontMono,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.12,
            textTransform: "uppercase",
            color: color.faint,
          }}
        >
          {artists.length} on file · by spins
        </span>
      </div>
      <div
        className="pmp-artist-wall"
        style={{
          padding: `0 ${homeSpace.gutter}px`,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))",
          gap: "18px 12px",
        }}
      >
        {artists.map((artist) => {
          const ink = inkForTrack(artist.coverTrack || artist.tracks?.[0]);
          const genre = artist.topGenre ? (displayGenre(artist.topGenre) || artist.topGenre) : null;
          return (
            <button
              key={artist.slug}
              type="button"
              className="pmp-press"
              aria-label={artist.name}
              onClick={() => onOpenArtist?.(artist.slug)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                textAlign: "left",
                color: color.ink,
                minWidth: 0,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "1 / 1",
                  overflow: "hidden",
                  borderRadius: 6,
                  background: color.surfaceRaised,
                  border: "1px solid rgba(255,255,255,0.08)",
                  marginBottom: 8,
                }}
              >
                {artist.coverTrack ? (
                  <AlbumArt track={artist.coverTrack} size={160} borderRadius={6} />
                ) : (
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      fontFamily: fontPoster,
                      fontSize: 40,
                      fontWeight: 800,
                      color: "rgba(232,236,242,0.35)",
                    }}
                  >
                    {(artist.name || "?").charAt(0)}
                  </span>
                )}
                <span
                  aria-hidden="true"
                  style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, background: ink }}
                />
              </div>
              <div
                style={{
                  fontFamily: fontDisplay,
                  fontSize: 14,
                  fontWeight: 650,
                  letterSpacing: -0.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {artist.name}
              </div>
              <div
                style={{
                  marginTop: 3,
                  fontFamily: fontMono,
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: 0.08,
                  textTransform: "uppercase",
                  color: color.muted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {artist.count} {artist.count === 1 ? "track" : "tracks"}
                {genre ? ` · ${genre}` : ""}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
