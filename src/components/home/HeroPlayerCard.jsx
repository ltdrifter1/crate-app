import { useEffect, useRef, lazy, Suspense } from "react";
import {
  color,
  fontDisplay,
  fontPoster,
  homeSpace,
  mtv,
  y2k,
} from "../../theme";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { useIsBuffering, useIsPlaying } from "../../usePlayerTransport";
import {
  STATION_CALLSIGN,
  channelBugLine,
  resolveChannelBug,
} from "../../lib/mtvChannel";
import ChannelIdent from "../station/ChannelIdent";
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

/**
 * The picture. The sleeve fills the frame like a video still — cropped, not
 * blurred — and the lower third sits on it. No art yet: the idle editorial
 * plate, contained, so the frame is never empty.
 */
function ScreenArt({ src, idleSrc, playing, wellColor = "" }) {
  const art = src || idleSrc;
  const isIdlePlate = !src && !!idleSrc;
  return (
    <span
      className="pmp-hero-sleeve pmp-hero-screen-art"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        display: "block",
        overflow: "hidden",
        background: isIdlePlate ? y2k.artGradient : wellColor || "#0E1116",
      }}
    >
      {art ? (
        <CoverImage
          key={art}
          src={art}
          alt=""
          width={1200}
          height={1200}
          sizes="(min-width: 900px) 1100px, 100vw"
          eager
          priority
          raw={isIdlePlate}
          objectPosition={isIdlePlate ? HERO_IDLE_FOCUS : "50% 32%"}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: isIdlePlate ? "contain" : "cover",
            objectPosition: isIdlePlate ? HERO_IDLE_FOCUS : "50% 32%",
            padding: isIdlePlate ? "10%" : 0,
            transform: playing ? "scale(1.02)" : "scale(1)",
            transition: "transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          draggable={false}
        />
      ) : null}
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
        padding: "9px 12px 9px 9px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {track.albumCover ? (
        <span style={{ display: "block", width: 40, height: 40, flexShrink: 0, borderRadius: 8, overflow: "hidden" }}>
          <CoverImage
            src={track.albumCover}
            alt=""
            width={40}
            height={40}
            wellColor={track.color || ""}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
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
 * HeroPlayerCard — Home is a channel, and this is the screen.
 *
 * One frame: the sleeve fills it like a music-video still, LIVE and the CH
 * ident sit in the corners, the title is a lower third cut into the picture,
 * and the station callsign watermarks the bottom-right. Below the frame, a
 * flat control strip: timeline, transport, Slow / Fast, up next, the crawl.
 * No bezel, no glass, no logo — type and the picture do the work.
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
  const wellColor = track?.color || previewTrack?.color || "";

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
      className="pmp-hero pmp-glass-stage"
      style={{
        position: "relative",
        isolation: "isolate",
        overflow: "hidden",
        width: "100%",
        minHeight: 0,
        borderRadius: 20,
        background: "#0A0D11",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 24px 60px rgba(6,10,16,0.55)",
        cursor: playDisabled && !live ? "default" : "pointer",
        WebkitTapHighlightColor: "transparent",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── The screen ─────────────────────────────────────────────── */}
      <div
        className={`pmp-hero-screen${hasVideo ? " pmp-hero-screen--video" : ""}`}
        style={{
          position: "relative",
          width: "100%",
          overflow: "hidden",
          background: wellColor || "#0E1116",
        }}
      >
        {hasVideo ? (
          <span className="pmp-hero-sleeve" style={{ position: "absolute", inset: 0, display: "block" }}>
            <Suspense fallback={null}>
              <VideoStage
                track={track}
                playing={isPlaying}
                progress={progress}
                showBadge={false}
              />
            </Suspense>
          </span>
        ) : (
          <ScreenArt
            src={art}
            idleSrc={art ? null : HERO_IDLE_ART}
            playing={live && isPlaying}
            wellColor={wellColor}
          />
        )}

        {/* Scrim: dark at the foot for the lower third, a breath at the head for the bugs. */}
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
              linear-gradient(180deg, rgba(6,8,12,0) 42%, rgba(6,8,12,0.58) 68%, rgba(6,8,12,0.94) 100%)
            `,
          }}
        />

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
            {live && (
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
            <ChannelIdent bugLine={bugLine} slug={channelBug.slug} ink={sceneChannel?.accent || null} />
          </div>
        </div>

        {/* Lower third */}
        <div
          key={track?.id || previewTrack?.id || "idle"}
          className="pmp-hero-id"
          style={{
            position: "absolute",
            zIndex: 2,
            left: 0,
            right: 0,
            bottom: 0,
            padding: "0 18px 16px 18px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 16,
            animation: "trackSwap 0.35s ease both",
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
                background: live ? mtv.hot : "rgba(255,255,255,0.55)",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
                fontFamily: fontPoster,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: mtv.caps,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.78)",
                textShadow: "0 1px 10px rgba(6,8,12,0.6)",
              }}
            >
              {live ? "Now playing" : idleEyebrow}
            </div>
            <div
              className="pmp-hero-title"
              style={{
                fontFamily: fontPoster,
                fontSize: "clamp(38px, 11vw, 72px)",
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
              {title}
            </div>
            <div
              style={{
                marginTop: 7,
                fontFamily: fontDisplay,
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: -0.2,
                color: "rgba(255,255,255,0.92)",
                textShadow: "0 1px 10px rgba(6,8,12,0.6)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {artist}
            </div>
            <div
              className="pmp-hero-meta"
              style={{
                marginTop: 8,
                textShadow: "0 1px 8px rgba(6,8,12,0.6)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <LcdMetaLine bits={lcdBits} on="lcd" inline />
            </div>
          </div>

          {/* Station watermark — the bug every frame carries. */}
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
              textShadow: "0 1px 8px rgba(6,8,12,0.6)",
              paddingBottom: 2,
            }}
          >
            {STATION_CALLSIGN}
          </span>
        </div>
      </div>

      {/* ── The control strip ──────────────────────────────────────── */}
      <div
        className="pmp-hero-deck"
        style={{
          position: "relative",
          zIndex: 3,
          padding: `10px ${homeSpace.gutter - 6}px 12px`,
          background: "#0A0D11",
          borderTop: "1px solid rgba(255,255,255,0.07)",
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
                  <span style={{ color: mtv.hot, margin: "0 16px" }}>■</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
