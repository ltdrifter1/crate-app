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

function HostAvatar({ host, size = 44, lcd = false }) {
  if (!host) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: lcd ? radio.radiusLcd : Math.max(4, Math.round(size * 0.16)),
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fontMono,
        fontSize: Math.max(9, size * 0.26),
        fontWeight: 800,
        letterSpacing: 0.6,
        color: lcd ? y2k.cyan : y2k.lightMetal,
        background: lcd
          ? `
            linear-gradient(160deg, rgba(101,230,255,0.12) 0%, transparent 50%),
            linear-gradient(145deg, #121820 0%, #070A0E 100%)
          `
          : `
            linear-gradient(160deg, rgba(255,255,255,0.16) 0%, transparent 42%),
            linear-gradient(145deg, #3A414C 0%, #15181C 100%)
          `,
        border: lcd ? radio.lcdBorder : "1px solid rgba(255,255,255,0.16)",
        boxShadow: lcd
          ? radio.lcdShadow
          : "inset 0 1px 0 rgba(255,255,255,0.16), 0 4px 10px rgba(0,0,0,0.35)",
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

function SignalBars({ level = 4 }) {
  const bars = [0.35, 0.55, 0.75, 1, 0.85];
  return (
    <div
      aria-hidden="true"
      style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: 12 }}
    >
      {bars.map((h, i) => (
        <span
          key={i}
          style={{
            width: 3,
            height: Math.round(12 * h),
            borderRadius: 1,
            background: i < level ? y2k.cyan : "rgba(255,255,255,0.12)",
            boxShadow: i < level ? `0 0 6px rgba(${chrome.cyanRgb},0.45)` : "none",
            opacity: i < level ? 1 : 0.5,
          }}
        />
      ))}
    </div>
  );
}

function Scanlines() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: 0.055,
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(101,230,255,0.35) 3px)",
        mixBlendMode: "screen",
      }}
    />
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

/** LCD tuner timeline with ticks + glowing needle. */
function BroadcastTimeline({ progress = 0, startLabel, endLabel }) {
  const pct = Math.min(100, Math.max(0, Math.round((progress || 0) * 100)));
  const ticks = [0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];

  return (
    <div style={{ position: "relative" }} aria-hidden="true">
      <div
        style={{
          position: "relative",
          height: 22,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 2,
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
                height: t % 25 === 0 ? 6 : 3,
                background: t <= pct
                  ? "rgba(101,230,255,0.65)"
                  : "rgba(255,255,255,0.16)",
              }}
            />
          ))}
        </div>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 3,
            marginTop: 8,
            borderRadius: 2,
            background: radio.lcdTrack,
            boxShadow: "inset 0 1px 0 rgba(0,0,0,0.55)",
            overflow: "visible",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: 2,
              background: radio.lcdFill,
              boxShadow: radio.lcdGlow,
              transition: "width 1s linear",
            }}
          />
          <div
            className="pmp-tuner-needle"
            style={{
              position: "absolute",
              left: `calc(${pct}% - 5px)`,
              top: "50%",
              width: 10,
              height: 10,
              marginTop: -5,
              borderRadius: "50%",
              background: y2k.lightMetal,
              border: `1.5px solid ${y2k.cyan}`,
              boxShadow: `0 0 12px rgba(${chrome.cyanRgb},0.65), inset 0 1px 0 rgba(255,255,255,0.75)`,
              transition: "left 1s linear",
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
        }}
      >
        <TechLabel color={y2k.cyan}>{startLabel}</TechLabel>
        <TechLabel color="rgba(101,230,255,0.45)">{endLabel}</TechLabel>
      </div>
    </div>
  );
}

