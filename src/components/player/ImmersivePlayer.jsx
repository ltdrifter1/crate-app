/**
 * ImmersivePlayer — alternate-2003 MP3 device.
 * Artwork window + LCD (title, BPM, Camelot, seek) + hardware transport
 * with Pace slider. Booth tools stay in a drawer.
 */
import { useEffect, useRef, useState } from "react";
import {
  fontDisplay,
  fontMono,
  color,
  motion,
  glass,
  artShadow,
  aluminumGradient,
  hardware,
  radio,
  y2k,
} from "../../theme";
import { hexToRgbStr } from "../../lib/harmony";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { useIsPlaying } from "../../usePlayerTransport";
import Icon from "../ui/Icon";
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
import {
  DeviceCatalogMark,
  HardwareIconButton as ChromeIconButton,
  LcdMetaLine,
  LcdPanel,
  LcdSeek as ChromeSeek,
  LcdArtist,
  formatBitrate,
  trackLcdBits,
} from "./DeviceChrome";
import PlayerDeck from "./PlayerDeck";

const EASE = motion.ease;

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
        border: "1px solid rgba(216,223,232,0.16)",
        boxShadow: "inset 0 1px 0 rgba(216,223,232,0.1), inset 0 -1px 0 rgba(58,66,80,0.35)",
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
          color: color.onDark,
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

