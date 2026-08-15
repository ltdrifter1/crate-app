import { useMemo, useState } from "react";
import {
  color, fontDisplay, fontMono, glass, homeSpace, motion, artShadow, chrome, y2k, radio
} from "../../theme";
import {
  biggestClimbers,
  buildMonthlyChart,
  buildMonthlyReveal,
  chartScopeLabel,
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

function MovementTag({ movement, delta }) {
  if (movement === "up") {
    return (
      <span style={{
        color: chrome.signal,
        fontFamily: fontMono,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 0.4,
        textShadow: `0 0 10px rgba(${chrome.cyanRgb},0.35)`,
      }}>
        ↑{delta}
      </span>
    );
  }
  if (movement === "down") {
    return (
      <span style={{
        color: chrome.hot,
        fontFamily: fontMono,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 0.4,
      }}>
        ↓{delta}
      </span>
    );
  }
  if (movement === "debut" || movement === "new") {
    return (
      <span style={{
        color: chrome.signal,
        fontFamily: fontMono,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: 1,
        padding: "3px 6px",
        borderRadius: 3,
        border: "1px solid rgba(101,230,255,0.35)",
        background: "rgba(101,230,255,0.08)",
        boxShadow: `0 0 12px rgba(${chrome.cyanRgb},0.15)`,
      }}>
        NEW
      </span>
    );
  }
  return (
    <span style={{
      width: 5,
      height: 5,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.18)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
      display: "inline-block",
    }} />
  );
}

