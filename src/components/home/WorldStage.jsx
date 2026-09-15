import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  broadcast,
  fontLcd,
  fontPoster,
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
  formatChannelNum,
  resolveChannelBug,
} from "../../lib/mtvChannel";
import { HERO_IDLE_ART, HERO_IDLE_FOCUS, resolveChannelArt } from "../../lib/channelArt";
import { trackHasVideo } from "../../lib/video";
import { lookFromPointer, worldLayerTransform, hotspotLayout } from "../../lib/worldLook";
import Icon from "../ui/Icon";
import CoverImage from "../ui/CoverImage";
import { IceOrbPlay } from "../player/OrbitalControls";
import { EnergyShiftControl } from "../listen/EnergyShiftButton";
import ScanlineWash from "./ScanlineWash";

const LazyVideoStage = lazy(() => import("../station/VideoStage"));

function fmtTime(secs = 0) {
  if (!Number.isFinite(secs) || secs < 0) secs = 0;
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(!!mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);
  return reduced;
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

/**
 * Full-bleed inhabit-the-music stage: look-around sleeve world, spatial channel
 * hotspots, hardware HUD. Replaces the inset hero card as Home's first 5 seconds.
 */
export default function WorldStage({
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
  channels = [],
  activeChannelId = null,
  onTuneChannel = null,
  muted = false,
  onToggleMute = null,
}) {
  const isPlaying = useIsPlaying();
  const isBuffering = useIsBuffering();
  const { progress, duration } = usePlayerPlayback();
  const stageRef = useRef(null);
  const cursorRef = useRef(null);
  const lookRef = useRef({ yaw: 0, pitch: 0 });
  const [look, setLook] = useState({ yaw: 0, pitch: 0 });
  const [finePointer, setFinePointer] = useState(false);
  const reduced = usePrefersReducedMotion();
  const live = !!track;
  const art = track?.albumCover || previewTrack?.albumCover || null;
  const hasVideo = trackHasVideo(track);
  const channelBug = resolveChannelBug({ sceneChannel, show: liveShow });
  const bugLine = channelBugLine(channelBug);
  const onAir = live || isRadioMode;
  const title = live
    ? track.title
    : previewTrack?.title || daypart?.vibe || "Tune the station";
  const artist = live
    ? track.artist
    : previewTrack?.artist || "Look around. One tap and the world finds you.";
  const pct = duration > 0 ? Math.min(1, progress / duration) : 0;
  const hotspotChannels = channels.slice(0, 6);
  const spots = hotspotLayout(hotspotChannels.length, reduced ? { yaw: 0, pitch: 0 } : look);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(pointer: fine)");
    const sync = () => setFinePointer(!!mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    if (!onVisibilityChange) return undefined;
    const el = stageRef.current;
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

  useEffect(() => {
    if (reduced) {
      lookRef.current = { yaw: 0, pitch: 0 };
      setLook({ yaw: 0, pitch: 0 });
    }
  }, [reduced]);

  const moveLook = (clientX, clientY) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = lookFromPointer({
      x: clientX - rect.left,
      y: clientY - rect.top,
      width: rect.width,
      height: rect.height,
    });
    lookRef.current = next;
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate3d(${clientX - rect.left}px, ${clientY - rect.top}px, 0)`;
    }
    setLook(next);
  };

  const handlePointerMove = (e) => {
    if (reduced) return;
    moveLook(e.clientX, e.clientY);
  };

  const handlePrimary = () => {
    if (live) onOpen?.();
    else if (!playDisabled) onPlay?.();
  };

  return (
    <div
      ref={stageRef}
      className={`pmp-world-stage${finePointer && !reduced ? " pmp-world-stage--cursor" : ""}`}
      role="region"
      aria-label={
        live
          ? `Now playing ${track.title} by ${track.artist}. Look around the world, or open the player.`
          : previewTrack
            ? `Up first ${previewTrack.title} by ${previewTrack.artist}. Enter to start the station.`
            : "Planet world. Start the station."
      }
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        if (reduced) return;
        lookRef.current = { yaw: 0, pitch: 0 };
        setLook({ yaw: 0, pitch: 0 });
      }}
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100dvh",
        height: "100dvh",
        overflow: "hidden",
        background: "#050608",
        isolation: "isolate",
        perspective: 1200,
      }}
    >
      <div
        aria-hidden="true"
        className="pmp-world-depth"
        style={{
          position: "absolute",
          inset: "-12%",
          transform: reduced ? "none" : worldLayerTransform(look, 0.45),
          transition: reduced ? "none" : "transform 0.18s linear",
          willChange: reduced ? "auto" : "transform",
        }}
      >
        <CoverImage
          src={art || HERO_IDLE_ART}
          alt=""
          width={1400}
          height={1400}
          eager
          raw={!art}
          objectPosition={!art ? HERO_IDLE_FOCUS : "center"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(36px) saturate(1.35) brightness(0.38)",
            transform: "scale(1.12)",
          }}
        />
      </div>

      <div
        aria-hidden="true"
        className="pmp-world-room"
        style={{
          position: "absolute",
          inset: "8% 12%",
          transform: reduced ? "none" : worldLayerTransform(look, 1),
          transition: reduced ? "none" : "transform 0.12s linear",
          borderRadius: "46% 54% 48% 52% / 48% 46% 54% 52%",
          overflow: "hidden",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.12), 0 40px 80px rgba(0,0,0,0.55), 0 0 80px rgba(101,230,255,0.08)",
        }}
      >
        {hasVideo && live ? (
          <Suspense fallback={null}>
            <LazyVideoStage
              track={track}
              playing={isPlaying}
              progress={progress}
              showBadge={false}
            />
          </Suspense>
        ) : (
          <CoverImage
            src={art || HERO_IDLE_ART}
            alt=""
            width={900}
            height={900}
            priority
            raw={!art}
            objectPosition={!art ? HERO_IDLE_FOCUS : "center"}
            className="pmp-world-sleeve"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: live && isPlaying ? "scale(1.06)" : "scale(1.02)",
              transition: "transform 14s ease",
              filter: "saturate(1.12) contrast(1.06)",
            }}
          />
        )}
      </div>

      <ScanlineWash />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 70% 55% at 50% 42%, transparent 0%, rgba(5,6,8,0.18) 58%, rgba(5,6,8,0.72) 100%),
            linear-gradient(180deg, rgba(5,6,8,0.55) 0%, transparent 22%, transparent 58%, rgba(5,6,8,0.88) 100%)
          `,
          pointerEvents: "none",
        }}
      />

      {spots.map((spot, i) => {
        const ch = hotspotChannels[i];
        if (!ch) return null;
        const { src } = resolveChannelArt(ch);
        const active = activeChannelId === ch.id;
        return (
          <button
            key={ch.id}
            type="button"
            className={`pmp-world-hotspot${active ? " is-active" : ""}`}
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
            }}
            aria-label={`Tune ${ch.title} — ${ch.tagline || ch.shortTitle}`}
            aria-pressed={active || undefined}
            onClick={(e) => {
              e.stopPropagation();
              onTuneChannel?.(ch);
            }}
          >
            <span className="pmp-world-hotspot-dot">
              {src ? (
                <img src={src} alt="" />
              ) : (
                <span className="pmp-world-hotspot-letter">
                  {(ch.shortTitle || ch.title || "?").charAt(0)}
                </span>
              )}
            </span>
            <span className="pmp-world-hotspot-label" style={{ fontFamily: fontLcd }}>
              {formatChannelNum(ch.num ?? i + 1)}
              <em>{ch.shortTitle || ch.title}</em>
            </span>
          </button>
        );
      })}

      {finePointer && !reduced && (
        <div ref={cursorRef} className="pmp-world-cursor" aria-hidden="true" />
      )}

      <div className="pmp-world-topchrome">
        <div className="pmp-world-ident">
          <span style={{ fontFamily: fontLcd, color: y2k.cyan, fontWeight: 800, letterSpacing: 1.6, fontSize: 11 }}>
            {STATION_CALLSIGN}
          </span>
          <span className="pmp-world-ident-rule" />
          <span style={{ fontFamily: fontLcd, color: "rgba(244,246,248,0.62)", letterSpacing: 1.2, fontSize: 10, fontWeight: 700 }}>
            {STATION_FREQ}
          </span>
          <span className={`pmp-world-live${onAir ? " is-live" : ""}`}>
            <i className={onAir ? "pmp-live-led" : undefined} />
            {onAir ? "Live" : "Standby"}
          </span>
        </div>
        <div className="pmp-world-topchrome-right">
          {hasVideo && <span className="pmp-world-video-chip">Video</span>}
          <span className="pmp-world-bug" style={{ fontFamily: fontLcd }}>
            {bugLine}
          </span>
          {onToggleMute && (
            <button
              type="button"
              className="pmp-world-mute"
              aria-label={muted ? "Unmute" : "Mute"}
              aria-pressed={muted}
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
            >
              <Icon name={muted ? "mute" : "volume"} size={16} />
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        className="pmp-world-hit"
        aria-label={
          live
            ? `Open now playing ${track.title}`
            : previewTrack
              ? `Up first ${previewTrack.title} by ${previewTrack.artist}. Start the station.`
              : "Start the station"
        }
        onClick={handlePrimary}
        disabled={playDisabled && !live}
      />

      <div className="pmp-world-lower">
        <div className="pmp-world-copy" key={track?.id || previewTrack?.id || "idle"}>
          <div style={{ fontFamily: fontLcd, fontSize: 11, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase", color: y2k.cyan, marginBottom: 8 }}>
            {live ? (isRadioMode ? "On air" : "Now playing") : previewTrack ? "Up first" : "Planet Radio"}
          </div>
          <div
            style={{
              fontFamily: fontPoster,
              fontStyle: "italic",
              fontSize: "clamp(28px, 6vw, 52px)",
              fontWeight: 800,
              letterSpacing: -1.2,
              lineHeight: 0.98,
              color: y2k.offWhite,
              textShadow: "0 8px 40px rgba(0,0,0,0.55)",
            }}
          >
            {title}
          </div>
          <div style={{ marginTop: 8, fontSize: 16, fontWeight: 600, color: "rgba(244,246,248,0.78)" }}>
            {artist}
          </div>
          {live && upNextTrack?.title && (
            <div className="pmp-world-upnext">
              Up next · {upNextTrack.title}
              {upNextTrack.artist ? ` — ${upNextTrack.artist}` : ""}
            </div>
          )}
        </div>

        <div
          className="pmp-world-transport"
          onClick={(e) => e.stopPropagation()}
          style={{ padding: `10px ${homeSpace.gutter}px 18px` }}
        >
          {live ? (
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
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
                  height: 14,
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
                    height: 3,
                    borderRadius: 999,
                    background: broadcast.lcdTrack,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct * 100}%`,
                      background: broadcast.lcdFill,
                      borderRadius: 999,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: fontLcd,
                    fontSize: 11,
                    fontVariantNumeric: "tabular-nums",
                    color: "rgba(244,246,248,0.55)",
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
            </div>
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
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.5)",
                background: playDisabled
                  ? "rgba(60,64,72,0.6)"
                  : "linear-gradient(180deg, #FFFFFF 0%, #E7EBF0 55%, #C8CED6 100%)",
                color: "#0B0C0F",
                fontFamily: fontPoster,
                fontSize: 13,
                fontWeight: 800,
                fontStyle: "italic",
                letterSpacing: 0.6,
                textTransform: "uppercase",
                cursor: playDisabled ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: playDisabled ? 0.6 : 1,
              }}
            >
              <Icon name="play" size={15} />
              Start listening
            </button>
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
                  fontFamily: fontLcd,
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
    </div>
  );
}
