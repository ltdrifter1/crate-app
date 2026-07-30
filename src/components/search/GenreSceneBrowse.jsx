import { useMemo } from "react";
import { fontDisplay, fontMono, color } from "../../theme";
import { genreBrowseRows, tracksForGenreLane, genreStory } from "../../lib/browse";

/**
 * Genre-only browse for Search empty state.
 * Scenes stay in the background — user picks a genre to listen.
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

  const playGenre = (lane) => {
    if (onListenIntent) {
      onListenIntent({ genre: lane, scene: null });
      return;
    }
    const pool = tracksForGenreLane(tracks, lane);
    if (pool.length) onPlayPool?.(pool[0], pool);
  };

  // Optional: show tracks for the active listening genre
  if (activeGenre) {
    const pool = tracksForGenreLane(tracks, activeGenre);
    return (
      <div style={{ paddingTop: 8, animation: "rise 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
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
            Listening
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: -0.7,
            color: color.ink,
            fontFamily: fontDisplay,
            marginBottom: 8,
          }}>
            {activeGenre}
          </div>
          <div style={{ fontSize: 14, color: color.body, lineHeight: 1.45, marginBottom: 14 }}>
            {genreStory(activeGenre)}
          </div>
          <div style={{ fontSize: 13, color: color.muted, marginBottom: 12 }}>
            {pool.length} songs in this genre
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
        Pick a genre to listen.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {rows.map((row) => (
          <button
            key={row.lane}
            type="button"
            onClick={() => playGenre(row.lane)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: "14px 4px",
              background: "none",
              border: "none",
              borderBottom: `1px solid ${color.line}`,
              cursor: "pointer",
              textAlign: "left",
              color: color.ink,
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
        ))}
      </div>
    </div>
  );
}
