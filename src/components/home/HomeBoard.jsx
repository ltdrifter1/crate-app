/**
 * The Board on Home — Top 5, same row language as the Charts page.
 * Sits under Channel Surfing: you pick a station first, then see what the
 * whole station is playing.
 */
import { useMemo, useReducer } from "react";
import { color, fontMono, homeSpace, motion } from "../../theme";
import { enrichCountdownWithHistory } from "../../lib/chartHistory";
import { boardMaxScore, entryFromCountdown, inkForTrack } from "../../lib/board";
import { hasRequestedToday } from "../../lib/station";
import HomeBandHeader from "./HomeBandHeader";
import Icon from "../ui/Icon";
import { BoardList, BoardRow } from "../station/BoardParts";

export const HOME_BOARD_SIZE = 5;

export default function HomeBoard({
  countdown = [],
  nowPlayingId = null,
  isPlaying = true,
  onPlayTrack = null,
  onOpenCharts = null,
  onTune = null,
  onRequest = null,
  first = false,
  delay = 0.05,
}) {
  const [, bump] = useReducer((n) => n + 1, 0);
  const entries = useMemo(
    () =>
      enrichCountdownWithHistory(countdown.slice(0, HOME_BOARD_SIZE))
        .filter((c) => c?.track?.id)
        .map(entryFromCountdown),
    [countdown]
  );
  // A chart where nothing has been played, liked or requested is just the catalog in id order.
  if (entries.length < 3 || !(boardMaxScore(entries) > 0)) return null;

  const pool = countdown.map((c) => c.track).filter(Boolean);
  const request = onRequest
    ? (entry) => {
        onRequest(entry.id);
        bump();
      }
    : null;

  return (
    <section
      aria-label="The Board"
      className="pmp-home-board"
      style={{
        marginTop: first ? homeSpace.sectionGapFirst : homeSpace.sectionGap,
        padding: 0,
        animation: `rise 0.5s ${motion.ease} ${delay}s both`,
      }}
    >
      <HomeBandHeader
        title="The Board"
        subtitle="Top 5 on the station"
        action={onOpenCharts ? { label: "Full chart", onClick: onOpenCharts } : null}
      />
      <div style={{ padding: `0 ${homeSpace.gutter}px` }}>
        <BoardList label="Top 5" columns>
          {entries.map((e, i) => (
            <BoardRow
              key={`${e.id}-${e.rank}`}
              entry={e}
              index={i}
              variant="home"
              ink={inkForTrack(e.track)}
              active={nowPlayingId === e.id}
              playing={isPlaying}
              requested={hasRequestedToday(e.id)}
              onPlay={(entry) => onPlayTrack?.(entry.track, pool.length ? pool : [entry.track])}
              onRequest={request}
            />
          ))}
        </BoardList>
        {onTune && (
          <button
            type="button"
            onClick={onTune}
            className="pmp-press"
            style={{
              marginTop: 14,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              minHeight: 42,
              padding: "0 18px 0 14px",
              borderRadius: 980,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: color.ink,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Icon name="play" size={13} />
            Play the countdown
            <span
              aria-hidden="true"
              style={{ fontFamily: fontMono, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: color.muted }}
            >
              TOP 20
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
