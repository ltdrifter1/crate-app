import { useEffect, useMemo, useState } from "react";
import {
  color, fontDisplay, fontMono, glass, homeSpace, motion, chrome, hardware
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
        fontSize: Math.max(10, size * 0.28),
        fontWeight: 800,
        letterSpacing: 0.5,
        color: "#fff",
        background: `
          linear-gradient(160deg, rgba(255,255,255,0.16) 0%, transparent 42%),
          linear-gradient(145deg, #4A515D 0%, #16181E 100%)
        `,
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 6px 14px rgba(0,0,0,0.28)",
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
    ? (compact ? color.muted : color.muted)
    : (compact ? "rgba(242,244,247,0.55)" : color.faint);
  const nameColor = onGlass
    ? color.body
    : (compact ? color.onDarkMuted : color.body);

  const inner = (
    <>
      <HostAvatar host={show.host} size={compact ? 24 : 28} />
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: fontMono,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.9,
          textTransform: "uppercase",
          color: labelColor,
        }}>
          Hosted by
        </div>
        <div style={{
          fontSize: compact ? 13 : 14,
          fontWeight: 550,
          letterSpacing: -0.15,
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
    gap: 9,
    padding: compact ? "5px 12px 5px 5px" : "6px 12px 6px 6px",
    borderRadius: 5,
    background: hardware.keyFace,
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: hardware.plateEdge,
    maxWidth: 240,
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
        borderRadius: 8,
        border: `1px solid rgba(255,255,255,0.14)`,
        background: `
          repeating-linear-gradient(90deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 4px),
          linear-gradient(165deg, rgba(42,47,55,0.98) 0%, rgba(23,26,31,0.98) 58%, rgba(15,17,21,0.99) 100%)
        `,
        boxShadow: `inset 4px 0 0 ${color.accent}, inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
        color: color.ink,
        padding: "18px 18px 16px",
      }}>
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `
            linear-gradient(180deg, rgba(255,255,255,0.045) 0%, transparent 28%)
          `,
        }} />

        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 10px", borderRadius: 3,
            background: "rgba(8,9,11,0.58)",
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
              background: color.accent,
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
              borderRadius: 5,
              border: tuned ? `1px solid ${color.accent}` : `1px solid ${glass.border}`,
              cursor: "pointer",
              fontFamily: fontMono,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: tuned ? color.accent : color.ink,
              background: tuned
                ? "rgba(8,9,11,0.58)"
                : glass.chrome,
              boxShadow: tuned
                ? `inset 4px 0 0 ${color.accent}, inset 0 1px 0 ${glass.highlight}`
                : `inset 0 1px 0 ${glass.highlight}, inset 0 -1px 0 rgba(0,0,0,0.5)`,
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
            <h3 style={{
              margin: 0,
              fontFamily: fontDisplay,
              fontSize: "clamp(20px, 3.6vw, 24px)",
              fontWeight: 750,
              letterSpacing: -0.3,
              color: color.ink,
            }}>
              Program guide
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
          return (
            <button
              key={show.id}
              type="button"
              onClick={() => onSelectShow?.(show)}
              aria-current={tuned ? "true" : undefined}
              style={{
                flex: "0 0 auto",
                width: 176,
                scrollSnapAlign: "start",
                textAlign: "left",
                padding: 14,
                borderRadius: 6,
                cursor: "pointer",
                border: `1px solid ${live || tuned ? color.accent : glass.borderSoft}`,
                background: live || tuned
                  ? "linear-gradient(160deg, rgba(42,47,55,0.98) 0%, rgba(19,22,27,0.99) 72%)"
                  : "linear-gradient(160deg, rgba(37,42,49,0.96) 0%, rgba(20,23,28,0.98) 72%)",
                boxShadow: live || tuned
                  ? `inset 4px 0 0 ${color.accent}, inset 0 1px 0 ${glass.highlight}, inset 0 -1px 0 rgba(0,0,0,0.5)`
                  : `inset 0 1px 0 ${glass.highlight}, inset 0 -1px 0 rgba(0,0,0,0.5)`,
              }}
            >
              <div style={{
                display: "flex", justifyContent: "space-between", gap: 6, marginBottom: 10,
              }}>
                <span style={{
                  fontFamily: fontMono, fontSize: 10, fontWeight: 800,
                  letterSpacing: 1.1, textTransform: "uppercase",
                  color: live ? chrome.live : (tuned ? color.accent : color.faint),
                }}>
                  {live ? "Live" : tuned ? "Tuned" : show.status === "up-next" ? "Up next" : formatShowClock(show.startHour)}
                </span>
                <HostAvatar host={show.host} size={24} />
              </div>
              <div style={{
                fontFamily: fontDisplay, fontSize: 15, fontWeight: 800,
                letterSpacing: -0.25, color: tuned ? color.accent : color.ink, lineHeight: 1.15,
                minHeight: 36,
              }}>
                {show.shortTitle || show.title}
              </div>
              <div style={{
                marginTop: 7,
                fontSize: 12, fontWeight: 550, color: color.muted,
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
