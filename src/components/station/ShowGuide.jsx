import { useEffect, useMemo, useState } from "react";
import {
  color, font, fontDisplay, fontMono, glass, homeSpace, motion, radius,
} from "../../theme";
import {
  buildDailyGuide,
  formatRemaining,
  formatShowClock,
  resolveShowAt,
} from "../../lib/shows";

function HostAvatar({ host, size = 44 }) {
  if (!host) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fontMono,
        fontSize: size * 0.28,
        fontWeight: 800,
        letterSpacing: 0.5,
        color: "#fff",
        background: `
          linear-gradient(160deg, rgba(255,255,255,0.28) 0%, transparent 42%),
          linear-gradient(145deg, ${host.accent} 0%, #16181E 120%)
        `,
        border: "1px solid rgba(255,255,255,0.22)",
        boxShadow: `0 8px 20px rgba(22,24,30,0.22), 0 0 0 3px ${host.accent}33`,
      }}
    >
      {host.monogram}
    </div>
  );
}

/** Compact host credit for player chrome. */
export function HostCreditChip({ show, compact = false, onClick = null }) {
  if (!show?.host) return null;
  const inner = (
    <>
      <HostAvatar host={show.host} size={compact ? 22 : 28} />
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: fontMono,
          fontSize: compact ? 8 : 9,
          fontWeight: 800,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: compact ? "rgba(242,244,247,0.55)" : color.faint,
        }}>
          Hosted by
        </div>
        <div style={{
          fontSize: compact ? 11 : 12,
          fontWeight: 700,
          color: compact ? color.onDark : color.ink,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {show.host.name}
        </div>
      </div>
    </>
  );

  const style = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: compact ? "4px 8px 4px 4px" : "6px 10px 6px 6px",
    borderRadius: 999,
    background: compact ? "rgba(255,255,255,0.08)" : glass.fillStrong,
    border: `1px solid ${compact ? "rgba(255,255,255,0.12)" : glass.border}`,
    boxShadow: compact ? "none" : `inset 0 1px 0 ${glass.highlight}`,
    maxWidth: 200,
    cursor: onClick ? "pointer" : "default",
  };

  if (onClick) {
    return (
      <button type="button" onClick={onClick} style={{ ...style, font: "inherit" }}>
        {inner}
      </button>
    );
  }
  return <div style={style}>{inner}</div>;
}

/**
 * Hero "NOW ON AIR" card — the appointment-viewing surface.
 */
