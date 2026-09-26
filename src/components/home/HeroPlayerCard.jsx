import { useEffect, useRef, lazy, Suspense } from "react";
import {
  artShadow,
  color,
  fontDisplay,
  fontMono,
  fontPoster,
  glass,
  glassStage,
  homeSpace,
  trim,
  y2k,
} from "../../theme";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { useIsBuffering, useIsPlaying } from "../../usePlayerTransport";
import {
  channelBugLine,
  resolveChannelBug,
} from "../../lib/mtvChannel";
import { trackHasVideo } from "../../lib/video";
import CoverImage from "../ui/CoverImage";
import { HERO_IDLE_ART, HERO_IDLE_FOCUS } from "../../lib/heroIdle";
import ScanlineWash from "./ScanlineWash";
import {
  LcdMetaLine,
  LcdPanel,
  formatBitrate,
  trackLcdBits,
} from "../player/DeviceChrome";
import PlayerDeck from "../player/PlayerDeck";

const VideoStage = lazy(() => import("../station/VideoStage"));

function PlanetPip({ size = 26 }) {
  return (
    <span
      aria-hidden="true"
      className="pmp-planet-pip"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: "block",
        backgroundImage: "url(/brand/planet-mascot.svg)",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        filter: `drop-shadow(0 0 8px ${trim.blue}88)`,
      }}
    />
  );
}

