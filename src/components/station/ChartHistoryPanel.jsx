import { memo, useMemo, useState } from "react";
import {
  color, font, fontDisplay, fontMono, glass, homeSpace, artFrameStyle,
  chrome, radio, BTN_PRIMARY, chromeIconButton, radius, hardware, hardwareKey,
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
import { formatMonthLabel } from "../../lib/mixes";
import { CANONICAL_GENRES } from "../../lib/genres";
import { SCENE_CHANNELS } from "../../lib/sceneChannels";
import CoverImage from "../ui/CoverImage";
import Icon from "../ui/Icon";
import { catalogSleeveUrl } from "../../lib/catalogSleeve";
import { TrackActionsMenu, TrackMoreButton, useTrackMenu } from "../listen/TrackRow";

function formatDayLabel(dayKey) {
  const d = new Date(`${dayKey}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return String(dayKey || "").slice(5);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

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
  };
}

/** Rank delta — motion on change, SF figures, no LED stamps. */
function MovementMark({ movement, delta }) {
  if (movement === "up") {
    return (
      <span
        className="pmp-rank-up"
        aria-label={`Up ${delta}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          color: chrome.signal,
          fontFamily: fontDisplay,
          fontSize: 13,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: -0.2,
        }}
      >
        <Icon name="chev_up" size={14} />
        {delta}
      </span>
    );
  }
  if (movement === "down") {
    return (
      <span
        className="pmp-rank-down"
        aria-label={`Down ${delta}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          color: chrome.hot,
          fontFamily: fontDisplay,
          fontSize: 13,
          fontWeight: 650,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: -0.2,
        }}
      >
        <Icon name="chev_down" size={14} />
        {delta}
      </span>
    );
  }
  if (movement === "debut" || movement === "new") {
    return (
      <span
        aria-label="New"
        style={{
          color: chrome.signal,
          fontFamily: fontDisplay,
          fontSize: 12,
          fontWeight: 650,
          letterSpacing: -0.08,
        }}
      >
        New
      </span>
    );
  }
  return (
    <span aria-hidden="true" style={{ color: color.faint, fontSize: 13, fontFamily: fontDisplay }}>
      —
    </span>
  );
}

function RankStamp({ rank }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        zIndex: 2,
        minWidth: 32,
        height: 22,
        padding: "0 7px",
        borderRadius: 3,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: hardware.keyFace,
        border: "1px solid rgba(216,223,232,0.45)",
        boxShadow: hardware.keyRaised,
        color: color.ink,
        fontFamily: fontMono,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.4,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      #{String(rank).padStart(2, "0")}
    </span>
  );
}

/** PS1 chamfered keys — primary chart views. */
function HardwareTabs({ items, activeId, onChange, ariaLabel }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="hide-scroll"
      style={{
        display: "flex",
        gap: 6,
        overflowX: "auto",
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
              ...hardwareKey({ pressed: active, size: "md" }),
              flex: "1 0 auto",
              minWidth: 0,
              padding: "0 12px",
              color: active ? color.ink : color.muted,
              fontFamily: fontDisplay,
              fontSize: 13,
              fontWeight: active ? 650 : 520,
              letterSpacing: -0.2,
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/** Compact scope plate — overall / channel / genre. */
function Segmented({ items, activeId, onChange, ariaLabel }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{
        display: "flex",
        padding: 3,
        borderRadius: 8,
        background: radio.moduleFace,
        border: radio.border,
        boxShadow: hardware.plateEdge,
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
              flex: 1,
              minHeight: 32,
              padding: "6px 8px",
              border: "none",
              borderRadius: 6,
              background: active ? hardware.keyFace : "transparent",
              color: active ? color.ink : color.muted,
              fontFamily: fontDisplay,
              fontSize: 13,
              fontWeight: active ? 650 : 520,
              letterSpacing: -0.2,
              cursor: "pointer",
              boxShadow: active ? hardware.keyRaised : "none",
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

/** Library-style underline tabs / filter list. */
function UnderlineRail({ items, activeId, onChange, ariaLabel }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="hide-scroll"
      style={{
        display: "flex",
        gap: 2,
        overflowX: "auto",
        borderBottom: "1px solid rgba(28,32,40,0.1)",
        marginBottom: 14,
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
              padding: "8px 12px 10px",
              color: active ? color.ink : color.muted,
              fontSize: 15,
              fontWeight: active ? 650 : 520,
              fontFamily: fontDisplay,
              letterSpacing: -0.22,
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

function QuietIconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="pmp-press"
      style={{
        ...chromeIconButton(36),
        borderRadius: 10,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

/**
 * Monthly charts — overall or split by channel / genre, plus archive tabs.
 * Flow: pick the view first (board / climbers / crowns / archive), then
 * refine the live board with scope. Podium for #1–#3, playlist for the rest.
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
}) {
  const [tab, setTab] = useState("month");
  const [scopeMode, setScopeMode] = useState("overall");
  const [channelId, setChannelId] = useState(SCENE_CHANNELS[0]?.id || null);
  const [genre, setGenre] = useState(CANONICAL_GENRES[0] || "Electronic");
  const [archiveDay, setArchiveDay] = useState(null);
  const { menu, openFromButton, openFromContext, close } = useTrackMenu();

  const scope = useMemo(
    () => normalizeChartScope({ mode: scopeMode, channelId, genre }),
    [scopeMode, channelId, genre]
  );

  const month = monthKey();
  const monthLabel = formatMonthLabel(month);
  const onBoard = tab === "month";

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
      movement: "same",
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
    tracks.find((t) => t.id === entry.id) || {
      id: entry.id,
      title: entry.title,
      artist: entry.artist,
      albumCover: entry.albumCover,
      color: entry.color,
    };

  const playEntry = (entry, list) => {
    if (!entry?.id || !onPlayTrack) return;
    const track = resolveTrack(entry);
    const pool = list.map((e) => resolveTrack(e)).filter((t) => t?.id);
    onPlayTrack(track, pool.length ? pool : [track]);
  };

  const addEntry = (entry, event) => {
    event?.stopPropagation?.();
    if (!entry?.id || !onAddToQueue) return;
    onAddToQueue(resolveTrack(entry));
  };

  const openMore = (event, entry) => {
    if (!playlistCtx) return;
    openFromButton(event, resolveTrack(entry));
  };

  const scopeTitle = scope.mode === "overall" ? "Top 20" : chartScopeLabel(scope);
  const podium = onBoard ? monthlyEntries.slice(0, 3) : [];
  const listEntries = onBoard ? monthlyEntries.slice(3) : null;
  const showSkeleton = catalogLoading && !monthlyEntries.length;

  return (
    <section
      aria-label="Monthly charts"
      style={{
        position: "relative",
        padding: `4px 0 ${homeSpace.sectionPadBottom}px`,
      }}
    >
      <div style={{ padding: `0 ${homeSpace.gutter}px 12px` }}>
        <HardwareTabs
          ariaLabel="Chart view"
          activeId={tab}
          onChange={setTab}
          items={[
            { id: "month", label: "This month" },
            { id: "climbers", label: "Climbers" },
            { id: "ones", label: "#1s" },
            { id: "archive", label: "Past days" },
          ]}
        />
      </div>

      {onBoard && (
        <>
          <div style={{ padding: `0 ${homeSpace.gutter}px 10px` }}>
            <div style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 10,
            }}>
              <h2 style={{
                margin: 0,
                fontFamily: fontDisplay,
                fontSize: "clamp(20px, 4.2vw, 26px)",
                fontWeight: 700,
                letterSpacing: -0.5,
                color: color.ink,
                lineHeight: 1.12,
              }}>
                {scopeTitle}
              </h2>
              <div style={{
                fontFamily: fontMono,
                fontSize: 11,
                fontWeight: 700,
                color: color.muted,
                letterSpacing: 0.12,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}>
                {monthLabel}
              </div>
            </div>
            <Segmented
              ariaLabel="Chart scope"
              activeId={scopeMode}
              onChange={setScopeMode}
              items={[
                { id: "overall", label: "Overall" },
                { id: "channel", label: "Channel" },
                { id: "genre", label: "Genre" },
              ]}
            />
          </div>

          {scopeMode === "channel" && (
            <div style={{ padding: `0 ${homeSpace.gutter}px` }}>
              <UnderlineRail
                ariaLabel="Channel"
                activeId={channelId}
                onChange={setChannelId}
                items={SCENE_CHANNELS.map((ch) => ({
                  id: ch.id,
                  label: ch.shortTitle || ch.title,
                }))}
              />
            </div>
          )}

          {scopeMode === "genre" && (
            <div style={{ padding: `0 ${homeSpace.gutter}px` }}>
              <UnderlineRail
                ariaLabel="Genre"
                activeId={genre}
                onChange={setGenre}
                items={CANONICAL_GENRES.map((g) => ({ id: g, label: g }))}
              />
            </div>
          )}
        </>
      )}

      <div style={{ padding: `0 ${homeSpace.gutter}px` }}>
        {tab === "month" && (
          <>
            {onTuneMonthly && monthlyEntries.length > 0 && (
              <button
                type="button"
                onClick={() => onTuneMonthly(scope)}
                className="pmp-tune-key"
                style={{
                  ...BTN_PRIMARY,
                  width: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 14,
                  padding: "10px 16px",
                  minHeight: 40,
                  fontSize: 15,
                  fontWeight: 650,
                  letterSpacing: -0.2,
                  textTransform: "none",
                  fontFamily: fontDisplay,
                  borderRadius: 8,
                }}
              >
                <Icon name="play" size={14} />
                Play this chart
              </button>
            )}
            {showSkeleton ? (
              <BoardSkeleton />
            ) : monthlyEntries.length ? (
              <>
                <ChartPodium
                  entries={podium}
                  nowPlayingId={nowPlayingId}
                  onPlay={(entry) => playEntry(entry, monthlyEntries)}
                  onAdd={onAddToQueue ? addEntry : null}
                  onMore={playlistCtx ? openMore : null}
                  onContext={playlistCtx ? (e, entry) => openFromContext(e, resolveTrack(entry)) : null}
                />
                {listEntries?.length > 0 && (
                  <ChartList
                    entries={listEntries}
                    nowPlayingId={nowPlayingId}
                    onPlay={(e) => playEntry(e, monthlyEntries)}
                    onAdd={onAddToQueue ? addEntry : null}
                    onMore={playlistCtx ? openMore : null}
                    onContext={playlistCtx ? (e, entry) => openFromContext(e, resolveTrack(entry)) : null}
                  />
                )}
              </>
            ) : (
              <Empty note="Nothing on this board yet. Play and request cuts to fill the month." />
            )}
          </>
        )}

        {tab === "climbers" && (
          climbers.length ? (
            <ChartList
              entries={climbers.map((c) => toEntry(c))}
              nowPlayingId={nowPlayingId}
              onPlay={playEntry}
              onAdd={onAddToQueue ? addEntry : null}
              onMore={playlistCtx ? openMore : null}
              onContext={playlistCtx ? (e, entry) => openFromContext(e, resolveTrack(entry)) : null}
            />
          ) : (
            <Empty note="Play and request across two days to unlock climbers." />
          )
        )}

        {tab === "ones" && (
          ones.length ? (
            <ChartList
              entries={ones.map((e, i) => toEntry(e, {
                rank: i + 1,
                movement: "same",
                meta: e.dayKey ? formatDayLabel(e.dayKey) : null,
              }))}
              nowPlayingId={nowPlayingId}
              onPlay={playEntry}
              onAdd={onAddToQueue ? addEntry : null}
              onMore={playlistCtx ? openMore : null}
              onContext={playlistCtx ? (e, entry) => openFromContext(e, resolveTrack(entry)) : null}
            />
          ) : (
            <Empty note="Number-ones appear as daily charts are captured." />
          )
        )}

        {tab === "archive" && (
          <>
            {days.length > 0 && (
              <UnderlineRail
                ariaLabel="Archive day"
                activeId={archiveDay}
                onChange={setArchiveDay}
                items={days.map((d) => ({ id: d, label: formatDayLabel(d) }))}
              />
            )}
            {archive ? (
              <ChartList
                entries={archive.entries.map((e) => toEntry(e, { movement: "same" }))}
                nowPlayingId={nowPlayingId}
                onPlay={playEntry}
                onAdd={onAddToQueue ? addEntry : null}
                onMore={playlistCtx ? openMore : null}
                onContext={playlistCtx ? (e, entry) => openFromContext(e, resolveTrack(entry)) : null}
              />
            ) : (
              <Empty note={days.length ? "Pick a day to reopen that board." : "The archive fills as you listen."} />
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

function Empty({ note }) {
  return (
    <div
      role="status"
      style={{
        padding: "22px 18px",
        borderRadius: radius.lg,
        border: `1px solid ${glass.borderSoft}`,
        background: `
          linear-gradient(180deg, rgba(91,101,116,0.05) 0%, transparent 42%),
          ${glass.fill}
        `,
        boxShadow: `inset 0 1px 0 ${glass.highlight}`,
        color: color.muted,
        fontSize: 15,
        lineHeight: 1.45,
        fontFamily: font,
        letterSpacing: -0.08,
      }}
    >
      {note}
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div aria-hidden="true" className="pmp-chart-podium" style={{ marginBottom: 12 }}>
      <div className="pmp-chart-podium__lead pmp-chart-skel" style={{ aspectRatio: "1 / 1" }} />
      <div className="pmp-chart-podium__side">
        <div className="pmp-chart-skel" style={{ flex: 1, minHeight: 88 }} />
        <div className="pmp-chart-skel" style={{ flex: 1, minHeight: 88 }} />
      </div>
    </div>
  );
}

function ChartPodium({ entries, nowPlayingId, onPlay, onAdd, onMore, onContext }) {
  if (!entries?.length) return null;
  const lead = entries[0];
  const rest = entries.slice(1);
  return (
    <div className="pmp-chart-podium" style={{ marginBottom: 8 }}>
      <PodiumLead
        entry={lead}
        active={nowPlayingId === lead.id}
        onPlay={() => onPlay(lead)}
        onAdd={onAdd ? (e) => onAdd(lead, e) : null}
        onMore={onMore ? (e) => onMore(e, lead) : null}
        onContextMenu={onContext ? (e) => onContext(e, lead) : undefined}
      />
      {rest.length > 0 && (
        <div className="pmp-chart-podium__side">
          {rest.map((entry) => (
            <PodiumCut
              key={`${entry.id}-${entry.rank}`}
              entry={entry}
              active={nowPlayingId === entry.id}
              onPlay={() => onPlay(entry)}
              onContextMenu={onContext ? (e) => onContext(e, entry) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PodiumLead({ entry, active, onPlay, onAdd, onMore, onContextMenu }) {
  const sleeve = catalogSleeveUrl(entry.albumCover);
  return (
    <article
      className="pmp-chart-podium__lead"
      aria-label={`#${entry.rank} ${entry.title} by ${entry.artist}`}
      onContextMenu={onContextMenu}
      style={{
        minWidth: 0,
        padding: 10,
        borderRadius: 10,
        border: active ? radio.borderLive : radio.border,
        background: radio.moduleFace,
        boxShadow: radio.moduleShadow,
      }}
    >
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Play #${entry.rank} ${entry.title}`}
        style={{
          ...artFrameStyle({ size: 220, active, radius: 6 }),
          width: "100%",
          height: "auto",
          aspectRatio: "1 / 1",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <CoverImage
          src={sleeve}
          width={220}
          height={220}
          alt=""
          priority
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <span aria-hidden="true" className="pmp-chart-scan" />
        <RankStamp rank={entry.rank} />
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(180deg, transparent 48%, rgba(58,66,80,0.38) 100%)",
          }}
        >
          <span style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: radio.tuneFace,
            boxShadow: radio.tuneShadow,
            color: chrome.inkPlate,
          }}>
            <Icon name="play" size={18} />
          </span>
        </span>
      </button>
      <div style={{
        marginTop: 10,
        fontFamily: fontDisplay,
        fontSize: 17,
        fontWeight: 700,
        letterSpacing: -0.32,
        color: color.ink,
        lineHeight: 1.15,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {entry.title}
      </div>
      <div style={{
        marginTop: 3,
        fontSize: 13,
        fontWeight: 500,
        color: color.muted,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}>
        {entry.artist}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <MovementMark movement={entry.movement} delta={entry.delta} />
        <div style={{ flex: 1 }} />
        {onAdd && (
          <QuietIconButton label={`Add ${entry.title} to queue`} onClick={onAdd}>
            <Icon name="plus" size={16} />
          </QuietIconButton>
        )}
        {onMore && <TrackMoreButton onClick={onMore} />}
      </div>
    </article>
  );
}

function PodiumCut({ entry, active, onPlay, onContextMenu }) {
  const sleeve = catalogSleeveUrl(entry.albumCover);
  return (
    <button
      type="button"
      onClick={onPlay}
      onContextMenu={onContextMenu}
      aria-label={`Play #${entry.rank} ${entry.title}`}
      className="pmp-press"
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        gap: 10,
        alignItems: "center",
        padding: 8,
        borderRadius: 8,
        border: active ? radio.borderLive : radio.borderQuiet,
        background: radio.moduleFace,
        boxShadow: hardware.plateEdge,
        cursor: "pointer",
        textAlign: "left",
        color: "inherit",
      }}
    >
      <span style={{
        ...artFrameStyle({ size: 72, active, radius: 6 }),
        flexShrink: 0,
        width: 72,
        height: 72,
      }}>
        <CoverImage src={sleeve} width={72} height={72} alt="" eager />
        <RankStamp rank={entry.rank} />
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{
          display: "block",
          fontFamily: fontDisplay,
          fontSize: 14,
          fontWeight: 650,
          letterSpacing: -0.2,
          color: color.ink,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {entry.title}
        </span>
        <span style={{
          display: "block",
          marginTop: 2,
          fontSize: 12,
          color: color.muted,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {entry.artist}
        </span>
        <span style={{ display: "inline-flex", marginTop: 6 }}>
          <MovementMark movement={entry.movement} delta={entry.delta} />
        </span>
      </span>
    </button>
  );
}

const ChartPlaylistRow = memo(function ChartPlaylistRow({
  e,
  active,
  onPlay,
  onAdd,
  onMore,
  onContext,
}) {
  return (
    <li style={{ borderBottom: "1px solid rgba(61,70,84,0.08)" }}>
      <div
        className="pmp-chart-row"
        onContextMenu={onContext ? (ev) => onContext(ev, e) : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          minHeight: 56,
          margin: "0 -8px",
          padding: "6px 8px",
          borderRadius: 8,
          background: active ? "rgba(91,101,116,0.06)" : "transparent",
          boxShadow: active ? `inset 2px 0 0 ${chrome.signal}` : "none",
        }}
      >
        <button
          type="button"
          onClick={() => onPlay?.(e)}
          aria-label={`#${e.rank} ${e.title} by ${e.artist}`}
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 0,
            border: "none",
            background: "none",
            cursor: "pointer",
            textAlign: "left",
            color: "inherit",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <div style={{
            width: 28,
            flexShrink: 0,
            fontFamily: fontMono,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.08,
            color: color.muted,
            textAlign: "center",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}>
            {String(e.rank).padStart(2, "0")}
          </div>

          <div style={{
            width: 44,
            height: 44,
            borderRadius: 6,
            flexShrink: 0,
            overflow: "hidden",
            background: color.surfaceRaised,
            border: `1px solid ${active ? "rgba(91,101,116,0.28)" : "rgba(184,192,204,0.2)"}`,
          }}>
            <CoverImage src={catalogSleeveUrl(e.albumCover)} width={44} height={44} alt="" />
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 15,
              fontWeight: 650,
              color: color.ink,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: fontDisplay,
              letterSpacing: -0.22,
            }}>
              {e.title}
            </div>
            <div style={{
              fontSize: 12,
              color: color.muted,
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: font,
            }}>
              {e.artist}{e.meta ? ` · ${e.meta}` : ""}
            </div>
          </div>
        </button>

        <div style={{
          flexShrink: 0,
          minWidth: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingRight: 2,
        }}>
          <MovementMark movement={e.movement} delta={e.delta} />
        </div>
        {onAdd && (
          <QuietIconButton label={`Add ${e.title} to queue`} onClick={(ev) => onAdd(e, ev)}>
            <Icon name="plus" size={15} />
          </QuietIconButton>
        )}
        {onMore && <TrackMoreButton onClick={(ev) => onMore(ev, e)} />}
      </div>
    </li>
  );
});

function ChartList({ entries, nowPlayingId, onPlay, onAdd, onMore, onContext }) {
  return (
    <ol style={{
      listStyle: "none",
      margin: 0,
      padding: 0,
      display: "flex",
      flexDirection: "column",
    }}>
      {entries.map((e) => (
        <ChartPlaylistRow
          key={`${e.id}-${e.rank}`}
          e={e}
          active={nowPlayingId === e.id}
          onPlay={onPlay}
          onAdd={onAdd}
          onMore={onMore}
          onContext={onContext}
        />
      ))}
    </ol>
  );
}
