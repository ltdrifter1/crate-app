import { useEffect, useMemo, useState } from "react";
import {
  color, fontDisplay, fontMono, homeSpace, motion, chrome, hardware, y2k, radio
} from "../../theme";
import {
  buildDailyGuide,
  formatRemaining,
  formatShowClock,
  resolveShowAt,
  STATION_SHOWS,
} from "../../lib/shows";
import { STATION_CALLSIGN, STATION_FREQ } from "../../lib/mtvChannel";

function HostAvatar({ host, size = 44 }) {
  if (!host) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(4, Math.round(size * 0.18)),
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fontMono,
        fontSize: Math.max(9, size * 0.26),
        fontWeight: 800,
        letterSpacing: 0.6,
        color: y2k.lightMetal,
        background: `
          linear-gradient(160deg, rgba(255,255,255,0.14) 0%, transparent 42%),
          linear-gradient(145deg, #3A414C 0%, #15181C 100%)
        `,
        border: "1px solid rgba(255,255,255,0.16)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), 0 4px 10px rgba(0,0,0,0.35)",
      }}
    >
      {host.monogram}
    </div>
  );
}

function LiveLed({ size = 7 }) {
  return (
    <span
      aria-hidden="true"
      className="pmp-live-led"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: chrome.live,
        boxShadow: `0 0 0 2px rgba(${chrome.liveRgb},0.22), 0 0 10px rgba(${chrome.liveRgb},0.55)`,
        flexShrink: 0,
      }}
    />
  );
}

