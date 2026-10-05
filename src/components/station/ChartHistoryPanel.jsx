import { useMemo, useReducer, useState } from "react";
import {
  color, font, fontMono, fontPoster, homeSpace, glassPill, BTN_PRIMARY,
} from "../../theme";
import {
  biggestClimbers,
  buildMonthlyChart,
  buildMonthlyReveal,
  chartScopeLabel,
  enrichCountdownWithHistory,
  getNumberOnes,
  listChartDays,
  getChartSnapshot,
  monthKey,
  normalizeChartScope,
} from "../../lib/chartHistory";
import { NEUTRAL_INK, boardMaxScore, channelForTrack, heatLevel } from "../../lib/board";
import { formatMonthLabel } from "../../lib/mixes";
import { CANONICAL_GENRES } from "../../lib/genres";
import { SCENE_CHANNELS, getSceneChannel } from "../../lib/sceneChannels";
import { onInk } from "../../lib/mtvChannel";
import Icon from "../ui/Icon";
import { TrackActionsMenu, useTrackMenu } from "../listen/TrackRow";
import { BoardList, BoardRow } from "./BoardParts";
import { BoardEmpty, BoardLead, BoardPodiumCard, BoardSkeleton } from "./BoardFeature";

function formatDayLabel(dayKey) {
  const d = new Date(`${dayKey}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return String(dayKey || "").slice(5);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** Flatten a countdown row, a snapshot row or a reveal row into one entry shape. */
function toEntry(c, fallback = {}) {
  const track = c.track || {};
  return {
    rank: c.rank ?? fallback.rank,
    id: track.id || c.id,
    title: track.title || c.title,
    artist: track.artist || c.artist,
    albumCover: track.albumCover || c.albumCover,
    movement: c.movement || fallback.movement || "same",
    delta: c.delta ?? fallback.delta ?? 0,
    meta: c.meta || fallback.meta || null,
    color: track.color || c.color,
    score: c.score,
    requestCount: track.requestCount ?? c.requestCount ?? 0,
    playCount: track.playCount ?? c.playCount ?? 0,
    likeCount: track.likeCount ?? c.likeCount ?? 0,
    bpm: track.bpm ?? c.bpm,
    camelot: track.camelot ?? c.camelot,
  };
}

/** Which chart to show: the live month, climbers, crowns, or a past day. */
const VIEWS = [
  { id: "month", label: "This month" },
  { id: "climbers", label: "Climbers" },
  { id: "ones", label: "#1s" },
  { id: "archive", label: "Past days" },
];

const SCOPES = [
  { id: "overall", label: "Overall" },
  { id: "channel", label: "Channel" },
  { id: "genre", label: "Genre" },
];

const capsLabel = {
  fontFamily: fontPoster,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

/** Chart views — pearl plate when selected, quiet fill otherwise. */
function ViewTabs({ items, activeId, onChange, ariaLabel }) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="hide-scroll" style={{ display: "flex", gap: 6, overflowX: "auto" }}>
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            className="pmp-press"
            onClick={() => onChange(item.id)}
            style={{
              ...glassPill({ active }),
              ...capsLabel,
              flex: "1 1 auto",
              minHeight: 42,
              padding: "0 10px",
              fontSize: 15,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/** Overall / Channel / Genre — a flat track with a sliding pearl plate. */
function ScopeSwitch({ items, activeId, onChange, ariaLabel }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{
        display: "flex",
        padding: 3,
        borderRadius: 12,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(200,210,222,0.12)",
      }}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            className="pmp-press"
            onClick={() => onChange(item.id)}
            style={{
              ...capsLabel,
              flex: 1,
              minHeight: 36,
              padding: "0 10px",
              border: "none",
              borderRadius: 9,
              background: active ? color.ink : "transparent",
              color: active ? color.onAccent : color.muted,
              fontSize: 15,
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/** Text tabs with an underline — genre and archive-day pickers. */
function UnderlineRail({ items, activeId, onChange, ariaLabel, mono = false }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="hide-scroll"
      style={{
        display: "flex",
        gap: 2,
        overflowX: "auto",
        borderBottom: `1px solid ${color.line}`,
        marginBottom: 16,
      }}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            style={{
              flexShrink: 0,
              border: "none",
              background: "none",
              cursor: "pointer",
              padding: "8px 12px 11px",
              color: active ? color.ink : color.muted,
              fontSize: mono ? 12 : 15,
              fontWeight: active ? 650 : 520,
              fontFamily: mono ? fontMono : font,
              letterSpacing: mono ? "0.08em" : -0.22,
              textTransform: mono ? "uppercase" : "none",
              boxShadow: active ? `inset 0 -2px 0 ${color.ink}` : "none",
              whiteSpace: "nowrap",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/** Channel picker — each station is a CH bug in its own ink. */
function ChannelRail({ activeId, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Channel"
      className="hide-scroll"
      style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16 }}
    >
      {SCENE_CHANNELS.map((ch) => {
        const active = ch.id === activeId;
        return (
          <button
            key={ch.id}
            type="button"
            role="tab"
            aria-selected={active}
            className="pmp-press"
            onClick={() => onChange(ch.id)}
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "stretch",
              padding: 0,
              borderRadius: 3,
              overflow: "hidden",
              border: `1.5px solid ${active ? ch.accent : "rgba(200,210,222,0.16)"}`,
              background: active ? "rgba(255,255,255,0.06)" : "transparent",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                ...capsLabel,
                padding: "6px 7px 5px",
                fontSize: 13,
                lineHeight: 1,
                background: active ? ch.accent : "rgba(255,255,255,0.08)",
                color: active ? onInk(ch.accent) : color.muted,
                fontFamily: fontMono,
                letterSpacing: "0.04em",
              }}
            >
              {String(ch.num).padStart(2, "0")}
            </span>
            <span
              style={{
                ...capsLabel,
                padding: "6px 10px 5px",
                fontSize: 14,
                lineHeight: 1,
                color: active ? color.ink : color.muted,
              }}
            >
              {ch.shortTitle || ch.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SectionHead({ title, note, right, action, ink }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
      <div style={{ minWidth: 0 }}>
        <span
          aria-hidden="true"
          style={{ display: "block", width: 34, height: 4, background: ink || color.ink, marginBottom: 8 }}
        />
        <h2
          style={{
            margin: 0,
            fontFamily: fontPoster,
            fontWeight: 800,
            fontSize: "clamp(28px, 7vw, 38px)",
            lineHeight: 0.95,
            letterSpacing: "0.005em",
            textTransform: "uppercase",
            color: color.ink,
          }}
        >
          {title}
        </h2>
        {note && <p style={{ margin: "6px 0 0", fontFamily: font, fontSize: 14, color: color.muted, lineHeight: 1.35 }}>{note}</p>}
      </div>
      {action}
      {right && (
        <div
          style={{
            fontFamily: fontMono,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: color.muted,
            whiteSpace: "nowrap",
            paddingBottom: 3,
          }}
        >
          {right}
        </div>
      )}
    </div>
  );
}

/**
 * Monthly charts — overall or split by channel / genre, plus archive tabs.
 * Pick the view first (board / climbers / crowns / archive), then refine the
 * live board with scope. NO. 1 gets a frame, #2–#3 are posters, the rest is the list.
 */
export default function ChartHistoryPanel({
  countdown = [],
  tracks = [],
  catalogLoading = false,
  onPlayTrack = null,
  onTuneMonthly = null,
  onAddToQueue = null,
  playlistCtx = null,
  nowPlayingId = null,
  isPlaying = true,
}) {
  const [tab, setTab] = useState("month");
  const [scopeMode, setScopeMode] = useState("overall");
  const [channelId, setChannelId] = useState(SCENE_CHANNELS[0]?.id || null);
  const [genre, setGenre] = useState(CANONICAL_GENRES[0] || "Electronic");
  const [archiveDay, setArchiveDay] = useState(null);
  const [, bump] = useReducer((n) => n + 1, 0);
  const { menu, openFromButton, openFromContext, close } = useTrackMenu();

  const scope = useMemo(
    () => normalizeChartScope({ mode: scopeMode, channelId, genre }),
    [scopeMode, channelId, genre]
  );

  const month = monthKey();
  const monthLabel = formatMonthLabel(month);
  const onBoard = tab === "month";
  const scopeChannel = scopeMode === "channel" ? getSceneChannel(channelId) : null;

  const trackById = useMemo(() => new Map(tracks.map((t) => [t.id, t])), [tracks]);

  /** Station ink, channel and live counts for an entry. Archive boards keep their own counts. */
  const decorate = (entry, { live = true } = {}) => {
    const full = trackById.get(entry.id);
    const channel = channelForTrack(full || entry);
    return {
      ...entry,
      requestCount: live && full ? full.requestCount ?? entry.requestCount : entry.requestCount,
      playCount: live && full ? full.playCount ?? entry.playCount : entry.playCount,
      likeCount: live && full ? full.likeCount ?? entry.likeCount : entry.likeCount,
      bpm: entry.bpm ?? full?.bpm,
      camelot: entry.camelot ?? full?.camelot,
      channel,
      ink: scopeChannel?.accent || channel?.accent || NEUTRAL_INK,
    };
  };

  const monthlyLive = useMemo(
    () => (tracks.length ? buildMonthlyChart(tracks, { limit: 20, scope }) : []),
    [tracks, scope]
  );
  const monthlyEntries = useMemo(() => {
    if (monthlyLive.length) {
      return enrichCountdownWithHistory(monthlyLive).map((c) => toEntry(c));
    }
    if (!tracks.length) return [];
    return buildMonthlyReveal(20, { scope, tracks }).map((e) => toEntry({ ...e, rank: e.monthRank }, {
      movement: "none",
      meta: e.peakDay ? formatDayLabel(e.peakDay) : null,
    }));
  }, [monthlyLive, tracks, scope]);

  const climbers = useMemo(
    () => (tab === "climbers" ? biggestClimbers(countdown, 8) : []),
    [tab, countdown]
  );
  const ones = useMemo(
    () => (tab === "ones" ? getNumberOnes(10) : []),
    [tab, countdown]
  );
  const days = useMemo(
    () => (tab === "archive" ? listChartDays(10) : []),
    [tab, countdown]
  );
  const archive = useMemo(
    () => (tab === "archive" && archiveDay ? getChartSnapshot(archiveDay) : null),
    [tab, archiveDay]
  );

  if (!catalogLoading && !tracks.length && !countdown.length) {
    const hasOnes = getNumberOnes(1).length > 0;
    if (!hasOnes) return null;
  }

  const resolveTrack = (entry) =>
    trackById.get(entry.id) || {
      id: entry.id,
      title: entry.title,
      artist: entry.artist,
      albumCover: entry.albumCover,
      color: entry.color,
    };

  const playEntry = (entry, list) => {
    if (!entry?.id || !onPlayTrack) return;
    const track = resolveTrack(entry);
    const pool = (list || [entry]).map((e) => resolveTrack(e)).filter((t) => t?.id);
    onPlayTrack(track, pool.length ? pool : [track]);
  };

  const addEntry = onAddToQueue
    ? (entry, event) => {
        event?.stopPropagation?.();
        if (entry?.id) onAddToQueue(resolveTrack(entry));
      }
    : null;
  const openMore = playlistCtx ? (event, entry) => openFromButton(event, resolveTrack(entry)) : null;
  const openContext = playlistCtx ? (event, entry) => openFromContext(event, resolveTrack(entry)) : null;
  const requestEntry = playlistCtx?.onRequest
    ? (entry) => {
        playlistCtx.onRequest(entry.id);
        bump();
      }
    : null;
  const isRequested = (id) => !!playlistCtx?.hasRequested?.(id);

  const scopeTitle = scope.mode === "overall" ? "Top 20" : chartScopeLabel(scope);
  const showSkeleton = catalogLoading && !monthlyEntries.length;

  /** A flat list of rows; heat is relative to the hottest row on that list. */
  const renderRows = (entries, { live = true, cols = false, label } = {}) => {
    const decorated = entries.map((e) => decorate(e, { live }));
    const max = boardMaxScore(decorated);
    return (
      <BoardList columns={cols} label={label}>
        {decorated.map((e, i) => (
          <BoardRow
            key={`${e.id}-${e.rank}-${i}`}
            entry={e}
            index={i}
            ink={e.ink}
            heat={heatLevel(e, max)}
            active={nowPlayingId === e.id}
            playing={isPlaying}
            requested={isRequested(e.id)}
            onPlay={(entry) => playEntry(entry, decorated)}
            onAdd={addEntry}
            onMore={openMore}
            onContext={openContext}
            onRequest={live ? requestEntry : null}
          />
        ))}
      </BoardList>
    );
  };

  const renderBoard = () => {
    const decorated = monthlyEntries.map((e) => decorate(e));
    const max = boardMaxScore(decorated);
    const [lead, ...rest] = decorated;
    const poster = rest.slice(0, 2);
    const list = rest.slice(2);
    const common = (e) => ({
      entry: e,
      ink: e.ink,
      heat: heatLevel(e, max),
      active: nowPlayingId === e.id,
      playing: isPlaying,
      requested: isRequested(e.id),
      onPlay: () => playEntry(e, decorated),
      onMore: openMore,
      onContext: openContext,
      onRequest: requestEntry,
    });
    return (
      <>
        <div className="pmp-chart-podium">
          <BoardLead
            {...common(lead)}
            channel={lead.channel}
            kicker={scope.mode === "overall" ? "Top of the board" : `Top of the ${scope.mode}`}
            onAdd={addEntry}
          />
          {poster.length > 0 && (
            <div className="pmp-chart-podium__side">
              {poster.map((e, i) => (
                <BoardPodiumCard key={`${e.id}-${e.rank}`} {...common(e)} index={i + 1} />
              ))}
            </div>
          )}
        </div>
        {list.length > 0 &&
          (() => {
            const listMax = max;
            return (
              <BoardList columns label={`${scopeTitle}, ${list[0].rank} to ${list[list.length - 1].rank}`}>
                {list.map((e, i) => (
                  <BoardRow
                    key={`${e.id}-${e.rank}`}
                    entry={e}
                    index={i}
                    ink={e.ink}
                    heat={heatLevel(e, listMax)}
                    active={nowPlayingId === e.id}
                    playing={isPlaying}
                    requested={isRequested(e.id)}
                    onPlay={(entry) => playEntry(entry, decorated)}
                    onAdd={addEntry}
                    onMore={openMore}
                    onContext={openContext}
                    onRequest={requestEntry}
                  />
                ))}
              </BoardList>
            );
          })()}
      </>
    );
  };

  return (
    <section
      aria-label="Monthly charts"
      className="pmp-board"
      style={{ position: "relative", padding: `16px 0 ${homeSpace.sectionPadBottom}px` }}
    >
      <div style={{ padding: `0 ${homeSpace.gutter}px 18px` }}>
        <ViewTabs ariaLabel="Chart view" activeId={tab} onChange={setTab} items={VIEWS} />
      </div>

      {onBoard && (
        <div style={{ padding: `0 ${homeSpace.gutter}px` }}>
          <SectionHead
            title={scopeTitle}
            ink={scopeChannel?.accent}
            note={scope.mode === "overall" ? "Ranked by requests, plays and likes." : `${monthLabel} · ranked on this ${scope.mode}`}
            action={
              onTuneMonthly && monthlyEntries.length > 0 ? (
                <button
                  type="button"
                  onClick={() => onTuneMonthly(scope)}
                  className="pmp-tune-key"
                  style={{
                    ...BTN_PRIMARY,
                    width: "auto",
                    flexShrink: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0 16px 0 14px",
                    minHeight: 42,
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  <Icon name="play" size={13} />
                  Play this chart
                </button>
              ) : null
            }
          />
          <ScopeSwitch ariaLabel="Chart scope" activeId={scopeMode} onChange={setScopeMode} items={SCOPES} />
          <div style={{ height: 14 }} />
          {scopeMode === "channel" && <ChannelRail activeId={channelId} onChange={setChannelId} />}
          {scopeMode === "genre" && (
            <UnderlineRail
              ariaLabel="Genre"
              activeId={genre}
              onChange={setGenre}
              items={CANONICAL_GENRES.map((g) => ({ id: g, label: g }))}
            />
          )}
        </div>
      )}

      <div style={{ padding: `0 ${homeSpace.gutter}px` }}>
        {tab === "month" && (
          <>
            {showSkeleton ? (
              <BoardSkeleton />
            ) : monthlyEntries.length ? (
              renderBoard()
            ) : (
              <BoardEmpty note="Play and request cuts to fill the month." />
            )}
          </>
        )}

        {tab === "climbers" && (
          <>
            <SectionHead title="Biggest moves" note="Tracks that climbed since yesterday's board." />
            {climbers.length ? (
              renderRows(climbers.map((c) => toEntry(c)), { label: "Climbers" })
            ) : (
              <BoardEmpty title="No moves yet" note="Play and request across two days to unlock climbers." />
            )}
          </>
        )}

        {tab === "ones" && (
          <>
            <SectionHead title="Number ones" note="Whatever held the top spot, day by day." />
            {ones.length ? (
              renderRows(
                ones.map((e) => toEntry(e, {
                  rank: 1,
                  movement: "none",
                  meta: e.dayKey ? formatDayLabel(e.dayKey) : null,
                })),
                { live: false, label: "Number ones" }
              )
            ) : (
              <BoardEmpty title="No crowns yet" note="Number-ones appear as daily charts are captured." />
            )}
          </>
        )}

        {tab === "archive" && (
          <>
            <SectionHead title="Past days" note="Reopen any board we captured." />
            {days.length > 0 && (
              <UnderlineRail
                ariaLabel="Archive day"
                activeId={archiveDay}
                onChange={setArchiveDay}
                mono
                items={days.map((d) => ({ id: d, label: formatDayLabel(d) }))}
              />
            )}
            {archive ? (
              renderRows(archive.entries.map((e) => toEntry(e, { movement: "none" })), {
                live: false,
                cols: true,
                label: `Board for ${formatDayLabel(archive.dayKey)}`,
              })
            ) : (
              <BoardEmpty
                title="Pick a day"
                note={days.length ? "Pick a day to reopen that board." : "The archive fills as you listen."}
              />
            )}
          </>
        )}
      </div>

      {menu && playlistCtx && (
        <TrackActionsMenu
          track={menu.track}
          playlistCtx={playlistCtx}
          x={menu.x}
          y={menu.y}
          onClose={close}
        />
      )}
    </section>
  );
}
