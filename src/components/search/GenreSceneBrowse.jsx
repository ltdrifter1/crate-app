import { useMemo, useState } from "react";
import { fontDisplay, fontMono, color } from "../../theme";
import {
  genreBrowseRows,
  scenesForLane,
  tracksForGenreLane,
  tracksForScenePool,
  genreStory,
} from "../../lib/browse";
import { getScene } from "../../lib/scenes";

/**
 * Genre → Scene browse map for Search empty state.
 * Drill: genres → scenes for that lane → filtered pool (play, not query-only).
 */
export default function GenreSceneBrowse({
  tracks = [],
  onPlayPool,
  currentTrack,
  isPlaying,
  TrackRow,
  onLike,
  playlistCtx,
}) {
  const [lane, setLane] = useState(null);
  const [sceneId, setSceneId] = useState(null);

  const rows = useMemo(() => genreBrowseRows(tracks), [tracks]);
  const scenes = useMemo(() => (lane ? scenesForLane(lane) : []), [lane]);
  const scene = sceneId ? getScene(sceneId) : null;

  const pool = useMemo(() => {
    if (sceneId) return tracksForScenePool(tracks, sceneId);
    if (lane) return tracksForGenreLane(tracks, lane);
    return [];
  }, [tracks, lane, sceneId]);

  const playPool = () => {
    if (!pool.length || !onPlayPool) return;
    onPlayPool(pool[0], pool);
  };

  if (scene) {
    return (
      <div style={{ paddingTop: 8, animation: "rise 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
        <button
          type="button"
          onClick={() => setSceneId(null)}
          style={{
            background: "none",
            border: "none",
            color: color.accent,
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
            padding: "4px 0 16px",
          }}
        >
          ‹ {lane}
        </button>

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
            Scene · {lane}
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: -0.7,
            color: color.ink,
            fontFamily: fontDisplay,
            marginBottom: 8,
          }}>
            {scene.label}
          </div>
          <div style={{ fontSize: 14, color: color.body, lineHeight: 1.45, maxWidth: 340, marginBottom: 14 }}>
            {scene.story}
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}>
            <button
              type="button"
              onClick={playPool}
              disabled={!pool.length}
              style={{
                padding: "12px 20px",
                borderRadius: 980,
                border: "none",
                background: pool.length ? color.accent : color.surfaceRaised,
                color: pool.length ? color.onAccent : color.faint,
                fontWeight: 650,
                fontSize: 14,
                cursor: pool.length ? "pointer" : "default",
              }}
            >
              Play scene
            </button>
            <span style={{ fontSize: 13, color: color.muted }}>
              {pool.length} {pool.length === 1 ? "song" : "songs"}
            </span>
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
        {!pool.length && (
          <div style={{ padding: "32px 0", textAlign: "center", color: color.muted, fontSize: 14 }}>
            No songs match this scene yet.
          </div>
        )}
      </div>
    );
  }

  if (lane) {
    const lanePool = tracksForGenreLane(tracks, lane);
    return (
      <div style={{ paddingTop: 8, animation: "rise 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
        <button
          type="button"
          onClick={() => { setLane(null); setSceneId(null); }}
          style={{
            background: "none",
            border: "none",
            color: color.accent,
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
            padding: "4px 0 16px",
          }}
        >
          ‹ Browse
        </button>

        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: -0.7,
            color: color.ink,
            fontFamily: fontDisplay,
            marginBottom: 8,
          }}>
            {lane}
          </div>
          <div style={{ fontSize: 14, color: color.body, lineHeight: 1.45, maxWidth: 320, marginBottom: 14 }}>
            {genreStory(lane)}
          </div>
          <button
            type="button"
            onClick={() => onPlayPool?.(lanePool[0], lanePool)}
            disabled={!lanePool.length}
            style={{
              padding: "12px 20px",
              borderRadius: 980,
              border: "none",
              background: lanePool.length ? color.accent : color.surfaceRaised,
              color: lanePool.length ? color.onAccent : color.faint,
              fontWeight: 650,
              fontSize: 14,
              cursor: lanePool.length ? "pointer" : "default",
              marginBottom: 8,
            }}
          >
            Play all {lane}
          </button>
          <div style={{ fontSize: 13, color: color.muted }}>
            {lanePool.length} songs · pick a scene to go deeper
          </div>
        </div>

        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: color.muted,
          marginBottom: 8,
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}>
          Scenes
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {scenes.map((s) => {
            const count = tracksForScenePool(tracks, s.id).length;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSceneId(s.id)}
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
                    {s.label}
                  </div>
                  <div style={{
                    fontSize: 13,
                    color: color.muted,
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {s.story.split("—")[0].trim()}
                  </div>
                </div>
                <span style={{
                  fontSize: 12,
                  color: color.faint,
                  fontFamily: fontMono,
                  flexShrink: 0,
                }}>
                  {count || "·"}
                </span>
              </button>
            );
          })}
        </div>
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
        Browse
      </div>
      <div style={{ fontSize: 14, color: color.muted, marginBottom: 14, lineHeight: 1.4 }}>
        Start with a genre, then open its scenes.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {rows.map((row) => (
          <button
            key={row.lane}
            type="button"
            onClick={() => setLane(row.lane)}
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
