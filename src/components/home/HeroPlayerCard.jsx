import { useEffect, useRef } from "react";
import {
  fontDisplay,
  fontMono,
  homeSpace,
  y2k,
} from "../../theme";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { useIsPlaying } from "../../usePlayerTransport";
import Icon from "../ui/Icon";
import { IceOrbPlay } from "../player/OrbitalControls";

function fmtTime(secs = 0) {
  if (!Number.isFinite(secs) || secs < 0) secs = 0;
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Soft on-media bug — quieter than the old plate chip. */
function BroadcastBug({ live, playing, channelLabel }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        maxWidth: "100%",
        padding: "6px 11px",
        borderRadius: 980,
        background: "rgba(10,11,13,0.42)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(16px) saturate(1.2)",
        WebkitBackdropFilter: "blur(16px) saturate(1.2)",
        fontFamily: fontDisplay,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.2,
        color: y2k.offWhite,
      }}
    >
      {(live || playing) && (
        <>
          <span
            aria-hidden="true"
            style={{
              width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
              background: live ? y2k.neon : "rgba(247,248,250,0.9)",
              boxShadow: live ? `0 0 8px ${y2k.neon}` : "none",
              animation: playing ? "stageLiveDot 1.6s ease-in-out infinite" : "none",
            }}
          />
          <span style={{ color: live ? y2k.neon : "rgba(247,248,250,0.88)", flexShrink: 0, fontSize: 10, fontWeight: 650 }}>
            Live
          </span>
          <span aria-hidden="true" style={{ width: 1, height: 10, background: "rgba(255,255,255,0.18)", flexShrink: 0 }} />
        </>
      )}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "rgba(244,246,248,0.86)" }}>
        {channelLabel}
      </span>
    </span>
  );
}

function SoftIconButton({ label, icon, active = false, onClick, size = 44, iconSize = 17 }) {
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
        border: `1px solid ${active ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.12)"}`,
        background: active ? "rgba(255,255,255,0.16)" : "rgba(12,13,16,0.36)",
        color: active ? y2k.chromeBright : y2k.offWhite,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: "none",
        flexShrink: 0,
      }}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
}

/**
 * HeroPlayerCard — full-bleed broadcast "Now Playing" stage.
 * Artwork-dominant plane with chrome lower-third, consolidated LIVE bug,
 * favorite + transport controls. Idle state invites starting the station.
 */
