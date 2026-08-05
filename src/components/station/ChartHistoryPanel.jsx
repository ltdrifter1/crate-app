import { useMemo, useState } from "react";
import {
  color, fontDisplay, fontMono, glass, homeSpace, motion, radius, artShadow,
} from "../../theme";
import {
  biggestClimbers,
  buildWeeklyReveal,
  enrichCountdownWithHistory,
  getNumberOnes,
  listChartDays,
  getChartSnapshot,
  weekKey,
} from "../../lib/chartHistory";

function MovementTag({ movement, delta }) {
  if (movement === "up") {
    return <span style={{ color: "#2ED3A4", fontFamily: fontMono, fontSize: 10, fontWeight: 800 }}>↑{delta}</span>;
  }
  if (movement === "down") {
    return <span style={{ color: "#FF3B4E", fontFamily: fontMono, fontSize: 10, fontWeight: 800 }}>↓{delta}</span>;
  }
  if (movement === "debut" || movement === "new") {
    return <span style={{ color: "#FFB020", fontFamily: fontMono, fontSize: 10, fontWeight: 800 }}>NEW</span>;
  }
  return <span style={{ color: color.faint, fontFamily: fontMono, fontSize: 10, fontWeight: 700 }}>●</span>;
}

/**
 * Chart history + weekly reveal — TRL archive energy.
 */
export default function ChartHistoryPanel({
  countdown = [],
  tracks = [],
  onPlayTrack = null,
  onTuneWeekly = null,
}) {
  const [tab, setTab] = useState("today"); // today | week | ones | archive
  const [archiveDay, setArchiveDay] = useState(null);

  const live = useMemo(() => enrichCountdownWithHistory(countdown), [countdown]);
  const climbers = useMemo(() => biggestClimbers(countdown, 5), [countdown]);
  const weekly = useMemo(() => buildWeeklyReveal(10), [countdown, tracks.length]);
  const ones = useMemo(() => getNumberOnes(10), [countdown]);
  const days = useMemo(() => listChartDays(10), [countdown]);

  const archive = archiveDay ? getChartSnapshot(archiveDay) : null;

  if (!countdown.length && !weekly.length && !ones.length) return null;

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

  return (
    <section
      aria-label="Chart history"
      style={{
        padding: `8px 0 ${homeSpace.sectionPadBottom}px`,
        animation: `rise 0.55s ${motion.ease} 0.05s both`,
      }}
    >
      <div style={{ padding: `0 ${homeSpace.gutter}px 12px` }}>
        <div style={{
          fontFamily: fontMono, fontSize: 10, fontWeight: 800,
          letterSpacing: 1.5, textTransform: "uppercase", color: "#FFB020",
          marginBottom: 4,
        }}>
          Chart archive · {weekKey()}
        </div>
        <h3 style={{
          margin: 0,
          fontFamily: fontDisplay,
          fontSize: "clamp(20px, 4vw, 26px)",
          fontWeight: 750,
          letterSpacing: -0.4,
          color: color.ink,
        }}>
          History & climbers
        </h3>
      </div>

      <div style={{
        display: "flex", gap: 6, padding: `0 ${homeSpace.gutter}px 12px`,
        overflowX: "auto",
      }} className="hide-scroll">
        {[
          { id: "today", label: "Today" },
          { id: "climbers", label: "Climbers" },
          { id: "week", label: "Weekly reveal" },
          { id: "ones", label: "#1s" },
          { id: "archive", label: "Past days" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              flexShrink: 0,
              padding: "8px 12px",
              borderRadius: 999,
              border: `1px solid ${tab === t.id ? color.ink : glass.border}`,
              background: tab === t.id ? color.ink : glass.fillStrong,
              color: tab === t.id ? color.onDark : color.body,
              fontFamily: fontMono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: `0 ${homeSpace.gutter}px` }}>
        {tab === "today" && (
          <ChartList
            entries={live.slice(0, 10).map((c) => ({
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

        {tab === "week" && (
          <>
            {onTuneWeekly && weekly.length > 0 && (
              <button
                type="button"
                onClick={onTuneWeekly}
                style={{
                  width: "100%",
                  marginBottom: 10,
                  padding: "12px 14px",
                  borderRadius: radius.sm,
                  border: "1px solid rgba(255,176,32,0.4)",
                  background: "linear-gradient(165deg, #FFB020 0%, #C47A00 120%)",
                  color: "#16181E",
                  fontFamily: fontMono,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                Play weekly reveal
              </button>
            )}
            {weekly.length ? (
              <ChartList
                entries={weekly.map((e) => ({
                  rank: e.weekRank,
                  id: e.id,
                  title: e.title,
                  artist: e.artist,
                  albumCover: e.albumCover,
                  movement: "same",
                  delta: 0,
                }))}
                onPlay={(e, list) => playEntry(e, list)}
              />
            ) : (
              <Empty note="Come back after a few days of charting — the weekly reveal fills in." />
            )}
          </>
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
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 10 }} className="hide-scroll">
              {days.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setArchiveDay(d)}
                  style={{
                    flexShrink: 0,
                    padding: "8px 10px",
                    borderRadius: radius.sm,
                    border: `1px solid ${archiveDay === d ? color.ink : glass.border}`,
                    background: archiveDay === d ? color.surfaceRaised : glass.fillStrong,
                    fontFamily: fontMono,
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                    color: color.ink,
                  }}
                >
                  {d.slice(5)}
                </button>
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
    <div className="glass-surface" style={{ padding: 16, borderRadius: radius.md, color: color.muted, fontSize: 13 }}>
      {note}
    </div>
  );
}

function ChartList({ entries, onPlay }) {
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
      {entries.map((e) => (
        <li key={`${e.id}-${e.rank}`}>
          <button
            type="button"
            onClick={() => onPlay?.(e, entries)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: radius.md,
              border: `1px solid ${glass.borderSoft}`,
              background: "rgba(255,255,255,0.55)",
              boxShadow: `inset 0 1px 0 ${glass.highlight}`,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{
              width: 28, fontFamily: fontMono, fontWeight: 800, fontSize: 14,
              color: e.rank <= 3 ? "#FFB020" : color.ink, textAlign: "center",
            }}>
              {e.rank}
            </div>
            {e.albumCover ? (
              <img src={e.albumCover} alt="" width={40} height={40} style={{ borderRadius: 5, objectFit: "cover", boxShadow: artShadow.quiet }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: 5, background: color.surfaceRaised }} />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 650, color: color.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {e.title}
              </div>
              <div style={{ fontSize: 11, color: color.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {e.artist}{e.meta ? ` · ${e.meta}` : ""}
              </div>
            </div>
            <MovementTag movement={e.movement} delta={e.delta} />
          </button>
        </li>
      ))}
    </ol>
  );
}
