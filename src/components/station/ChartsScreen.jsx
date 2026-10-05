import { useMemo } from "react";
import { color, fontMono, fontPoster, homeSpace, chromeIconButton } from "../../theme";
import { buildCountdown } from "../../lib/station";
import { enrichCountdownWithHistory, monthKey } from "../../lib/chartHistory";
import { boardCrawl, boardStats } from "../../lib/board";
import { formatMonthLabel } from "../../lib/mixes";
import { useIsPlaying } from "../../usePlayerTransport";
import ChartHistoryPanel from "./ChartHistoryPanel";
import { BoardEmpty } from "./BoardFeature";
import Icon from "../ui/Icon";

const VOICE = ["Play it", "Request it", "Watch it climb"];

/** Red-square crawl. Real top-five text only; the station voice closes the loop. */
function BoardTicker({ entries }) {
  const items = [...boardCrawl(entries, 5), ...VOICE, "Planet MP3 Charts"];
  const chars = items.join("").length;
  const group = (hidden) => (
    <span className="pmp-board-ticker__group" aria-hidden={hidden || undefined}>
      {items.map((text, i) => (
        <span key={`${i}-${text}`} style={{ display: "inline-flex", alignItems: "center" }}>
          <span className="pmp-board-ticker__item">{text}</span>
          <span className="pmp-board-ticker__sep" />
        </span>
      ))}
    </span>
  );
  return (
    <div className="pmp-board-ticker" role="marquee" aria-label="Top of the chart">
      <div className="pmp-board-ticker__track" style={{ "--crawl": `${Math.max(36, Math.round(chars * 0.34))}s` }}>
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}

function Scoreboard({ stats, hasHistory }) {
  const cells = [
    { n: stats.size, l: "Board" },
    { n: hasHistory ? stats.climbing : "–", l: "Climbing" },
    { n: hasHistory ? stats.fresh : "–", l: "New" },
    { n: stats.requests, l: stats.requests === 1 ? "Request" : "Requests" },
  ];
  return (
    <div className="pmp-board-score" role="group" aria-label="Board totals" style={{ margin: `0 ${homeSpace.gutter}px` }}>
      {cells.map((c) => (
        <div key={c.l}>
          <div className="pmp-board-score__n">{c.n}</div>
          <div className="pmp-board-score__l">{c.l}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * Charts — the Board. A broadcast countdown: masthead, red-square crawl,
 * scoreboard, then the chart itself (ChartHistoryPanel).
 */
export default function ChartsScreen({
  countdown = [],
  tracks = [],
  catalogLoading = false,
  onPlayTrack = null,
  onTuneMonthly = null,
  onAddToQueue = null,
  playlistCtx = null,
  nowPlayingId = null,
  onOpenMenu = null,
}) {
  const isPlaying = useIsPlaying();
  const empty = !catalogLoading && tracks.length === 0 && countdown.length === 0;
  const monthLabel = formatMonthLabel(monthKey());

  // Rows with yesterday's board folded in, so the totals can say who is climbing.
  const board = useMemo(() => {
    const base = countdown.length ? countdown : buildCountdown(tracks, 20);
    return enrichCountdownWithHistory(base).map((c) => ({
      rank: c.rank,
      title: c.track?.title,
      artist: c.track?.artist,
      movement: c.movement,
      requestCount: c.track?.requestCount || 0,
      playCount: c.track?.playCount || 0,
    }));
  }, [countdown, tracks]);
  const stats = useMemo(() => boardStats(board), [board]);
  const hasHistory = board.some((e) => e.movement && e.movement !== "none");

  return (
    <div style={{ position: "relative", paddingBottom: 56, overflow: "hidden" }}>
      <header className="pmp-board-mast">
        <span className="pmp-board-mast__ghost" aria-hidden="true">20</span>

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
          {onOpenMenu && (
            <button
              type="button"
              aria-label="More"
              onClick={onOpenMenu}
              className="pmp-press"
              style={chromeIconButton(44)}
            >
              <Icon name="menu" size={16} />
            </button>
          )}
          <span
            className="pmp-lcd-pip"
            aria-hidden="true"
            style={{ width: 8, height: 8, background: color.alert, flexShrink: 0 }}
          />
          <span
            style={{
              fontFamily: fontMono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: color.body,
              whiteSpace: "nowrap",
            }}
          >
            Live · Countdown
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontFamily: fontMono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: color.muted,
              whiteSpace: "nowrap",
            }}
          >
            {monthLabel}
          </span>
        </div>

        <h1
          style={{
            position: "relative",
            margin: "16px 0 0",
            fontFamily: fontPoster,
            fontWeight: 800,
            fontSize: "clamp(60px, 18vw, 96px)",
            lineHeight: 0.84,
            letterSpacing: "-0.005em",
            textTransform: "uppercase",
            color: color.ink,
          }}
        >
          Charts
        </h1>
      </header>

      <BoardTicker entries={board} />

      {board.length > 0 && <Scoreboard stats={stats} hasHistory={hasHistory} />}

      {empty && (
        <div style={{ margin: `18px ${homeSpace.gutter}px 0` }}>
          <BoardEmpty note="Play and request cuts to build this month's chart. History fills in as you listen." />
        </div>
      )}

      <ChartHistoryPanel
        countdown={countdown}
        tracks={tracks}
        catalogLoading={catalogLoading}
        onPlayTrack={onPlayTrack}
        onTuneMonthly={onTuneMonthly}
        onAddToQueue={onAddToQueue}
        playlistCtx={playlistCtx}
        nowPlayingId={nowPlayingId}
        isPlaying={isPlaying}
      />
    </div>
  );
}
