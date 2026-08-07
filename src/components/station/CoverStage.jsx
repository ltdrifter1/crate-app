import { useEffect, useRef } from "react";
import Icon from "../ui/Icon";
import PlanetMascot from "../brand/PlanetMascot";
import BrandTagline from "../brand/BrandTagline";
import {
  EnergyShiftFeedback,
  EnergyShiftModeChip,
  EnergyShiftControl,
} from "../listen/EnergyShiftButton";
import { OrbitalPlayControl } from "../player/OrbitalControls";
import {
  DedicationFlash,
  HypnoVisualizer,
  LowerThird,
  ChannelBug,
  OnAirBadge,
  StationHeatBar,
  StationTicker,
  UpNextBumper,
} from "./StationChrome";
import { HostCreditChip } from "./ShowGuide";
import VideoStage, { VideoBadge } from "./VideoStage";
import { color, dock, fontDisplay, fontMono, glass, homeSpace, motion, aluminumGradient } from "../../theme";
import { fmtTime } from "../../lib/harmony";
import { trackHasVideo } from "../../lib/video";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { useIsPlaying } from "../../usePlayerTransport";

/**
 * Home Cover Stage atmosphere.
 * Idle → brushed aluminum. Live → full-bleed sleeve as the visual plane
 * (Cover Flow / iTunes memory — never an inset Spotify card).
 */
export function CoverStageAtmosphere({ track = null, playing = false, live = false }) {
  const hasArt = !!(live && track?.albumCover);

  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: aluminumGradient() }} />

      {/* Brushed aluminum window light */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `
          linear-gradient(115deg, rgba(34,38,45,0.72) 0%, transparent 40%, transparent 60%, rgba(26,29,36,0.045) 100%),
          radial-gradient(ellipse 90% 55% at 50% -8%, rgba(42,47,55,0.85) 0%, transparent 62%)
        `,
        opacity: hasArt ? 0.35 : 1,
        transition: "opacity 0.7s ease",
      }}/>

      {/* Full-bleed sleeve — edge-to-edge when listening */}
      {hasArt && (
        <div
          key={track.id}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${track.albumCover})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            animation: `fadeIn 0.7s ${motion.ease} both`,
            transform: playing ? "scale(1.03)" : "scale(1)",
            transition: "transform 8s ease",
          }}
        />
      )}

      {/* Cinematic broadcast veil — preserve sleeve color without washing it out. */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: hasArt
          ? `
            linear-gradient(180deg, rgba(5,6,8,0.78) 0%, rgba(5,6,8,0.3) 24%, rgba(5,6,8,0.12) 48%, rgba(5,6,8,0.68) 76%, rgba(5,6,8,0.94) 100%),
            radial-gradient(ellipse 76% 52% at 50% 24%, transparent 0%, rgba(5,6,8,0.16) 68%, rgba(5,6,8,0.42) 100%)
          `
          : `
            radial-gradient(ellipse 80% 50% at 50% 18%, rgba(169,199,228,0.05) 0%, transparent 60%),
            linear-gradient(180deg, rgba(8,9,11,0.08) 0%, transparent 30%, transparent 55%, rgba(8,9,11,0.72) 100%)
          `,
      }}/>
    </div>
  );
}

/**
 * Home Cover Stage — one chrome for idle and live.
 * Live mode runs as The Station: ON AIR, lower third, up next, heat, ticker.
 */