/** Machined scope / mode key — engineered corners, never pill. */
function ScopeChip({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        flexShrink: 0,
        padding: "9px 13px",
        minHeight: 34,
        borderRadius: radio.radiusControl,
        border: active
          ? "1px solid rgba(101,230,255,0.42)"
          : `1px solid ${glass.border}`,
        background: active
          ? `
            linear-gradient(180deg, rgba(101,230,255,0.16) 0%, rgba(101,230,255,0.04) 100%),
            linear-gradient(165deg, rgba(48,54,64,0.95) 0%, rgba(22,26,32,0.98) 100%)
          `
          : `
            linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 42%),
            ${glass.fillStrong}
          `,
        color: active ? chrome.signal : color.body,
        fontFamily: fontMono,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 0.9,
        textTransform: "uppercase",
        cursor: "pointer",
        boxShadow: active
          ? `inset 0 1px 0 rgba(255,255,255,0.2), 0 0 18px rgba(${chrome.cyanRgb},0.12), inset 0 -1px 0 rgba(0,0,0,0.4)`
          : `inset 0 1px 0 ${glass.highlight}, inset 0 -1px 0 rgba(0,0,0,0.4)`,
        transition: `border-color ${motion.fast} ${motion.ease}, color ${motion.fast}, box-shadow ${motion.base}`,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {label}
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
}) {
  const [tab, setTab] = useState("month"); // month | climbers | ones | archive
  const [scopeMode, setScopeMode] = useState("overall"); // overall | channel | genre
  const [channelId, setChannelId] = useState(SCENE_CHANNELS[0]?.id || null);
  const [genre, setGenre] = useState(CANONICAL_GENRES[0] || "Electronic");
  const [archiveDay, setArchiveDay] = useState(null);

  const scope = useMemo(
    () => normalizeChartScope({
      mode: scopeMode,
      channelId,
      genre,
    }),
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
  // Prefer live heat for the month board; fall back to peak-from-days if empty
  const monthlyEntries = monthlyLive.length
    ? monthlyLive.map((c) => ({
        rank: c.rank,
        id: c.track.id,
        title: c.track.title,
        artist: c.track.artist,
        albumCover: c.track.albumCover,
        movement: "same",
        delta: 0,
      }))
    : monthlyReveal.map((e) => ({
        rank: e.monthRank,
        id: e.id,
        title: e.title,
        artist: e.artist,
        albumCover: e.albumCover,
        movement: "same",
        delta: 0,
        meta: e.peakDay,
      }));

  const climbers = useMemo(() => biggestClimbers(countdown, 5), [countdown]);
  const ones = useMemo(() => getNumberOnes(10), [countdown]);
  const days = useMemo(() => listChartDays(10), [countdown]);

  const archive = archiveDay ? getChartSnapshot(archiveDay) : null;

  if (!tracks.length && !countdown.length && !ones.length) return null;

  const playEntry = (entry, list) => {
    if (!entry?.id || !onPlayTrack) return;
    const track = tracks.find((t) => t.id === entry.id) || {
      id: entry.id,
      title: entry.title,
      artist: entry.artist,
      albumCover: entry.albumCover,
    };
    const pool = list
      .map((e) => tracks.find((t) => t.id === e.id))
      .filter(Boolean);
    onPlayTrack(track, pool.length ? pool : [track]);
  };

  const scopeTitle = chartScopeLabel(scope);

  return (
    <section
      aria-label="Monthly charts"
      style={{
        position: "relative",
        padding: `4px 0 ${homeSpace.sectionPadBottom}px`,
        animation: `rise 0.55s ${motion.ease} 0.06s both`,
      }}
    >
      <div style={{ padding: `0 ${homeSpace.gutter}px 14px` }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}>
          <span aria-hidden="true" style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: chrome.signal,
            boxShadow: `0 0 0 2px rgba(${chrome.cyanRgb},0.2), 0 0 12px rgba(${chrome.cyanRgb},0.45)`,
            animation: "breathe 2.4s ease-in-out infinite",
          }} />
          <div style={{
            fontFamily: fontMono, fontSize: 10, fontWeight: 800,
            letterSpacing: 1.6, textTransform: "uppercase", color: chrome.steel,
          }}>
            Monthly chart · {monthLabel}
          </div>
        </div>
        <h3 style={{
          margin: 0,
          fontFamily: fontDisplay,
          fontSize: "clamp(22px, 4.5vw, 28px)",
          fontWeight: 750,
          letterSpacing: -0.5,
          color: color.ink,
          lineHeight: 1.1,
        }}>
          {scopeTitle}
        </h3>
      </div>

      {/* Scope bank */}
      <div style={{
        display: "flex", gap: 6, padding: `0 ${homeSpace.gutter}px 10px`,
        overflowX: "auto",
      }} className="hide-scroll">
        {[
          { id: "overall", label: "Overall" },
          { id: "channel", label: "By channel" },
          { id: "genre", label: "By genre" },
        ].map((t) => (
          <ScopeChip
            key={t.id}
            active={scopeMode === t.id}
            label={t.label}
            onClick={() => setScopeMode(t.id)}
          />
        ))}
      </div>

      {scopeMode === "channel" && (
        <div style={{
          display: "flex", gap: 6, padding: `0 ${homeSpace.gutter}px 10px`,
          overflowX: "auto",
        }} className="hide-scroll">
          {SCENE_CHANNELS.map((ch) => (
            <ScopeChip
              key={ch.id}
              active={channelId === ch.id}
              label={`CH-${String(ch.num).padStart(2, "0")} ${ch.shortTitle || ch.title}`}
              onClick={() => setChannelId(ch.id)}
            />
          ))}
        </div>
      )}

      {scopeMode === "genre" && (
        <div style={{
          display: "flex", gap: 6, padding: `0 ${homeSpace.gutter}px 10px`,
          overflowX: "auto",
        }} className="hide-scroll">
          {CANONICAL_GENRES.map((g) => (
            <ScopeChip
              key={g}
              active={genre === g}
              label={g}
              onClick={() => setGenre(g)}
            />
          ))}
        </div>
      )}

      {/* Mode segment — single hardware plate */}
      <div style={{ padding: `0 ${homeSpace.gutter}px 14px` }}>
        <div
          role="tablist"
          aria-label="Chart view"
          style={{
            display: "flex",
            gap: 3,
            padding: 4,
            borderRadius: radio.radiusTight,
            border: `1px solid ${glass.border}`,
            background: `
              linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 50%),
              rgba(12,14,18,0.72)
            `,
            boxShadow: `inset 0 1px 0 ${glass.highlight}, inset 0 2px 6px rgba(0,0,0,0.35)`,
            overflowX: "auto",
          }}
          className="hide-scroll"
        >
          {[
            { id: "month", label: "This month" },
            { id: "climbers", label: "Climbers" },
            { id: "ones", label: "#1s" },
            { id: "archive", label: "Past days" },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                style={{
                  flex: "1 0 auto",
                  padding: "9px 12px",
                  borderRadius: 5,
                  border: active
                    ? "1px solid rgba(231,235,240,0.28)"
                    : "1px solid transparent",
                  background: active
                    ? `
                      linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 100%),
                      rgba(36,40,48,0.95)
                    `
                    : "transparent",
                  color: active ? y2k.offWhite : color.faint,
                  fontFamily: fontMono,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  boxShadow: active
                    ? `inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 12px rgba(0,0,0,0.3)`
                    : "none",
                  transition: `color ${motion.fast}, background ${motion.base}, box-shadow ${motion.base}`,
                  WebkitTapHighlightColor: "transparent",
                  whiteSpace: "nowrap",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: `0 ${homeSpace.gutter}px` }}>
        {tab === "month" && (
          <>
            {onTuneMonthly && monthlyEntries.length > 0 && (
              <button
                type="button"
                onClick={() => onTuneMonthly(scope)}
                style={{
                  width: "100%",
                  marginBottom: 14,
                  padding: "14px 16px",
                  borderRadius: radio.radiusTight,
                  border: "1px solid rgba(231,235,240,0.35)",
                  background: radio.tuneFace,
                  color: chrome.inkPlate,
                  fontFamily: fontMono,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  boxShadow: radio.tuneShadow,
                  transition: `transform ${motion.fast} ${motion.ease}, box-shadow ${motion.base}`,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                Play monthly chart
              </button>
            )}
            {monthlyEntries.length ? (
              <ChartList
                entries={monthlyEntries}
                onPlay={(e, list) => playEntry(e, list)}
              />
            ) : (
              <Empty note="No cuts in this scope yet — play and request to fill the monthly chart." />
            )}
          </>
        )}

        {tab === "climbers" && (
          climbers.length ? (
            <ChartList
              entries={climbers.map((c) => ({
                rank: c.rank,
                id: c.track.id,
                title: c.track.title,
                artist: c.track.artist,
                albumCover: c.track.albumCover,
                movement: c.movement,
                delta: c.delta,
              }))}
              onPlay={(e, list) => playEntry(e, list)}
            />
          ) : (
            <Empty note="Play and request across two days to unlock climbers." />
          )
        )}

        {tab === "ones" && (
          ones.length ? (
            <ChartList
              entries={ones.map((e, i) => ({
                rank: i + 1,
                id: e.id,
                title: e.title,
                artist: e.artist,
                albumCover: e.albumCover,
                movement: "same",
                meta: e.dayKey,
              }))}
              onPlay={(e, list) => playEntry(e, list)}
            />
          ) : (
            <Empty note="Number-ones appear as daily charts are captured." />
          )
        )}

        {tab === "archive" && (
          <>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12 }} className="hide-scroll">
              {days.map((d) => (
                <ScopeChip
                  key={d}
                  active={archiveDay === d}
                  label={d.slice(5)}
                  onClick={() => setArchiveDay(d)}
                />
              ))}
            </div>
            {archive ? (
              <ChartList
                entries={archive.entries.map((e) => ({
                  rank: e.rank,
                  id: e.id,
                  title: e.title,
                  artist: e.artist,
                  albumCover: e.albumCover,
                  movement: "same",
                }))}
                onPlay={(e, list) => playEntry(e, list)}
              />
            ) : (
              <Empty note={days.length ? "Pick a day." : "Archive builds as you listen."} />
            )}
          </>
        )}
      </div>
    </section>
  );
}

function Empty({ note }) {
  return (
    <div style={{
      padding: "18px 16px",
      borderRadius: radio.radiusTight,
      border: radio.lcdBorder,
      background: radio.lcdFace,
      boxShadow: radio.lcdShadow,
      color: color.muted,
      fontSize: 13,
      lineHeight: 1.5,
      fontFamily: fontMono,
      letterSpacing: 0.2,
    }}>
      {note}
    </div>
  );
}

/** Continuous machined countdown strips — premium, not boxed cards. */
function ChartList({ entries, onPlay }) {
  return (
    <ol style={{
      listStyle: "none",
      margin: 0,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      gap: 5,
    }}>
      {entries.map((e, i) => {
        const top = e.rank <= 3;
        return (
          <li
            key={`${e.id}-${e.rank}`}
            style={{
              animation: `rise 0.45s ${motion.ease} ${Math.min(i, 12) * 0.03}s both`,
            }}
          >
            <button
              type="button"
              onClick={() => onPlay?.(e, entries)}
              aria-label={`#${e.rank} ${e.title} by ${e.artist}`}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 0,
                padding: 0,
                minHeight: 58,
                borderRadius: 6,
                overflow: "hidden",
                border: top
                  ? "1px solid rgba(101,230,255,0.22)"
                  : `1px solid ${glass.borderSoft}`,
                background: top
                  ? `
                    linear-gradient(90deg, rgba(101,230,255,0.1) 0%, rgba(24,27,32,0.98) 32%),
                    linear-gradient(165deg, rgba(40,46,56,0.96) 0%, rgba(16,18,22,0.98) 100%)
                  `
                  : `
                    linear-gradient(90deg, rgba(37,42,49,0.96) 0%, rgba(20,23,28,0.98) 72%)
                  `,
                boxShadow: top
                  ? `inset 3px 0 0 ${chrome.signal}, inset 0 1px 0 ${glass.highlight}, 0 0 20px rgba(${chrome.cyanRgb},0.06)`
                  : `inset 0 1px 0 ${glass.highlight}, inset 0 -1px 0 rgba(0,0,0,0.5)`,
                cursor: "pointer",
                textAlign: "left",
                transition: `border-color ${motion.fast}, box-shadow ${motion.base}`,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <div style={{
                width: top ? 50 : 44,
                flexShrink: 0,
                fontFamily: fontMono,
                fontSize: e.rank === 1 ? 30 : top ? 26 : 18,
                fontWeight: 900,
                letterSpacing: -1.4,
                color: e.rank === 1
                  ? chrome.signal
                  : top
                    ? chrome.bright
                    : color.body,
                textAlign: "center",
                textShadow: e.rank === 1
                  ? `0 0 18px rgba(${chrome.cyanRgb},0.4)`
                  : "none",
                fontVariantNumeric: "tabular-nums",
              }}>
                {e.rank}
              </div>

              <div style={{
                width: 56,
                height: 56,
                borderRadius: 0,
                flexShrink: 0,
                overflow: "hidden",
                background: color.surfaceRaised,
                boxShadow: `
                  inset 1px 0 0 rgba(255,255,255,0.08),
                  inset -1px 0 0 rgba(0,0,0,0.35),
                  ${artShadow.quiet}
                `,
              }}>
                <CoverImage src={e.albumCover} width={56} height={56} alt="" />
              </div>

              <div style={{ minWidth: 0, flex: 1, padding: "8px 12px" }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: color.ink,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontFamily: fontDisplay,
                  letterSpacing: -0.2,
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
                }}>
                  {e.artist}{e.meta ? ` · ${e.meta}` : ""}
                </div>
              </div>

              <div style={{
                flexShrink: 0,
                paddingRight: 14,
                display: "flex",
                alignItems: "center",
                minWidth: 28,
                justifyContent: "flex-end",
              }}>
                <MovementTag movement={e.movement} delta={e.delta} />
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
