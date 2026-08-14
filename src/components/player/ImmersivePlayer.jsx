/**
 * ImmersivePlayer — premium Y2K listening booth.
 * Sleeve-first theater: oversized jewel case → title → aluminum transport.
 * Secondary booth tools (channels, request, session arc) live in a drawer.
 * Chrome language is machined aluminum / grey — no ice-blue accents.
 */
import { useEffect, useRef, useState } from "react";
import {
  fontDisplay,
  fontMono,
  color,
  radius,
  motion,
  glass,
  artShadow,
  aluminumGradient,
  hardware,
  y2k,
} from "../../theme";
import { fmtTime, hexToRgbStr } from "../../lib/harmony";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { useIsPlaying } from "../../usePlayerTransport";
import { EnergyShiftFeedback, EnergyShiftControl } from "../listen/EnergyShiftButton";
import {
  DedicationFlash,
  HypnoVisualizer,
  StationTicker,
} from "../station/StationChrome";
import VideoStage from "../station/VideoStage";
import SceneSurfRail from "../station/SceneSurfRail";
import { trackHasVideo } from "../../lib/video";
import { estimateLockedIn } from "../../lib/station";
import CoverImage from "../ui/CoverImage";

const EASE = motion.ease;

/** Soft circular secondary control. */
function ChromeIconButton({
  onClick,
  label,
  pressed = false,
  active = false,
  children,
  size = 44,
}) {
  const lit = active || pressed;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed || undefined}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: lit ? color.ink : color.muted,
        background: lit ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${lit ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.1)"}`,
        boxShadow: "none",
        transition: `transform ${motion.fast} ${EASE}, color ${motion.fast}, background ${motion.base}`,
        padding: 0,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

/** Thin modern seek — soft track, no aluminum groove. */
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
          height: 3,
          marginTop: -1.5,
          borderRadius: 999,
          background: "rgba(255,255,255,0.14)",
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 999,
            background: "rgba(247,248,250,0.92)",
            transition: "width 0.08s linear",
          }}
        />
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
        borderRadius: 6,
        background: y2k.inkGlass,
        border: "1px solid rgba(255,255,255,0.16)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.35)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        pointerEvents: "none",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: color.alert,
          boxShadow: "0 0 0 3px rgba(224,60,75,0.22)",
          animation: "stageLiveDot 1.5s ease-in-out infinite",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: fontMono,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: y2k.offWhite,
          flexShrink: 0,
        }}
      >
        On Air
      </span>
      {secondary && (
        <span
          style={{
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 0.4,
            color: y2k.chromeMid,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {secondary}
        </span>
      )}
    </div>
  );
}

