import { useEffect, useRef, lazy, Suspense } from "react";
import {
  artFrameStyle,
  artShadow,
  color,
  fontDisplay,
  fontMono,
  glass,
  glassStage,
  homeSpace,
  radio,
  y2k,
  BTN_PRIMARY,
} from "../../theme";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { useIsBuffering, useIsPlaying } from "../../usePlayerTransport";
import {
  channelBugLine,
  resolveChannelBug,
} from "../../lib/mtvChannel";
import { trackHasVideo } from "../../lib/video";
import Icon from "../ui/Icon";
import CoverImage from "../ui/CoverImage";
import { PlayKey } from "../player/OrbitalControls";
import { EnergyShiftFeedback, PaceSlot } from "../listen/EnergyShiftButton";
import { HERO_IDLE_ART, HERO_IDLE_FOCUS } from "../../lib/heroIdle";
import ScanlineWash from "./ScanlineWash";
import {
  HardwareIconButton,
  LcdMetaLine,
  LcdPanel,
  LcdTimeline,
  formatBitrate,
  trackLcdBits,
} from "../player/DeviceChrome";

const VideoStage = lazy(() => import("../station/VideoStage"));

function MetaChip({ children }) {
  if (!children) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        maxWidth: "100%",
        padding: "3px 8px",
        borderRadius: 4,
        border: "1px solid rgba(91,101,116,0.12)",
        background: "rgba(91, 101, 116, 0.12)",
        fontFamily: fontMono,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.06,
        textTransform: "uppercase",
        color: color.accent,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function LivePlate({ live }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "4px 9px 4px 8px",
        borderRadius: 4,
        background: live ? "rgba(224,49,74,0.16)" : "rgba(91, 101, 116, 0.12)",
        border: live ? "1px solid rgba(224,49,74,0.35)" : "1px solid rgba(91,101,116,0.1)",
        boxShadow: "none",
        flexShrink: 0,
      }}
    >
      <span
        aria-hidden="true"
        className={live ? "pmp-live-led" : undefined}
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: live ? y2k.live : "rgba(91,101,116,0.45)",
          boxShadow: "none",
        }}
      />
      <span
        style={{
          fontFamily: fontDisplay,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.08,
          textTransform: "uppercase",
          color: live ? y2k.live : color.muted,
        }}
      >
        {live ? "Live" : "Standby"}
      </span>
    </span>
  );
}

function ChannelIdent({ bugLine, slug }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        overflow: "hidden",
        borderRadius: 4,
        border: "1px solid rgba(91,101,116,0.12)",
        background: "rgba(91, 101, 116, 0.12)",
        maxWidth: "100%",
      }}
    >
      <span
        style={{
          padding: "6px 9px",
          fontFamily: fontDisplay,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.08,
          color: color.accent,
          borderRight: "1px solid rgba(91,101,116,0.1)",
          background: color.accentSoft,
          whiteSpace: "nowrap",
        }}
      >
        {bugLine.split(" · ")[0]}
      </span>
      <span
        style={{
          padding: "6px 10px",
          fontFamily: fontDisplay,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.04,
          textTransform: "uppercase",
          color: y2k.offWhite,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {slug}
      </span>
    </span>
  );
}

function ChromeIconButton({ label, icon, active = false, onClick, size = 42, iconSize = 16 }) {
  return (
    <HardwareIconButton
      label={label}
      active={active}
      size={size}
      stopPropagation
      onClick={onClick}
    >
      <Icon name={icon} size={iconSize} />
    </HardwareIconButton>
  );
}

