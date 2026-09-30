import { color, fontDisplay, homeSpace, type } from "../../theme";
import { TrackRow } from "../listen/TrackRow";
import { trendingTracks } from "../../lib/homeCollections";
import { useCurrentTrack, useIsPlaying } from "../../usePlayerTransport";

/**
 * What’s moving — ranked cuts by play heat.
 */
export default function TrendingCuts({
  tracks = [],
  onPlayTrack = null,
  limit = 24,
}) {
  const current = useCurrentTrack();
  const playing = useIsPlaying();
  const ranked = trendingTracks(tracks, limit);

  if (!ranked.length) {
    return (
      <p
        style={{
          margin: 0,
          padding: `16px ${homeSpace.gutter}px`,
          fontSize: 14,
          color: color.muted,
        }}
      >
        Nothing is moving yet.
      </p>
    );
  }

  return (
    <section aria-label="Trending" style={{ marginTop: 12 }}>
      <div style={{ padding: `0 ${homeSpace.gutter}px 10px` }}>
        <h2
          style={{
            ...type.title3,
            margin: 0,
            color: color.ink,
            fontFamily: fontDisplay,
          }}
        >
          What’s moving
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: color.muted }}>
          {ranked.length} track{ranked.length === 1 ? "" : "s"} by play heat.
        </p>
      </div>
      <div style={{ padding: `0 ${homeSpace.gutter - 4}px` }}>
        {ranked.map((track, i) => (
          <TrackRow
            key={track.id}
            track={track}
            rank={i + 1}
            active={current?.id === track.id}
            isPlaying={playing && current?.id === track.id}
            onPlay={() => onPlayTrack?.(track, ranked)}
          />
        ))}
      </div>
    </section>
  );
}
