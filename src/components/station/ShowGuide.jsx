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

function Scanlines({ opacity = 0.05 }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity,
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

/** Full-bleed LCD tuner — frequency-scale timeline. */
function BroadcastTimeline({ progress = 0, startLabel, endLabel }) {
  const pct = Math.min(100, Math.max(0, Math.round((progress || 0) * 100)));
  const ticks = [0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];

  return (
    <div style={{ position: "relative" }} aria-hidden="true">
      <div style={{ position: "relative", height: 28, display: "flex", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
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
                height: t % 25 === 0 ? 8 : 4,
                background: t <= pct
                  ? "rgba(101,230,255,0.7)"
                  : "rgba(255,255,255,0.14)",
              }}
            />
          ))}
        </div>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 4,
            marginTop: 10,
            borderRadius: 2,
            background: "rgba(101,230,255,0.08)",
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
              left: `calc(${pct}% - 6px)`,
              top: "50%",
              width: 12,
              height: 12,
              marginTop: -6,
              borderRadius: "50%",
              background: y2k.lightMetal,
              border: `1.5px solid ${y2k.cyan}`,
              boxShadow: `0 0 14px rgba(${chrome.cyanRgb},0.7), inset 0 1px 0 rgba(255,255,255,0.75)`,
              transition: "left 1s linear",
            }}
          />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
        <TechLabel color={y2k.cyan}>{startLabel}</TechLabel>
        <TechLabel color="rgba(101,230,255,0.4)">{endLabel}</TechLabel>
      </div>
    </div>
  );
}

