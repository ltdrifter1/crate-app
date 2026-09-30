import { useMemo } from "react";
import { color, fontDisplay, glass, homeSpace, radius, type } from "../../theme";
import { AlbumArt } from "../listen/AlbumArt";
import { buildArtists } from "../../lib/catalog";
import { displayGenre } from "../../lib/genres";

/**
 * Artists in the crate — cover, name, count. Opens the artist page.
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
      <div style={{ padding: `0 ${homeSpace.gutter}px 10px` }}>
        <h2
          style={{
            ...type.title3,
            margin: 0,
            color: color.ink,
            fontFamily: fontDisplay,
          }}
        >
          Artists
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: color.muted }}>
          {artists.length} artist{artists.length === 1 ? "" : "s"}
        </p>
      </div>
      <div style={{ padding: `0 ${homeSpace.gutter}px`, display: "flex", flexDirection: "column", gap: 6 }}>
        {artists.map((artist) => {
          const plays = artist.totalPlays || 0;
          const meta = [
            `${artist.count} track${artist.count === 1 ? "" : "s"}`,
            plays ? `${plays} play${plays === 1 ? "" : "s"}` : null,
            artist.topGenre ? (displayGenre(artist.topGenre) || artist.topGenre) : null,
          ].filter(Boolean);
          return (
            <button
              key={artist.slug}
              type="button"
              className="pmp-press"
              aria-label={artist.name}
              onClick={() => onOpenArtist?.(artist.slug)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "10px 12px",
                borderRadius: radius.lg,
                border: `1px solid ${glass.borderSoft}`,
                background: glass.plate,
                boxShadow: glass.shadowSoft,
                cursor: "pointer",
                textAlign: "left",
                color: color.ink,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  overflow: "hidden",
                  flexShrink: 0,
                  background: color.surfaceRaised,
                  border: `1px solid ${glass.borderSoft}`,
                }}
              >
                {artist.coverTrack ? (
                  <AlbumArt track={artist.coverTrack} size={48} borderRadius={24} />
                ) : null}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontFamily: fontDisplay,
                    fontSize: 16,
                    fontWeight: 600,
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
                    marginTop: 2,
                    fontSize: 13,
                    color: color.muted,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {meta.join(" · ")}
                </div>
              </div>
              <span aria-hidden="true" style={{ color: color.faint, fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
                ›
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