function JewelSleeve({ src, idleSrc, playing, eager = false, size = 148 }) {
  const art = src || idleSrc;
  return (
    <span
      className="pmp-hero-sleeve"
      style={{
        ...artFrameStyle({ size, radius: 6, active: playing }),
        flexShrink: 0,
        boxShadow: playing ? artShadow.active : artShadow.raised,
      }}
    >
      {art ? (
        <CoverImage
          key={art}
          src={art}
          alt=""
          width={size}
          height={size}
          priority={false}
          eager={eager}
          raw={!src}
          objectPosition={!src ? HERO_IDLE_FOCUS : undefined}
          className="pmp-hero-art"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            animation: "fadeIn 0.55s ease both",
            transform: playing ? "scale(1.04)" : "scale(1)",
            transition: "transform 12s ease",
          }}
        />
      ) : (
        <img
          src="/brand/planet-mp3-lockup-512.png"
          alt=""
          width={size}
          height={size}
          decoding="async"
          className="pmp-hero-art"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            padding: 18,
            background: y2k.artGradient,
          }}
          draggable={false}
        />
      )}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            linear-gradient(180deg, transparent 62%, rgba(58,66,80,0.28) 100%)
          `,
          boxShadow: "none",
        }}
      />
    </span>
  );
}

function UpNextGlass({ track }) {
  if (!track?.title) return null;
  return (
    <div
      className="pmp-upnext-glass"
      style={{
        marginTop: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 0,
        padding: "8px 10px 8px 8px",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.48)",
        background: `
          linear-gradient(165deg, rgba(255,255,255,0.46) 0%, rgba(216,223,232,0.18) 52%, rgba(184,191,202,0.12) 100%)
        `,
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.72),
          0 10px 24px rgba(58,66,80,0.12)
        `,
        backdropFilter: glass.blurSoft,
        WebkitBackdropFilter: glass.blurSoft,
      }}
    >
      {track.albumCover ? (
        <CoverImage
          src={track.albumCover}
          alt=""
          width={36}
          height={36}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            objectFit: "cover",
            flexShrink: 0,
            boxShadow: "0 4px 10px rgba(58,66,80,0.18)",
          }}
        />
      ) : null}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.16,
            textTransform: "uppercase",
            color: color.accent,
          }}
        >
          Up next
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 13,
            fontWeight: 650,
            letterSpacing: -0.2,
            color: color.ink,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {track.title}
          {track.artist ? ` — ${track.artist}` : ""}
        </div>
      </div>
    </div>
  );
}

/**
 * HeroPlayerCard — Home now-playing device.
 * Sleeve + ice LCD on one stage; seek as a timeline; transport left,
 * Pace half-width bottom-right.
 */
