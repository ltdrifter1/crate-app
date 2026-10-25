/**
 * ImmersivePlayer — the channel, full screen.
 *
 * Same grammar as the Home screen: the sleeve fills a broadcast frame, LIVE
 * and the CH ident sit in the corners, the title is a lower third cut into
 * the picture, the callsign watermarks the frame. Below it a flat deck:
 * timeline, transport, Slow / Fast, up next, volume, the crawl. Booth tools
 * stay in a drawer. No blurred backdrop, no fake meters, no device plate.
 */
import { useEffect, useRef, useState } from "react";
import {
  fontDisplay,
  fontMono,
  fontPoster,
  color,
  motion,
  glass,
  hardware,
  mtv,
  radio,
  y2k,
} from "../../theme";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { useIsPlaying } from "../../usePlayerTransport";
import Icon from "../ui/Icon";
import { DedicationFlash } from "../station/StationChrome";
import ChannelIdent from "../station/ChannelIdent";
import { getSceneChannel } from "../../lib/sceneChannels";
import {
  STATION_CALLSIGN,
  channelBugLine,
  resolveChannelBug,
} from "../../lib/mtvChannel";
import VideoStage from "../station/VideoStage";
import SceneSurfRail from "../station/SceneSurfRail";
import { trackHasVideo } from "../../lib/video";
import CoverImage from "../ui/CoverImage";
import {
  HardwareIconButton as ChromeIconButton,
  LcdMetaLine,
  LcdSeek as ChromeSeek,
  formatBitrate,
  trackLcdBits,
} from "./DeviceChrome";
import PlayerDeck from "./PlayerDeck";

const EASE = motion.ease;