function TechLabel({ children, color: c = color.faint, style = {} }) {
  return (
    <span
      style={{
        ...radio.label,
        color: c,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function programIndex(showId) {
  const idx = STATION_SHOWS.findIndex((s) => s.id === showId);
  return String(Math.max(0, idx) + 1).padStart(2, "0");
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
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 1.1,
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
    borderRadius: radio.radiusTight,
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

/** Broadcast timeline — illuminated tuner progress with tick marks. */
function BroadcastTimeline({ progress = 0, startLabel, endLabel }) {
  const pct = Math.min(100, Math.max(0, Math.round((progress || 0) * 100)));
  const ticks = [0, 25, 50, 75, 100];

  return (
    <div style={{ position: "relative" }} aria-hidden="true">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <TechLabel color={y2k.cyan}>{startLabel}</TechLabel>
        <TechLabel color={color.faint}>{endLabel}</TechLabel>
      </div>
      <div
        style={{
          position: "relative",
          height: 18,
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Tick marks */}
        <div
          style={{
            position: "absolute",
            inset: "0 0 auto 0",
            height: 4,
            display: "flex",
            justifyContent: "space-between",
            pointerEvents: "none",
          }}
        >
          {ticks.map((t) => (
            <span
              key={t}
              style={{
                width: 1,
                height: t % 50 === 0 ? 5 : 3,
                background: t <= pct
                  ? "rgba(101,230,255,0.55)"
                  : "rgba(255,255,255,0.14)",
              }}
            />
          ))}
        </div>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 2,
            marginTop: 4,
            borderRadius: 1,
            background: radio.lcdTrack,
            boxShadow: "inset 0 1px 0 rgba(0,0,0,0.45)",
            overflow: "visible",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: 1,
              background: radio.lcdFill,
              boxShadow: radio.lcdGlow,
              transition: "width 1s linear",
            }}
          />
          <div
            className="pmp-tuner-needle"
            style={{
              position: "absolute",
              left: `calc(${pct}% - 4px)`,
              top: "50%",
              width: 8,
              height: 8,
              marginTop: -4,
              borderRadius: "50%",
              background: y2k.lightMetal,
              border: `1px solid ${y2k.cyan}`,
              boxShadow: `0 0 8px rgba(${chrome.cyanRgb},0.55), inset 0 1px 0 rgba(255,255,255,0.7)`,
              transition: "left 1s linear",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Hero ON AIR receiver module — hardware broadcast interface.
 */
export function NowOnAirCard({
  airing = null,
  onTuneIn = null,
  tuned = false,
  bumper = null,
}) {
  if (!airing?.show) return null;
  const { show, host, remainingMinutes, progress, nextShow } = airing;
  const prog = programIndex(show.id);

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
        className="pmp-radio-module"
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: radio.radius,
          border: radio.borderLive,
          background: radio.moduleFaceLive,
          boxShadow: radio.moduleShadowLive,
          color: color.ink,
          padding: "14px 14px 12px",
        }}
      >
        {/* Subtle internal scanline wash */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: 0.04,
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.55) 3px)",
            mixBlendMode: "overlay",
          }}
        />

        {/* Status / readout row */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 14,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "5px 9px",
                borderRadius: radio.radiusTight,
                background: "rgba(8,10,13,0.55)",
                border: "1px solid rgba(255,51,79,0.35)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              <LiveLed size={6} />
              <TechLabel color={chrome.live} style={{ letterSpacing: 1.6 }}>
                On Air
              </TechLabel>
            </div>
            <TechLabel color={y2k.cyan}>Live</TechLabel>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <TechLabel color={color.muted}>
              {STATION_CALLSIGN}
            </TechLabel>
            <TechLabel color={color.faint}>·</TechLabel>
            <TechLabel color={y2k.techBlue}>
              Freq {STATION_FREQ}
            </TechLabel>
            <TechLabel color={color.faint}>·</TechLabel>
            <TechLabel color={color.muted}>
              Prog {prog}
            </TechLabel>
          </div>
        </div>

        {/* Show identity */}
        <div style={{ position: "relative", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <HostAvatar host={host} size={48} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2
              style={{
                margin: 0,
                fontFamily: fontDisplay,
                fontSize: "clamp(22px, 4.4vw, 28px)",
                fontWeight: 700,
                letterSpacing: 0.4,
                lineHeight: 1.05,
                textTransform: "uppercase",
                color: y2k.offWhite,
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
                alignItems: "baseline",
              }}
            >
              <span
                style={{
                  fontFamily: fontMono,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  color: y2k.lightMetal,
                }}
              >
                {host.name}
              </span>
              <span style={{ color: color.faint, fontSize: 11 }}>·</span>
              <span
                style={{
                  fontFamily: fontMono,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: color.muted,
                }}
              >
                {host.title}
              </span>
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <TechLabel color={color.muted} style={{ display: "block" }}>
              Signal
            </TechLabel>
            <div
              style={{
                marginTop: 4,
                fontFamily: fontMono,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 0.4,
                color: y2k.cyan,
              }}
            >
              {formatRemaining(remainingMinutes)}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ position: "relative", marginTop: 16 }}>
          <BroadcastTimeline
            progress={progress}
            startLabel={formatShowClock(show.startHour)}
            endLabel={formatShowClock(show.endHour === 24 ? 0 : show.endHour)}
          />
        </div>

        {bumper && (
          <div
            style={{
              position: "relative",
              marginTop: 12,
              padding: "8px 10px",
              borderRadius: radio.radiusTight,
              background: "rgba(8,10,13,0.42)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: 12,
              fontWeight: 500,
              fontStyle: "italic",
              color: color.muted,
              lineHeight: 1.4,
            }}
          >
            “{bumper}”
          </div>
        )}

        {/* Tune-in hardware key */}
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
            className={tuned ? "pmp-tune-key pmp-tune-key--locked" : "pmp-tune-key"}
            style={{
              flex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: "11px 16px",
              borderRadius: radio.radiusControl,
              border: tuned
                ? "1px solid rgba(101,230,255,0.4)"
                : "1px solid rgba(255,255,255,0.28)",
              cursor: "pointer",
              fontFamily: fontMono,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: tuned ? y2k.cyan : "#0A0C10",
              background: tuned
                ? "linear-gradient(180deg, rgba(101,230,255,0.1) 0%, rgba(255,255,255,0.04) 100%), rgba(12,14,18,0.75)"
                : radio.tuneFace,
              boxShadow: tuned
                ? "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 16px rgba(101,230,255,0.12)"
                : radio.tuneShadow,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                border: tuned ? `2px solid ${y2k.cyan}` : "2px solid #1A1E24",
                boxShadow: tuned
                  ? `inset 0 0 0 2px rgba(8,10,13,0.9), 0 0 8px rgba(${chrome.cyanRgb},0.5)`
                  : "inset 0 0 0 2px rgba(232,236,242,0.9)",
                background: tuned ? y2k.cyan : "transparent",
              }}
            />
            {tuned ? "Locked in" : "Tune in"}
          </button>
        </div>

        {nextShow && (
          <div
            style={{
              position: "relative",
              marginTop: 12,
              paddingTop: 11,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "center",
            }}
          >
            <TechLabel color={color.faint}>Up next</TechLabel>
            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  fontFamily: fontDisplay,
                  fontSize: 13,
                  fontWeight: 650,
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                  color: color.body,
                }}
              >
                {nextShow.shortTitle || nextShow.title}
              </span>
              <span
                style={{
                  marginLeft: 8,
                  fontFamily: fontMono,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.6,
                  color: y2k.cyan,
                }}
              >
                {formatShowClock(nextShow.startHour)}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Horizontal day guide — compact broadcast schedule strip.
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
              fontSize: "clamp(18px, 3.4vw, 22px)",
              fontWeight: 700,
              letterSpacing: 0.6,
              textTransform: "uppercase",
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
          gap: 8,
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
          const lit = live || tuned;
          return (
            <button
              key={show.id}
              type="button"
              onClick={() => onSelectShow?.(show)}
              aria-current={tuned ? "true" : undefined}
              className="pmp-lift pmp-schedule-cell"
              style={{
                flex: "0 0 auto",
                width: 148,
                scrollSnapAlign: "start",
                textAlign: "left",
                padding: "11px 12px",
                borderRadius: radio.radiusTight,
                cursor: "pointer",
                border: lit ? radio.borderLive : radio.borderQuiet,
                background: lit ? radio.stripFaceLive : radio.stripFace,
                boxShadow: lit ? radio.stripShadowLive : radio.stripShadow,
                transition: `transform ${motion.settle} ${motion.ease}, border-color ${motion.base}, box-shadow ${motion.settle}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 6,
                  marginBottom: 8,
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontFamily: fontMono,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                    color: live
                      ? chrome.live
                      : tuned
                        ? y2k.cyan
                        : show.status === "up-next"
                          ? y2k.techBlue
                          : color.muted,
                  }}
                >
                  {live && <LiveLed size={5} />}
                  {live
                    ? "Live"
                    : tuned
                      ? "Tuned"
                      : show.status === "up-next"
                        ? "Up next"
                        : formatShowClock(show.startHour)}
                </span>
                <HostAvatar host={show.host} size={22} />
              </div>
              <div
                style={{
                  fontFamily: fontDisplay,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 0.35,
                  textTransform: "uppercase",
                  color: lit ? y2k.offWhite : color.ink,
                  lineHeight: 1.15,
                  minHeight: 32,
                }}
              >
                {show.shortTitle || show.title}
              </div>
              <div
                style={{
                  marginTop: 7,
                  fontFamily: fontMono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.9,
                  textTransform: "uppercase",
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
                  marginTop: 6,
                  fontFamily: fontMono,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 0.4,
                  color: lit ? y2k.cyan : color.faint,
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
