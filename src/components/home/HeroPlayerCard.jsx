import { useEffect, useRef, lazy, Suspense } from "react";
import {
  artShadow,
  color,
  fontDisplay,
  fontMono,
  fontPoster,
  glassStage,
  homeSpace,
  mtv,
  y2k,
} from "../../theme";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { useIsBuffering, useIsPlaying } from "../../usePlayerTransport";
import {
  channelBugLine,
  onInk,
  resolveChannelBug,
} from "../../lib/mtvChannel";
import { trackHasVideo } from "../../lib/video";
import CoverImage from "../ui/CoverImage";
import { HERO_IDLE_ART, HERO_IDLE_FOCUS } from "../../lib/heroIdle";
import {
  LcdMetaLine,
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
      }}
    />
  );
}

/**
 * CH plate. On a tuned station it is printed in that station's ink — the same colour as its
 * card on the dial — so Home says which channel you are on. The live feed keeps the white sticker.
 */
function ChannelIdent({ bugLine, slug, ink = null }) {
  const plate = ink || mtv.plate;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        overflow: "hidden",
        borderRadius: 2,
        border: `1px solid ${plate}`,
        background: "rgba(0,0,0,0.55)",
        maxWidth: "100%",
      }}
    >
      <span
        style={{
          padding: "5px 9px",
          fontFamily: fontPoster,
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: mtv.caps,
          color: ink ? onInk(ink) : mtv.plateInk,
          background: plate,
          whiteSpace: "nowrap",
        }}
      >
        {bugLine.split(" · ")[0]}
      </span>
      <span
        style={{
          padding: "5px 10px",
          fontFamily: fontPoster,
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: mtv.caps,
          textTransform: "uppercase",
          color: mtv.plate,
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
      className="pmp-hero-sleeve pmp-hero-sleeve--square"
      style={{
        position: "relative",
        display: "block",
        width: "min(100%, 320px)",
        alignSelf: "center",
        aspectRatio: "1 / 1",
        flexShrink: 0,
        borderRadius: 0,
        overflow: "hidden",
        border: "3px solid #F1E5D7",
        boxShadow: "6px 6px 0 #F1E5D7",
        transform: "rotate(-1.5deg)",
        background: wellColor || "#0E1116",
      }}
    >
      {art ? (
        <CoverImage
          key={art}
          src={art}
          alt=""
          width={Math.max(size, 960)}
          height={Math.max(size, 960)}
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
    </span>
  );
}

function UpNextGlass({ track }) {
  if (!track?.title) return null;
  return (
    <div
      className="pmp-upnext-glass"
      style={{
        marginTop: 14,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderRadius: 0,
        background: "transparent",
        border: "none",
        borderTop: "1px dotted rgba(241,229,215,0.55)",
      }}
    >
      {track.albumCover ? (
        <span style={{ display: "block", width: 40, height: 40, flexShrink: 0, borderRadius: 0, overflow: "hidden" }}>
          <CoverImage
            src={track.albumCover}
            alt=""
            width={40}
            height={40}
            wellColor={track.color || ""}
            style={{
              width: 40,
              height: 40,
              borderRadius: 0,
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        </span>
      ) : null}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontFamily: fontPoster,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: mtv.caps,
            textTransform: "uppercase",
            color: color.muted,
          }}
        >
          Up next
        </div>
        <div
          style={{
            marginTop: 1,
            fontSize: 14,
            fontWeight: 600,
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
          background: "transparent",
        }}
      />

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
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          {hasVideo && (
            <span
              aria-hidden="true"
              style={{
                padding: "5px 10px",
                borderRadius: 0,
                border: "2px solid #F1E5D7",
                background: "transparent",
                fontFamily: fontMono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: color.ink,
              }}
            >
              Video
            </span>
          )}
          <ChannelIdent bugLine={bugLine} slug={channelBug.slug} ink={sceneChannel?.accent || null} />
        </div>
      </div>

      <div
        className={`pmp-hero-stage${hasVideo ? "" : " pmp-hero-stage--split"}`}
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
              borderRadius: 0,
              overflow: "hidden",
              border: "3px solid #F1E5D7",
              boxShadow: artShadow.raised,
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
          <div
            className="pmp-hero-id"
            style={{ position: "relative", padding: "2px 0" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
                fontFamily: fontMono,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: color.muted,
              }}
            >
              {!live && (
                <span
                  aria-hidden="true"
                  style={{
                    width: 16,
                    height: 16,
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
              {live ? "Now playing" : idleEyebrow}
            </div>

            <div
              style={{
                fontFamily: fontPoster,
                fontStyle: "normal",
                fontSize: "clamp(48px, 8vw, 92px)",
                fontWeight: 400,
                letterSpacing: -0.3,
                lineHeight: 0.84,
                textTransform: "uppercase",
                color: color.ink,
                textShadow: "0.045em 0.045em 0 #F74D7A",
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
                marginTop: 6,
                fontFamily: fontDisplay,
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: -0.2,
                color: color.body,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {artist}
            </div>

            <div style={{ marginTop: 10, color: color.muted }}>
              <LcdMetaLine bits={lcdBits} on="metal" />
            </div>
          </div>
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

        {live && upNextTrack?.title && (
          <UpNextGlass track={upNextTrack} />
        )}

        {tickerText ? (
          <div
            aria-hidden="true"
            className="pmp-hero-ticker"
            style={{
              marginTop: 12,
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
                  <span style={{ margin: "0 16px" }}>✦</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