function TuneInKey({ tuned, onTuneIn }) {
  return (
    <button
      type="button"
      onClick={onTuneIn}
      className={tuned ? "pmp-tune-key pmp-tune-key--locked" : "pmp-tune-key"}
      style={{
        width: "100%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "13px 16px",
        borderRadius: radio.radiusControl,
        border: tuned
          ? "1px solid rgba(101,230,255,0.45)"
          : "1px solid rgba(255,255,255,0.32)",
        cursor: "pointer",
        fontFamily: fontMono,
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: 1.8,
        textTransform: "uppercase",
        color: tuned ? y2k.cyan : "#0A0C10",
        background: tuned
          ? "linear-gradient(180deg, rgba(101,230,255,0.12) 0%, rgba(255,255,255,0.04) 100%), rgba(8,12,16,0.7)"
          : radio.tuneFace,
        boxShadow: tuned
          ? "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 18px rgba(101,230,255,0.14)"
          : radio.tuneShadow,
        backdropFilter: tuned ? "blur(12px)" : undefined,
        WebkitBackdropFilter: tuned ? "blur(12px)" : undefined,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 10,
          height: 10,
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
  );
}

/**
 * Hero ON AIR — LCD display + chrome control bay (standalone).
 */
export function NowOnAirCard({
  airing = null,
  onTuneIn = null,
  tuned = false,
  bumper = null,
  embedded = false,
}) {
  if (!airing?.show) return null;
  const { show, host, remainingMinutes, progress, nextShow } = airing;
  const prog = programIndex(show.id);

  const body = (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(140px, 0.75fr)",
          gap: 12,
          alignItems: "stretch",
        }}
        className="pmp-tonight-grid"
      >
        {/* LCD DISPLAY */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: radio.radiusLcd,
            border: radio.lcdBorder,
            background: radio.lcdFace,
            boxShadow: radio.lcdShadow,
            padding: "14px 14px 12px",
            minWidth: 0,
          }}
        >
          <Scanlines />
          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <LiveLed size={7} />
              <TechLabel color={chrome.live} style={{ letterSpacing: 1.8 }}>
                On Air
              </TechLabel>
              <TechLabel color="rgba(101,230,255,0.35)">│</TechLabel>
              <TechLabel color={y2k.cyan}>Live</TechLabel>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <TechLabel color="rgba(101,230,255,0.55)">Prog {prog}</TechLabel>
              <SignalBars level={4} />
            </div>
          </div>

          <div style={{ position: "relative", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <HostAvatar host={host} size={52} lcd />
            <div style={{ minWidth: 0, flex: 1 }}>
              <h2
                style={{
                  margin: 0,
                  fontFamily: fontDisplay,
                  fontSize: "clamp(20px, 4vw, 26px)",
                  fontWeight: 700,
                  letterSpacing: 0.6,
                  lineHeight: 1.05,
                  textTransform: "uppercase",
                  color: y2k.cyan,
                  textShadow: `0 0 18px rgba(${chrome.cyanRgb},0.35)`,
                }}
              >
                {show.title}
              </h2>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(201,220,230,0.72)",
                  lineHeight: 1.35,
                }}
              >
                {show.tagline}
              </div>
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                <span
                  style={{
                    fontFamily: fontMono,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    color: y2k.lightMetal,
                  }}
                >
                  {host.name}
                </span>
                <span
                  style={{
                    fontFamily: fontMono,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    color: "rgba(101,230,255,0.55)",
                  }}
                >
                  {host.title}
                </span>
              </div>
            </div>
          </div>

          <div style={{ position: "relative", marginTop: 14 }}>
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
                paddingTop: 10,
                borderTop: "1px solid rgba(101,230,255,0.12)",
                fontSize: 11,
                fontWeight: 500,
                fontStyle: "italic",
                color: "rgba(169,199,210,0.7)",
                lineHeight: 1.4,
              }}
            >
              “{bumper}”
            </div>
          )}
        </div>

        {/* CHROME CONTROL BAY */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 12,
            padding: "12px 12px 12px",
            borderRadius: radio.radiusTight,
            border: radio.borderChrome,
            background: `
              linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 40%, transparent 100%),
              linear-gradient(160deg, rgba(48,54,64,0.55) 0%, rgba(22,26,32,0.65) 100%)
            `,
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.35)",
            backdropFilter: "blur(18px) saturate(1.3)",
            WebkitBackdropFilter: "blur(18px) saturate(1.3)",
            minWidth: 0,
          }}
        >
          <div>
            <TechLabel color={color.muted} style={{ display: "block", marginBottom: 6 }}>
              Remaining
            </TechLabel>
            <div
              style={{
                fontFamily: fontDisplay,
                fontSize: "clamp(22px, 4vw, 28px)",
                fontWeight: 700,
                letterSpacing: 0.4,
                color: y2k.offWhite,
                lineHeight: 1,
              }}
            >
              {formatRemaining(remainingMinutes) || "—"}
            </div>
            <div
              style={{
                marginTop: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <TechLabel color={color.faint}>Signal</TechLabel>
              <SignalBars level={4} />
            </div>
            <div
              style={{
                marginTop: 8,
                fontFamily: fontMono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: color.muted,
              }}
            >
              {show.timeLabel}
            </div>
          </div>

          <TuneInKey tuned={tuned} onTuneIn={onTuneIn} />

          {nextShow && (
            <div
              style={{
                paddingTop: 10,
                borderTop: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <TechLabel color={color.faint} style={{ display: "block", marginBottom: 4 }}>
                Up next
              </TechLabel>
              <div
                style={{
                  fontFamily: fontDisplay,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                  color: color.body,
                  lineHeight: 1.2,
                }}
              >
                {nextShow.shortTitle || nextShow.title}
              </div>
              <div
                style={{
                  marginTop: 3,
                  fontFamily: fontMono,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.6,
                  color: y2k.cyan,
                }}
              >
                {formatShowClock(nextShow.startHour)}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 560px) {
          .pmp-tonight-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );

  if (embedded) {
    return (
      <div aria-label={`Now on air: ${show.title}`} style={{ position: "relative" }}>
        {body}
      </div>
    );
  }

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
          background: radio.glassFaceLive,
          boxShadow: radio.glassShadowLive,
          backdropFilter: radio.glassBlur,
          WebkitBackdropFilter: radio.glassBlur,
          color: color.ink,
          padding: 12,
        }}
      >
        <Scanlines />
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 12,
            paddingBottom: 10,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <TechLabel color={y2k.offWhite} style={{ letterSpacing: 2, fontSize: 11 }}>
            On tonight
          </TechLabel>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <TechLabel color={color.muted}>{STATION_CALLSIGN}</TechLabel>
            <TechLabel color={color.faint}>·</TechLabel>
            <TechLabel color={y2k.techBlue}>{STATION_FREQ} FM</TechLabel>
          </div>
        </div>
        <div style={{ position: "relative" }}>{body}</div>
      </div>
    </section>
  );
}

/**
 * Horizontal day guide — glass program dial strip.
 */
export function ShowGuideRail({
  guide = [],
  activeShowId = null,
  onSelectShow = null,
  /** When true (Home Tonight band), drop nested headers — parent owns the title. */
  embedded = false,
  flush = false,
}) {
  if (!guide.length) return null;

  return (
    <section
      aria-label="Today’s program guide"
      style={{
        padding: embedded || flush ? 0 : "18px 0 8px",
        animation: embedded || flush ? "none" : `rise 0.55s ${motion.ease} 0.04s both`,
      }}
    >
      {!embedded && !flush && (
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

      {(embedded || flush) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: flush ? "0 2px 10px" : `0 ${homeSpace.gutter}px 10px`,
          }}
        >
          <TechLabel color={color.muted} style={{ letterSpacing: 1.8 }}>
            Program dial
          </TechLabel>
          <TechLabel color={color.faint}>
            {guide.length} blocks
          </TechLabel>
        </div>
      )}

      <div
        className="hide-scroll"
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          padding: flush
            ? "0 0 2px"
            : embedded
              ? `0 ${homeSpace.gutter}px 2px`
              : `2px ${homeSpace.gutter}px 12px`,
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {guide.map((show, i) => {
          const live = show.status === "live";
          const tuned = activeShowId === show.id;
          const lit = live || tuned;
          const upNext = show.status === "up-next";
          return (
            <button
              key={show.id}
              type="button"
              onClick={() => onSelectShow?.(show)}
              aria-current={tuned ? "true" : undefined}
              className="pmp-lift pmp-schedule-cell"
              style={{
                flex: "0 0 auto",
                width: 132,
                scrollSnapAlign: "start",
                textAlign: "left",
                padding: "10px 10px 11px",
                borderRadius: radio.radiusTight,
                cursor: "pointer",
                border: lit
                  ? radio.borderLive
                  : upNext
                    ? "1px solid rgba(123,167,255,0.28)"
                    : "1px solid rgba(255,255,255,0.12)",
                background: lit ? radio.stripFaceLive : radio.stripFace,
                boxShadow: lit ? radio.stripShadowLive : radio.stripShadow,
                backdropFilter: "blur(16px) saturate(1.25)",
                WebkitBackdropFilter: "blur(16px) saturate(1.25)",
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
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: 1.1,
                    textTransform: "uppercase",
                    color: live
                      ? chrome.live
                      : tuned
                        ? y2k.cyan
                        : upNext
                          ? y2k.techBlue
                          : color.muted,
                  }}
                >
                  {live && <LiveLed size={5} />}
                  {live
                    ? "Live"
                    : tuned
                      ? "Tuned"
                      : upNext
                        ? "Next"
                        : formatShowClock(show.startHour)}
                </span>
                <TechLabel color={lit ? y2k.cyan : "rgba(255,255,255,0.22)"} style={{ fontSize: 8 }}>
                  {String(i + 1).padStart(2, "0")}
                </TechLabel>
              </div>
              <div
                style={{
                  fontFamily: fontDisplay,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                  color: lit ? y2k.offWhite : color.ink,
                  lineHeight: 1.15,
                  minHeight: 30,
                }}
              >
                {show.shortTitle || show.title}
              </div>
              <div
                style={{
                  marginTop: 8,
                  height: 1,
                  background: lit
                    ? "linear-gradient(90deg, rgba(101,230,255,0.45), transparent)"
                    : "rgba(255,255,255,0.08)",
                }}
              />
              <div
                style={{
                  marginTop: 7,
                  fontFamily: fontMono,
                  fontSize: 9,
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
                  marginTop: 4,
                  fontFamily: fontMono,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: 0.3,
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

/**
 * Unified On Tonight deck — one Y2K glass instrument panel.
 * Header chrome + LCD receiver + program dial in a single chassis.
 */
export function TonightDeck({
  airing = null,
  guide = [],
  bumper = null,
  activeShowId = null,
  tuned = false,
  onTuneIn = null,
  onSelectShow = null,
  showNowPlaying = true,
}) {
  const show = airing?.show || null;
  const prog = show ? programIndex(show.id) : "—";
  const hasGuide = guide.length > 0;
  const hasNow = !!(showNowPlaying && show);

  if (!hasNow && !hasGuide) return null;

  return (
    <section
      aria-label="On tonight"
      style={{
        marginTop: homeSpace.sectionGapFirst,
        padding: `0 ${homeSpace.gutter}px`,
        animation: `rise 0.5s ${motion.ease} 0.04s both`,
      }}
    >
      <div
        className="pmp-radio-module pmp-tonight-deck"
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: radio.radius,
          border: radio.borderLive,
          background: radio.glassFaceLive,
          boxShadow: radio.glassShadowLive,
          backdropFilter: radio.glassBlur,
          WebkitBackdropFilter: radio.glassBlur,
          padding: "12px 12px 12px",
        }}
      >
        <Scanlines />

        {/* Chrome header */}
        <div
          style={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: hasNow || hasGuide ? 12 : 0,
            padding: "2px 2px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: fontDisplay,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                color: y2k.offWhite,
                lineHeight: 1.1,
              }}
            >
              On tonight
            </div>
            {show?.tagline && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  color: color.muted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 280,
                }}
              >
                {show.tagline}
              </div>
            )}
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: radio.radiusLcd,
              background: "rgba(6,10,14,0.55)",
              border: "1px solid rgba(101,230,255,0.18)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              flexWrap: "wrap",
            }}
          >
            <TechLabel color={y2k.lightMetal}>{STATION_CALLSIGN}</TechLabel>
            <TechLabel color="rgba(101,230,255,0.3)">·</TechLabel>
            <TechLabel color={y2k.cyan}>{STATION_FREQ} FM</TechLabel>
            <TechLabel color="rgba(101,230,255,0.3)">·</TechLabel>
            <TechLabel color={y2k.techBlue}>Prog {prog}</TechLabel>
          </div>
        </div>

        {hasNow && (
          <div style={{ position: "relative", marginBottom: hasGuide ? 14 : 0 }}>
            <NowOnAirCard
              airing={airing}
              bumper={bumper}
              tuned={tuned}
              onTuneIn={onTuneIn}
              embedded
            />
          </div>
        )}

        {hasGuide && (
          <div
            style={{
              position: "relative",
              paddingTop: hasNow ? 12 : 0,
              borderTop: hasNow ? "1px solid rgba(255,255,255,0.08)" : "none",
              margin: hasNow ? "0 -2px" : 0,
            }}
          >
            <ShowGuideRail
              guide={guide}
              activeShowId={activeShowId}
              onSelectShow={onSelectShow}
              flush
            />
          </div>
        )}
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