export default function HeroPlayerCard({
  track = null,
  previewTrack = null,
  upNextTrack = null,
  liveShow = null,
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
}) {
  const isPlaying = useIsPlaying();
  const { progress, duration } = usePlayerPlayback();
  const cardRef = useRef(null);
  const live = !!track;
  const art = track?.albumCover || previewTrack?.albumCover || null;
  const channelLabel =
    liveShow?.shortTitle || liveShow?.title || daypart?.label || "Planet Radio";

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

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label={
        live
          ? `Now playing ${track.title} by ${track.artist}. Open player.`
          : "Start the station"
      }
      onClick={() => (live ? onOpen?.() : !playDisabled && onPlay?.())}
      onKeyDown={(e) => {
        if (e.key === "Enter") live ? onOpen?.() : !playDisabled && onPlay?.();
      }}
      className="pmp-hero"
      style={{
        position: "relative",
        /* Full-bleed stage — no inset card radius fighting the Home gutter */
        borderRadius: 0,
        overflow: "hidden",
        aspectRatio: "16 / 11",
        minHeight: 300,
        maxHeight: 520,
        marginLeft: -homeSpace.gutter,
        marginRight: -homeSpace.gutter,
        width: `calc(100% + ${homeSpace.gutter * 2}px)`,
        maxWidth: "none",
        cursor: playDisabled && !live ? "default" : "pointer",
        border: "none",
        background: y2k.artGradient,
        boxShadow: `0 20px 48px rgba(0,0,0,0.42)`,
        WebkitTapHighlightColor: "transparent",
        isolation: "isolate",
      }}
    >
      {/* Artwork — full-bleed stage */}
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

      {/* Broadcast scrim — key light top, dense lower-third */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: `
            linear-gradient(180deg, rgba(10,11,13,0.55) 0%, rgba(10,11,13,0.08) 22%, transparent 40%),
            linear-gradient(180deg, transparent 38%, rgba(10,11,13,0.5) 62%, rgba(10,11,13,0.94) 100%)
          `,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "50%",
          background: `radial-gradient(120% 100% at 50% 110%, ${y2k.chromeWash} 0%, transparent 70%)`,
        }}
      />

      {/* Top chrome — consolidated bug */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: homeSpace.gutter,
          right: homeSpace.gutter,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <BroadcastBug
          live={live || isRadioMode}
          playing={isPlaying}
          channelLabel={channelLabel}
        />
      </div>

      {/* Lower third — type + soft transport on the art */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: `0 ${homeSpace.gutter}px 18px`,
        }}
      >
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 12,
            fontWeight: 550,
            letterSpacing: 0.15,
            color: "rgba(244,246,248,0.62)",
            marginBottom: 6,
            textShadow: "0 1px 8px rgba(0,0,0,0.55)",
          }}
        >
          {live ? "Now playing" : "Planet Radio"}
        </div>

        <div
          key={track?.id || "idle"}
          style={{ animation: "trackSwap 0.35s ease both" }}
        >
          <div
            style={{
              fontFamily: fontDisplay,
              fontSize: "clamp(22px, 5.5vw, 30px)",
              fontWeight: 650,
              letterSpacing: -0.55,
              lineHeight: 1.08,
              color: y2k.offWhite,
              textShadow: "0 2px 18px rgba(0,0,0,0.5)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              maxWidth: 640,
            }}
          >
            {live ? track.title : daypart?.vibe || "Tune the station"}
          </div>
          <div
            style={{
              marginTop: 5,
              fontSize: 14,
              fontWeight: 500,
              color: "rgba(244,246,248,0.7)",
              textShadow: "0 1px 8px rgba(0,0,0,0.45)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 520,
            }}
          >
            {live ? track.artist : "One tap and the dial finds you something good."}
          </div>
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
              <SoftIconButton label="Previous" icon="prev" onClick={onPrev} />
              <IceOrbPlay
                isPlaying={isPlaying}
                onClick={onTogglePlay}
                size={56}
                glowing={isPlaying}
                stopPropagation
              />
              <SoftIconButton label="Next" icon="skip" onClick={onSkip} />
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
                    borderRadius: 980,
                    border: `1px solid ${requested ? "rgba(200,242,65,0.35)" : "rgba(255,255,255,0.14)"}`,
                    background: requested ? y2k.neonSoft : "rgba(12,13,16,0.4)",
                    color: requested ? y2k.neon : y2k.offWhite,
                    fontFamily: fontDisplay,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 0.1,
                    cursor: requested ? "default" : "pointer",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Icon name="zap" size={13} />
                  {requested ? "Requested" : "Request"}
                </button>
              )}
              <SoftIconButton
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
                borderRadius: 980,
                border: "1px solid rgba(255,255,255,0.45)",
                background: playDisabled ? "rgba(60,64,72,0.6)" : "rgba(247,248,250,0.96)",
                color: "#0B0C0F",
                fontFamily: fontDisplay,
                fontSize: 14,
                fontWeight: 650,
                letterSpacing: 0.1,
                cursor: playDisabled ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: playDisabled ? "none" : "0 8px 22px rgba(0,0,0,0.35)",
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
              aria-hidden="true"
              style={{
                flex: 1,
                height: 2,
                borderRadius: 999,
                background: "rgba(255,255,255,0.14)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct * 100}%`,
                  background: "rgba(247,248,250,0.92)",
                  borderRadius: 999,
                  transition: "width 0.2s linear",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: fontMono,
                fontSize: 10,
                fontVariantNumeric: "tabular-nums",
                color: "rgba(244,246,248,0.55)",
                letterSpacing: 0.2,
                flexShrink: 0,
              }}
            >
              {fmtTime(progress)}
              {duration ? ` / ${fmtTime(duration)}` : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