export default function HeroPlayerCard({
  track = null,
  previewTrack = null,
  upNextTrack = null,
  liveShow = null,
  sceneChannel = null,
  daypart = null,
  isRadioMode = false,
  playDisabled = false,
  onPlay = null,
  onTogglePlay = null,
  onSkip = null,
  onPrev = null,
  onLike = null,
  onDislike = null,
  onOpen = null,
  onVisibilityChange = null,
  onSeek = null,
  tickerText = "",
}) {
  const isPlaying = useIsPlaying();
  const isBuffering = useIsBuffering();
  const { progress, duration: playbackDuration } = usePlayerPlayback();
  const cardRef = useRef(null);
  const live = !!track;
  const art = track?.albumCover || previewTrack?.albumCover || null;
  const hasVideo = trackHasVideo(track);
  const channelBug = resolveChannelBug({ sceneChannel, show: liveShow });
  const bugLine = channelBugLine(channelBug);
  const onAir = live || isRadioMode;
  const displayTrack = track || previewTrack;
  const duration = playbackDuration > 0 ? playbackDuration : Number(displayTrack?.duration) || 0;
  const idleEyebrow = previewTrack ? "Up first" : "Planet Radio";
  const idleTitle = previewTrack?.title || daypart?.vibe || "Tune the station";
  const idleArtist = previewTrack?.artist || "One tap and the dial finds you something good.";
  const title = live ? track.title : idleTitle;
  const artist = live ? track.artist : idleArtist;
  const album = displayTrack?.album;
  const genre = displayTrack?.genre;
  const lcdBits = trackLcdBits(displayTrack, [
    formatBitrate(displayTrack),
    album || null,
    genre || null,
    hasVideo ? "Video" : null,
  ]);

  useEffect(() => {
    if (!onVisibilityChange) return undefined;
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    let lastVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const ratio = entry.intersectionRatio;
        const next = lastVisible
          ? entry.isIntersecting && ratio >= 0.28
          : entry.isIntersecting && ratio >= 0.48;
        if (next === lastVisible) return;
        lastVisible = next;
        onVisibilityChange(next);
      },
      { threshold: [0, 0.2, 0.28, 0.35, 0.48, 0.6, 1] }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      onVisibilityChange(true);
    };
  }, [onVisibilityChange]);

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label={
        live
          ? `Now playing ${track.title} by ${track.artist}. Open player.`
          : previewTrack
            ? `Up first ${previewTrack.title} by ${previewTrack.artist}. Start the station.`
            : "Start the station"
      }
      onClick={() => (live ? onOpen?.() : !playDisabled && onPlay?.())}
      onKeyDown={(e) => {
        if (e.key === "Enter") live ? onOpen?.() : !playDisabled && onPlay?.();
      }}
      className="pmp-hero pmp-hero-bezel pmp-glass-stage"
      style={{
        ...glassStage,
        minHeight: 0,
        width: "100%",
        cursor: playDisabled && !live ? "default" : "pointer",
        WebkitTapHighlightColor: "transparent",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        aria-hidden="true"
        className="pmp-hero-wash"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
          background: `
            radial-gradient(70% 80% at 18% 20%, ${track?.color ? `${track.color}66` : color.accentSoft} 0%, transparent 62%),
            linear-gradient(180deg, rgba(216,223,232,0.28) 0%, rgba(74, 83, 96, 0.18) 100%)
          `,
        }}
      />

      <ScanlineWash />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "12px 14px 0",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <LivePlate live={onAir} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          {hasVideo && (
            <span
              aria-hidden="true"
              style={{
                padding: "5px 8px",
                borderRadius: 4,
                border: "1px solid rgba(91,101,116,0.1)",
                background: "rgba(91, 101, 116, 0.12)",
                fontFamily: fontDisplay,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: -0.08,
                textTransform: "none",
                color: color.ink,
              }}
            >
              Video
            </span>
          )}
          <ChannelIdent bugLine={bugLine} slug={channelBug.slug} />
        </div>
      </div>

      <div
        className="pmp-hero-stage"
        style={{
          position: "relative",
          zIndex: 2,
          padding: "14px 14px 6px",
        }}
      >
        {hasVideo ? (
          <div
            style={{
              position: "relative",
              flex: "1 1 220px",
              minWidth: 180,
              maxWidth: 420,
              aspectRatio: "16 / 9",
              borderRadius: 10,
              overflow: "hidden",
              border: "1px solid rgba(216,223,232,0.16)",
              boxShadow: artShadow.raised,
              background: "#4A5360",
            }}
          >
            <Suspense fallback={null}>
              <VideoStage
                track={track}
                playing={isPlaying}
                progress={progress}
                showBadge={false}
              />
            </Suspense>
          </div>
        ) : (
          <JewelSleeve
            src={art}
            idleSrc={art ? null : HERO_IDLE_ART}
            playing={live && isPlaying}
            eager={!!art}
            size={168}
          />
        )}

        <div
          key={track?.id || previewTrack?.id || "idle"}
          style={{
            flex: "1 1 0%",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            animation: "trackSwap 0.35s ease both",
          }}
        >
          <LcdPanel live={live && isPlaying} style={{ padding: "10px 12px 10px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: live ? color.lcdInk : color.lcdMute,
                opacity: 0.85,
              }}
            />
            {!live && (
              <span
                aria-hidden="true"
                style={{
                  width: 18,
                  height: 18,
                  display: "block",
                  backgroundImage: "url(/brand/planet-mascot.svg)",
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  opacity: 0.92,
                  flexShrink: 0,
                }}
              />
            )}
            <div
              style={{
                fontFamily: fontMono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.12,
                textTransform: "uppercase",
                color: color.lcdInk,
              }}
            >
              {live ? (isRadioMode ? "On air" : "Now playing") : idleEyebrow}
            </div>
          </div>

          <div
            style={{
              fontFamily: fontDisplay,
              fontStyle: "normal",
              fontSize: "clamp(18px, 4.2vw, 26px)",
              fontWeight: 700,
              letterSpacing: -0.5,
              lineHeight: 1.08,
              color: color.lcdInk,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              paddingRight: 12,
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 14,
              fontWeight: 600,
              color: color.lcdMute,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {artist}
          </div>

          <div style={{ marginTop: 8 }}>
            <LcdMetaLine bits={lcdBits} />
          </div>
          </LcdPanel>

          {live && upNextTrack?.title && (
            <UpNextGlass track={upNextTrack} />
          )}
        </div>

        {hasVideo && (
          <JewelSleeve
            src={art}
            playing={live && isPlaying}
            eager={false}
            size={96}
          />
        )}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 3,
          marginTop: "auto",
          padding: `12px ${homeSpace.gutter - 6}px 14px`,
          background: "transparent",
          borderTop: "1px solid rgba(91,101,116,0.08)",
          boxShadow: "none",
        }}
      >
        <div className="pmp-deck">
          {live ? (
            <>
              <LcdTimeline
                progress={progress}
                duration={duration}
                onChange={onSeek}
                stopPropagation
              />
              <EnergyShiftFeedback bottom="calc(100% + 10px)" />
              <div className="pmp-deck-keys">
                <PlayKey
                  isPlaying={isPlaying}
                  buffering={isBuffering}
                  onClick={onTogglePlay}
                  size={48}
                  glowing={isPlaying && !isBuffering}
                  stopPropagation
                />
                <HardwareIconButton label="Next" onClick={onSkip} stopPropagation size={40}>
                  <Icon name="skip" size={15} />
                </HardwareIconButton>
                <ChromeIconButton
                  label={track.liked ? "Unlike" : "Like"}
                  icon={track.liked ? "heart" : "heartempty"}
                  active={!!track.liked}
                  onClick={() => onLike?.(track.id)}
                  size={36}
                  iconSize={15}
                />
                {onDislike && (
                  <ChromeIconButton
                    label="Dislike this track"
                    icon={track.disliked ? "dislikefilled" : "dislike"}
                    active={!!track.disliked}
                    onClick={() => onDislike()}
                    size={36}
                    iconSize={15}
                  />
                )}
              </div>
              <PaceSlot compact stopPropagation />
            </>
          ) : (
            <button
              type="button"
              aria-label="Start the station"
              disabled={playDisabled}
              onClick={(e) => {
                e.stopPropagation();
                onPlay?.();
              }}
              className="pmp-press play-primary"
              style={{
                ...BTN_PRIMARY,
                width: "auto",
                height: 44,
                padding: "0 22px",
                opacity: playDisabled ? 0.6 : 1,
                cursor: playDisabled ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icon name="play" size={15} />
              Start listening
            </button>
          )}
        </div>

        {tickerText ? (
          <div
            aria-hidden="true"
            style={{
              marginTop: 10,
              overflow: "hidden",
              maskImage: "linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)",
            }}
          >
            <div
              className="pmp-ticker-track"
              style={{
                display: "inline-block",
                whiteSpace: "nowrap",
                fontFamily: fontDisplay,
                fontSize: 13,
                fontWeight: 400,
                letterSpacing: -0.08,
                textTransform: "none",
                color: color.muted,
              }}
            >
              {tickerText} · {tickerText} ·
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
