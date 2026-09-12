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
import HomeBandHeader from "../home/HomeBandHeader";

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

/** Slim tuner — ticks + needle, no LCD chassis. */
function BroadcastTimeline({ progress = 0, startLabel, endLabel }) {
  const pct = Math.min(100, Math.max(0, Math.round((progress || 0) * 100)));
  const ticks = [0, 25, 50, 75, 100];

  return (
    <div style={{ position: "relative" }} aria-hidden="true">
      <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
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
                height: t === 0 || t === 100 || t === 50 ? 7 : 4,
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
            height: 3,
            marginTop: 8,
            borderRadius: 2,
            background: "rgba(255,255,255,0.08)",
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
              boxShadow: `0 0 12px rgba(${chrome.cyanRgb},0.65)`,
              transition: "left 1s linear",
            }}
          />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
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
        minWidth: compact ? 120 : undefined,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: compact ? "11px 16px" : "13px 16px",
        borderRadius: radio.radiusControl,
        border: tuned
          ? "1px solid rgba(101,230,255,0.45)"
          : "1px solid rgba(255,255,255,0.32)",
        cursor: "pointer",
        fontFamily: fontMono,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        color: tuned ? y2k.cyan : "#0A0C10",
        background: tuned
          ? "linear-gradient(180deg, rgba(101,230,255,0.12) 0%, rgba(255,255,255,0.04) 100%), rgba(8,12,16,0.7)"
          : radio.tuneFace,
        boxShadow: tuned
          ? "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 18px rgba(101,230,255,0.14)"
          : radio.tuneShadow,
        flexShrink: 0,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
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
 * On-air EPG block — title / tune / timeline only.
 * All content flush to homeSpace.gutter (parent pads).
 */
