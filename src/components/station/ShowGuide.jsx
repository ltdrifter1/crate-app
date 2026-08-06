import { useEffect, useMemo, useState } from "react";
import {
  color, font, fontDisplay, fontMono, glass, homeSpace, motion, radius, chrome
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
export function HostCreditChip({ show, compact = false, onClick = null, tone = "auto" }) {
  if (!show?.host) return null;
  const onGlass = tone === "glass" || (tone === "auto" && !compact);
  const labelColor = onGlass
    ? (compact ? color.faint : color.faint)
    : (compact ? "rgba(242,244,247,0.55)" : color.faint);
  const nameColor = onGlass
    ? color.ink
    : (compact ? color.onDark : color.ink);

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
          color: labelColor,
        }}>
          Hosted by
        </div>
        <div style={{
          fontSize: compact ? 11 : 12,
          fontWeight: 700,
          color: nameColor,
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
    padding: compact ? "4px 10px 4px 4px" : "6px 10px 6px 6px",
    borderRadius: 999,
    background: onGlass
      ? (compact ? "rgba(29,33,39,0.58)" : glass.fillStrong)
      : (compact ? "rgba(255,255,255,0.08)" : glass.fillStrong),
    border: `1px solid ${onGlass ? glass.borderSoft : (compact ? "rgba(255,255,255,0.12)" : glass.border)}`,
    boxShadow: onGlass
      ? `inset 0 1px 0 ${glass.highlight}`
      : (compact ? "none" : `inset 0 1px 0 ${glass.highlight}`),
    maxWidth: 220,
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
 * Hero "NOW ON AIR" card — frosted appointment-viewing surface.
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
        borderRadius: radius.xl,
        border: `1px solid rgba(255,255,255,0.14)`,
        background: `
          linear-gradient(135deg, ${host.accent}18 0%, transparent 48%),
          linear-gradient(165deg, rgba(38,43,51,0.82) 0%, rgba(28,32,38,0.52) 55%, rgba(22,25,30,0.48) 100%)
        `,
        boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowLift}`,
        backdropFilter: glass.blur,
        WebkitBackdropFilter: glass.blur,
        color: color.ink,
        padding: "18px 18px 16px",
      }}>
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `
            radial-gradient(ellipse 80% 50% at 0% 0%, ${host.accent}22 0%, transparent 55%),
            linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 40%)
          `,
        }} />

        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 10px", borderRadius: radius.pill,
            background: "rgba(32,36,43,0.65)",
            border: `1px solid ${glass.borderSoft}`,
            boxShadow: `inset 0 1px 0 ${glass.highlight}`,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%", background: "#E23B4C",
              boxShadow: "0 0 0 3px rgba(226,59,76,0.22)",
              animation: "stageLiveDot 1.4s ease-in-out infinite",
            }} />
            <span style={{
              fontFamily: fontMono, fontSize: 10, fontWeight: 800,
              letterSpacing: 1.5, textTransform: "uppercase", color: color.ink,
            }}>
              Now on air
            </span>
          </div>
          <div style={{
            fontFamily: fontMono, fontSize: 10, fontWeight: 700,
            letterSpacing: 0.8, color: color.muted,
            textAlign: "right",
          }}>
            {show.timeLabel}
            <div style={{ marginTop: 2, color: color.body, fontWeight: 800 }}>
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
              color: color.ink,
            }}>
              {show.title}
            </h2>
            <div style={{
              marginTop: 6,
              fontSize: 13,
              color: color.body,
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
                letterSpacing: 0.4, color: color.ink,
              }}>
                {host.name}
              </span>
              <span style={{ color: color.faint }}>·</span>
              <span style={{
                fontFamily: fontMono, fontSize: 10, fontWeight: 600,
                letterSpacing: 0.8, textTransform: "uppercase",
                color: color.muted,
              }}>
                {host.title}
              </span>
            </div>
          </div>
        </div>

        <div style={{ position: "relative", marginTop: 16 }} aria-hidden="true">
          <div style={{
            height: 4, borderRadius: 999,
            background: "rgba(18,20,26,0.08)",
            boxShadow: "inset 0 1px 2px rgba(18,20,26,0.08)",
            overflow: "hidden",
          }}>
            <div style={{
              width: `${Math.round((progress || 0) * 100)}%`,
              height: "100%",
              borderRadius: 999,
              background: `linear-gradient(90deg, ${host.accent}, ${color.ink})`,
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
            color: color.muted,
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
              borderRadius: radius.lg,
              border: tuned ? `1px solid ${glass.borderSoft}` : "1px solid rgba(18,20,26,0.2)",
              cursor: "pointer",
              fontFamily: fontMono,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: tuned ? color.muted : color.onAccent,
              background: tuned
                ? "rgba(28,32,38,0.55)"
                : `linear-gradient(165deg, #EDF0F4 0%, #C4CBD4 100%)`,
              boxShadow: tuned
                ? `inset 0 1px 0 ${glass.highlight}`
                : `inset 0 1px 0 rgba(255,255,255,0.22), ${glass.shadowSoft}`,
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
            borderTop: `1px solid ${glass.borderSoft}`,
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: color.faint,
          }}>
            <span>Up next</span>
            <span style={{ color: color.body, textAlign: "right" }}>
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
  /** When true (Home Tonight band), drop nested headers — parent owns the title. */
  embedded = false,
}) {
  if (!guide.length) return null;

  return (
    <section
      aria-label="Today’s program guide"
      style={{
        padding: embedded ? "4px 0 6px" : "18px 0 8px",
        animation: embedded ? "none" : `rise 0.55s ${motion.ease} 0.04s both`,
      }}
    >
      {!embedded && (
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
              letterSpacing: 1.5, textTransform: "uppercase", color: chrome.steel,
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
      )}

      <div
        className="hide-scroll"
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          padding: embedded
            ? `2px ${homeSpace.gutter}px 8px`
            : `2px ${homeSpace.gutter}px 12px`,
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
                  ? `linear-gradient(160deg, ${accent}18 0%, rgba(38,43,51,0.8) 55%)`
                  : "rgba(32,36,43,0.68)",
                boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
              }}
            >
              <div style={{
                display: "flex", justifyContent: "space-between", gap: 6, marginBottom: 8,
              }}>
                <span style={{
                  fontFamily: fontMono, fontSize: 9, fontWeight: 800,
                  letterSpacing: 1.1, textTransform: "uppercase",
                  color: live ? chrome.hot : color.faint,
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
