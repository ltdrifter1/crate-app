import { useEffect, useRef } from "react";
import {
  broadcast,
  fontDisplay,
  fontMono,
  homeSpace,
  y2k,
} from "../../theme";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { useIsBuffering, useIsPlaying } from "../../usePlayerTransport";
import { channelBugLine, resolveChannelBug } from "../../lib/mtvChannel";
import { trackHasVideo } from "../../lib/video";
import Icon from "../ui/Icon";
import { IceOrbPlay } from "../player/OrbitalControls";
import VideoStage from "../station/VideoStage";
import { EnergyShiftControl } from "../listen/EnergyShiftButton";

function fmtTime(secs = 0) {
  if (!Number.isFinite(secs) || secs < 0) secs = 0;
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Quiet live/channel readout — honest status, no LED costume. */
function BroadcastBug({ live, playing, channelLabel }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        maxWidth: "100%",
        padding: "5px 10px",
        borderRadius: 980,
        background: "rgba(8,10,13,0.55)",
        border: "1px solid rgba(255,255,255,0.12)",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: -0.08,
        color: y2k.offWhite,
      }}
    >
      {(live || playing) && (
        <>
          <span
            aria-hidden="true"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              flexShrink: 0,
              background: live ? y2k.live : "rgba(247,248,250,0.85)",
            }}
          />
          <span
            style={{
              color: "rgba(247,248,250,0.92)",
              flexShrink: 0,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Live
          </span>
          <span
            aria-hidden="true"
            style={{ width: 1, height: 10, background: "rgba(255,255,255,0.18)", flexShrink: 0 }}
          />
        </>
      )}
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: "rgba(244,246,248,0.82)",
        }}
      >
        {channelLabel}
      </span>
    </span>
  );
}

function ChromeIconButton({ label, icon, active = false, onClick, size = 44, iconSize = 17 }) {
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
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        border: `1px solid ${active ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)"}`,
        background: active
          ? "rgba(255,255,255,0.16)"
          : "rgba(8,10,13,0.42)",
        color: y2k.offWhite,
        boxShadow: "none",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        flexShrink: 0,
      }}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
}

/**
 * HeroPlayerCard — Home stage.
 * Cover/video, honest status, seek, transport. No CRT / LED costume.
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
  const channelLabel =
    sceneChannel?.shortTitle ||
    sceneChannel?.title ||
    liveShow?.shortTitle ||
    liveShow?.title ||
    daypart?.label ||
    channelBug.label ||
    "Planet Radio";
  const bugLine = channelBugLine(channelBug);

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

  const pct = duration > 0 ? Math.min(1, progress / duration) : 0;
  const idleEyebrow = previewTrack ? "Up first" : "Planet Radio";
  const idleTitle = previewTrack?.title || daypart?.vibe || "Tune the station";
  const idleArtist = previewTrack?.artist || "One tap and the dial finds you something good.";

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
        aspectRatio: "16 / 10",
        minHeight: 300,
        maxHeight: 520,
        width: "100%",
        cursor: playDisabled && !live ? "default" : "pointer",
        border: broadcast.bezelBorder,
        background: y2k.artGradient,
        WebkitTapHighlightColor: "transparent",
        isolation: "isolate",
      }}
    >
      {art ? (
        <img
          key={art}
          src={art}
          alt=""
          className="pmp-hero-art"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            animation: "fadeIn 0.6s ease both",
            transform: !hasVideo && isPlaying ? "scale(1.08)" : "scale(1.02)",
            transition: "transform 18s ease",
            filter: isPlaying && !hasVideo ? "saturate(1.12) contrast(1.06)" : "none",
          }}
        />
      ) : (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="/brand/planet-mp3-lockup-512.png"
            alt=""
            style={{
              width: "48%",
              maxWidth: 240,
              opacity: 0.9,
              filter: "drop-shadow(0 18px 40px rgba(0,0,0,0.5))",
            }}
            draggable={false}
          />
        </div>
      )}

      {hasVideo && (
        <VideoStage
          track={track}
          playing={isPlaying}
          progress={progress}
          showBadge={false}
        />
      )}

      {!hasVideo && track?.color && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
            background: `radial-gradient(80% 70% at 50% 20%, ${track.color}40 0%, transparent 62%)`,
            mixBlendMode: "screen",
          }}
        />
      )}

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          background: `
            linear-gradient(180deg, rgba(10,11,13,0.48) 0%, rgba(10,11,13,0.08) 24%, transparent 42%),
            linear-gradient(180deg, transparent 40%, rgba(10,11,13,0.5) 68%, rgba(8,10,13,0.94) 100%)
          `,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 16,
          left: homeSpace.gutter,
          right: homeSpace.gutter,
          zIndex: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <BroadcastBug
          live={live || isRadioMode}
          playing={isPlaying}
          channelLabel={live ? `${bugLine}` : channelLabel}
        />
        {hasVideo && (
          <span
            aria-hidden="true"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "5px 10px",
              borderRadius: 980,
              background: "rgba(8,10,13,0.55)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: -0.08,
              color: y2k.offWhite,
            }}
          >
            Video
          </span>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 3,
          padding: `0 ${homeSpace.gutter}px 16px`,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: -0.08,
            color: "rgba(244,246,248,0.72)",
            marginBottom: 6,
            textShadow: "0 1px 8px rgba(0,0,0,0.45)",
          }}
        >
          {live
            ? (isRadioMode ? "On air" : "Now playing")
            : idleEyebrow}
        </div>

        <div
          key={track?.id || "idle"}
          style={{ animation: "trackSwap 0.35s ease both" }}
        >
          <div
            style={{
              fontFamily: fontDisplay,
              fontSize: "clamp(24px, 5.8vw, 32px)",
              fontWeight: 750,
              letterSpacing: -0.7,
              lineHeight: 1.06,
              color: y2k.offWhite,
              textShadow: "0 2px 18px rgba(0,0,0,0.55)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              maxWidth: 640,
            }}
          >
            {live ? track.title : idleTitle}
          </div>
          <div
            style={{
              marginTop: 5,
              fontSize: 14,
              fontWeight: 500,
              color: "rgba(244,246,248,0.74)",
              textShadow: "0 1px 8px rgba(0,0,0,0.45)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 520,
            }}
          >
            {live ? track.artist : idleArtist}
          </div>
          {live && upNextTrack?.title && (
            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: -0.06,
                color: "rgba(244,246,248,0.62)",
              }}
            >
              Up next · {upNextTrack.title}
              {upNextTrack.artist ? ` — ${upNextTrack.artist}` : ""}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 14,
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
                size={56}
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
                height: 48,
                padding: "0 22px",
                borderRadius: 12,
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
              marginTop: 12,
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
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: -0.04,
                color: "rgba(244,246,248,0.42)",
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
