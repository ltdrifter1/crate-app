import { useEffect, useRef } from "react";
import {
  fontDisplay,
  fontMono,
  glass,
  homeSpace,
  motion,
  y2k,
} from "../../theme";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { useIsPlaying } from "../../usePlayerTransport";
import Icon from "../ui/Icon";

function fmtTime(secs = 0) {
  if (!Number.isFinite(secs) || secs < 0) secs = 0;
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Single MTV-style bug: LIVE · channel — consolidates dual pills. */
function BroadcastBug({ live, playing, channelLabel }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        maxWidth: "100%",
        padding: "7px 12px",
        borderRadius: 8,
        background: "rgba(10,8,16,0.62)",
        border: "1px solid rgba(255,255,255,0.16)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
        fontFamily: fontMono,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 1.8,
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
              background: live ? y2k.neon : y2k.purpleBright,
              boxShadow: live
                ? `0 0 8px ${y2k.neon}`
                : `0 0 8px ${y2k.purpleGlow}`,
              animation: playing ? "stageLiveDot 1.6s ease-in-out infinite" : "none",
            }}
          />
          <span style={{ color: live ? y2k.neon : y2k.purpleBright, flexShrink: 0 }}>
            LIVE
          </span>
          <span
            aria-hidden="true"
            style={{
              width: 1,
              height: 10,
              background: "rgba(255,255,255,0.22)",
              flexShrink: 0,
            }}
          />
        </>
      )}
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textTransform: "uppercase",
          color: "rgba(242,239,230,0.88)",
        }}
      >
        {channelLabel}
      </span>
    </span>
  );
}

function GlassIconButton({ label, icon, active = false, onClick, size = 42, iconSize = 17 }) {
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
        border: `1px solid ${active ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.16)"}`,
        background: active ? y2k.purpleSoft : "rgba(12,10,18,0.5)",
        color: active ? y2k.purpleBright : y2k.offWhite,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: active
          ? `0 0 16px ${y2k.purpleGlow}`
          : "inset 0 1px 0 rgba(255,255,255,0.08)",
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
        // Broadcast plate — sharper chrome, cinematic plane (not soft marketing card)
        borderRadius: 12,
        overflow: "hidden",
        aspectRatio: "16 / 11",
        minHeight: 300,
        maxHeight: 520,
        // Bleed past home gutters toward edge-to-edge stage
        marginLeft: -homeSpace.gutter,
        marginRight: -homeSpace.gutter,
        width: `calc(100% + ${homeSpace.gutter * 2}px)`,
        maxWidth: "none",
        cursor: playDisabled && !live ? "default" : "pointer",
        border: "1px solid rgba(255,255,255,0.12)",
        borderLeft: "none",
        borderRight: "none",
        background: y2k.artGradient,
        boxShadow: `
          0 28px 64px rgba(0,0,0,0.55),
          inset 0 1px 0 rgba(255,255,255,0.1),
          0 0 0 1px rgba(139,92,246,0.06)
        `,
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
            linear-gradient(180deg, rgba(8,6,14,0.55) 0%, rgba(8,6,14,0.08) 22%, transparent 40%),
            linear-gradient(180deg, transparent 38%, rgba(8,6,14,0.5) 62%, rgba(8,6,14,0.94) 100%)
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
          background: `radial-gradient(120% 100% at 50% 110%, ${y2k.purpleWash} 0%, transparent 70%)`,
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

      {/* Lower third — chrome broadcast plate */}
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
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: y2k.purpleBright,
            marginBottom: 8,
            textShadow: "0 1px 8px rgba(0,0,0,0.6)",
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
              fontSize: "clamp(24px, 6vw, 34px)",
              fontWeight: 800,
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
            {live ? track.title : daypart?.vibe || "Tune the station"}
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 15,
              fontWeight: 500,
              color: "rgba(242,239,230,0.74)",
              textShadow: "0 1px 8px rgba(0,0,0,0.5)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 520,
            }}
          >
            {live ? track.artist : "One tap and the dial finds you something good."}
          </div>
        </div>

        {/* Transport row */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {live ? (
            <>
              <GlassIconButton label="Previous" icon="prev" onClick={onPrev} />
              <button
                type="button"
                aria-label={isPlaying ? "Pause" : "Play"}
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePlay?.();
                }}
                className="pmp-press play-primary"
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.22)",
                  background: `linear-gradient(160deg, ${y2k.purpleBright} 0%, ${y2k.purple} 48%, ${y2k.purpleDeep} 100%)`,
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: `0 0 26px ${y2k.purpleGlow}, 0 10px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.35)`,
                  flexShrink: 0,
                }}
              >
                <span style={{ display: "flex", marginLeft: isPlaying ? 0 : 2 }}>
                  <Icon name={isPlaying ? "pause" : "play"} size={22} />
                </span>
              </button>
              <GlassIconButton label="Next" icon="skip" onClick={onSkip} />
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
                    height: 42,
                    borderRadius: 10,
                    border: `1px solid ${requested ? "rgba(200,242,65,0.4)" : "rgba(255,255,255,0.16)"}`,
                    background: requested ? y2k.neonSoft : "rgba(12,10,18,0.45)",
                    color: requested ? y2k.neon : y2k.offWhite,
                    fontFamily: fontMono,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1.6,
                    textTransform: "uppercase",
                    cursor: requested ? "default" : "pointer",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Icon name="zap" size={13} />
                  {requested ? "Req'd" : "Request"}
                </button>
              )}
              <GlassIconButton
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
                height: 54,
                padding: "0 26px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.22)",
                background: playDisabled
                  ? "rgba(60,58,72,0.6)"
                  : `linear-gradient(160deg, ${y2k.purpleBright} 0%, ${y2k.purple} 48%, ${y2k.purpleDeep} 100%)`,
                color: "#FFFFFF",
                fontFamily: fontDisplay,
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: 1.8,
                textTransform: "uppercase",
                cursor: playDisabled ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: playDisabled
                  ? "none"
                  : `0 0 30px ${y2k.purpleGlow}, 0 12px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.35)`,
                opacity: playDisabled ? 0.6 : 1,
              }}
            >
              <Icon name="play" size={16} />
              Start the station
            </button>
          )}
        </div>

        {live && (
          <div
            style={{
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              fontFamily: fontMono,
              fontSize: 10,
              letterSpacing: 0.8,
              color: "rgba(242,239,230,0.55)",
            }}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textTransform: "uppercase",
              }}
            >
              {upNextTrack ? `Up next — ${upNextTrack.title} · ${upNextTrack.artist}` : " "}
            </span>
            <span style={{ flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
              {fmtTime(progress)}
              {duration ? ` / ${fmtTime(duration)}` : ""}
            </span>
          </div>
        )}
      </div>

      {/* Progress hairline */}
      {live && duration > 0 && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 3,
            background: "rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              width: `${pct * 100}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${y2k.purpleDeep}, ${y2k.purpleBright})`,
              boxShadow: `0 0 10px ${y2k.purpleGlow}`,
              transition: `width ${motion.base} linear`,
            }}
          />
        </div>
      )}

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 12,
          boxShadow: `inset 0 1px 0 ${glass.highlight}`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
