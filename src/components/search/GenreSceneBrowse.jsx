import { useMemo, useState } from "react";
import { fontDisplay, fontMono, color, glass, radius, type } from "../../theme";
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
          ...type.display,
          fontSize: 28,
          color: color.ink,
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
        ...type.section,
        fontSize: 20,
        color: color.ink,
        marginBottom: 8,
      }}>
        Genres
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map((row) => (
          <button
            key={row.lane}
            type="button"
            onClick={() => setDigGenre(row.lane)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: "14px 14px",
              background: `
                linear-gradient(165deg, rgba(34,38,45,0.72) 0%, rgba(28,32,38,0.4) 100%)
              `,
              border: `1px solid ${glass.borderSoft}`,
              borderRadius: radius.lg,
              boxShadow: `inset 0 1px 0 ${glass.highlight}`,
              backdropFilter: glass.blurSoft,
              WebkitBackdropFilter: glass.blurSoft,
              cursor: "pointer",
              textAlign: "left",
              color: color.ink,
              width: "100%",
            }}
          >
            <span style={{ ...type.section, fontSize: 17, color: color.ink }}>
              {row.lane}
            </span>
            <span style={{
              ...type.monoLabel,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.2,
              textTransform: "none",
              color: color.faint,
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
