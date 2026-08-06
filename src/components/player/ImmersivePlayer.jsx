/**
 * ImmersivePlayer — premium Y2K listening booth.
 * Platinum glass, brushed aluminum transport, jewel-case sleeve.
 * Station TV chrome (dark lower-thirds / emoji heat) stays on Cover Stage;
 * here the hierarchy is sleeve → title → transport deck.
 */
import { useEffect, useRef, useState } from "react";
import {
  fontDisplay, fontMono, color, radius, motion, glass, artShadow, aluminumGradient,
} from "../../theme";
import { fmtTime, hexToRgbStr } from "../../lib/harmony";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { EnergyShiftFeedback, EnergyShiftControl } from "../listen/EnergyShiftButton";
import {
  DedicationFlash,
  HypnoVisualizer,
  StationTicker,
  UpNextBumper,
} from "../station/StationChrome";
import VideoStage, { VideoBadge } from "../station/VideoStage";
import { HostCreditChip } from "../station/ShowGuide";
import SceneSurfRail from "../station/SceneSurfRail";
import { trackHasVideo } from "../../lib/video";
import { estimateLockedIn } from "../../lib/station";

const EASE = motion.ease;

function ChromeIconButton({
  onClick,
  label,
  pressed = false,
  active = false,
  children,
  size = 44,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed || undefined}
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: active ? color.ink : color.muted,
        background: active
          ? "linear-gradient(165deg, rgba(56,62,72,0.95) 0%, rgba(25,28,34,0.88) 100%)"
          : "linear-gradient(165deg, rgba(38,43,51,0.82) 0%, rgba(28,32,38,0.55) 100%)",
        border: `1px solid ${active ? glass.border : glass.borderSoft}`,
        boxShadow: active
          ? `inset 0 1px 0 ${glass.highlight}, inset 0 -1px 0 rgba(22,24,30,0.06), 0 4px 12px rgba(22,24,30,0.08)`
          : `inset 0 1px 0 ${glass.highlight}, 0 2px 8px rgba(22,24,30,0.05)`,
        backdropFilter: glass.blurSoft,
        WebkitBackdropFilter: glass.blurSoft,
        transition: `transform ${motion.fast} ${EASE}, color ${motion.fast}, box-shadow ${motion.base}`,
        padding: 0,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

/** Inset aluminum seek groove with chrome thumb. */
function ChromeSeek({
  value = 0,
  max = 1,
  onChange,
  label = "Seek",
  valueText,
}) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) * 100 : 0;
  return (
    <div style={{ width: "100%", position: "relative" }}>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height: 6,
          marginTop: -3,
          borderRadius: 999,
          background: `
            linear-gradient(180deg, rgba(22,24,30,0.14) 0%, rgba(32,36,43,0.65) 100%)
          `,
          boxShadow: "inset 0 1px 2px rgba(22,24,30,0.18), inset 0 -1px 0 rgba(36,40,48,0.75)",
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: 999,
          background: `
            linear-gradient(180deg, #EDF0F4 0%, #B9C1CC 55%, #D3D9E1 100%)
          `,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)",
          transition: "width 0.08s linear",
        }} />
      </div>
      <input
        type="range"
        className="chrome-seek"
        min={0}
        max={max || 1}
        step={0.1}
        value={value}
        onChange={(e) => onChange?.(parseFloat(e.target.value))}
        aria-label={label}
        aria-valuetext={valueText}
        style={{
          position: "relative",
          width: "100%",
          margin: 0,
          height: 28,
          background: "transparent",
          cursor: "pointer",
          zIndex: 1,
        }}
      />
    </div>
  );
}

function MetaChip({ children }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "5px 9px",
      borderRadius: 8,
      fontSize: 11,
      fontWeight: 650,
      letterSpacing: 0.6,
      fontFamily: fontMono,
      fontVariantNumeric: "tabular-nums",
      color: color.body,
      background: "rgba(32,36,43,0.65)",
      border: `1px solid ${glass.borderSoft}`,
      boxShadow: `inset 0 1px 0 ${glass.highlight}`,
    }}>
      {children}
    </span>
  );
}

