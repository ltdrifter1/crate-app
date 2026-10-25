import { useMemo, useState } from "react";
import { fontDisplay, fontMono, fontPoster, color, glass, radius } from "../../theme";
import { genreBrowseRows, tracksForGenreLane } from "../../lib/browse";
import VirtualList from "../ui/VirtualList";

/**
 * Genre browse for Search empty state — names only, no description copy.
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
    const useVirtual = pool.length > 40;
    const listMax = typeof window !== "undefined"
      ? Math.min(window.innerHeight * 0.62, 640)
      : 480;
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
        <div style={{
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: 0.2,
          textTransform: "uppercase",
          lineHeight: 1,
          color: color.ink,
          fontFamily: fontPoster,
          marginBottom: 16,
        }}>
          {browsing}
        </div>
        {useVirtual ? (
          <VirtualList
            items={pool}
            estimateSize={68}
            maxHeight={listMax}
            renderItem={(t) => (
              <TrackRow
                track={t}
                onPlay={() => onPlayPool?.(t, pool)}
                active={currentTrack?.id === t.id}
                isPlaying={isPlaying}
                onLike={onLike}
                playlistCtx={playlistCtx}
              />
            )}
          />
        ) : (
          pool.map((t) => (
            <TrackRow
              key={t.id}
              track={t}
              onPlay={() => onPlayPool?.(t, pool)}
              active={currentTrack?.id === t.id}
              isPlaying={isPlaying}
              onLike={onLike}
              playlistCtx={playlistCtx}
            />
          ))
        )}
        {onListenIntent && pool.length > 0 && (
          <button
            type="button"
            onClick={() => listenGenre(browsing)}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "12px 14px",
              borderRadius: radius.lg,
              border: `1px solid ${glass.border}`,
              background: glass.chrome,
              color: color.ink,
              fontSize: 14,
              fontWeight: 650,
              cursor: "pointer",
              boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
              backdropFilter: glass.blurSoft,
              WebkitBackdropFilter: glass.blurSoft,
            }}
          >
            Listen
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 8, animation: "rise 0.45s cubic-bezier(0.22,1,0.36,1) both" }}>
      <div style={{
        fontFamily: fontMono,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.14,
        textTransform: "uppercase",
        color: color.accent,
        marginBottom: 8,
      }}>
        Genres
      </div>
      <div
        className="pmp-genre-bins"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}
      >
        {rows.map((row) => (
          <button
            key={row.lane}
            type="button"
            onClick={() => setDigGenre(row.lane)}
            aria-label={`Browse ${row.lane}`}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 14,
              minHeight: 84,
              padding: "12px 12px 10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(200,210,222,0.12)",
              borderRadius: 6,
              boxShadow: "inset 0 1px 0 rgba(200,210,222,0.08)",
              cursor: "pointer",
              textAlign: "left",
              color: color.ink,
              width: "100%",
              minWidth: 0,
            }}
          >
            <span style={{
              fontFamily: fontPoster,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 0.2,
              textTransform: "uppercase",
              lineHeight: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {row.lane}
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.1,
              textTransform: "uppercase",
              color: color.muted,
              fontFamily: fontMono,
            }}>
              {row.trackCount} {row.trackCount === 1 ? "track" : "tracks"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