/** Quiet booth tools — dedicate, plus the track's real request and play counts. */
function BoothStrip({
  track,
  onDedicate = null,
}) {
  // Real counts off the track. Nothing here is estimated.
  const requests = Number(track?.requestCount) || 0;
  const plays = Number(track?.playCount) || 0;
  const tally = [
    requests ? `${requests} ${requests === 1 ? "request" : "requests"}` : null,
    plays ? `${plays} ${plays === 1 ? "play" : "plays"}` : null,
  ].filter(Boolean).join(" · ") || "New on the station";

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
          fontSize: 11,
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
        {tally}
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
  onRequest = null,
  dedicationFlash = null,
  onClearDedication = null,
  liveShow = null,
  tracks = [],
  sceneChannelsActiveId = null,
  onTuneSceneChannel = null,
}) {
  const { progress, duration } = usePlayerPlayback();
  const isPlaying = useIsPlaying();
  const [showMore, setShowMore] = useState(false);
  const [showBooth, setShowBooth] = useState(false);
  const moreRef = useRef(null);
  const hasVideo = trackHasVideo(currentTrack);
  const hasBoothTools = !!(onDedicate || onTuneSceneChannel || sessionArc?.energies?.length > 1);

  useEffect(() => {
    setShowMore(false);
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

  const sceneChannel = sceneChannelsActiveId ? getSceneChannel(sceneChannelsActiveId) : null;
  const hasIdent = !!(sceneChannel || liveShow);
  const channelBug = hasIdent ? resolveChannelBug({ sceneChannel, show: liveShow }) : null;
  const bugLine = channelBug ? channelBugLine(channelBug) : "";
  const metaBits = trackLcdBits(currentTrack, [
    formatBitrate(currentTrack),
    countdownRank ? `#${countdownRank}` : null,
    hasVideo ? "Video" : null,
    liveShow?.host?.name || liveShow?.host?.handle || null,
  ]);
  const wellColor = currentTrack.color || "#0E1116";

  const circleChrome = {
    width: 42,
    height: 42,
    borderRadius: 980,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: hardware.keyFace,
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: hardware.keyRaised,
    color: color.ink,
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
  };

  const shadowText = "0 1px 10px rgba(6,8,12,0.6)";

  return (
    <div
      className="pmp-player"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        overflow: "hidden",
        background: "#07090C",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top chrome — close, booth, more. No plate, no pill. */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "calc(10px + env(safe-area-inset-top, 0px)) 16px 10px",
          flexShrink: 0,
          gap: 12,
        }}
      >
        <button type="button" onClick={onClose} aria-label="Close player" style={circleChrome}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

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
                color: showBooth ? color.accent : y2k.offWhite,
                boxShadow: showBooth
                  ? `${hardware.keyRaised}, 0 0 14px ${color.accentGlow}`
                  : hardware.keyRaised,
                border: `1px solid ${showBooth ? color.accentGlow : "rgba(255,255,255,0.10)"}`,
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
                  borderRadius: 16,
                  padding: "6px 0",
                  zIndex: 8,
                  boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 18px 48px rgba(0,0,0,0.5)`,
                  animation: `rise 0.22s ${EASE} both`,
                }}
              >
                {onRequest && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMore(false);
                      onRequest(currentTrack);
                    }}
                    style={menuItemStyle}
                  >
                    Request it
                  </button>
                )}
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
                        background: crossfadeOn ? color.accent : "rgba(30,36,44,0.92)",
                        transition: `background ${motion.base} ${EASE}`,
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
                          boxShadow: "0 1px 3px rgba(6,10,16,0.35)",
                          transition: `left ${motion.base} ${EASE}`,
                        }}
                      />
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── The screen ─────────────────────────────────────────────── */}
      <div
        className="pmp-player-screen"
        key={currentTrack.id}
        style={{
          position: "relative",
          flexShrink: 0,
          overflow: "hidden",
          borderRadius: 16,
          background: wellColor,
          animation: `trackSwap 0.4s ${EASE} both`,
        }}
      >
        {hasVideo ? (
          <VideoStage track={currentTrack} playing={isPlaying} progress={progress} dim={false} />
        ) : currentTrack.albumCover ? (
          <CoverImage
            src={currentTrack.albumCover}
            alt=""
            width={1200}
            height={1200}
            sizes="(min-width: 860px) 1100px, 100vw"
            priority
            objectPosition="50% 32%"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 32%",
              transform: isPlaying ? "scale(1.02)" : "scale(1)",
              transition: "transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              background: y2k.artGradient,
              fontSize: 120,
              fontWeight: 800,
              color: "rgba(232,236,242,0.28)",
              letterSpacing: -6,
              fontFamily: fontPoster,
            }}
          >
            {(currentTrack.title || "P")[0]}
          </div>
        )}

        <div
          aria-hidden="true"
          className="pmp-hero-wash"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
            background: `
              linear-gradient(180deg, rgba(6,8,12,0.42) 0%, rgba(6,8,12,0) 26%),
              linear-gradient(180deg, rgba(6,8,12,0) 40%, rgba(6,8,12,0.6) 68%, rgba(6,8,12,0.94) 100%)
            `,
          }}
        />

        {dedicationFlash && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 4,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              padding: "56px 16px 0",
              pointerEvents: "none",
            }}
          >
            <div style={{ pointerEvents: "auto", maxWidth: 420, width: "100%" }}>
              <DedicationFlash dedication={dedicationFlash} onDone={onClearDedication} />
            </div>
          </div>
        )}

        {/* Corner bugs */}
        <div
          style={{
            position: "absolute",
            zIndex: 2,
            top: 0,
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 10,
            padding: "14px 14px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            {(isRadioMode || liveShow) && (
              <span
                className="pmp-live-bug"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "5px 9px 5px 8px",
                  borderRadius: 2,
                  background: mtv.hot,
                  color: "#fff",
                  fontFamily: fontPoster,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 0.18,
                  boxShadow: "0 4px 14px rgba(6,8,12,0.4)",
                }}
              >
                <span
                  aria-hidden="true"
                  className="pmp-live-dot"
                  style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }}
                />
                LIVE
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", minWidth: 0 }}>
            {hasVideo && (
              <span
                aria-hidden="true"
                style={{
                  padding: "5px 9px",
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.35)",
                  background: "rgba(6,8,12,0.45)",
                  fontFamily: fontPoster,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: mtv.caps,
                  textTransform: "uppercase",
                  color: color.ink,
                }}
              >
                Video
              </span>
            )}
            {channelBug && (
              <ChannelIdent bugLine={bugLine} slug={channelBug.slug} ink={sceneChannel?.accent || null} />
            )}
          </div>
        </div>

        {/* Lower third */}
        <div
          className="pmp-hero-id"
          style={{
            position: "absolute",
            zIndex: 2,
            left: 0,
            right: 0,
            bottom: 0,
            padding: "0 18px 16px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ position: "relative", minWidth: 0, flex: 1, paddingLeft: 14 }}>
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 0,
                top: 4,
                bottom: 4,
                width: 4,
                background: isPlaying ? mtv.hot : "rgba(255,255,255,0.55)",
              }}
            />
            <div
              className="pmp-hero-title"
              style={{
                fontFamily: fontPoster,
                fontSize: "clamp(34px, 9.5vw, 64px)",
                fontWeight: 800,
                letterSpacing: 0.2,
                lineHeight: 0.94,
                textTransform: "uppercase",
                color: "#fff",
                textShadow: "0 2px 18px rgba(6,8,12,0.55)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                maxWidth: "min(100%, 20ch)",
                paddingRight: 8,
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
                  marginTop: 7,
                  color: "rgba(255,255,255,0.92)",
                  fontFamily: fontDisplay,
                  fontSize: 17,
                  fontWeight: 600,
                  cursor: "pointer",
                  letterSpacing: -0.2,
                  textShadow: shadowText,
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textAlign: "left",
                }}
              >
                {currentTrack.artist}
              </button>
            ) : (
              <div
                style={{
                  marginTop: 7,
                  color: "rgba(255,255,255,0.92)",
                  fontFamily: fontDisplay,
                  fontSize: 17,
                  fontWeight: 600,
                  letterSpacing: -0.2,
                  textShadow: shadowText,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentTrack.artist}
              </div>
            )}
            <div
              style={{
                marginTop: 8,
                textShadow: shadowText,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <LcdMetaLine bits={metaBits} on="lcd" inline />
            </div>
          </div>
          <span
            aria-hidden="true"
            className="pmp-hero-callsign"
            style={{
              flexShrink: 0,
              fontFamily: fontPoster,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 0.28,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.55)",
              textShadow: shadowText,
              paddingBottom: 2,
            }}
          >
            {STATION_CALLSIGN}
          </span>
        </div>
      </div>

      {/* ── The deck ───────────────────────────────────────────────── */}
      <div
        className="pmp-player-deck"
        style={{
          position: "relative",
          zIndex: 3,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          padding: "8px 16px 0",
        }}
      >
        {showBooth && hasBoothTools && (
          <div
            style={{
              flexShrink: 0,
              width: "min(100%, 1100px)",
              margin: "0 auto 8px",
              padding: "12px 14px 14px",
              borderRadius: 16,
              background: radio.moduleFace,
              border: radio.border,
              boxShadow: radio.moduleShadow,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              animation: `rise 0.28s ${EASE} both`,
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
            <BoothStrip track={currentTrack} onDedicate={onDedicate} />
            {onTuneSceneChannel && (
              <SceneSurfRail
                tracks={tracks}
                activeChannelId={sceneChannelsActiveId}
                onTuneChannel={onTuneSceneChannel}
                compact
              />
            )}
          </div>
        )}

        <div
          style={{
            width: "min(100%, 1100px)",
            margin: "0 auto",
            flexShrink: 0,
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

          {/* Up next + volume — one quiet row under the keys */}
          <div
            className="pmp-player-foot"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 8,
              padding: "0 4px",
              minWidth: 0,
            }}
          >
            {upNextTrack ? (
              <button
                type="button"
                onClick={() => onShowQueue?.()}
                aria-label={`Up next: ${upNextTrack.title}`}
                style={{
                  flex: "1 1 50%",
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 10px 6px 6px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  cursor: onShowQueue ? "pointer" : "default",
                  textAlign: "left",
                  color: color.ink,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    borderRadius: 4,
                    overflow: "hidden",
                    background: color.surfaceRaised,
                    border: "1px solid rgba(200,210,222,0.18)",
                  }}
                >
                  {upNextTrack.albumCover ? (
                    <CoverImage
                      src={upNextTrack.albumCover}
                      alt=""
                      width={32}
                      height={32}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : null}
                </span>
                <span style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                  <span
                    style={{
                      fontFamily: fontPoster,
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: mtv.caps,
                      textTransform: "uppercase",
                      color: color.muted,
                    }}
                  >
                    Up next
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: -0.15,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {upNextTrack.title}
                    {upNextTrack.artist ? ` — ${upNextTrack.artist}` : ""}
                  </span>
                </span>
              </button>
            ) : (
              <span style={{ flex: "1 1 50%" }} />
            )}

            <div
              className="pmp-player-volume"
              style={{
                flex: "1 1 40%",
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0 4px",
              }}
            >
              <span style={{ color: y2k.chromeMid, display: "flex", flexShrink: 0 }} aria-hidden="true">
                <Icon name="volume" size={14} />
              </span>
              <ChromeSeek value={volume} max={1} onChange={onVolumeChange} label="Volume" variant="volume" />
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
                        fontSize: 11,
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
        </div>

        {/* The crawl at the foot of the channel — same crawl as the Home screen. */}
        <div
          style={{
            flexShrink: 0,
            width: "min(100%, 1100px)",
            margin: "8px auto 0",
            paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
            minHeight: 10,
          }}
        >
          {tickerText ? (
            <div
              aria-hidden="true"
              className="pmp-hero-ticker"
              style={{
                padding: "7px 0",
                overflow: "hidden",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                maskImage: "linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)",
              }}
            >
              <div
                className="pmp-ticker-track"
                style={{
                  display: "inline-block",
                  whiteSpace: "nowrap",
                  fontFamily: fontPoster,
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: color.body,
                }}
              >
                {[0, 1].map((i) => (
                  <span key={i}>
                    {tickerText}
                    <span style={{ color: mtv.hot, margin: "0 16px" }}>■</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