/** Quiet booth tools — dedicate / locked-in count. */
function BoothStrip({
  track,
  onDedicate = null,
}) {
  const [lockedIn, setLockedIn] = useState(() => estimateLockedIn(track));
  useEffect(() => {
    setLockedIn(estimateLockedIn(track));
    const id = setInterval(() => setLockedIn(estimateLockedIn(track, new Date())), 20000);
    return () => clearInterval(id);
  }, [track?.id, track?.playCount, track?.likeCount, track?.requestCount]);

  if (!onDedicate) return null;

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
  onDislike = null,
  onShare = null,
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
  onDedicate = null,
  dedicationFlash = null,
  onClearDedication = null,
  liveShow = null,
  tracks = [],
  sceneChannelsActiveId = null,
  onTuneSceneChannel = null,
}) {
  const { progress, duration } = usePlayerPlayback();
  const isPlaying = useIsPlaying();
  const [artLoaded, setArtLoaded] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showBooth, setShowBooth] = useState(false);
  const moreRef = useRef(null);
  const hasVideo = trackHasVideo(currentTrack);
  const hasBoothTools = !!(onDedicate || onTuneSceneChannel || sessionArc?.energies?.length > 1);

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
  const metaBits = trackLcdBits(currentTrack, [
    formatBitrate(currentTrack),
    countdownRank ? `#${countdownRank}` : null,
    hasVideo ? "Video" : null,
    liveShow?.host?.name || liveShow?.host?.handle || null,
  ]);

  const circleChrome = {
    width: 42,
    height: 42,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: hardware.keyFace,
    border: "1px solid rgba(91,101,116,0.22)",
    boxShadow: hardware.keyRaised,
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
      {/* Atmosphere — dark chassis + sleeve bloom */}
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
            filter: "blur(48px) saturate(1.08)",
            opacity: artLoaded ? 0.38 : 0.12,
            transform: isPlaying ? "scale(1.02)" : "scale(1)",
            transition: "opacity 0.35s ease, transform 0.35s ease",
          }}
        />
      )}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 85% 50% at 50% 16%, rgba(${rgb},0.12) 0%, transparent 55%),
            radial-gradient(ellipse 60% 40% at 50% 70%, ${y2k.chromeWash} 0%, transparent 70%),
            linear-gradient(180deg,
              rgba(197,203,214,0.18) 0%,
              rgba(197,203,214,0.06) 30%,
              transparent 48%,
              rgba(180,187,198,0.22) 78%,
              rgba(180,187,198,0.45) 100%
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
          background: "linear-gradient(180deg, rgba(197,203,214,0.45) 0%, transparent 100%)",
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

        <DeviceCatalogMark />
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
                borderRadius: 8,
                gap: 6,
                color: showBooth ? color.accent : y2k.offWhite,
                boxShadow: showBooth
                  ? `${hardware.keyRaised}, 0 0 14px ${color.accentGlow}`
                  : hardware.keyRaised,
                border: `1px solid ${showBooth ? color.accentGlow : "rgba(216,223,232,0.16)"}`,
                fontFamily: fontMono,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.12,
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
                  background: radio.moduleFace,
                  border: `1px solid ${glass.border}`,
                  borderRadius: 8,
                  padding: "6px 0",
                  zIndex: 8,
                  boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 18px 48px rgba(58,66,80,0.45)`,
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
                        background: crossfadeOn ? color.accent : "rgba(197,202,211,0.85)",
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
                          boxShadow: "0 1px 3px rgba(58,66,80,0.35)",
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

      {/* Center — sleeve + LCD (row on desktop) */}
      <div
        className="pmp-device-stage"
        style={{
          position: "relative",
          zIndex: 2,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "18px 22px 12px",
          minHeight: 0,
          gap: 16,
          margin: "0 16px",
          borderRadius: 18,
          background: glass.fillStrong,
          border: `1px solid ${glass.border}`,
          boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowLift}`,
          backdropFilter: glass.blur,
          WebkitBackdropFilter: glass.blur,
        }}
      >
        {dedicationFlash && (
          <DedicationFlash dedication={dedicationFlash} onDone={onClearDedication} />
        )}

        {/* Jewel-case sleeve — dominant stage */}
        <div
          className="pmp-device-sleeve pmp-sleeve-crossfade"
          key={currentTrack.id}
          style={{
            position: "relative",
            width: hasVideo ? "min(42vw, 168px)" : "min(72vw, 520px)",
            aspectRatio: "1 / 1",
            borderRadius: 6,
            padding: 3,
            background: hardware.keyFace,
            boxShadow: isPlaying ? artShadow.raised : artShadow.quiet,
            animation: isPlaying
              ? `coverSettle 1.1s ${EASE} both, trackSwap 0.45s ${EASE} both`
              : `trackSwap 0.45s ${EASE} both`,
            opacity: hasVideo ? 0.94 : 1,
            flexShrink: 0,
            minHeight: 0,
            maxHeight: hasVideo ? "28vh" : "52vh",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              borderRadius: 4,
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
                  linear-gradient(135deg, rgba(216,223,232,0.35) 0%, transparent 40%),
                  linear-gradient(180deg, transparent 55%, rgba(74,83,96,0.22) 100%)
                `,
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* Title hierarchy */}
        <LcdPanel
          live={isPlaying}
          style={{
            width: "100%",
            maxWidth: 720,
            padding: "12px 14px 10px",
            animation: `trackSwap 0.35s ${EASE} both`,
          }}
        >
          <div
            className={currentTrack.title?.length > 22 ? "pmp-lcd-marquee" : undefined}
            style={{
              fontFamily: fontDisplay,
              fontSize: "clamp(20px, 5vw, 28px)",
              fontWeight: 750,
              letterSpacing: -0.6,
              color: color.lcdInk,
              lineHeight: 1.12,
              marginBottom: 6,
              overflow: "hidden",
              whiteSpace: currentTrack.title?.length > 22 ? "nowrap" : undefined,
              display: currentTrack.title?.length > 22 ? "block" : "-webkit-box",
              WebkitLineClamp: currentTrack.title?.length > 22 ? undefined : 2,
              WebkitBoxOrient: currentTrack.title?.length > 22 ? undefined : "vertical",
              paddingRight: 14,
            }}
          >
            <span>{currentTrack.title}</span>
            {currentTrack.title?.length > 22 ? (
              <span aria-hidden="true">{currentTrack.title}</span>
            ) : null}
          </div>
          {onOpenArtist ? (
            <button
              type="button"
              onClick={() => onOpenArtist(currentTrack.artist)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: color.lcdMute,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: -0.2,
              }}
            >
              {currentTrack.artist}
            </button>
          ) : (
            <LcdArtist>{currentTrack.artist}</LcdArtist>
          )}

          <div style={{ marginTop: 8 }}>
            <LcdMetaLine bits={metaBits} />
          </div>

          {upNextTrack && (
            <button
              type="button"
              onClick={() => onShowQueue?.()}
              style={{
                marginTop: 12,
                paddingTop: 10,
                width: "100%",
                display: "block",
                textAlign: "left",
                background: "none",
                border: "none",
                borderTop: "1px solid rgba(183,228,238,0.18)",
                cursor: onShowQueue ? "pointer" : "default",
                fontFamily: fontMono,
                fontSize: 11,
                fontWeight: 650,
                letterSpacing: 0.08,
                textTransform: "uppercase",
                color: color.lcdMute,
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ color: color.lcdSignal }}>Up next</span>
              {" · "}
              {upNextTrack.title}
            </button>
          )}
        </LcdPanel>
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
              maxWidth: 720,
              margin: "0 auto",
              padding: "12px 14px 14px",
              borderRadius: 10,
              background: radio.moduleFace,
              border: radio.border,
              boxShadow: radio.moduleShadow,
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

      {/* Transport — same device chassis */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          padding: "0 16px calc(16px + env(safe-area-inset-bottom, 0px))",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "min(92vw, 1100px)",
            margin: "0 auto",
            padding: "10px 12px 8px",
            borderRadius: 12,
            background: glass.fillStrong,
            border: `1px solid ${glass.border}`,
            boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
            backdropFilter: glass.blur,
            WebkitBackdropFilter: glass.blur,
            animation: `dockRise 0.5s ${EASE} both`,
          }}
        >
          <PlayerDeck
            progress={progress}
            duration={duration}
            onSeek={onSeek}
            isPlaying={isPlaying}
            onTogglePlay={onTogglePlay}
            onPrev={onPrev}
            onSkip={onSkip}
            onLike={onLike ? () => onLike(currentTrack.id) : null}
            onDislike={onDislike}
            onShare={onShare ? () => onShare(currentTrack) : null}
            onShowQueue={onShowQueue}
            liked={!!currentTrack.liked}
            disliked={!!currentTrack.disliked}
            playSize={56}
            stopPropagation={false}
            paceStopPropagation={false}
            seekStopPropagation={false}
            feedbackBottom="calc(100% + 14px)"
            extraKeys={
              !isRadioMode && onToggleShuffle ? (
                <ChromeIconButton
                  onClick={onToggleShuffle}
                  label="Shuffle"
                  pressed={shuffle}
                  active={shuffle}
                  size={40}
                >
                  <Icon name="shuffle" size={15} />
                </ChromeIconButton>
              ) : null
            }
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 10,
              padding: "0 4px",
              gap: 8,
            }}
          >
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
