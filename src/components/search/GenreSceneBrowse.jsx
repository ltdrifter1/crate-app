import { useMemo, useState } from "react";
import { fontDisplay, fontMono, color, glass, radius } from "../../theme";
import { genreBrowseRows, tracksForGenreLane, genreStory } from "../../lib/browse";

/**
 * Genre browse for Search empty state.
 * Dig = open the crate. Listen = start On air in that lane.
 */
export default function GenreSceneBrowse({
  tracks = [],
  onPlayPool,
  onListenIntent,
  currentTrack,
  isPlaying,
  TrackRow,
  onLike,
  playlistCtx,
  activeGenre = null,
}) {
  const rows = useMemo(() => genreBrowseRows(tracks), [tracks]);
  const [digGenre, setDigGenre] = useState(null);
  const browsing = activeGenre || digGenre;

  const listenGenre = (lane) => {
    if (onListenIntent) {
      onListenIntent({ genre: lane, scene: null });
      return;
    }
    const pool = tracksForGenreLane(tracks, lane);
    if (pool.length) onPlayPool?.(pool[0], pool);
  };

  if (browsing) {
    const pool = tracksForGenreLane(tracks, browsing);
    return (
      <div style={{ paddingTop: 8, animation: "rise 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
        {!activeGenre && (
          <button
            type="button"
            onClick={() => setDigGenre(null)}
            style={{
              background: "none", border: "none", color: color.accent,
              fontSize: 14, cursor: "pointer", fontWeight: 500, marginBottom: 14, padding: 0,
            }}
          >
            ‹ Genres
          </button>
        )}
        <div style={{ marginBottom: 18 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 650,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            color: color.faint,
            fontFamily: fontMono,
            marginBottom: 8,
          }}>
            {activeGenre ? "Listening" : "In the crate"}
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: -0.7,
            color: color.ink,
            fontFamily: fontDisplay,
            marginBottom: 8,
          }}>
            {browsing}
          </div>
          <div style={{ fontSize: 14, color: color.body, lineHeight: 1.45, marginBottom: 14 }}>
            {genreStory(browsing)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, color: color.muted }}>
              {pool.length} cut{pool.length === 1 ? "" : "s"}
            </div>
            {onListenIntent && (
              <button
                type="button"
                onClick={() => listenGenre(browsing)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "8px 14px",
                  borderRadius: radius.sm,
                  border: `1px solid ${glass.border}`,
                  background: glass.fillStrong,
                  color: color.ink,
                  fontSize: 12.5,
                  fontWeight: 650,
                  cursor: "pointer",
                  boxShadow: `inset 0 1px 0 ${glass.highlight}`,
                  backdropFilter: glass.blurSoft,
                  WebkitBackdropFilter: glass.blurSoft,
                }}
              >
                Listen in this lane
              </button>
            )}
          </div>
        </div>
        {pool.map((t) => (
          <TrackRow
            key={t.id}
            track={t}
            onPlay={() => onPlayPool?.(t, pool)}
            active={currentTrack?.id === t.id}
            isPlaying={isPlaying}
            onLike={onLike}
            playlistCtx={playlistCtx}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 8, animation: "rise 0.45s cubic-bezier(0.22,1,0.36,1) both" }}>
      <div style={{
        fontSize: 20,
        fontWeight: 700,
        letterSpacing: -0.4,
        color: color.ink,
        marginBottom: 6,
        fontFamily: fontDisplay,
      }}>
        Genres
      </div>
      <div style={{ fontSize: 14, color: color.muted, marginBottom: 14, lineHeight: 1.4 }}>
        Dig a lane — or listen On air from here.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {rows.map((row) => (
          <div
            key={row.lane}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 0",
              borderBottom: `1px solid ${color.line}`,
            }}
          >
            <button
              type="button"
              onClick={() => setDigGenre(row.lane)}
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "2px 4px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                color: color.ink,
                minWidth: 0,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 600, fontFamily: fontDisplay }}>
                  {row.lane}
                </div>
                <div style={{ fontSize: 13, color: color.muted, marginTop: 2 }}>
                  {row.story}
                </div>
              </div>
              <span style={{
                fontSize: 12,
                color: color.faint,
                fontFamily: fontMono,
                flexShrink: 0,
              }}>
                {row.trackCount}
              </span>
            </button>
            {onListenIntent && (
              <button
                type="button"
                onClick={() => listenGenre(row.lane)}
                aria-label={`Listen to ${row.lane}`}
                style={{
                  flexShrink: 0,
                  padding: "8px 12px",
                  borderRadius: radius.sm,
                  border: `1px solid ${glass.border}`,
                  background: glass.fillStrong,
                  color: color.body,
                  fontSize: 11.5,
                  fontWeight: 650,
                  cursor: "pointer",
                  fontFamily: fontMono,
                  letterSpacing: 0.2,
                  boxShadow: `inset 0 1px 0 ${glass.highlight}`,
                }}
              >
                Listen
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
