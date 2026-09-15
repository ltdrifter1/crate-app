import { useEffect, useRef, lazy, Suspense } from "react";
import {
  artFrameStyle,
  artShadow,
  broadcast,
  fontDisplay,
  fontMono,
  homeSpace,
  radio,
  y2k,
} from "../../theme";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { useIsBuffering, useIsPlaying } from "../../usePlayerTransport";
import {
  STATION_CALLSIGN,
  STATION_FREQ,
  channelBugLine,
  resolveChannelBug,
} from "../../lib/mtvChannel";
import { trackHasVideo } from "../../lib/video";
import Icon from "../ui/Icon";
import CoverImage from "../ui/CoverImage";
import { IceOrbPlay } from "../player/OrbitalControls";
import { EnergyShiftControl } from "../listen/EnergyShiftButton";
import { HERO_IDLE_ART, HERO_IDLE_FOCUS } from "../../lib/channelArt";

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
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(8,10,13,0.45)",
        fontFamily: fontMono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.7,
        textTransform: "uppercase",
        color: "rgba(244,246,248,0.78)",
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
        padding: "5px 9px 5px 8px",
        borderRadius: 4,
        background: live ? "rgba(255,51,79,0.16)" : "rgba(8,10,13,0.55)",
        border: live
          ? "1px solid rgba(255,51,79,0.55)"
          : "1px solid rgba(255,255,255,0.12)",
        boxShadow: live ? "0 0 16px rgba(255,51,79,0.18)" : "none",
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
          background: live ? y2k.live : "rgba(247,248,250,0.35)",
          boxShadow: live ? "0 0 8px rgba(255,51,79,0.85)" : "none",
        }}
      />
      <span
        style={{
          fontFamily: fontMono,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: live ? y2k.offWhite : "rgba(244,246,248,0.55)",
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
        border: "1px solid rgba(255,255,255,0.16)",
        background: "rgba(8,10,13,0.62)",
        maxWidth: "100%",
      }}
    >
      <span
        style={{
          padding: "6px 9px",
          fontFamily: fontMono,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.6,
          color: y2k.cyan,
          borderRight: "1px solid rgba(255,255,255,0.1)",
          background:
            "linear-gradient(180deg, rgba(101,230,255,0.12) 0%, rgba(8,10,13,0.2) 100%)",
          whiteSpace: "nowrap",
        }}
      >
        {bugLine.split(" · ")[0]}
      </span>
      <span
        style={{
          padding: "6px 10px",
          fontFamily: fontMono,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 0.9,
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
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        border: `1px solid ${active ? "rgba(231,235,240,0.32)" : "rgba(255,255,255,0.12)"}`,
        background: active
          ? "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%)"
          : radio.moduleFace,
        color: y2k.offWhite,
        boxShadow: active
          ? "inset 0 1px 0 rgba(255,255,255,0.28), 0 0 14px rgba(101,230,255,0.12)"
          : "inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.45)",
        flexShrink: 0,
      }}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
}