export function NowOnAirCard({
  airing = null,
  onTuneIn = null,
  tuned = false,
  bumper = null,
}) {
  if (!airing?.show) return null;
  const { show, host, remainingMinutes, progress, nextShow } = airing;

  return (
    <section
      aria-label={`Now on air: ${show.title}`}
      style={{
        margin: `0 ${homeSpace.gutter}px`,
        padding: 0,
        animation: `rise 0.5s ${motion.ease} both`,
      }}
    >
      <div style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: radius.lg,
        border: `1px solid ${glass.border}`,
        background: `
          linear-gradient(135deg, ${host.accent}22 0%, transparent 42%),
          linear-gradient(165deg, rgba(22,24,30,0.94) 0%, #1A1D24 55%, #12141A 100%)
        `,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 18px 40px rgba(22,24,30,0.22)`,
        color: color.onDark,
        padding: "18px 18px 16px",
      }}>
        {/* Scanline / broadcast texture */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.06,
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.35) 3px)",
        }} />

        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 10px", borderRadius: 999,
            background: "rgba(255,59,78,0.18)",
            border: "1px solid rgba(255,59,78,0.45)",
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%", background: "#FF3B4E",
              boxShadow: "0 0 0 3px rgba(255,59,78,0.28)",
              animation: "stageLiveDot 1.4s ease-in-out infinite",
            }} />
            <span style={{
              fontFamily: fontMono, fontSize: 10, fontWeight: 800,
              letterSpacing: 1.5, textTransform: "uppercase",
            }}>
              Now on air
            </span>
          </div>
          <div style={{
            fontFamily: fontMono, fontSize: 10, fontWeight: 700,
            letterSpacing: 0.8, color: "rgba(242,244,247,0.55)",
            textAlign: "right",
          }}>
            {show.timeLabel}
            <div style={{ marginTop: 2, color: host.accent }}>
              {formatRemaining(remainingMinutes)}
            </div>
          </div>
        </div>

        <div style={{ position: "relative", display: "flex", gap: 14, alignItems: "flex-start" }}>
          <HostAvatar host={host} size={56} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{
              margin: 0,
              fontFamily: fontDisplay,
              fontSize: "clamp(22px, 4.5vw, 28px)",
              fontWeight: 750,
              letterSpacing: -0.55,
              lineHeight: 1.08,
            }}>
              {show.title}
            </h2>
            <div style={{
              marginTop: 6,
              fontSize: 13,
              color: "rgba(242,244,247,0.72)",
              lineHeight: 1.35,
            }}>
              {show.tagline}
            </div>
            <div style={{
              marginTop: 10,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}>
              <span style={{
                fontFamily: fontMono, fontSize: 11, fontWeight: 700,
                letterSpacing: 0.4, color: "#fff",
              }}>
                {host.name}
              </span>
              <span style={{ color: "rgba(242,244,247,0.35)" }}>·</span>
              <span style={{
                fontFamily: fontMono, fontSize: 10, fontWeight: 600,
                letterSpacing: 0.8, textTransform: "uppercase",
                color: "rgba(242,244,247,0.5)",
              }}>
                {host.title}
              </span>
            </div>
          </div>
        </div>

        {/* Block progress */}
        <div style={{ position: "relative", marginTop: 16 }} aria-hidden="true">
          <div style={{
            height: 3, borderRadius: 2, background: "rgba(255,255,255,0.12)", overflow: "hidden",
          }}>
            <div style={{
              width: `${Math.round((progress || 0) * 100)}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${host.accent}, #fff)`,
              boxShadow: `0 0 12px ${host.accent}`,
              transition: "width 1s linear",
            }} />
          </div>
        </div>

        {bumper && (
          <div style={{
            position: "relative",
            marginTop: 12,
            fontFamily: fontMono,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.3,
            color: "rgba(242,244,247,0.62)",
            lineHeight: 1.4,
          }}>
            “{bumper}”
          </div>
        )}

        <div style={{
          position: "relative",
          marginTop: 16,
          display: "flex",
          gap: 8,
          alignItems: "stretch",
        }}>
          <button
            type="button"
            onClick={onTuneIn}
            style={{
              flex: 1,
              padding: "13px 16px",
              borderRadius: radius.sm,
              border: "none",
              cursor: "pointer",
              fontFamily: fontMono,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: "#fff",
              background: tuned
                ? "rgba(255,255,255,0.12)"
                : `linear-gradient(165deg, ${host.accent} 0%, #16181E 130%)`,
              boxShadow: tuned ? "none" : `0 10px 24px ${host.accent}44`,
            }}
          >
            {tuned ? "You’re locked in ✓" : "Tune into this block"}
          </button>
        </div>

        {nextShow && (
          <div style={{
            position: "relative",
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "rgba(242,244,247,0.48)",
          }}>
            <span>Up next</span>
            <span style={{ color: "rgba(242,244,247,0.78)", textAlign: "right" }}>
              {nextShow.shortTitle || nextShow.title} · {formatShowClock(nextShow.startHour)}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Horizontal day guide — surf the channel’s blocks.
 */
export function ShowGuideRail({
  guide = [],
  activeShowId = null,
  onSelectShow = null,
}) {
  if (!guide.length) return null;

  return (
    <section
      aria-label="Today’s program guide"
      style={{
        padding: `18px 0 8px`,
        animation: `rise 0.55s ${motion.ease} 0.04s both`,
      }}
    >
      <div style={{
        padding: `0 ${homeSpace.gutter}px 10px`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
      }}>
        <div>
          <div style={{
            fontFamily: fontMono, fontSize: 10, fontWeight: 800,
            letterSpacing: 1.5, textTransform: "uppercase", color: "#FF3B4E",
            marginBottom: 4,
          }}>
            Program guide
          </div>
          <h3 style={{
            margin: 0,
            fontFamily: fontDisplay,
            fontSize: 18,
            fontWeight: 750,
            letterSpacing: -0.3,
            color: color.ink,
          }}>
            Today’s blocks
          </h3>
        </div>
      </div>

      <div
        className="hide-scroll"
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          padding: `2px ${homeSpace.gutter}px 12px`,
          scrollSnapType: "x mandatory",
        }}
      >
        {guide.map((show) => {
          const live = show.status === "live";
          const tuned = activeShowId === show.id;
          const accent = show.host?.accent || color.accent;
          return (
            <button
              key={show.id}
              type="button"
              onClick={() => onSelectShow?.(show)}
              aria-current={live ? "true" : undefined}
              style={{
                flex: "0 0 auto",
                width: 168,
                scrollSnapAlign: "start",
                textAlign: "left",
                padding: 12,
                borderRadius: radius.md,
                cursor: "pointer",
                border: `1px solid ${live || tuned ? accent : glass.borderSoft}`,
                background: live
                  ? `linear-gradient(160deg, ${accent}18 0%, rgba(255,255,255,0.7) 55%)`
                  : "rgba(255,255,255,0.58)",
                boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
              }}
            >
              <div style={{
                display: "flex", justifyContent: "space-between", gap: 6, marginBottom: 8,
              }}>
                <span style={{
                  fontFamily: fontMono, fontSize: 9, fontWeight: 800,
                  letterSpacing: 1.1, textTransform: "uppercase",
                  color: live ? "#FF3B4E" : color.faint,
                }}>
                  {live ? "Live" : show.status === "up-next" ? "Up next" : formatShowClock(show.startHour)}
                </span>
                <HostAvatar host={show.host} size={22} />
              </div>
              <div style={{
                fontFamily: fontDisplay, fontSize: 14, fontWeight: 700,
                letterSpacing: -0.2, color: color.ink, lineHeight: 1.15,
                minHeight: 34,
              }}>
                {show.shortTitle || show.title}
              </div>
              <div style={{
                marginTop: 6,
                fontSize: 11, color: color.muted,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {show.host?.name}
              </div>
              <div style={{
                marginTop: 8,
                fontFamily: fontMono, fontSize: 9, fontWeight: 650,
                letterSpacing: 0.6, color: color.faint,
              }}>
                {show.timeLabel}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Live airing clock — refreshes every 30s for remaining/progress. */
export function useLiveAiring(tickMs = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  return useMemo(() => {
    const airing = resolveShowAt(now);
    const guide = buildDailyGuide(now);
    return { now, airing, guide };
  }, [now]);
}