function PlayerOnAir({ showTitle = null, daypartLabel = null }) {
  const secondary = showTitle || daypartLabel;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        maxWidth: 200,
        padding: "7px 12px",
        borderRadius: 980,
        background: glass.chrome,
        border: `1px solid ${glass.border}`,
        boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
        pointerEvents: "none",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "#E23B4C",
          boxShadow: "0 0 0 3px rgba(226,59,76,0.2)",
          animation: "stageLiveDot 1.5s ease-in-out infinite",
          flexShrink: 0,
        }}
      />
      <span style={{
        fontFamily: fontMono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        color: color.ink,
        flexShrink: 0,
      }}>
        On Air
      </span>
      {secondary && (
        <span style={{
          fontFamily: fontMono,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 0.4,
          color: color.muted,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {secondary}
        </span>
      )}
    </div>
  );
}

/** Quiet booth strip — locked-in count + request/dedicate as chrome chips. */
function BoothStrip({
  track,
  onRequest = null,
  requested = false,
  onDedicate = null,
}) {
  const [lockedIn, setLockedIn] = useState(() => estimateLockedIn(track));
  useEffect(() => {
    setLockedIn(estimateLockedIn(track));
    const id = setInterval(() => setLockedIn(estimateLockedIn(track, new Date())), 20000);
    return () => clearInterval(id);
  }, [track?.id, track?.playCount, track?.likeCount, track?.requestCount]);

  if (!onRequest && !onDedicate) return null;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      width: "100%",
      maxWidth: 400,
      padding: "8px 4px",
    }}>
      <div style={{
        fontFamily: fontMono,
        fontSize: 10,
        fontWeight: 650,
        letterSpacing: 1.1,
        textTransform: "uppercase",
        color: color.muted,
      }}>
        <span style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color.accent,
          marginRight: 8,
          verticalAlign: "middle",
          opacity: 0.7,
        }} />
        {lockedIn} locked in
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {onRequest && (
          <button
            type="button"
            onClick={onRequest}
            disabled={requested}
            style={{
              padding: "7px 12px",
              borderRadius: 980,
              fontSize: 11,
              fontWeight: 650,
              fontFamily: fontMono,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              cursor: requested ? "default" : "pointer",
              color: requested ? color.faint : color.ink,
              background: requested ? "rgba(27,31,37,0.5)" : glass.fillStrong,
              border: `1px solid ${glass.borderSoft}`,
              boxShadow: `inset 0 1px 0 ${glass.highlight}`,
            }}
          >
            {requested ? "Requested" : "Request"}
          </button>
        )}
        {onDedicate && (
          <button
            type="button"
            onClick={onDedicate}
            style={{
              padding: "7px 12px",
              borderRadius: 980,
              fontSize: 11,
              fontWeight: 650,
              fontFamily: fontMono,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              cursor: "pointer",
              color: color.ink,
              background: glass.fillStrong,
              border: `1px solid ${glass.borderSoft}`,
              boxShadow: `inset 0 1px 0 ${glass.highlight}`,
            }}
          >
            Dedicate
          </button>
        )}
      </div>
    </div>
  );
}

const menuItemStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  textAlign: "left",
  padding: "13px 16px",
  background: "none",
  border: "none",
  color: color.ink,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  letterSpacing: -0.15,
};

