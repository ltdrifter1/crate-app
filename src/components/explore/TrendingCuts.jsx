import { useMemo } from "react";
import { color, fontDisplay, fontMono, fontPoster, homeSpace, mtv } from "../../theme";
import { trendingTracks } from "../../lib/homeCollections";
import { inkForTrack, HEAT_SEGMENTS } from "../../lib/board";
import { HeatMeter, RankNumeral, NowBars } from "../station/BoardParts";
import { useCurrentTrack, useIsPlaying } from "../../usePlayerTransport";
import CoverImage from "../ui/CoverImage";

/**
 * What’s moving — the station’s own chart language, applied to play heat.
 * Condensed numerals, a station-ink stripe, a heat meter against the hottest
 * cut. Not a streaming list with a number in front of it.
 */
export default function TrendingCuts({
  tracks = [],
  onPlayTrack = null,
  limit = 24,
}) {
  const current = useCurrentTrack();
  const playing = useIsPlaying();
  const ranked = useMemo(() => trendingTracks(tracks, limit), [tracks, limit]);
  const maxPlays = useMemo(
    () => ranked.reduce((m, t) => Math.max(m, Number(t.playCount) || 0), 0),
    [ranked]
  );

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
      <div
        style={{
          padding: `0 ${homeSpace.gutter}px 10px`,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
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
            What’s moving
          </h2>
          <p style={{ margin: "5px 0 0", fontSize: 13, color: color.muted }}>
            {ranked.length} track{ranked.length === 1 ? "" : "s"} by play heat.
          </p>
        </div>
        <span
          style={{
            fontFamily: fontMono,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.12,
            textTransform: "uppercase",
            color: color.faint,
            whiteSpace: "nowrap",
          }}
        >
          Plays · all time
        </span>
      </div>

      <ol
        style={{
          listStyle: "none",
          margin: 0,
          padding: `0 ${homeSpace.gutter}px`,
          display: "flex",
          flexDirection: "column",
        }}
        className="pmp-heat-list"
      >
        {ranked.map((track, i) => {
          const ink = inkForTrack(track);
          const plays = Number(track.playCount) || 0;
          const level = maxPlays > 0 ? Math.max(1, Math.round((plays / maxPlays) * HEAT_SEGMENTS)) : 0;
          const isNow = current?.id === track.id;
          const meta = [track.bpm ? `${Math.round(track.bpm)} BPM` : null, track.camelot || null]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={track.id} style={{ borderBottom: "1px solid rgba(200,210,222,0.08)" }}>
              <button
                type="button"
                className="pmp-press pmp-heat-row"
                aria-label={`Play ${track.title} by ${track.artist}`}
                aria-current={isNow ? "true" : undefined}
                onClick={() => onPlayTrack?.(track, ranked)}
                style={{
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: "4px 46px 44px minmax(0, 1fr) auto",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 4px 10px 0",
                  background: isNow ? "rgba(255,255,255,0.04)" : "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  color: color.ink,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 4,
                    alignSelf: "stretch",
                    background: isNow ? mtv.hot : ink,
                    borderRadius: 1,
                  }}
                />
                <span style={{ color: isNow ? mtv.hot : color.ink, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <RankNumeral rank={i + 1} size={28} ink={ink} />
                  {isNow && playing ? <NowBars playing /> : null}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 4,
                    overflow: "hidden",
                    background: color.surfaceRaised,
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "block",
                  }}
                >
                  {track.albumCover ? (
                    <CoverImage
                      src={track.albumCover}
                      alt=""
                      width={44}
                      height={44}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : null}
                </span>
                <span style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                  <span
                    style={{
                      fontFamily: fontPoster,
                      fontSize: 18,
                      fontWeight: 700,
                      letterSpacing: 0.04,
                      lineHeight: 1.05,
                      textTransform: "uppercase",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {track.title}
                  </span>
                  <span
                    style={{
                      fontFamily: fontDisplay,
                      fontSize: 13,
                      color: color.muted,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {track.artist}
                  </span>
                  <HeatMeter level={level} ink={ink} />
                </span>
                <span
                  style={{
                    fontFamily: fontMono,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.1,
                    textTransform: "uppercase",
                    color: color.lcdMute,
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 3,
                  }}
                >
                  <span style={{ color: color.body }}>{plays} {plays === 1 ? "play" : "plays"}</span>
                  {meta ? <span>{meta}</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
