import { useEffect, useRef, lazy, Suspense } from "react";
import {
  artFrameStyle,
  artShadow,
  color,
  fontDisplay,
  homeSpace,
  y2k,
} from "../../theme";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { useIsBuffering, useIsPlaying } from "../../usePlayerTransport";
import {
  STATION_CALLSIGN,
  channelBugLine,
  resolveChannelBug,
} from "../../lib/mtvChannel";
import { trackHasVideo } from "../../lib/video";
import Icon from "../ui/Icon";
import CoverImage from "../ui/CoverImage";
import { IceOrbPlay } from "../player/OrbitalControls";
import { EnergyShiftControl } from "../listen/EnergyShiftButton";
import { HERO_IDLE_ART, HERO_IDLE_FOCUS } from "../../lib/channelArt";
import ScanlineWash from "./ScanlineWash";

const VideoStage = lazy(() => import("../station/VideoStage"));

function fmtTime(secs = 0) {
  if (!Number.isFinite(secs) || secs < 0) secs = 0;
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function MetaChip({ children }) {
  if (!children) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        maxWidth: "100%",
        padding: "3px 8px",
        borderRadius: 980,
        border: "none",
        background: "rgba(255,255,255,0.72)",
        fontFamily: fontDisplay,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: -0.08,
        textTransform: "none",
        color: color.ink,
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
        borderRadius: 980,
        background: live ? "rgba(224,49,74,0.12)" : "rgba(255,255,255,0.72)",
        border: "none",
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
          background: live ? y2k.live : "rgba(28,32,40,0.28)",
          boxShadow: "none",
        }}
      />
      <span
        style={{
          fontFamily: fontDisplay,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: -0.08,
          textTransform: "none",
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
        borderRadius: 980,
        border: "none",
        background: "rgba(255,255,255,0.78)",
        maxWidth: "100%",
      }}
    >
      <span
        style={{
          padding: "6px 9px",
          fontFamily: fontDisplay,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: -0.08,
          color: y2k.offWhite,
          borderRight: "1px solid rgba(28,32,40,0.1)",
          background: "rgba(255,255,255,0.55)",
          whiteSpace: "nowrap",
        }}
      >
        {bugLine.split(" · ")[0]}
      </span>
      <span
        style={{
          padding: "6px 10px",
          fontFamily: fontDisplay,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: -0.08,
          textTransform: "none",
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
    <button
      type="button"
      aria-label={label}
      aria-pressed={active || undefined}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="pmp-press"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        border: "none",
        background: active
          ? "linear-gradient(180deg, #FFFFFF 0%, #E8EBEF 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(232,236,242,0.78) 100%)",
        color: y2k.offWhite,
        boxShadow: "none",
        flexShrink: 0,
      }}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
}

