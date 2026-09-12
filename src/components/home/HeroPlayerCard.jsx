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

function fmtTime(secs = 0) {
  if (!Number.isFinite(secs) || secs < 0) secs = 0;
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Broadcast bug — LIVE LED + channel readout. */
function BroadcastBug({ live, playing, channelLabel }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        maxWidth: "100%",
        padding: "6px 11px 6px 9px",
        borderRadius: 8,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%), rgba(8,10,13,0.62)",
        border: "1px solid rgba(231,235,240,0.2)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 20px rgba(0,0,0,0.35)",
        backdropFilter: "blur(18px) saturate(1.25)",
        WebkitBackdropFilter: "blur(18px) saturate(1.25)",
        fontFamily: fontMono,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.6,
        color: y2k.offWhite,
      }}
    >
      {(live || playing) && (
        <>
          <span
            aria-hidden="true"
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              flexShrink: 0,
              background: live ? y2k.neon : "rgba(247,248,250,0.9)",
              boxShadow: live ? `0 0 10px ${y2k.neon}` : "none",
              animation: playing ? "stageLiveDot 1.6s ease-in-out infinite" : "none",
            }}
          />
          <span
            style={{
              color: live ? y2k.neon : "rgba(247,248,250,0.88)",
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.3,
              textTransform: "uppercase",
            }}
          >
            Live
          </span>
          <span
            aria-hidden="true"
            style={{ width: 1, height: 11, background: "rgba(255,255,255,0.2)", flexShrink: 0 }}
          />
        </>
      )}
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: "rgba(244,246,248,0.88)",
          letterSpacing: 0.8,
          textTransform: "uppercase",
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
        border: `1px solid ${active ? "rgba(231,235,240,0.4)" : "rgba(231,235,240,0.18)"}`,
        background: active
          ? "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.06) 100%), rgba(28,32,38,0.55)"
          : "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%), rgba(10,12,16,0.45)",
        color: active ? y2k.chromeBright : y2k.offWhite,
        boxShadow: active
          ? `inset 0 1px 0 rgba(255,255,255,0.32), 0 0 16px ${y2k.chromeGlow}`
          : "inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.4)",
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
 * HeroPlayerCard — broadcast monitor stage.
 * Chrome bezel, CRT wash, LIVE bug, LCD seek, lower-third transport.
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
  onOpen = null,
  onRequest = null,
  requested = false,
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
            src="/brand/planet-mp3-lockup-on-black.png"
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
        className="pmp-crt"
        style={{ position: "absolute", inset: 0, zIndex: 2 }}
      />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          background: `
            linear-gradient(180deg, rgba(10,11,13,0.62) 0%, rgba(10,11,13,0.1) 22%, transparent 40%),
            linear-gradient(180deg, transparent 36%, rgba(10,11,13,0.55) 62%, rgba(8,10,13,0.96) 100%)
          `,
        }}
      />

      {/* Corner ticks — monitor frame */}
      {[
        { top: 10, left: 10, borderTop: "2px solid rgba(231,235,240,0.45)", borderLeft: "2px solid rgba(231,235,240,0.45)" },
        { top: 10, right: 10, borderTop: "2px solid rgba(231,235,240,0.45)", borderRight: "2px solid rgba(231,235,240,0.45)" },
        { bottom: 10, left: 10, borderBottom: "2px solid rgba(101,230,255,0.4)", borderLeft: "2px solid rgba(101,230,255,0.4)" },
        { bottom: 10, right: 10, borderBottom: "2px solid rgba(101,230,255,0.4)", borderRight: "2px solid rgba(101,230,255,0.4)" },
      ].map((tick, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            position: "absolute",
            zIndex: 4,
            width: 16,
            height: 16,
            pointerEvents: "none",
            ...tick,
          }}
        />
      ))}

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
              gap: 5,
              padding: "5px 10px",
              borderRadius: 6,
              background: "rgba(10,11,13,0.55)",
              border: "1px solid rgba(255,79,216,0.28)",
              boxShadow: "0 0 16px rgba(255,79,216,0.16)",
              fontFamily: fontMono,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: y2k.offWhite,
            }}
          >
            ▶ Video
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
            fontFamily: fontMono,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            color: live ? y2k.cyan : "rgba(244,246,248,0.62)",
            marginBottom: 6,
            textShadow: live ? "0 0 12px rgba(101,230,255,0.45)" : "0 1px 8px rgba(0,0,0,0.55)",
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
                fontFamily: fontMono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                color: "rgba(101,230,255,0.78)",
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
              {onRequest && (
                <button
                  type="button"
                  aria-label={requested ? "Requested" : "Request this cut"}
                  aria-pressed={requested || undefined}
                  disabled={requested}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequest();
                  }}
                  className="pmp-press"
                  style={{
                    padding: "0 14px",
                    height: 40,
                    borderRadius: 10,
                    border: `1px solid ${requested ? "rgba(200,242,65,0.45)" : "rgba(231,235,240,0.2)"}`,
                    background: requested ? y2k.neonSoft : "rgba(12,13,16,0.5)",
                    color: requested ? y2k.neon : y2k.offWhite,
                    fontFamily: fontMono,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    cursor: requested ? "default" : "pointer",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: requested ? `0 0 16px ${y2k.neonSoft}` : "inset 0 1px 0 rgba(255,255,255,0.14)",
                  }}
                >
                  <Icon name="zap" size={13} />
                  {requested ? "Requested" : "Request"}
                </button>
              )}
              <ChromeIconButton
                label={track.liked ? "Unlike" : "Like"}
                icon={track.liked ? "heart" : "heartempty"}
                active={!!track.liked}
                onClick={() => onLike?.(track.id)}
              />
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
                fontSize: 10,
                fontVariantNumeric: "tabular-nums",
                color: "rgba(101,230,255,0.7)",
                letterSpacing: 0.3,
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
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1.3,
                textTransform: "uppercase",
                color: "rgba(244,246,248,0.48)",
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
