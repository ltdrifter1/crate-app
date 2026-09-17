import { useMemo, useState } from "react";
import {
  color, font, fontDisplay, glass, homeSpace, motion, artShadow, artFrameStyle,
  chrome, radio, BTN_PRIMARY, chromeIconButton, radius,
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
          textShadow: `0 0 12px rgba(${chrome.cyanRgb},0.35)`,
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

/** iOS segmented control — inset plate, not pills. */
function Segmented({ items, activeId, onChange, ariaLabel }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{
        display: "flex",
        padding: 3,
        borderRadius: 10,
        background: `
          linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(226,230,236,0.9) 100%)
        `,
        border: `1px solid ${glass.border}`,
        boxShadow: `inset 0 1px 0 ${glass.highlight}, inset 0 2px 6px rgba(28,32,40,0.08)`,
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
              minHeight: 34,
              padding: "6px 8px",
              border: "none",
              borderRadius: 8,
              background: active
                ? "linear-gradient(180deg, #6FB4F8 0%, #1E6FE8 100%)"
                : "transparent",
              color: active ? "#FFFFFF" : color.muted,
              fontFamily: fontDisplay,
              fontSize: 13,
              fontWeight: active ? 650 : 520,
              letterSpacing: -0.2,
              cursor: "pointer",
              boxShadow: active
                ? "inset 0 1px 0 rgba(255,255,255,0.35), 0 3px 8px rgba(30,111,232,0.28)"
                : "none",
              transition: `color ${motion.fast}, background ${motion.base}, box-shadow ${motion.base}`,
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
 */
export default function ChartHistoryPanel({
  countdown = [],
  tracks = [],
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

  const monthlyLive = useMemo(
    () => buildMonthlyChart(tracks, { limit: 20, scope }),
    [tracks, scope]
  );
  const monthlyReveal = useMemo(
    () => buildMonthlyReveal(20, { scope, tracks }),
    [tracks, scope, countdown.length]
  );

  const monthlyEntries = monthlyLive.length
    ? enrichCountdownWithHistory(monthlyLive).map((c) => toEntry(c))
    : monthlyReveal.map((e) => toEntry({ ...e, rank: e.monthRank }, {
      movement: "same",
      meta: e.peakDay ? formatDayLabel(e.peakDay) : null,
    }));

  const climbers = useMemo(() => biggestClimbers(countdown, 5), [countdown]);
  const ones = useMemo(() => getNumberOnes(10), [countdown]);
  const days = useMemo(() => listChartDays(10), [countdown]);
  const archive = archiveDay ? getChartSnapshot(archiveDay) : null;

  if (!tracks.length && !countdown.length && !ones.length) return null;

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
  const hero = tab === "month" ? monthlyEntries[0] : null;
  const listEntries = tab === "month" ? monthlyEntries.slice(1) : null;

  return (
    <section
      aria-label="Monthly charts"
      style={{
        position: "relative",
        padding: `4px 0 ${homeSpace.sectionPadBottom}px`,
        animation: `rise 0.55s ${motion.ease} 0.06s both`,
      }}
    >
      <div style={{ padding: `0 ${homeSpace.gutter}px 12px` }}>
        <div style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 4,
        }}>
          <h2 style={{
            margin: 0,
            fontFamily: fontDisplay,
            fontSize: "clamp(22px, 4.4vw, 28px)",
            fontWeight: 700,
            letterSpacing: -0.55,
            color: color.ink,
            lineHeight: 1.12,
          }}>
            {scopeTitle}
          </h2>
          <div style={{
            fontFamily: font,
            fontSize: 13,
            fontWeight: 600,
            color: color.muted,
            letterSpacing: -0.08,
            whiteSpace: "nowrap",
          }}>
            {monthLabel}
          </div>
        </div>
      </div>

      <div style={{ padding: `0 ${homeSpace.gutter}px 12px` }}>
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

      <div style={{ padding: `0 ${homeSpace.gutter}px 0` }}>
        <UnderlineRail
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
                  marginBottom: 16,
                  padding: "10px 16px",
                  minHeight: 40,
                  fontSize: 15,
                  fontWeight: 650,
                  letterSpacing: -0.2,
                  textTransform: "none",
                  fontFamily: fontDisplay,
                  borderRadius: 10,
                }}
              >
                <Icon name="play" size={14} />
                Play this chart
              </button>
            )}
            {monthlyEntries.length ? (
              <>
                {hero && (
                  <ChartHero
                    entry={hero}
                    active={nowPlayingId === hero.id}
                    onPlay={() => playEntry(hero, monthlyEntries)}
                    onAdd={onAddToQueue ? (e) => addEntry(hero, e) : null}
                    onMore={playlistCtx ? (e) => openMore(e, hero) : null}
                    onContextMenu={playlistCtx ? (e) => openFromContext(e, resolveTrack(hero)) : undefined}
                  />
                )}
                {listEntries?.length > 0 && (
                  <ChartList
                    entries={listEntries}
                    nowPlayingId={nowPlayingId}
                    onPlay={(e, list) => playEntry(e, monthlyEntries)}
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
          linear-gradient(180deg, rgba(101,230,255,0.05) 0%, transparent 42%),
          ${glass.fill}
        `,
        boxShadow: `inset 0 1px 0 ${glass.highlight}`,
        backdropFilter: glass.blurSoft,
        WebkitBackdropFilter: glass.blurSoft,
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

function ChartHero({ entry, active, onPlay, onAdd, onMore, onContextMenu }) {
  const art = 160;
  return (
    <article
      aria-label={`#${entry.rank} ${entry.title} by ${entry.artist}`}
      onContextMenu={onContextMenu}
      style={{
        position: "relative",
        display: "flex",
        gap: 16,
        alignItems: "stretch",
        marginBottom: 14,
        padding: 12,
        borderRadius: radius.lg,
        overflow: "hidden",
        border: active
          ? "1px solid rgba(30,111,232,0.35)"
          : "1px solid rgba(28,32,40,0.12)",
        background: `
          radial-gradient(120% 80% at 0% 0%, rgba(111,191,58,0.1) 0%, transparent 46%),
          linear-gradient(165deg, #FFFFFF 0%, #E8EBEF 100%)
        `,
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.95),
          inset 0 -1px 0 rgba(28,32,40,0.06),
          ${glass.shadowSoft}
        `,
        backdropFilter: glass.blurSoft,
        WebkitBackdropFilter: glass.blurSoft,
      }}
    >
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Play #${entry.rank} ${entry.title}`}
        style={{
          ...artFrameStyle({ size: art, active, radius: 10 }),
          border: "none",
          padding: 0,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <CoverImage
          src={entry.albumCover}
          width={art}
          height={art}
          alt=""
          priority
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <span aria-hidden="true" className="pmp-chart-scan" />
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(180deg, transparent 46%, rgba(8,10,13,0.38) 100%)",
            opacity: 1,
          }}
        >
          <span style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
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

      <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{
          fontFamily: fontDisplay,
          fontSize: "clamp(40px, 9vw, 56px)",
          fontWeight: 780,
          color: chrome.signal,
          letterSpacing: -1.6,
          lineHeight: 0.9,
          marginBottom: 8,
          fontVariantNumeric: "tabular-nums",
          textShadow: "none",
        }}>
          {entry.rank}
        </div>
        <div style={{
          fontFamily: fontDisplay,
          fontSize: "clamp(18px, 4.2vw, 24px)",
          fontWeight: 720,
          letterSpacing: -0.45,
          color: color.ink,
          lineHeight: 1.12,
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}>
          {entry.title}
        </div>
        <div style={{
          marginTop: 4,
          fontSize: 15,
          fontWeight: 500,
          color: color.muted,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {entry.artist}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
          <MovementMark movement={entry.movement} delta={entry.delta} />
          <div style={{ flex: 1 }} />
          {onAdd && (
            <QuietIconButton label={`Add ${entry.title} to queue`} onClick={onAdd}>
              <Icon name="plus" size={16} />
            </QuietIconButton>
          )}
          {onMore && <TrackMoreButton onClick={onMore} />}
        </div>
      </div>
    </article>
  );
}

function ChartList({ entries, nowPlayingId, onPlay, onAdd, onMore, onContext }) {
  return (
    <ol style={{
      listStyle: "none",
      margin: 0,
      padding: 0,
      display: "flex",
      flexDirection: "column",
    }}>
      {entries.map((e, i) => {
        const top = e.rank <= 3;
        const active = nowPlayingId === e.id;
        return (
          <li
            key={`${e.id}-${e.rank}`}
            style={{
              animation: `rise 0.42s ${motion.ease} ${Math.min(i, 12) * 0.028}s both`,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="pmp-chart-row"
              onContextMenu={onContext ? (ev) => onContext(ev, e) : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                minHeight: 64,
                margin: "0 -8px",
                padding: "8px 8px",
                borderRadius: 10,
                background: active ? "rgba(101,230,255,0.06)" : "transparent",
                boxShadow: active ? `inset 2px 0 0 ${chrome.signal}` : "none",
              }}
            >
              <button
                type="button"
                onClick={() => onPlay?.(e, entries)}
                aria-label={`#${e.rank} ${e.title} by ${e.artist}`}
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
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
                  width: top ? 36 : 32,
                  flexShrink: 0,
                  fontFamily: fontDisplay,
                  fontSize: e.rank === 1 ? 26 : top ? 20 : 16,
                  fontWeight: e.rank === 1 ? 780 : top ? 720 : 650,
                  letterSpacing: -0.8,
                  color: e.rank === 1
                    ? chrome.signal
                    : top
                      ? color.ink
                      : color.body,
                  textAlign: "center",
                  textShadow: e.rank === 1 ? `0 0 16px rgba(${chrome.cyanRgb},0.35)` : "none",
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}>
                  {e.rank}
                </div>

                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 8,
                  flexShrink: 0,
                  overflow: "hidden",
                  background: color.surfaceRaised,
                  boxShadow: artShadow.quiet,
                  border: `1px solid ${active ? "rgba(101,230,255,0.28)" : "rgba(184,192,204,0.2)"}`,
                }}>
                  <CoverImage src={e.albumCover} width={52} height={52} alt="" />
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 650,
                    color: color.ink,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontFamily: fontDisplay,
                    letterSpacing: -0.25,
                  }}>
                    {e.title}
                  </div>
                  <div style={{
                    fontSize: 13,
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
      })}
    </ol>
  );
}