export default function CoverStage({
  onPlay, onTogglePlay, onSkip, onPrev, onOpen,
  currentTrack, isRadioMode, hypnoPocket = false,
  previewTrack = null, mixLane, playDisabled = false,
  onStageVisibilityChange = null,
  onSeek = null,
  upNextTrack = null,
  countdownRank = null,
  daypart = null,
  tickerText = "",
  onRequest = null,
  requested = false,
  onDedicate = null,
  dedicationFlash = null,
  onClearDedication = null,
  stationMode = false,
  liveShow = null,
  sceneChannel = null,
}) {
  const { progress, duration } = usePlayerPlayback();
  const isPlaying = useIsPlaying();
  const stageRef = useRef(null);
  const live = !!currentTrack;
  const canStart = !playDisabled;
  const stageTrack = currentTrack || previewTrack;
  const playingVisual = !!(live && isPlaying);
  const displayTrack = currentTrack || previewTrack || null;
  const showStation = !!(live && stationMode);
  const onAirLabel = liveShow?.shortTitle || liveShow?.title || daypart?.label || (mixLane === "night" ? "Night Crash" : "Daytime Live");

  useEffect(() => {
    if (!onStageVisibilityChange) return undefined;
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    // Hysteresis: hide dock only when stage is clearly in view; show dock
    // sooner when scrolling away so transport never fights the floating dock.
    let lastVisible = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const ratio = entry.intersectionRatio;
        const next = lastVisible
          ? (entry.isIntersecting && ratio >= 0.28)
          : (entry.isIntersecting && ratio >= 0.48);
        if (next === lastVisible) return;
        lastVisible = next;
        onStageVisibilityChange(next);
      },
      { threshold: [0, 0.2, 0.28, 0.35, 0.48, 0.6, 1] }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      onStageVisibilityChange(true);
    };
  }, [onStageVisibilityChange]);

  const openImmersive = () => {
    if (live && onOpen) onOpen();
  };

  const handlePrimary = () => {
    if (live) onTogglePlay?.();
    else if (canStart) onPlay?.();
  };

  return (
    <div
      ref={stageRef}
      style={{
        position: "relative",
        minHeight: showStation ? "min(100dvh - 64px, 860px)" : "min(100dvh - 88px, 720px)",
        height: showStation ? "min(100dvh - 64px, 860px)" : "min(100dvh - 88px, 720px)",
        background: color.canvas,
        overflow: "hidden",
        animation: "stationIn 0.85s cubic-bezier(0.22,1,0.36,1) both",
        outline: "none",
      }}
    >
      <CoverStageAtmosphere track={stageTrack} playing={playingVisual} live={live} />

      {showStation && trackHasVideo(stageTrack) ? (
        <VideoStage
          track={stageTrack}
          playing={playingVisual}
          progress={progress}
        />
      ) : (
        // Prefer the sleeve as the broadcast plane; hypno only when no art.
        showStation && !stageTrack?.albumCover && (
          <HypnoVisualizer playing={playingVisual} colorHex="169,199,228" />
        )
      )}

      {live && (
        <button
          type="button"
          aria-label="Open now playing"
          onClick={openImmersive}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background: "transparent",
            border: "none",
            cursor: onOpen ? "pointer" : "default",
            padding: 0,
          }}
        />
      )}

      {/* One hard top strip: ON AIR / callsign / show at left, CH-ID at right. */}
      {showStation && (
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, zIndex: 3,
            paddingTop: "env(safe-area-inset-top, 0px)",
            pointerEvents: "none",
            background: `
              repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 4px),
              ${glass.frame}
            `,
            borderBottom: "1px solid rgba(0,0,0,0.72)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 6px 16px rgba(0,0,0,0.34)",
          }}
        >
          <div style={{
            minHeight: 44,
            display: "flex",
            alignItems: "stretch",
            justifyContent: "space-between",
            gap: 8,
          }}>
            <div style={{ pointerEvents: "none", minWidth: 0 }}>
              <OnAirBadge
                showTitle={liveShow ? (liveShow.shortTitle || liveShow.title) : null}
                daypartLabel={onAirLabel}
                integrated
              />
            </div>
            <div style={{ display: "flex", alignItems: "stretch", flexShrink: 0 }}>
              <ChannelBug
                sceneChannel={sceneChannel}
                show={sceneChannel ? null : liveShow}
                daypartLabel={daypart?.label || onAirLabel}
                integrated
              />
            </div>
          </div>
          {tickerText && <StationTicker text={tickerText} dense />}
        </div>
      )}

      {/* Idle brand plane — mascot stays in the visual field */}
      {!live && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: `72px ${homeSpace.gutter}px calc(210px + env(safe-area-inset-bottom, 0px))`,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{
            animation: `markIn 0.7s ${motion.ease} both`,
            width: "min(72vw, 300px)",
          }}>
            <PlanetMascot size={300} />
          </div>
        </div>
      )}

      {/* Shared transport chrome — station mode is a full-bleed bottom bar */}
      <div
        style={{
          position: "absolute",
          left: 0, right: 0, bottom: 0, zIndex: 2,
          // Clear the floating tab dock so stage transport never sandwiches it.
          padding: showStation
            ? `0 0 calc(${dock.clearTabs - 34}px + env(safe-area-inset-bottom, 0px))`
            : `0 ${homeSpace.gutter}px calc(18px + env(safe-area-inset-bottom, 0px))`,
          display: "flex",
          flexDirection: "column",
          alignItems: showStation ? "stretch" : "center",
          boxSizing: "border-box",
          pointerEvents: "none",
          gap: showStation ? 0 : 7,
        }}
      >
        {showStation && dedicationFlash && (
          <DedicationFlash dedication={dedicationFlash} onDone={onClearDedication} />
        )}

        {showStation && upNextTrack && (
          <UpNextBumper track={upNextTrack} />
        )}

        {showStation && displayTrack ? (
          <div
            style={{
              width: "100%",
              maxWidth: "none",
              pointerEvents: "auto",
              borderRadius: "10px 10px 0 0",
              padding: "16px 18px 14px",
              background: `
                repeating-linear-gradient(90deg, rgba(255,255,255,0.014) 0 1px, transparent 1px 4px),
                linear-gradient(180deg,
                  rgba(45,50,58,0.98) 0%,
                  rgba(25,28,34,0.98) 38%,
                  rgba(12,14,17,0.99) 100%)
              `,
              border: "none",
              borderTop: `2px solid rgba(255,255,255,0.2)`,
              boxShadow: `
                inset 0 1px 0 rgba(255,255,255,0.08),
                inset 0 -1px 0 rgba(0,0,0,0.55),
                0 -12px 28px rgba(0,0,0,0.42)
              `,
              animation: `dockRise 0.55s ${motion.ease} both`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Fine brushed grain catches the top studio light. */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "10px 10px 0 0",
                pointerEvents: "none",
                background: `
                  linear-gradient(180deg, rgba(255,255,255,0.055) 0%, transparent 18%),
                  repeating-linear-gradient(0deg, transparent 0 2px, rgba(255,255,255,0.008) 2px 3px)
                `,
                boxShadow: "inset 1px 0 0 rgba(255,255,255,0.05), inset -1px 0 0 rgba(0,0,0,0.28)",
              }}
            />

            <div
              role="button"
              tabIndex={0}
              onClick={openImmersive}
              onKeyDown={(e) => { if (e.key === "Enter") openImmersive(); }}
              style={{
                position: "relative",
                cursor: onOpen ? "pointer" : "default",
                outline: "none",
              }}
            >
              <LowerThird
                track={displayTrack}
                rank={countdownRank}
                daypart={daypart}
                show={liveShow}
                embedded
              />
              <div style={{
                marginTop: 10,
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}>
                <VideoBadge track={displayTrack} />
                {liveShow?.host && <HostCreditChip show={liveShow} compact tone="glass" />}
              </div>
            </div>

            {/* Request / dedicate / reactions stay available — compact one-row heat */}
            <div
              aria-hidden="true"
              style={{
                height: 1,
                margin: "10px 0 8px",
                background: `
                  linear-gradient(90deg, transparent 0%, ${glass.border} 18%, ${glass.border} 82%, transparent 100%)
                `,
              }}
            />

            <StationHeatBar
              track={displayTrack}
              onRequest={onRequest}
              requested={requested}
              onDedicate={onDedicate}
              compact
              embedded
            />

            <div
              aria-hidden="true"
              style={{
                height: 1,
                margin: "8px 0 8px",
                background: `
                  linear-gradient(90deg, transparent 0%, ${glass.border} 18%, ${glass.border} 82%, transparent 100%)
                `,
              }}
            />

            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              pointerEvents: "auto",
              width: "100%",
            }}>
              <EnergyShiftFeedback bottom="calc(100% + 12px)" />

              <div style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                minHeight: 64,
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                }}>
                  <button
                    type="button"
                    aria-label="Previous"
                    disabled={!live}
                    onClick={() => onPrev?.()}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(18,20,24,0.96)",
                      border: `1px solid ${glass.borderSoft}`,
                      boxShadow: `inset 0 1px 0 ${glass.highlight}`,
                      color: live ? color.ink : color.faint,
                      cursor: live ? "pointer" : "default",
                      opacity: live ? 1 : 0.45,
                      padding: 0,
                    }}
                  >
                    <Icon name="prev" size={18}/>
                  </button>

                  <div style={{
                    padding: 3,
                    borderRadius: "50%",
                    background: `
                      linear-gradient(145deg, rgba(56,62,72,0.95) 0%, rgba(200,208,220,0.55) 100%)
                    `,
                    boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 10px 28px rgba(18,20,26,0.12)`,
                  }}>
                    <OrbitalPlayControl
                      isPlaying={live ? isPlaying : false}
                      onToggle={handlePrimary}
                      progress={live ? progress : 0}
                      duration={live ? duration : 0}
                      onSeek={live ? onSeek : null}
                      size={64}
                      glowing={playingVisual}
                    />
                  </div>

                  <button
                    type="button"
                    aria-label="Next"
                    disabled={!live && !canStart}
                    onClick={() => {
                      if (live) onSkip?.();
                      else if (canStart) onPlay?.();
                    }}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(18,20,24,0.96)",
                      border: `1px solid ${glass.borderSoft}`,
                      boxShadow: `inset 0 1px 0 ${glass.highlight}`,
                      color: (live || canStart) ? color.ink : color.faint,
                      cursor: (live || canStart) ? "pointer" : "default",
                      opacity: (live || canStart) ? 1 : 0.45,
                      padding: 0,
                    }}
                  >
                    <Icon name="skip" size={18}/>
                  </button>
                </div>

                <div style={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}>
                  <EnergyShiftControl size={40} stopPropagation={false} />
                </div>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                maxWidth: 220,
                fontSize: 11,
                fontFamily: fontMono,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: 0.3,
                color: color.muted,
                pointerEvents: "none",
              }}>
                <span>{live ? fmtTime(progress) : "0:00"}</span>
                <span>{live && duration ? fmtTime(duration) : "—:—"}</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div
              key={displayTrack?.id || "idle-meta"}
              role={live ? "button" : undefined}
              tabIndex={live ? 0 : undefined}
              onClick={live ? openImmersive : undefined}
              onKeyDown={live ? ((e) => { if (e.key === "Enter") openImmersive(); }) : undefined}
              style={{
                width: "100%",
                maxWidth: 420,
                textAlign: "center",
                marginBottom: 6,
                animation: live ? `trackSwap 0.45s ${motion.ease} both` : `rise 0.65s ${motion.ease} 0.08s both`,
                cursor: live && onOpen ? "pointer" : "inherit",
                pointerEvents: live ? "auto" : "none",
              }}
            >
              {displayTrack ? (
                <>
                  <h1 style={{
                    margin: 0,
                    fontSize: "clamp(20px, 3.8vw, 28px)",
                    fontWeight: 750,
                    letterSpacing: -0.6,
                    lineHeight: 1.12,
                    color: color.ink,
                    fontFamily: fontDisplay,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}>
                    {displayTrack.title}
                  </h1>
                  <div style={{
                    marginTop: 7,
                    fontSize: 14,
                    fontWeight: 500,
                    letterSpacing: -0.05,
                    color: color.body,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {displayTrack.artist}
                  </div>
                </>
              ) : (
                <BrandTagline size={12} style={{ letterSpacing: 2.2, textAlign: "center", maxWidth: "none", margin: "0 auto" }} />
              )}
            </div>

            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              pointerEvents: "auto",
              width: "100%",
              maxWidth: 420,
            }}>
              <EnergyShiftModeChip />
              <EnergyShiftFeedback bottom="calc(100% + 14px)" />

              <div style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                minHeight: 64,
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 14,
                }}>
                  <button
                    type="button"
                    aria-label="Previous"
                    disabled={!live}
                    onClick={() => onPrev?.()}
                    style={{
                      background: "none", border: "none", padding: 8,
                      color: live ? color.ink : color.faint,
                      cursor: live ? "pointer" : "default",
                      opacity: live ? 1 : 0.45,
                    }}
                  >
                    <Icon name="prev" size={20}/>
                  </button>

                  <OrbitalPlayControl
                    isPlaying={live ? isPlaying : false}
                    onToggle={handlePrimary}
                    progress={live ? progress : 0}
                    duration={live ? duration : 0}
                    onSeek={live ? onSeek : null}
                    size={64}
                    glowing={playingVisual}
                  />

                  <button
                    type="button"
                    aria-label="Next"
                    disabled={!live && !canStart}
                    onClick={() => {
                      if (live) onSkip?.();
                      else if (canStart) onPlay?.();
                    }}
                    style={{
                      background: "none", border: "none", padding: 8,
                      color: (live || canStart) ? color.ink : color.faint,
                      cursor: (live || canStart) ? "pointer" : "default",
                      opacity: (live || canStart) ? 1 : 0.45,
                    }}
                  >
                    <Icon name="skip" size={20}/>
                  </button>
                </div>

                <div style={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}>
                  <EnergyShiftControl size={40} stopPropagation={false} />
                </div>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                maxWidth: 200,
                fontSize: 11,
                fontFamily: fontMono,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: 0.3,
                color: color.faint,
                pointerEvents: "none",
              }}>
                <span>{live ? fmtTime(progress) : "0:00"}</span>
                <span>{live && duration ? fmtTime(duration) : "—:—"}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