function OnAirStage({
  airing,
  bumper = null,
  tuned = false,
  onTuneIn = null,
}) {
  if (!airing?.show) return null;
  const { show, host, remainingMinutes, progress, nextShow } = airing;

  return (
    <div
      aria-label={`Now on air: ${show.title}`}
      className="pmp-onair-stage"
      style={{ position: "relative" }}
    >
      {/* Live line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <LiveLed size={7} />
        <TechLabel color={chrome.live} style={{ letterSpacing: 1.8 }}>
          On air
        </TechLabel>
        <span aria-hidden="true" style={{ color: "rgba(255,255,255,0.16)" }}>·</span>
        <TechLabel color={color.muted}>
          Prog {programIndex(show.id)}
        </TechLabel>
        <span aria-hidden="true" style={{ color: "rgba(255,255,255,0.16)" }}>·</span>
        <TechLabel color={color.faint}>
          {show.timeLabel}
        </TechLabel>
      </div>

      {/* Title + tune */}
      <div
        className="pmp-onair-hero"
        style={{
          display: "grid",
          gridTemplateColumns: onTuneIn ? "minmax(0, 1fr) auto" : "1fr",
          gap: "14px 16px",
          alignItems: "start",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontFamily: fontDisplay,
              fontSize: "clamp(26px, 7vw, 40px)",
              fontWeight: 800,
              letterSpacing: -1,
              lineHeight: 0.95,
              textTransform: "uppercase",
              color: y2k.offWhite,
            }}
          >
            {show.title}
          </h3>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 14,
              fontWeight: 500,
              color: color.body,
              lineHeight: 1.4,
            }}
          >
            {show.tagline}
            {host?.name ? (
              <span style={{ color: color.muted }}>
                {" · "}
                <span style={{ color: y2k.cyan, fontFamily: fontMono, fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>
                  {host.name}
                </span>
              </span>
            ) : null}
          </p>
        </div>

        {onTuneIn && (
          <div style={{ justifySelf: "end" }}>
            <TuneInKey tuned={tuned} onTuneIn={onTuneIn} compact />
          </div>
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        <BroadcastTimeline
          progress={progress}
          startLabel={formatShowClock(show.startHour)}
          endLabel={formatShowClock(show.endHour === 24 ? 0 : show.endHour)}
        />
      </div>

      {/* One status line */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          gap: "6px 16px",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8 }}>
          <TechLabel color={color.faint}>Left</TechLabel>
          <span style={{
            fontFamily: fontDisplay,
            fontSize: 16,
            fontWeight: 700,
            color: y2k.offWhite,
          }}>
            {formatRemaining(remainingMinutes) || "—"}
          </span>
        </span>

        {nextShow && (
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
            <TechLabel color={color.faint}>Up next</TechLabel>
            <span style={{
              fontFamily: fontDisplay,
              fontSize: 13,
              fontWeight: 650,
              letterSpacing: 0.2,
              textTransform: "uppercase",
              color: color.body,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {nextShow.shortTitle || nextShow.title}
            </span>
            <span style={{
              fontFamily: fontMono,
              fontSize: 11,
              fontWeight: 700,
              color: y2k.cyan,
            }}>
              {formatShowClock(nextShow.startHour)}
            </span>
          </span>
        )}

        {bumper && (
          <span style={{
            fontSize: 12,
            fontStyle: "italic",
            color: "rgba(169,199,210,0.5)",
            lineHeight: 1.35,
          }}>
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
 * Hero ON AIR — standalone (legacy export).
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
        padding: `18px ${homeSpace.gutter}px`,
        animation: `rise 0.5s ${motion.ease} both`,
      }}
    >
      {stage}
    </section>
  );
}

/**
 * Day dial — continuous schedule scale.
 * Rail pads with homeSpace.gutter so first label shares the title edge.
 * Cells are ticks, not mini-cards (no fills / no nested chassis).
 */
export function ShowGuideRail({
  guide = [],
  activeShowId = null,
  onSelectShow = null,
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
        <HomeBandHeader title="Program guide" />
      )}

      {(embedded || flush) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: `0 ${homeSpace.gutter}px`,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontFamily: fontDisplay,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: -0.1,
              color: color.muted,
            }}
          >
            Today
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: -0.08,
              color: color.faint,
            }}
          >
            {guide.length} blocks
          </span>
        </div>
      )}

      <div
        className="hide-scroll pmp-day-dial"
        style={{
          display: "flex",
          gap: 0,
          overflowX: "auto",
          padding: `0 ${homeSpace.gutter}px 2px`,
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {guide.map((show, i) => {
          const live = show.status === "live";
          const tuned = activeShowId === show.id;
          const lit = live || tuned;
          const upNext = show.status === "up-next";
          const isFirst = i === 0;
          return (
            <button
              key={show.id}
              type="button"
              onClick={() => onSelectShow?.(show)}
              aria-current={tuned ? "true" : undefined}
              className="pmp-dial-cell"
              style={{
                flex: lit ? "0 0 148px" : "0 0 104px",
                scrollSnapAlign: "start",
                textAlign: "left",
                /* First cell: no extra left pad — rail gutter is the left edge */
                padding: isFirst ? "12px 14px 14px 0" : "12px 14px",
                margin: 0,
                borderRadius: 0,
                cursor: "pointer",
                border: "none",
                borderRight: "1px solid rgba(255,255,255,0.06)",
                background: "transparent",
                boxShadow: "none",
                position: "relative",
                WebkitTapHighlightColor: "transparent",
                transition: `flex-basis ${motion.settle} ${motion.ease}, color ${motion.fast}`,
              }}
            >
              {/* Active underline — not a card fill */}
              {lit && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: isFirst ? 0 : 0,
                    right: 0,
                    bottom: 0,
                    height: 2,
                    background: live ? chrome.live : y2k.cyan,
                    boxShadow: live
                      ? `0 0 10px rgba(${chrome.liveRgb},0.45)`
                      : `0 0 10px rgba(${chrome.cyanRgb},0.35)`,
                  }}
                />
              )}

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
              </div>
              <div
                style={{
                  fontFamily: fontDisplay,
                  fontSize: lit ? 13 : 12,
                  fontWeight: 700,
                  letterSpacing: 0.2,
                  textTransform: "uppercase",
                  color: lit ? y2k.offWhite : color.body,
                  lineHeight: 1.2,
                  minHeight: 28,
                }}
              >
                {show.shortTitle || show.title}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontFamily: fontMono,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 0.7,
                  textTransform: "uppercase",
                  color: lit ? "rgba(101,230,255,0.7)" : color.faint,
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
    </section>
  );
}

/**
 * On Tonight — single EPG band.
 * Shared HomeBandHeader left edge. No chassis card. No nested panels.
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
  first = false,
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
        marginTop: first ? homeSpace.sectionGapFirst : homeSpace.sectionGap,
        padding: 0,
        animation: `rise 0.5s ${motion.ease} 0.05s both`,
        position: "relative",
      }}
    >
      <HomeBandHeader
        title="On Tonight"
        subtitle={show?.tagline || "Tonight’s programmed blocks"}
        meta={`${STATION_CALLSIGN} · ${STATION_FREQ}`}
      />

      {hasNow && (
        <div
          style={{
            padding: `0 ${homeSpace.gutter}px`,
            marginBottom: hasGuide ? 18 : 0,
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
        <ShowGuideRail
          guide={guide}
          activeShowId={activeShowId}
          onSelectShow={onSelectShow}
          flush
        />
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