function TuneInKey({ tuned, onTuneIn, compact = false }) {
  return (
    <button
      type="button"
      onClick={onTuneIn}
      className={tuned ? "pmp-tune-key pmp-tune-key--locked" : "pmp-tune-key"}
      style={{
        width: compact ? "auto" : "100%",
        minWidth: compact ? 132 : undefined,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: compact ? "12px 18px" : "14px 18px",
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
        flexShrink: 0,
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
 * Flat on-air stage — one composition, no nested glass cards.
 * Massive title + compact tune key + full-bleed tuner.
 */
function OnAirStage({
  airing,
  bumper = null,
  tuned = false,
  onTuneIn = null,
}) {
  if (!airing?.show) return null;
  const { show, host, remainingMinutes, progress, nextShow } = airing;
  const prog = programIndex(show.id);

  return (
    <div
      aria-label={`Now on air: ${show.title}`}
      className="pmp-onair-stage"
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* Ghost monogram watermark — artistic anchor */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: -8,
          top: "50%",
          transform: "translateY(-52%)",
          fontFamily: fontDisplay,
          fontSize: "clamp(96px, 28vw, 160px)",
          fontWeight: 800,
          letterSpacing: -6,
          lineHeight: 1,
          color: "transparent",
          WebkitTextStroke: "1px rgba(101,230,255,0.1)",
          opacity: 0.9,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {host?.monogram || "PM"}
      </div>

      {/* Meta strip */}
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <LiveLed size={8} />
          <TechLabel color={chrome.live} style={{ letterSpacing: 2 }}>
            On air
          </TechLabel>
          <span
            aria-hidden="true"
            style={{
              width: 1,
              height: 10,
              background: "rgba(255,255,255,0.16)",
            }}
          />
          <TechLabel color={y2k.cyan}>Live</TechLabel>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <TechLabel color={color.muted}>{STATION_CALLSIGN}</TechLabel>
          <TechLabel color="rgba(101,230,255,0.28)">·</TechLabel>
          <TechLabel color={y2k.cyan}>{STATION_FREQ} FM</TechLabel>
          <TechLabel color="rgba(101,230,255,0.28)">·</TechLabel>
          <TechLabel color={y2k.techBlue}>Prog {prog}</TechLabel>
          <SignalBars level={4} />
        </div>
      </div>

      {/* Hero: title stack + tune key */}
      <div
        className="pmp-onair-hero"
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: onTuneIn ? "minmax(0, 1fr) auto" : "1fr",
          gap: "16px 20px",
          alignItems: "end",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: fontDisplay,
              fontSize: "clamp(32px, 9vw, 52px)",
              fontWeight: 800,
              letterSpacing: -1.4,
              lineHeight: 0.92,
              textTransform: "uppercase",
              color: y2k.offWhite,
              textShadow: `0 0 48px rgba(${chrome.cyanRgb},0.18)`,
            }}
          >
            {show.title}
          </h2>
          {show.tagline && (
            <p
              style={{
                margin: "12px 0 0",
                fontSize: 15,
                fontWeight: 500,
                color: color.body,
                lineHeight: 1.4,
                maxWidth: 420,
              }}
            >
              {show.tagline}
            </p>
          )}
          <div
            style={{
              marginTop: 14,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "6px 14px",
            }}
          >
            <span
              style={{
                fontFamily: fontMono,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: y2k.cyan,
              }}
            >
              {host?.name}
            </span>
            {host?.title && (
              <span
                style={{
                  fontFamily: fontMono,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  color: color.muted,
                }}
              >
                {host.title}
              </span>
            )}
          </div>
        </div>

        {onTuneIn && (
          <div style={{ justifySelf: "end", alignSelf: "end" }}>
            <TuneInKey tuned={tuned} onTuneIn={onTuneIn} compact />
          </div>
        )}
      </div>

      {/* Tuner */}
      <div style={{ position: "relative", marginTop: 22 }}>
        <BroadcastTimeline
          progress={progress}
          startLabel={formatShowClock(show.startHour)}
          endLabel={formatShowClock(show.endHour === 24 ? 0 : show.endHour)}
        />
      </div>

      {/* Status line — remaining + up next + bumper in one quiet row */}
      <div
        style={{
          position: "relative",
          marginTop: 14,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          gap: "8px 18px",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 8 }}>
          <TechLabel color={color.faint}>Left</TechLabel>
          <span
            style={{
              fontFamily: fontDisplay,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 0.3,
              color: y2k.offWhite,
            }}
          >
            {formatRemaining(remainingMinutes) || "—"}
          </span>
        </div>

        {nextShow && (
          <div style={{ display: "inline-flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
            <TechLabel color={color.faint}>Up next</TechLabel>
            <span
              style={{
                fontFamily: fontDisplay,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 0.4,
                textTransform: "uppercase",
                color: color.body,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {nextShow.shortTitle || nextShow.title}
            </span>
            <span
              style={{
                fontFamily: fontMono,
                fontSize: 11,
                fontWeight: 700,
                color: y2k.cyan,
              }}
            >
              {formatShowClock(nextShow.startHour)}
            </span>
          </div>
        )}

        {bumper && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              fontStyle: "italic",
              color: "rgba(169,199,210,0.55)",
              lineHeight: 1.35,
              maxWidth: "100%",
            }}
          >
            “{bumper}”
          </span>
        )}
      </div>

      <style>{`
        @media (max-width: 560px) {
          .pmp-onair-hero {
            grid-template-columns: 1fr !important;
          }
          .pmp-onair-hero .pmp-tune-key {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Hero ON AIR — standalone stage wrapper (legacy export).
 */
export function NowOnAirCard({
  airing = null,
  onTuneIn = null,
  tuned = false,
  bumper = null,
  embedded = false,
}) {
  if (!airing?.show) return null;

  const stage = (
    <OnAirStage
      airing={airing}
      bumper={bumper}
      tuned={tuned}
      onTuneIn={onTuneIn}
    />
  );

  if (embedded) {
    return <div style={{ position: "relative" }}>{stage}</div>;
  }

  return (
    <section
      aria-label={`Now on air: ${airing.show.title}`}
      style={{
        margin: 0,
        padding: `0 ${homeSpace.gutter}px`,
        animation: `rise 0.5s ${motion.ease} both`,
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "20px 0 8px",
          borderTop: "1px solid rgba(101,230,255,0.16)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: `
            radial-gradient(ellipse 80% 90% at 0% 0%, rgba(${chrome.cyanRgb},0.1) 0%, transparent 55%),
            radial-gradient(ellipse 50% 70% at 100% 100%, rgba(123,167,255,0.05) 0%, transparent 50%)
          `,
        }}
      >
        <Scanlines opacity={0.04} />
        <div style={{ position: "relative" }}>{stage}</div>
      </div>
    </section>
  );
}

/**
 * Continuous program dial — one LCD trough, hairline cells (not mini-cards).
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
      )}

      <div
        style={{
          position: "relative",
          margin: flush ? 0 : embedded ? `0 ${homeSpace.gutter}px` : `0 ${homeSpace.gutter}px`,
          borderRadius: flush ? 0 : radio.radiusLcd,
          border: flush ? "none" : radio.lcdBorder,
          background: flush
            ? "transparent"
            : `
              linear-gradient(180deg, rgba(101,230,255,0.04) 0%, transparent 40%),
              linear-gradient(160deg, #0A1016 0%, #06090E 55%, #04060A 100%)
            `,
          boxShadow: flush ? "none" : radio.lcdShadow,
          overflow: "hidden",
        }}
      >
        {(embedded || flush) && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 0 10px",
            }}
          >
            <TechLabel color={color.muted} style={{ letterSpacing: 1.8 }}>
              Day dial
            </TechLabel>
            <TechLabel color={color.faint}>
              {guide.length} blocks
            </TechLabel>
          </div>
        )}

        <div
          className="hide-scroll pmp-day-dial"
          style={{
            display: "flex",
            gap: 0,
            overflowX: "auto",
            padding: flush ? "0 0 2px" : "2px 0 4px",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            borderTop: "1px solid rgba(101,230,255,0.12)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: `
              linear-gradient(180deg, rgba(101,230,255,0.05) 0%, transparent 50%),
              rgba(6,10,14,0.72)
            `,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -1px 0 rgba(0,0,0,0.4)",
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
                className="pmp-dial-cell"
                style={{
                  flex: lit ? "0 0 168px" : "0 0 108px",
                  scrollSnapAlign: "start",
                  textAlign: "left",
                  padding: "12px 12px 14px",
                  margin: 0,
                  borderRadius: 0,
                  cursor: "pointer",
                  border: "none",
                  borderRight: "1px solid rgba(255,255,255,0.06)",
                  borderLeft: lit
                    ? `2px solid ${live ? chrome.live : y2k.cyan}`
                    : "2px solid transparent",
                  background: lit
                    ? `
                      linear-gradient(180deg, rgba(101,230,255,0.12) 0%, rgba(101,230,255,0.02) 100%),
                      rgba(12,18,24,0.9)
                    `
                    : upNext
                      ? "rgba(123,167,255,0.04)"
                      : "transparent",
                  boxShadow: lit
                    ? `inset 0 0 24px rgba(${chrome.cyanRgb},0.06)`
                    : "none",
                  transition: `flex-basis ${motion.settle} ${motion.ease}, background ${motion.base}, border-color ${motion.base}`,
                  WebkitTapHighlightColor: "transparent",
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
                  <TechLabel
                    color={lit ? y2k.cyan : "rgba(255,255,255,0.18)"}
                    style={{ fontSize: 8 }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </TechLabel>
                </div>
                <div
                  style={{
                    fontFamily: fontDisplay,
                    fontSize: lit ? 14 : 12,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                    color: lit ? y2k.offWhite : color.body,
                    lineHeight: 1.15,
                    minHeight: 28,
                  }}
                >
                  {show.shortTitle || show.title}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontFamily: fontMono,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    color: lit ? "rgba(101,230,255,0.65)" : color.faint,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {show.host?.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * On Tonight — flat broadcast stage + continuous day dial.
 * One atmospheric band (not a nested glass card stack).
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
  const hasGuide = guide.length > 0;
  const hasNow = !!(showNowPlaying && show);

  if (!hasNow && !hasGuide) return null;

  return (
    <section
      aria-label="On tonight"
      className="pmp-tonight-stage"
      style={{
        marginTop: homeSpace.sectionGapFirst,
        padding: 0,
        animation: `rise 0.55s ${motion.ease} 0.04s both`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Full-bleed atmosphere — no chassis card */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse 95% 70% at 8% -10%, rgba(${chrome.cyanRgb},0.16) 0%, transparent 52%),
            radial-gradient(ellipse 60% 50% at 100% 30%, rgba(123,167,255,0.07) 0%, transparent 48%),
            linear-gradient(180deg, rgba(14,18,24,0.9) 0%, rgba(8,10,13,0.35) 55%, transparent 100%)
          `,
        }}
      />
      <Scanlines opacity={0.035} />

      {/* Section identity — brand-weight, not a card header */}
      <div
        style={{
          position: "relative",
          padding: `4px ${homeSpace.gutter}px 0`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            paddingBottom: 16,
            borderBottom: `1px solid rgba(${chrome.cyanRgb},0.2)`,
            boxShadow: `0 1px 0 rgba(0,0,0,0.35)`,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: fontDisplay,
              fontSize: "clamp(28px, 7vw, 40px)",
              fontWeight: 800,
              letterSpacing: -1,
              textTransform: "uppercase",
              color: y2k.offWhite,
              lineHeight: 0.95,
            }}
          >
            On tonight
          </h2>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <TechLabel color={color.muted}>{STATION_CALLSIGN}</TechLabel>
            <TechLabel color="rgba(101,230,255,0.3)">·</TechLabel>
            <TechLabel color={y2k.cyan}>{STATION_FREQ} FM</TechLabel>
          </div>
        </div>
      </div>

      {hasNow && (
        <div
          style={{
            position: "relative",
            padding: `22px ${homeSpace.gutter}px ${hasGuide ? 8 : 20}px`,
          }}
        >
          <OnAirStage
            airing={airing}
            bumper={bumper}
            tuned={tuned}
            onTuneIn={onTuneIn}
          />
        </div>
      )}

      {hasGuide && (
        <div
          style={{
            position: "relative",
            padding: `${hasNow ? 12 : 18}px ${homeSpace.gutter}px 20px`,
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
