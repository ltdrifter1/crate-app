import { useEffect, useMemo, useState } from "react";
import {
  color, fontDisplay, fontMono, glass, homeSpace, motion, chrome, hardware, y2k
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
 * Hero "NOW ON AIR" card — soft frosted appointment surface (iOS glass).
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
        margin: 0,
        padding: 0,
        animation: `rise 0.5s ${motion.ease} both`,
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.14)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 40%, transparent 100%), rgba(22,25,30,0.58)",
          backdropFilter: "blur(22px) saturate(1.25)",
          WebkitBackdropFilter: "blur(22px) saturate(1.25)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3), 0 10px 28px rgba(0,0,0,0.32)",
          color: color.ink,
          padding: "16px 16px 14px",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 14,
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 11px",
              borderRadius: 980,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%), rgba(10,11,13,0.45)",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#E23B4C",
                boxShadow: "0 0 0 3px rgba(226,59,76,0.22)",
                animation: "stageLiveDot 1.4s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontFamily: fontDisplay,
                fontSize: 12,
                fontWeight: 650,
                letterSpacing: -0.1,
                color: color.ink,
              }}
            >
              Now on air
            </span>
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 550,
              letterSpacing: -0.05,
              color: color.muted,
              textAlign: "right",
            }}
          >
            {show.timeLabel}
            <div style={{ marginTop: 2, color: color.body, fontWeight: 650 }}>
              {formatRemaining(remainingMinutes)}
            </div>
          </div>
        </div>

        <div style={{ position: "relative", display: "flex", gap: 14, alignItems: "flex-start" }}>
          <HostAvatar host={host} size={52} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2
              style={{
                margin: 0,
                fontFamily: fontDisplay,
                fontSize: "clamp(20px, 4.2vw, 26px)",
                fontWeight: 700,
                letterSpacing: -0.45,
                lineHeight: 1.1,
                color: color.ink,
              }}
            >
              {show.title}
            </h2>
            <div
              style={{
                marginTop: 5,
                fontSize: 13,
                fontWeight: 500,
                color: color.body,
                lineHeight: 1.35,
              }}
            >
              {show.tagline}
            </div>
            <div
              style={{
                marginTop: 10,
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 650, letterSpacing: -0.1, color: color.ink }}>
                {host.name}
              </span>
              <span style={{ color: color.faint }}>·</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: color.muted }}>{host.title}</span>
            </div>
          </div>
        </div>

        <div style={{ position: "relative", marginTop: 16 }} aria-hidden="true">
          <div
            style={{
              height: 4,
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.round((progress || 0) * 100)}%`,
                height: "100%",
                borderRadius: 999,
                background: "linear-gradient(90deg, rgba(232,236,242,0.55), rgba(169,199,228,0.95))",
                transition: "width 1s linear",
              }}
            />
          </div>
        </div>

        {bumper && (
          <div
            style={{
              position: "relative",
              marginTop: 12,
              fontSize: 12,
              fontWeight: 500,
              color: color.muted,
              lineHeight: 1.4,
            }}
          >
            “{bumper}”
          </div>
        )}

        <div
          style={{
            position: "relative",
            marginTop: 14,
            display: "flex",
            gap: 8,
            alignItems: "stretch",
          }}
        >
          <button
            type="button"
            onClick={onTuneIn}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 980,
              border: tuned
                ? "1px solid rgba(232,236,242,0.4)"
                : "1px solid rgba(255,255,255,0.16)",
              cursor: "pointer",
              fontFamily: fontDisplay,
              fontSize: 14,
              fontWeight: 650,
              letterSpacing: -0.15,
              color: tuned ? y2k.chromeBright : "#0B0C0F",
              background: tuned
                ? "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%), rgba(18,20,24,0.55)"
                : "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, transparent 42%), linear-gradient(160deg, #E8ECF2 0%, #B8C0CC 48%, #6E7683 100%)",
              boxShadow: tuned
                ? "inset 0 1px 0 rgba(255,255,255,0.18)"
                : "0 0 18px rgba(232,236,242,0.18), inset 0 1px 0 rgba(255,255,255,0.45)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}
          >
            {tuned ? "You’re locked in" : "Tune in"}
          </button>
        </div>

        {nextShow && (
          <div
            style={{
              position: "relative",
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              fontSize: 12,
              fontWeight: 550,
              letterSpacing: -0.05,
              color: color.muted,
            }}
          >
            <span>Up next</span>
            <span style={{ color: color.body, textAlign: "right", fontWeight: 650 }}>
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
          gap: 12,
          overflowX: "auto",
          padding: embedded
            ? `2px ${homeSpace.gutter}px 8px`
            : `2px ${homeSpace.gutter}px 12px`,
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
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
              className="pmp-lift"
              style={{
                flex: "0 0 auto",
                width: 168,
                scrollSnapAlign: "start",
                textAlign: "left",
                padding: 14,
                borderRadius: 16,
                cursor: "pointer",
                border: `1px solid ${
                  live || tuned ? "rgba(232,236,242,0.35)" : "rgba(255,255,255,0.12)"
                }`,
                background: live || tuned
                  ? "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 100%), rgba(28,32,38,0.62)"
                  : "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%), rgba(18,20,24,0.5)",
                backdropFilter: "blur(18px) saturate(1.25)",
                WebkitBackdropFilter: "blur(18px) saturate(1.25)",
                boxShadow: live || tuned
                  ? "inset 0 1px 0 rgba(255,255,255,0.22), 0 8px 22px rgba(0,0,0,0.32)"
                  : "inset 0 1px 0 rgba(255,255,255,0.16), 0 6px 16px rgba(0,0,0,0.28)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 6,
                  marginBottom: 10,
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 650,
                    letterSpacing: -0.05,
                    color: live ? chrome.live : tuned ? y2k.chromeBright : color.muted,
                  }}
                >
                  {live
                    ? "Live"
                    : tuned
                      ? "Tuned"
                      : show.status === "up-next"
                        ? "Up next"
                        : formatShowClock(show.startHour)}
                </span>
                <HostAvatar host={show.host} size={24} />
              </div>
              <div
                style={{
                  fontFamily: fontDisplay,
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: -0.25,
                  color: tuned ? y2k.chromeBright : color.ink,
                  lineHeight: 1.2,
                  minHeight: 36,
                }}
              >
                {show.shortTitle || show.title}
              </div>
              <div
                style={{
                  marginTop: 7,
                  fontSize: 12,
                  fontWeight: 500,
                  color: color.muted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {show.host?.name}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  fontWeight: 500,
                  color: color.faint,
                }}
              >
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