function JewelSleeve({ src, idleSrc, playing, priority, size = 148 }) {
  const art = src || idleSrc;
  return (
    <span
      className="pmp-hero-sleeve"
      style={{
        ...artFrameStyle({ size, radius: 10, active: playing }),
        flexShrink: 0,
        boxShadow: playing ? artShadow.active : artShadow.raised,
      }}
    >
      {art ? (
        <CoverImage
          key={art}
          src={art}
          alt=""
          width={size * 2}
          height={size * 2}
          priority={priority}
          eager={!priority}
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
            filter: playing ? "saturate(1.14) contrast(1.08)" : "saturate(1.05) contrast(1.04)",
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
            linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 38%),
            linear-gradient(180deg, transparent 58%, rgba(8,10,13,0.38) 100%)
          `,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), inset 0 0 0 1px rgba(255,255,255,0.08)",
        }}
      />
    </span>
  );
}

/**
 * HeroPlayerCard — Home stage.
 * Modern MTV deck: framed sleeve (not full-bleed), channel ident, lower-third copy, hardware transport.
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
        borderRadius: 16,
        overflow: "hidden",
        minHeight: 280,
        width: "100%",
        cursor: playDisabled && !live ? "default" : "pointer",
        border: broadcast.bezelBorder,
        background: y2k.artGradient,
        WebkitTapHighlightColor: "transparent",
        isolation: "isolate",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
        <CoverImage
          src={art || HERO_IDLE_ART}
          alt=""
          width={720}
          height={720}
          eager
          raw={!art}
          objectPosition={!art ? HERO_IDLE_FOCUS : "center"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scale(1.18)",
            filter: "blur(28px) saturate(1.2) brightness(0.42)",
            opacity: 0.9,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(80% 70% at 12% 20%, ${track?.color ? `${track.color}33` : "rgba(101,230,255,0.14)"} 0%, transparent 58%),
              linear-gradient(180deg, rgba(8,10,13,0.28) 0%, rgba(8,10,13,0.72) 100%)
            `,
          }}
        />
      </div>

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
              fontFamily: fontMono,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.6,
              color: y2k.cyan,
              textShadow: "0 0 12px rgba(101,230,255,0.35)",
            }}
          >
            {STATION_CALLSIGN}
          </span>
          <span aria-hidden="true" style={{ width: 1, height: 11, background: "rgba(255,255,255,0.18)" }} />
          <span
            style={{
              fontFamily: fontMono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.2,
              color: "rgba(244,246,248,0.62)",
            }}
          >
            {STATION_FREQ}
          </span>
          <LivePlate live={onAir} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          {hasVideo && (
            <span
              aria-hidden="true"
              style={{
                padding: "5px 8px",
                borderRadius: 4,
                border: "1px solid rgba(200,242,65,0.35)",
                background: "rgba(200,242,65,0.12)",
                fontFamily: fontMono,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                color: y2k.neon,
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
            priority
            size={148}
          />
        )}

        <div
          key={track?.id || previewTrack?.id || "idle"}
          style={{
            flex: "1 1 180px",
            minWidth: 0,
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
                width: 28,
                height: 4,
                borderRadius: 1,
                background: y2k.neon,
                boxShadow: "0 0 10px rgba(200,242,65,0.55)",
              }}
            />
            <div
              style={{
                fontFamily: fontMono,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: y2k.neon,
              }}
            >
              {live ? (isRadioMode ? "On air" : "Now playing") : idleEyebrow}
            </div>
          </div>

          <div
            style={{
              fontFamily: fontDisplay,
              fontSize: "clamp(22px, 5.2vw, 34px)",
              fontWeight: 780,
              letterSpacing: -0.8,
              lineHeight: 1.05,
              color: y2k.offWhite,
              textShadow: "0 2px 18px rgba(0,0,0,0.45)",
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
              color: "rgba(244,246,248,0.78)",
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
                marginTop: 14,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(8,10,13,0.42)",
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
                    fontFamily: fontMono,
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: 1.3,
                    textTransform: "uppercase",
                    color: "rgba(101,230,255,0.85)",
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
            priority={false}
            size={96}
          />
        )}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 3,
          marginTop: "auto",
          padding: `10px ${homeSpace.gutter - 6}px 12px`,
          background: `
            linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 36%, transparent 100%),
            rgba(8,10,13,0.55)
          `,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
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
              <span style={{ flex: 1 }} />
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
                height: 46,
                padding: "0 20px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.5)",
                background: playDisabled
                  ? "rgba(60,64,72,0.6)"
                  : "linear-gradient(180deg, #FFFFFF 0%, #E7EBF0 55%, #C8CED6 100%)",
                color: "#0B0C0F",
                fontFamily: fontDisplay,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 0.15,
                cursor: playDisabled ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: playDisabled
                  ? "none"
                  : "inset 0 1px 0 rgba(255,255,255,0.85), 0 10px 24px rgba(0,0,0,0.38)",
                opacity: playDisabled ? 0.6 : 1,
              }}
            >
              <Icon name="play" size={15} />
              Start listening
            </button>
          )}
        </div>

        {live && (
          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              role={onSeek && duration ? "slider" : undefined}
              aria-label={onSeek && duration ? "Seek" : undefined}
              aria-valuemin={onSeek && duration ? 0 : undefined}
              aria-valuemax={onSeek && duration ? Math.floor(duration) : undefined}
              aria-valuenow={onSeek && duration ? Math.floor(progress) : undefined}
              onClick={(e) => {
                if (!onSeek || !duration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (e.clientX - rect.left) / Math.max(1, rect.width);
                onSeek(Math.max(0, Math.min(1, x)) * duration);
              }}
              style={{
                flex: 1,
                height: onSeek && duration ? 14 : 3,
                display: "flex",
                alignItems: "center",
                cursor: onSeek && duration ? "pointer" : "default",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 999,
                  background: broadcast.lcdTrack,
                  overflow: "hidden",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.45)",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct * 100}%`,
                    background: broadcast.lcdFill,
                    borderRadius: 999,
                    boxShadow: broadcast.lcdGlow,
                    transition: "width 0.2s linear",
                  }}
                />
              </div>
            </div>
            <span
              style={{
                fontFamily: fontMono,
                fontSize: 11,
                fontVariantNumeric: "tabular-nums",
                color: "rgba(244,246,248,0.55)",
                letterSpacing: 0,
                flexShrink: 0,
              }}
            >
              {fmtTime(progress)}
              {duration ? ` / ${fmtTime(duration)}` : ""}
            </span>
          </div>
        )}

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
                fontFamily: fontMono,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.4,
                textTransform: "uppercase",
                color: "rgba(101,230,255,0.7)",
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