function ChannelIdent({ bugLine, slug }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        overflow: "hidden",
        borderRadius: 2,
        border: "1px solid rgba(255,212,0,0.45)",
        background: "rgba(0,0,0,0.55)",
        maxWidth: "100%",
      }}
    >
      <span
        style={{
          padding: "5px 8px",
          fontFamily: fontPoster,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 0.12,
          color: "#1C222B",
          borderRight: "1px solid rgba(255,212,0,0.45)",
          background: color.accent,
          whiteSpace: "nowrap",
        }}
      >
        {bugLine.split(" · ")[0]}
      </span>
      <span
        style={{
          padding: "5px 10px",
          fontFamily: fontPoster,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 0.08,
          textTransform: "uppercase",
          color: color.accent,
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

function JewelSleeve({ src, idleSrc, playing, eager = false, size = 148, wellColor = "" }) {
  const art = src || idleSrc;
  return (
    <span
      className="pmp-hero-sleeve"
      style={{
        position: "relative",
        display: "block",
        width: "100%",
        aspectRatio: "16 / 9",
        flexShrink: 0,
        borderRadius: 4,
        overflow: "hidden",
        border: playing ? `2px solid ${color.accent}` : "1px solid rgba(255,255,255,0.12)",
        boxShadow: playing ? artShadow.active : artShadow.raised,
        background: wellColor || "#0E1116",
      }}
    >
      {art ? (
        <CoverImage
          key={art}
          src={art}
          alt=""
          width={Math.max(size, 960)}
          height={Math.round(Math.max(size, 960) * 9 / 16)}
          priority={eager}
          eager={eager}
          wellColor={wellColor}
          raw={!src}
          objectPosition={!src ? HERO_IDLE_FOCUS : "center"}
          className="pmp-hero-art"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            animation: "fadeIn 0.55s ease both",
            transform: playing ? "scale(1.06)" : "scale(1)",
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
            repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0 1px, transparent 1px 3px),
            linear-gradient(180deg, rgba(0,0,0,0.18) 0%, transparent 28%, transparent 52%, rgba(0,0,0,0.78) 100%)
          `,
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
        minWidth: 0,
        padding: 2,
        borderRadius: 16,
        background: trim.gradient,
        boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minWidth: 0,
          padding: "8px 10px 8px 8px",
          borderRadius: 14,
          background:
            "linear-gradient(165deg, rgba(42,50,60,0.96) 0%, rgba(28,34,43,0.94) 100%)",
          boxShadow: "inset 0 1px 0 rgba(200,210,222,0.16)",
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
          wellColor={track.color || ""}
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
    </div>
  );
}

/**
 * HeroPlayerCard — Home now-playing device.
 * Sleeve + LCD on one stage; seek as a timeline; Slow / Fast on the deck.
 */
export default function HeroPlayerCard({
  track = null,
  previewTrack = null,
  upNextTrack = null,
  liveShow = null,
  sceneChannel = null,
  daypart: _daypart = null,
  isRadioMode: _isRadioMode = false,
  playDisabled = false,
  onPlay = null,
  onTogglePlay = null,
  onSkip = null,
  onPrev = null,
  onLike = null,
  onDislike = null,
  onShare = null,
  onShowQueue = null,
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
  const displayTrack = track || previewTrack;
  const duration = playbackDuration > 0 ? playbackDuration : Number(displayTrack?.duration) || 0;
  const idleEyebrow = previewTrack ? "Up first" : "Ready";
  const idleTitle = previewTrack?.title || "Your player";
  const idleArtist = previewTrack?.artist || "Tap play to start.";
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
            ? `Up first ${previewTrack.title} by ${previewTrack.artist}. Start listening.`
            : "Start listening"
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
            radial-gradient(70% 80% at 18% 20%, ${track?.color ? `${track.color}55` : color.accentSoft} 0%, transparent 62%),
            linear-gradient(180deg, rgba(255,212,0,0.08) 0%, rgba(0,0,0,0.4) 100%)
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
          <PlanetPip />
          {live && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px",
                borderRadius: 2,
                background: color.alert,
                color: "#fff",
                fontFamily: fontPoster,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.16,
              }}
            >
              LIVE
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          {hasVideo && (
            <span
              aria-hidden="true"
              style={{
                padding: "5px 10px",
                borderRadius: 980,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.06)",
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
          padding: "12px 14px 6px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {hasVideo ? (
          <div
            className="pmp-hero-sleeve"
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
              borderRadius: 4,
              overflow: "hidden",
              border: `2px solid ${color.accent}`,
              boxShadow: artShadow.active,
              background: "#0E1116",
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
            size={200}
            wellColor={track?.color || previewTrack?.color || ""}
          />
        )}

        <div
          key={track?.id || previewTrack?.id || "idle"}
          style={{
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            animation: "trackSwap 0.35s ease both",
          }}
        >
          <LcdPanel live={live && isPlaying} style={{ padding: "12px 14px 12px", borderRadius: 4 }}>
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
                width: 8,
                height: 8,
                borderRadius: 1,
                background: live ? color.alert : color.lcdMute,
                opacity: 0.95,
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
                fontFamily: fontPoster,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: 0.16,
                textTransform: "uppercase",
                color: color.accent,
              }}
            >
              {live ? "Now playing" : idleEyebrow}
            </div>
          </div>

          <div
            style={{
              fontFamily: fontPoster,
              fontStyle: "normal",
              fontSize: "clamp(22px, 5vw, 32px)",
              fontWeight: 800,
              letterSpacing: -0.4,
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
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 3,
          marginTop: "auto",
          padding: `12px ${homeSpace.gutter - 6}px 14px`,
          background: "transparent",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "none",
        }}
      >
        <PlayerDeck
          idle={!live}
          playDisabled={playDisabled}
          onStart={onPlay}
          progress={progress}
          duration={duration}
          onSeek={live ? onSeek : null}
          isPlaying={isPlaying}
          buffering={isBuffering}
          onTogglePlay={onTogglePlay}
          onPrev={live ? onPrev : null}
          onSkip={live ? onSkip : null}
          onLike={live && onLike ? () => onLike(track.id) : null}
          onDislike={live ? onDislike : null}
          onShare={live && onShare ? () => onShare(track) : null}
          onShowQueue={live ? onShowQueue : null}
          liked={!!track?.liked}
          disliked={!!track?.disliked}
        />

        {tickerText ? (
          <div
            aria-hidden="true"
            className="pmp-hero-ticker"
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