export default function ImmersivePlayer({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onSkip,
  onPrev,
  onClose,
  signalState,
  onSeek,
  onLike,
  volume = 1,
  onVolumeChange,
  onHypno,
  onHypnoRadio,
  onShowQueue,
  sessionArc = null,
  isRadioMode = false,
  hypnoPocket = false,
  roomLabel = null,
  onOpenRoom,
  onOpenLiner,
  onOpenArtist,
  shuffle = false,
  onToggleShuffle,
  repeat = "off",
  onCycleRepeat,
  crossfadeOn = true,
  onToggleCrossfade,
  upNextTrack = null,
  countdownRank = null,
  daypart = null,
  tickerText = "",
  onRequest = null,
  requested = false,
  onDedicate = null,
  dedicationFlash = null,
  onClearDedication = null,
  liveShow = null,
  tracks = [],
  sceneChannelsActiveId = null,
  onTuneSceneChannel = null,
  Icon,
  IceOrbPlay,
}) {
  const { progress, duration } = usePlayerPlayback();
  const [artLoaded, setArtLoaded] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef(null);
  const hasVideo = trackHasVideo(currentTrack);

  useEffect(() => {
    setShowMore(false);
    setArtLoaded(false);
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!showMore) return undefined;
    const onDoc = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setShowMore(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [showMore]);

  if (!currentTrack) return null;

  const rgb = hexToRgbStr(currentTrack.color);
  const metaBits = [
    currentTrack.bpm ? `${Math.round(currentTrack.bpm)} BPM` : null,
    currentTrack.camelot || null,
    currentTrack.energy != null ? `E${currentTrack.energy}` : null,
    countdownRank ? `#${countdownRank}` : null,
  ].filter(Boolean);

  const circleChrome = {
    width: 42,
    height: 42,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: glass.chrome,
    border: `1px solid ${glass.border}`,
    boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
    backdropFilter: glass.blurSoft,
    WebkitBackdropFilter: glass.blurSoft,
    color: color.ink,
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        overflow: "hidden",
        background: color.canvas,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Atmosphere — aluminum + sleeve bloom */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: aluminumGradient() }} />
      {currentTrack.albumCover && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: "-8%",
            backgroundImage: `url(${currentTrack.albumCover})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(42px) saturate(1.15)",
            opacity: artLoaded ? 0.42 : 0.12,
            transform: isPlaying ? "scale(1.06)" : "scale(1.02)",
            transition: "opacity 0.8s ease, transform 10s ease",
          }}
        />
      )}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 55% at 50% 18%, rgba(${rgb},0.16) 0%, transparent 58%),
            linear-gradient(180deg,
              rgba(226,230,237,0.55) 0%,
              rgba(226,230,237,0.12) 32%,
              rgba(226,230,237,0.08) 52%,
              rgba(226,230,237,0.72) 78%,
              rgba(214,219,228,0.96) 100%
            )
          `,
        }}
      />
      {/* Specular top sheen */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 120,
          background: "linear-gradient(180deg, rgba(32,36,43,0.65) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {!hasVideo && (
        <HypnoVisualizer playing={isPlaying} colorHex={rgb} />
      )}
      {hasVideo && (
        <VideoStage track={currentTrack} playing={isPlaying} progress={progress} dim={false} />
      )}

      {/* Top chrome */}
      <div style={{
        position: "relative",
        zIndex: 3,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "calc(12px + env(safe-area-inset-top, 0px)) 18px 0",
        flexShrink: 0,
        gap: 12,
      }}>
        <button type="button" onClick={onClose} aria-label="Close player" style={circleChrome}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <PlayerOnAir
          showTitle={liveShow ? (liveShow.shortTitle || liveShow.title) : null}
          daypartLabel={daypart?.label}
        />

        <div ref={moreRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowMore((m) => !m)}
            aria-label="More"
            aria-expanded={showMore}
            style={circleChrome}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="6" cy="12" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="18" cy="12" r="1.6" />
            </svg>
          </button>
          {showMore && (
            <div
              style={{
                position: "absolute",
                top: "112%",
                right: 0,
                minWidth: 200,
                background: "rgba(56,62,72,0.94)",
                border: `1px solid ${glass.border}`,
                borderRadius: radius.lg,
                padding: "6px 0",
                zIndex: 8,
                boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 18px 48px rgba(22,24,30,0.16)`,
                backdropFilter: glass.blur,
                WebkitBackdropFilter: glass.blur,
                animation: `rise 0.22s ${EASE} both`,
              }}
            >
              {onOpenLiner && (
                <button type="button" onClick={() => { setShowMore(false); onOpenLiner(currentTrack); }} style={menuItemStyle}>
                  Liner notes
                </button>
              )}
              {onHypno && (
                <button type="button" onClick={() => { setShowMore(false); onHypno(currentTrack); }} style={menuItemStyle}>
                  Near this
                </button>
              )}
              {onHypnoRadio && (
                <button type="button" onClick={() => { setShowMore(false); onHypnoRadio(currentTrack); }} style={menuItemStyle}>
                  <span>Near this radio</span>
                  <span style={{ color: hypnoPocket ? color.accent : color.faint, fontSize: 12 }}>
                    {hypnoPocket ? "On" : "Off"}
                  </span>
                </button>
              )}
              {roomLabel && (
                <button type="button" onClick={() => { setShowMore(false); onOpenRoom?.(); }} style={menuItemStyle}>
                  Playing in {roomLabel}
                </button>
              )}
              <div style={{ height: 1, background: glass.borderSoft, margin: "4px 10px" }} />
              {onToggleCrossfade && (
                <button
                  type="button"
                  onClick={() => onToggleCrossfade()}
                  role="switch"
                  aria-checked={crossfadeOn}
                  style={menuItemStyle}
                >
                  <span>Crossfade</span>
                  <span aria-hidden="true" style={{
                    width: 36,
                    height: 22,
                    borderRadius: 11,
                    flexShrink: 0,
                    position: "relative",
                    background: crossfadeOn ? color.accent : "rgba(26,29,36,0.14)",
                    transition: `background ${motion.base} ${EASE}`,
                  }}>
                    <span style={{
                      position: "absolute",
                      top: 2,
                      left: crossfadeOn ? 16 : 2,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: crossfadeOn ? color.onAccent : color.surfaceSolid,
                      boxShadow: "0 1px 3px rgba(26,29,36,0.25)",
                      transition: `left ${motion.base} ${EASE}`,
                    }} />
                  </span>
                </button>
              )}
              <div style={{ padding: "10px 16px 14px" }}>
                <div style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1.3,
                  color: color.muted,
                  fontFamily: fontMono,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}>
                  Volume
                </div>
                <ChromeSeek
                  value={volume}
                  max={1}
                  onChange={onVolumeChange}
                  label="Volume level"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {tickerText && (
        <div style={{ position: "relative", zIndex: 2, marginTop: 10, flexShrink: 0, opacity: 0.85 }}>
          <StationTicker text={tickerText} />
        </div>
      )}

      {/* Center — sleeve + title */}
      <div style={{
        position: "relative",
        zIndex: 2,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 24px 8px",
        minHeight: 0,
        gap: 14,
      }}>
        {dedicationFlash && (
          <DedicationFlash dedication={dedicationFlash} onDone={onClearDedication} />
        )}

        {sessionArc?.energies?.length > 1 && (
          <div style={{ width: "100%", maxWidth: 280, opacity: 0.7 }}>
            <svg width="100%" height="22" viewBox="0 0 320 22" preserveAspectRatio="none" aria-hidden="true">
              {(() => {
                const energies = sessionArc.energies;
                const idx = Math.min(sessionArc.index || 0, energies.length - 1);
                const stepX = 320 / Math.max(energies.length - 1, 1);
                const pts = energies.map((e, i) => `${i * stepX},${20 - ((e - 1) / 9) * 16}`).join(" ");
                const cx = idx * stepX;
                const cy = 20 - (((energies[idx] || 5) - 1) / 9) * 16;
                return (
                  <>
                    <polyline points={pts} fill="none" stroke="rgba(26,29,36,0.18)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx={cx} cy={cy} r="3" fill={color.accent} />
                  </>
                );
              })()}
            </svg>
          </div>
        )}

        {/* Jewel-case sleeve */}
        <div
          key={currentTrack.id}
          style={{
            position: "relative",
            width: hasVideo ? "min(38vw, 148px)" : "min(68vw, 300px)",
            aspectRatio: "1 / 1",
            borderRadius: 18,
            padding: 3,
            background: `
              linear-gradient(145deg, rgba(56,62,72,0.95) 0%, rgba(210,216,226,0.7) 48%, rgba(46,51,60,0.88) 100%)
            `,
            boxShadow: isPlaying ? artShadow.raised : artShadow.quiet,
            animation: isPlaying
              ? `coverFloat 6s ease-in-out infinite, trackSwap 0.45s ${EASE} both`
              : `trackSwap 0.45s ${EASE} both`,
            opacity: hasVideo ? 0.94 : 1,
            flexShrink: 1,
            minHeight: 0,
            maxHeight: "42vh",
          }}
        >
          <div style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: 15,
            overflow: "hidden",
            background: color.surfaceRaised,
            border: `1px solid ${glass.borderSoft}`,
          }}>
            {currentTrack.albumCover ? (
              <img
                src={currentTrack.albumCover}
                alt=""
                onLoad={() => setArtLoaded(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `linear-gradient(160deg, rgba(${rgb},0.35) 0%, ${color.surfaceRaised} 70%)`,
                fontSize: 72,
                fontWeight: 800,
                color: `rgba(${rgb},0.55)`,
                letterSpacing: -4,
                fontFamily: fontDisplay,
              }}>
                {(currentTrack.title || "P")[0]}
              </div>
            )}
            {/* Specular corner */}
            <div aria-hidden="true" style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, rgba(26,29,35,0.45) 0%, transparent 42%)",
              pointerEvents: "none",
            }} />
          </div>
        </div>

        {/* Title — premium hierarchy, not TV lower-third */}
        <div style={{
          width: "100%",
          maxWidth: 400,
          textAlign: "center",
          animation: `trackSwap 0.4s ${EASE} both`,
        }}>
          <div style={{
            fontFamily: fontDisplay,
            fontSize: "clamp(22px, 5.6vw, 30px)",
            fontWeight: 700,
            letterSpacing: -0.7,
            color: color.ink,
            lineHeight: 1.12,
            marginBottom: 6,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}>
            {currentTrack.title}
          </div>
          {onOpenArtist ? (
            <button
              type="button"
              onClick={() => onOpenArtist(currentTrack.artist)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: color.body,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: -0.2,
              }}
            >
              {currentTrack.artist}
            </button>
          ) : (
            <div style={{ fontSize: 16, fontWeight: 600, color: color.body, letterSpacing: -0.2 }}>
              {currentTrack.artist}
            </div>
          )}

          {(metaBits.length > 0 || hasVideo || liveShow?.host) && (
            <div style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "center",
              gap: 6,
              flexWrap: "wrap",
            }}>
              {metaBits.map((m) => <MetaChip key={m}>{m}</MetaChip>)}
              <VideoBadge track={currentTrack} />
              {liveShow?.host && <HostCreditChip show={liveShow} />}
            </div>
          )}
        </div>

        {upNextTrack && (
          <div style={{ width: "100%", maxWidth: 360, opacity: 0.9 }}>
            <UpNextBumper track={upNextTrack} />
          </div>
        )}

        <BoothStrip
          track={currentTrack}
          onRequest={onRequest}
          requested={requested}
          onDedicate={onDedicate}
        />

        {onTuneSceneChannel && (
          <div style={{ width: "100%", maxWidth: 400, marginTop: 2 }}>
            <SceneSurfRail
              tracks={tracks}
              activeChannelId={sceneChannelsActiveId}
              onTuneChannel={onTuneSceneChannel}
              compact
            />
          </div>
        )}
      </div>

      {/* Transport deck — frosted remote */}
      <div style={{
        position: "relative",
        zIndex: 3,
        padding: "0 16px calc(18px + env(safe-area-inset-bottom, 0px))",
        flexShrink: 0,
      }}>
        <div style={{
          maxWidth: 420,
          margin: "0 auto",
          padding: "16px 18px 18px",
          borderRadius: 22,
          background: `
            linear-gradient(165deg, rgba(38,43,51,0.82) 0%, rgba(28,32,38,0.55) 100%)
          `,
          border: `1px solid rgba(255,255,255,0.14)`,
          boxShadow: `
            inset 0 1px 0 ${glass.highlight},
            0 -1px 0 rgba(22,24,30,0.04),
            0 18px 48px rgba(22,24,30,0.12)
          `,
          backdropFilter: glass.blurHeavy,
          WebkitBackdropFilter: glass.blurHeavy,
          animation: `dockRise 0.5s ${EASE} both`,
        }}>
          <div style={{ marginBottom: 4 }}>
            <ChromeSeek
              value={progress}
              max={duration || 1}
              onChange={onSeek}
              label="Seek"
              valueText={`${fmtTime(progress)} of ${fmtTime(duration)}`}
            />
            <div style={{
              marginTop: 2,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              color: color.muted,
              fontFamily: fontMono,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: 0.3,
              padding: "0 2px",
            }}>
              <span>{fmtTime(progress)}</span>
              <span>{fmtTime(duration)}</span>
            </div>
          </div>

          <div style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginTop: 8,
          }}>
            <EnergyShiftFeedback bottom="calc(100% + 14px)" />

            <ChromeIconButton
              onClick={() => onLike?.(currentTrack.id)}
              label={currentTrack.liked ? "Unlike" : "Like"}
              active={!!currentTrack.liked}
            >
              <span style={{ display: "flex", animation: currentTrack.liked ? "likePop 0.25s ease" : "none" }}>
                <Icon name={currentTrack.liked ? "heart" : "heartempty"} size={18} />
              </span>
            </ChromeIconButton>

            <ChromeIconButton onClick={onPrev} label="Previous" size={48}>
              <Icon name="prev" size={20} />
            </ChromeIconButton>

            <div style={{
              padding: 3,
              borderRadius: "50%",
              background: `
                linear-gradient(145deg, rgba(56,62,72,0.95) 0%, rgba(200,208,220,0.65) 100%)
              `,
              boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 8px 24px rgba(22,24,30,0.12)`,
            }}>
              <IceOrbPlay
                isPlaying={isPlaying}
                onClick={onTogglePlay}
                size={68}
                glowing={isPlaying}
              />
            </div>

            <ChromeIconButton onClick={onSkip} label="Next" size={48}>
              <Icon name="skip" size={20} />
            </ChromeIconButton>

            <div style={{ width: 44, display: "flex", justifyContent: "center" }}>
              <EnergyShiftControl size={36} stopPropagation={false} />
            </div>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 14,
            padding: "0 4px",
            gap: 8,
          }}>
            {!isRadioMode && onToggleShuffle ? (
              <ChromeIconButton
                onClick={onToggleShuffle}
                label="Shuffle"
                pressed={shuffle}
                active={shuffle}
                size={40}
              >
                <Icon name="shuffle" size={15} />
              </ChromeIconButton>
            ) : (
              <span style={{ width: 40 }} aria-hidden="true" />
            )}

            <div style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 6px",
            }}>
              <span style={{ color: color.faint, display: "flex", flexShrink: 0 }} aria-hidden="true">
                <Icon name="volume" size={14} />
              </span>
              <ChromeSeek
                value={volume}
                max={1}
                onChange={onVolumeChange}
                label="Volume"
              />
            </div>

            {!isRadioMode && onCycleRepeat ? (
              <ChromeIconButton
                onClick={onCycleRepeat}
                label={`Repeat: ${repeat === "one" ? "one" : repeat === "all" ? "all" : "off"}`}
                pressed={repeat !== "off"}
                active={repeat !== "off"}
                size={40}
              >
                <span style={{ position: "relative", display: "flex" }}>
                  <Icon name="repeat" size={15} />
                  {repeat === "one" && (
                    <span aria-hidden="true" style={{
                      position: "absolute",
                      top: -4,
                      right: -6,
                      fontSize: 9,
                      fontWeight: 800,
                      color: color.accent,
                      fontFamily: fontMono,
                    }}>1</span>
                  )}
                </span>
              </ChromeIconButton>
            ) : (
              <ChromeIconButton onClick={() => onShowQueue?.()} label="Up Next" size={40}>
                <Icon name="queue" size={16} />
              </ChromeIconButton>
            )}
          </div>

          {!isRadioMode && onCycleRepeat && onShowQueue && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
              <button
                type="button"
                onClick={() => onShowQueue()}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 650,
                  fontFamily: fontMono,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: color.muted,
                  padding: "6px 12px",
                }}
              >
                Up Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