function JewelSleeve({ src, idleSrc, playing, eager = false, size = 148 }) {
  const art = src || idleSrc;
  return (
    <span
      className="pmp-hero-sleeve"
      style={{
        ...artFrameStyle({ size, radius: 8, active: playing }),
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
            linear-gradient(180deg, transparent 62%, rgba(0,0,0,0.28) 100%)
          `,
          boxShadow: "none",
        }}
      />
    </span>
  );
}

/**
 * HeroPlayerCard — Home now-playing.
 * Music.app featured cut: cover-first, soft container, restrained chrome.
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
  const { progress, duration } = usePlayerPlayback();
  const cardRef = useRef(null);
  const live = !!track;
  const art = track?.albumCover || previewTrack?.albumCover || null;
  const hasVideo = trackHasVideo(track);
  const channelBug = resolveChannelBug({ sceneChannel, show: liveShow });
  const bugLine = channelBugLine(channelBug);
  const onAir = live || isRadioMode;
  const displayTrack = track || previewTrack;
  const idleEyebrow = previewTrack ? "Up first" : "Planet Radio";
  const idleTitle = previewTrack?.title || daypart?.vibe || "Tune the station";
  const idleArtist = previewTrack?.artist || "One tap and the dial finds you something good.";
  const title = live ? track.title : idleTitle;
  const artist = live ? track.artist : idleArtist;
  const album = displayTrack?.album;
  const genre = displayTrack?.genre;
  const bpm = displayTrack?.bpm;
  const pct = duration > 0 ? Math.min(1, progress / duration) : 0;

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
      className="pmp-hero pmp-hero-bezel"
      style={{
        position: "relative",
        borderRadius: 18,
        overflow: "hidden",
        minHeight: 300,
        width: "100%",
        cursor: playDisabled && !live ? "default" : "pointer",
        border: "1px solid rgba(28,32,40,0.12)",
        boxShadow: "0 16px 36px rgba(28,32,40,0.12)",
        background: "linear-gradient(180deg, #F7F8FA 0%, #E8EBEF 100%)",
        WebkitTapHighlightColor: "transparent",
        isolation: "isolate",
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
            radial-gradient(70% 80% at 18% 20%, ${track?.color ? `${track.color}22` : "rgba(30,111,232,0.08)"} 0%, transparent 58%),
            linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(232,236,242,0.35) 100%)
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
          <span
            style={{
              fontFamily: fontDisplay,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: -0.16,
              color: y2k.offWhite,
            }}
          >
            {STATION_CALLSIGN}
          </span>
          <LivePlate live={onAir} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          {hasVideo && (
            <span
              aria-hidden="true"
              style={{
                padding: "5px 8px",
                borderRadius: 12,
                border: "1px solid rgba(28,32,40,0.1)",
                background: "rgba(255,255,255,0.78)",
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
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "stretch",
          gap: 16,
          padding: "16px 14px 8px",
          flexWrap: "wrap",
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
              border: "1px solid rgba(255,255,255,0.16)",
              boxShadow: artShadow.raised,
              background: "#07080A",
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
            size={220}
          />
        )}

        <div
          key={track?.id || previewTrack?.id || "idle"}
          style={{
            flex: "1 1 0%",
            minWidth: 200,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            animation: "trackSwap 0.35s ease both",
          }}
        >
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
                background: y2k.offWhite,
                opacity: 0.55,
              }}
            />
            <div
              style={{
                fontFamily: fontDisplay,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: -0.12,
                textTransform: "none",
                color: color.muted,
              }}
            >
              {live ? (isRadioMode ? "On air" : "Now playing") : idleEyebrow}
            </div>
          </div>

          <div
            style={{
              fontFamily: fontDisplay,
              fontStyle: "normal",
              fontSize: "clamp(24px, 5.6vw, 36px)",
              fontWeight: 700,
              letterSpacing: -0.7,
              lineHeight: 1.02,
              color: y2k.offWhite,
              textShadow: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 15,
              fontWeight: 600,
              color: color.body,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {artist}
          </div>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            {album ? <MetaChip>{album}</MetaChip> : null}
            {genre ? <MetaChip>{genre}</MetaChip> : null}
            {bpm ? <MetaChip>{Math.round(Number(bpm))} BPM</MetaChip> : null}
            {live ? <MetaChip>Stereo</MetaChip> : <MetaChip>{STATION_CALLSIGN} Live</MetaChip>}
            {hasVideo ? <MetaChip>Music video</MetaChip> : null}
          </div>

          {live && upNextTrack?.title && (
            <div
              style={{
                marginTop: "auto",
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "8px 0 0",
                borderRadius: 0,
                border: "none",
                background: "transparent",
              }}
            >
              {upNextTrack.albumCover ? (
                <CoverImage
                  src={upNextTrack.albumCover}
                  alt=""
                  width={36}
                  height={36}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 4,
                    objectFit: "cover",
                    flexShrink: 0,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
                  }}
                />
              ) : null}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: fontDisplay,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: -0.08,
                    textTransform: "none",
                    color: "rgba(244,246,248,0.55)",
                  }}
                >
                  Up next
                </div>
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "rgba(244,246,248,0.82)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {upNextTrack.title}
                  {upNextTrack.artist ? ` — ${upNextTrack.artist}` : ""}
                </div>
              </div>
            </div>
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
          borderTop: "1px solid rgba(28,32,40,0.08)",
          boxShadow: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {live ? (
            <>
              <ChromeIconButton label="Previous" icon="prev" onClick={onPrev} />
              <IceOrbPlay
                isPlaying={isPlaying}
                buffering={isBuffering}
                onClick={onTogglePlay}
                size={52}
                glowing={isPlaying && !isBuffering}
                stopPropagation
              />
              <ChromeIconButton label="Next" icon="skip" onClick={onSkip} />
              <div
                role={onSeek && duration ? "slider" : undefined}
                aria-label={onSeek && duration ? "Seek" : undefined}
                aria-valuemin={onSeek && duration ? 0 : undefined}
                aria-valuemax={onSeek && duration ? Math.floor(duration) : undefined}
                aria-valuenow={onSeek && duration ? Math.floor(progress) : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!onSeek || !duration) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - rect.left) / Math.max(1, rect.width);
                  onSeek(Math.max(0, Math.min(1, x)) * duration);
                }}
                style={{
                  flex: "1 1 140px",
                  minWidth: 120,
                  height: onSeek && duration ? 14 : 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: onSeek && duration ? "pointer" : "default",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 999,
                    background: "rgba(28,32,40,0.12)",
                    overflow: "hidden",
                    boxShadow: "none",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct * 100}%`,
                      background: "linear-gradient(90deg, #6FBF3A 0%, #8CD45A 100%)",
                      borderRadius: 999,
                      boxShadow: "none",
                      transition: "width 0.2s linear",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: fontDisplay,
                    fontSize: 12,
                    fontVariantNumeric: "tabular-nums",
                    color: "rgba(244,246,248,0.55)",
                    letterSpacing: -0.08,
                    flexShrink: 0,
                  }}
                >
                  {fmtTime(progress)}
                  {duration ? ` / ${fmtTime(duration)}` : ""}
                </span>
              </div>
              <ChromeIconButton
                label={track.liked ? "Unlike" : "Like"}
                icon={track.liked ? "heart" : "heartempty"}
                active={!!track.liked}
                onClick={() => onLike?.(track.id)}
              />
              {onDislike && (
                <ChromeIconButton
                  label="Dislike this track"
                  icon={track.disliked ? "dislikefilled" : "dislike"}
                  active={!!track.disliked}
                  onClick={() => onDislike()}
                />
              )}
              <EnergyShiftControl size={40} stopPropagation={false} />
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
                height: 44,
                padding: "0 22px",
                borderRadius: 980,
                border: "none",
                background: playDisabled
                  ? "rgba(197,202,211,0.65)"
                  : "linear-gradient(180deg, #6FB4F8 0%, #1E6FE8 100%)",
                color: playDisabled ? color.muted : "#FFFFFF",
                fontFamily: fontDisplay,
                fontSize: 16,
                fontWeight: 600,
                fontStyle: "normal",
                letterSpacing: -0.2,
                textTransform: "none",
                cursor: playDisabled ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: playDisabled
                  ? "none"
                  : "inset 0 1px 0 rgba(255,255,255,0.4), 0 6px 16px rgba(30,111,232,0.28)",
                opacity: playDisabled ? 0.6 : 1,
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
                color: "rgba(244,246,248,0.5)",
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