/** Quiet booth tools — request / dedicate / locked-in count. */
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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        width: "100%",
        padding: "4px 2px",
      }}
    >
      <div
        style={{
          fontFamily: fontMono,
          fontSize: 10,
          fontWeight: 650,
          letterSpacing: 1.1,
          textTransform: "uppercase",
          color: color.muted,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: y2k.chromeBright,
            marginRight: 8,
            verticalAlign: "middle",
            boxShadow: `0 0 8px ${y2k.chromeGlow}`,
          }}
        />
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
              borderRadius: hardware.radius + 2,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: fontMono,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              cursor: requested ? "default" : "pointer",
              color: requested ? color.faint : y2k.offWhite,
              background: hardware.keyFace,
              border: `1px solid ${glass.borderSoft}`,
              boxShadow: hardware.keyRaised,
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
              borderRadius: hardware.radius + 2,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: fontMono,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              cursor: "pointer",
              color: y2k.offWhite,
              background: hardware.keyFace,
              border: `1px solid ${glass.borderSoft}`,
              boxShadow: hardware.keyRaised,
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
  const isPlaying = useIsPlaying();
  const [artLoaded, setArtLoaded] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showBooth, setShowBooth] = useState(false);
  const moreRef = useRef(null);
  const hasVideo = trackHasVideo(currentTrack);
  const hasBoothTools = !!(onRequest || onDedicate || onTuneSceneChannel || sessionArc?.energies?.length > 1);

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
    hasVideo ? "Video" : null,
    liveShow?.host?.name || liveShow?.host?.handle || null,
  ].filter(Boolean);

  const circleChrome = {
    width: 42,
    height: 42,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: hardware.keyFace,
    border: "1px solid rgba(255,255,255,0.16)",
    boxShadow: hardware.keyRaised,
    color: y2k.offWhite,
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
      {/* Atmosphere — dark broadcast studio + sleeve bloom */}
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
            filter: "blur(48px) saturate(1.12)",
            opacity: artLoaded ? 0.38 : 0.1,
            transform: isPlaying ? "scale(1.05)" : "scale(1.02)",
            transition: "opacity 0.8s ease, transform 12s ease",
          }}
        />
      )}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 85% 50% at 50% 16%, rgba(${rgb},0.14) 0%, transparent 55%),
            radial-gradient(ellipse 60% 40% at 50% 70%, ${y2k.chromeWash} 0%, transparent 70%),
            linear-gradient(180deg,
              rgba(5,6,8,0.78) 0%,
              rgba(5,6,8,0.22) 30%,
              rgba(5,6,8,0.1) 48%,
              rgba(5,6,8,0.72) 78%,
              rgba(5,6,8,0.96) 100%
            )
          `,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 120,
          background: "linear-gradient(180deg, rgba(255,255,255,0.055) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {!hasVideo && <HypnoVisualizer playing={isPlaying} colorHex={rgb} />}
      {hasVideo && (
        <VideoStage track={currentTrack} playing={isPlaying} progress={progress} dim={false} />
      )}

      {/* Top chrome */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "calc(12px + env(safe-area-inset-top, 0px)) 18px 0",
          flexShrink: 0,
          gap: 12,
        }}
      >
        <button type="button" onClick={onClose} aria-label="Close player" style={circleChrome}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <PlayerOnAir
          showTitle={liveShow ? liveShow.shortTitle || liveShow.title : null}
          daypartLabel={daypart?.label}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {hasBoothTools && (
            <button
              type="button"
              onClick={() => setShowBooth((v) => !v)}
              aria-label={showBooth ? "Hide booth tools" : "Show booth tools"}
              aria-pressed={showBooth}
              style={{
                ...circleChrome,
                width: "auto",
                minWidth: 42,
                padding: "0 12px",
                borderRadius: 980,
                gap: 6,
                color: showBooth ? y2k.chromeBright : y2k.offWhite,
                boxShadow: showBooth
                  ? `${hardware.keyRaised}, 0 0 14px ${y2k.chromeGlow}`
                  : hardware.keyRaised,
                border: `1px solid ${showBooth ? "rgba(232,236,242,0.4)" : "rgba(255,255,255,0.16)"}`,
                fontFamily: fontMono,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              Booth
            </button>
          )}
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
                  background: "rgba(28,32,38,0.96)",
                  border: `1px solid ${glass.border}`,
                  borderRadius: radius.lg,
                  padding: "6px 0",
                  zIndex: 8,
                  boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 18px 48px rgba(0,0,0,0.45)`,
                  backdropFilter: glass.blur,
                  WebkitBackdropFilter: glass.blur,
                  animation: `rise 0.22s ${EASE} both`,
                }}
              >
                {onOpenLiner && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMore(false);
                      onOpenLiner(currentTrack);
                    }}
                    style={menuItemStyle}
                  >
                    Liner notes
                  </button>
                )}
                {onHypno && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMore(false);
                      onHypno(currentTrack);
                    }}
                    style={menuItemStyle}
                  >
                    Near this
                  </button>
                )}
                {onHypnoRadio && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMore(false);
                      onHypnoRadio(currentTrack);
                    }}
                    style={menuItemStyle}
                  >
                    <span>Near this radio</span>
                    <span style={{ color: hypnoPocket ? y2k.chromeBright : color.faint, fontSize: 12 }}>
                      {hypnoPocket ? "On" : "Off"}
                    </span>
                  </button>
                )}
                {roomLabel && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMore(false);
                      onOpenRoom?.();
                    }}
                    style={menuItemStyle}
                  >
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
                    <span
                      aria-hidden="true"
                      style={{
                        width: 36,
                        height: 22,
                        borderRadius: 11,
                        flexShrink: 0,
                        position: "relative",
                        background: crossfadeOn ? y2k.chrome : "rgba(26,29,36,0.45)",
                        transition: `background ${motion.base} ${EASE}`,
                        boxShadow: crossfadeOn ? `0 0 10px ${y2k.chromeGlow}` : "none",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 2,
                          left: crossfadeOn ? 16 : 2,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: crossfadeOn ? y2k.offWhite : color.surfaceSolid,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.35)",
                          transition: `left ${motion.base} ${EASE}`,
                        }}
                      />
                    </span>
                  </button>
                )}
                <div style={{ padding: "10px 16px 14px" }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 1.3,
                      color: color.muted,
                      fontFamily: fontMono,
                      textTransform: "uppercase",
                      marginBottom: 10,
                    }}
                  >
                    Volume
                  </div>
                  <ChromeSeek value={volume} max={1} onChange={onVolumeChange} label="Volume level" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {tickerText && (
        <div style={{ position: "relative", zIndex: 2, marginTop: 8, flexShrink: 0, opacity: 0.7 }}>
          <StationTicker text={tickerText} />
        </div>
      )}

      {/* Center — sleeve theater */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px 20px 6px",
          minHeight: 0,
          gap: 16,
        }}
      >
        {dedicationFlash && (
          <DedicationFlash dedication={dedicationFlash} onDone={onClearDedication} />
        )}

        {/* Jewel-case sleeve — dominant stage */}
        <div
          key={currentTrack.id}
          style={{
            position: "relative",
            width: hasVideo ? "min(42vw, 168px)" : "min(84vw, 360px)",
            aspectRatio: "1 / 1",
            borderRadius: 16,
            padding: 3,
            background: `
              linear-gradient(145deg, rgba(232,236,242,0.55) 0%, rgba(184,192,204,0.35) 42%, rgba(46,51,60,0.95) 100%)
            `,
            boxShadow: isPlaying ? artShadow.raised : artShadow.quiet,
            animation: isPlaying
              ? `coverSettle 1.1s ${EASE} both, trackSwap 0.45s ${EASE} both`
              : `trackSwap 0.45s ${EASE} both`,
            opacity: hasVideo ? 0.94 : 1,
            flexShrink: 1,
            minHeight: 0,
            maxHeight: hasVideo ? "28vh" : "52vh",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              borderRadius: 13,
              overflow: "hidden",
              background: y2k.charcoalRaised,
              border: "1px solid rgba(184,192,204,0.22)",
            }}
          >
            {currentTrack.albumCover ? (
              <CoverImage
                src={currentTrack.albumCover}
                alt=""
                width={360}
                height={360}
                sizes="(max-width: 480px) 84vw, 360px"
                priority
                onLoad={() => setArtLoaded(true)}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: y2k.artGradient,
                  fontSize: 72,
                  fontWeight: 800,
                  color: "rgba(232,236,242,0.35)",
                  letterSpacing: -4,
                  fontFamily: fontDisplay,
                }}
              >
                {(currentTrack.title || "P")[0]}
              </div>
            )}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background: `
                  linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 40%),
                  linear-gradient(180deg, transparent 55%, rgba(10,11,13,0.28) 100%)
                `,
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* Title hierarchy */}
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            textAlign: "center",
            animation: `trackSwap 0.4s ${EASE} both`,
          }}
        >
          <div
            style={{
              fontFamily: fontDisplay,
              fontSize: "clamp(24px, 6vw, 34px)",
              fontWeight: 750,
              letterSpacing: -0.8,
              color: y2k.offWhite,
              lineHeight: 1.1,
              marginBottom: 8,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
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

          {metaBits.length > 0 && (
            <div
              style={{
                marginTop: 10,
                fontFamily: fontMono,
                fontSize: 11,
                fontWeight: 650,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                color: y2k.chromeMid,
                lineHeight: 1.35,
              }}
            >
              {metaBits.join(" · ")}
            </div>
          )}

          {upNextTrack && (
            <button
              type="button"
              onClick={() => onShowQueue?.()}
              style={{
                marginTop: 12,
                background: "none",
                border: "none",
                padding: 0,
                cursor: onShowQueue ? "pointer" : "default",
                fontFamily: fontMono,
                fontSize: 11,
                fontWeight: 650,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: color.muted,
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: y2k.chromeBright }}>Up next</span>
              {" · "}
              {upNextTrack.title}
            </button>
          )}
        </div>
      </div>

      {/* Booth drawer — demoted secondary tools */}
      {showBooth && hasBoothTools && (
        <div
          style={{
            position: "relative",
            zIndex: 3,
            flexShrink: 0,
            padding: "0 16px 10px",
            animation: `rise 0.28s ${EASE} both`,
          }}
        >
          <div
            style={{
              maxWidth: 420,
              margin: "0 auto",
              padding: "12px 14px 14px",
              borderRadius: 16,
              background: `
                linear-gradient(165deg, rgba(30,34,40,0.92) 0%, rgba(18,20,24,0.88) 100%)
              `,
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
              backdropFilter: glass.blurSoft,
              WebkitBackdropFilter: glass.blurSoft,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {sessionArc?.energies?.length > 1 && (
              <div style={{ width: "100%", opacity: 0.75 }}>
                <svg width="100%" height="22" viewBox="0 0 320 22" preserveAspectRatio="none" aria-hidden="true">
                  {(() => {
                    const energies = sessionArc.energies;
                    const idx = Math.min(sessionArc.index || 0, energies.length - 1);
                    const stepX = 320 / Math.max(energies.length - 1, 1);
                    const pts = energies
                      .map((e, i) => `${i * stepX},${20 - ((e - 1) / 9) * 16}`)
                      .join(" ");
                    const cx = idx * stepX;
                    const cy = 20 - (((energies[idx] || 5) - 1) / 9) * 16;
                    return (
                      <>
                        <polyline
                          points={pts}
                          fill="none"
                          stroke="rgba(184,192,204,0.35)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx={cx} cy={cy} r="3" fill={y2k.chromeBright} />
                      </>
                    );
                  })()}
                </svg>
              </div>
            )}
            <BoothStrip
              track={currentTrack}
              onRequest={onRequest}
              requested={requested}
              onDedicate={onDedicate}
            />
            {onTuneSceneChannel && (
              <SceneSurfRail
                tracks={tracks}
                activeChannelId={sceneChannelsActiveId}
                onTuneChannel={onTuneSceneChannel}
                compact
              />
            )}
          </div>
        </div>
      )}

      {/* Transport — flat controls on the canvas */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          padding: "0 20px calc(20px + env(safe-area-inset-bottom, 0px))",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            maxWidth: 420,
            margin: "0 auto",
            padding: "8px 4px 4px",
            animation: `dockRise 0.5s ${EASE} both`,
          }}
        >
          <div style={{ marginBottom: 4 }}>
            <ChromeSeek
              value={progress}
              max={duration || 1}
              onChange={onSeek}
              label="Seek"
              valueText={`${fmtTime(progress)} of ${fmtTime(duration)}`}
            />
            <div
              style={{
                marginTop: 2,
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: color.muted,
                fontFamily: fontMono,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: 0.3,
                padding: "0 2px",
              }}
            >
              <span>{fmtTime(progress)}</span>
              <span>{fmtTime(duration)}</span>
            </div>
          </div>

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginTop: 10,
            }}
          >
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

            <IceOrbPlay
              isPlaying={isPlaying}
              onClick={onTogglePlay}
              size={68}
              glowing={isPlaying}
            />

            <ChromeIconButton onClick={onSkip} label="Next" size={48}>
              <Icon name="skip" size={20} />
            </ChromeIconButton>

            <div style={{ width: 44, display: "flex", justifyContent: "center" }}>
              <EnergyShiftControl size={36} stopPropagation={false} />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 14,
              padding: "0 4px",
              gap: 8,
            }}
          >
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

            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0 6px",
              }}
            >
              <span style={{ color: y2k.chromeMid, display: "flex", flexShrink: 0 }} aria-hidden="true">
                <Icon name="volume" size={14} />
              </span>
              <ChromeSeek value={volume} max={1} onChange={onVolumeChange} label="Volume" />
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
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        top: -4,
                        right: -6,
                        fontSize: 9,
                        fontWeight: 800,
                        color: y2k.chromeBright,
                        fontFamily: fontMono,
                      }}
                    >
                      1
                    </span>
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
                  color: y2k.chromeMid,
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
