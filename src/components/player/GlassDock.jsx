import { lazy, Suspense, useEffect, useState } from "react";
import {
  color, dock, fontDisplay, motion,
} from "../../theme";
import Icon from "../ui/Icon";
import BottomNavigation from "../home/BottomNavigation";
import { TrackActionsMenu, useTrackMenu } from "../listen/TrackRow";
import { PlayKey } from "../player/OrbitalControls";
import { primaryNavItems, dockActiveTab } from "../../lib/nav";
import FreePlaysMeter from "../billing/FreePlaysMeter";
import {
  useIsBuffering,
  useIsPlaying,
} from "../../usePlayerTransport";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { dockTintStyle } from "../../lib/dockTint";
import CoverImage from "../ui/CoverImage";
import { HardwareIconButton, LcdMetaLine, LcdSeek, LcdTimes, formatBitrate, trackLcdBits } from "./DeviceChrome";

const EnergyShiftFeedback = lazy(() =>
  import("../listen/EnergyShiftButton").then((m) => ({ default: m.EnergyShiftFeedback }))
);
const PaceSlot = lazy(() =>
  import("../listen/EnergyShiftButton").then((m) => ({ default: m.PaceSlot }))
);

/**
 * Mobile dock — Apple Music–style compact mini player over the tab bar.
 * Collapsed: cover + title/artist + play/pause + skip.
 * Expanded: seek, BPM/meta, Slow–Fast pace. Does not cover the feed by default.
 */
export default function GlassDock({
  screen, setScreen, showAdmin = false,
  track,
  onTogglePlay, onSkip, onPrev, onLike, onDislike, onSeek,
  isRadioMode, onOpen, playlistCtx, onShowQueue, hypnoPocket,
  hidePlayer = false,
  playsRemaining = null,
  access = null,
  onOpenPlans = null,
}) {
  const { progress, duration } = usePlayerPlayback();
  const isPlaying = useIsPlaying();
  const isBuffering = useIsBuffering();
  const items = primaryNavItems({ showAdmin });
  const [expanded, setExpanded] = useState(false);

  const hasPlayer = !!track && !hidePlayer;
  const { menu, openFromContext, close } = useTrackMenu();
  const tint = dockTintStyle(track);

  const activeTab = dockActiveTab(screen, { hasAdmin: showAdmin });
  const bits = trackLcdBits(track, [formatBitrate(track)]);
  const pct = duration > 0 ? Math.max(0, Math.min(100, (progress / duration) * 100)) : 0;

  useEffect(() => {
    setExpanded(false);
  }, [track?.id, hidePlayer]);

  const openFull = () => onOpen?.();
  const toggleExpanded = () => setExpanded((v) => !v);

  return (
    <div
      className="pmp-mobile-dock"
      style={{
        position: "fixed",
        left: dock.insetX,
        right: dock.insetX,
        bottom: `calc(${dock.insetBottom}px + env(safe-area-inset-bottom, 0px))`,
        zIndex: 85,
        animation: `dockRise 0.45s ${motion.ease} both`,
        pointerEvents: "none",
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      <FreePlaysMeter
        variant="banner"
        remaining={playsRemaining}
        access={access}
        onUpgrade={onOpenPlans}
      />
      {hasPlayer && (
        <Suspense fallback={null}>
          <EnergyShiftFeedback />
        </Suspense>
      )}

      <div
        className={`glass-dock pmp-dock-stack${hasPlayer ? " pmp-dock-stack--playing" : ""}`}
        style={{
          borderRadius: dock.radius,
          overflow: "hidden",
          pointerEvents: "auto",
          ...(hasPlayer ? tint : null),
        }}
      >
        {hasPlayer && (
          <div
            className={`pmp-mini-player${expanded ? " is-expanded" : ""}`}
            data-testid="mini-player"
            data-expanded={expanded ? "true" : "false"}
          >
            <div className="pmp-mini-progress" aria-hidden="true">
              <div className="pmp-mini-progress__fill" style={{ width: `${pct}%` }} />
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => (expanded ? openFull() : setExpanded(true))}
              onContextMenu={(e) => openFromContext(e, track)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (expanded) openFull();
                  else setExpanded(true);
                }
              }}
              aria-label={expanded ? "Open now playing" : "Show playback details"}
              aria-expanded={expanded}
              className="pmp-mini-bar"
              style={{
                minHeight: dock.playerH,
                padding: "6px 8px 6px 10px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                background: "transparent",
                boxShadow: isRadioMode || hypnoPocket
                  ? `inset 2px 0 0 ${color.accent}`
                  : "none",
              }}
            >
              <div
                className="pmp-mini-cover"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  overflow: "hidden",
                  flexShrink: 0,
                  border: "1px solid rgba(91,101,116,0.12)",
                  background: color.surfaceRaised,
                }}
              >
                {track.albumCover ? (
                  <CoverImage
                    src={track.albumCover}
                    alt=""
                    width={40}
                    height={40}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{
                    width: "100%", height: "100%", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontFamily: fontDisplay, fontWeight: 700, color: color.muted, fontSize: 14,
                  }}>
                    {(track.title || "P")[0]}
                  </div>
                )}
              </div>

              <div key={track.id} style={{ flex: 1, minWidth: 0, animation: "fadeIn 0.3s ease both" }}>
                <div style={{
                  fontSize: 14, fontWeight: 650, color: color.ink,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontFamily: fontDisplay, letterSpacing: -0.25,
                }}>
                  {(isRadioMode || hypnoPocket) && (
                    <span style={{
                      display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                      background: color.alert, marginRight: 8, verticalAlign: "middle",
                      animation: isPlaying ? "stageLiveDot 1.6s ease-in-out infinite" : "none",
                    }}/>
                  )}
                  {track.title}
                </div>
                <div style={{
                  fontSize: 12, color: color.muted, marginTop: 1,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {track.artist}
                </div>
              </div>

              <PlayKey
                isPlaying={isPlaying}
                buffering={isBuffering}
                onClick={onTogglePlay}
                size={44}
                iconSize={16}
                stopPropagation
                glowing={isPlaying && !isBuffering}
              />
              <HardwareIconButton
                label="Next"
                onClick={onSkip}
                size={44}
                stopPropagation
              >
                <Icon name="skip" size={15} />
              </HardwareIconButton>
            </div>

            {expanded && (
              <div
                className="pmp-mini-sheet"
                data-testid="mini-player-sheet"
                onClick={(e) => e.stopPropagation()}
              >
                <LcdMetaLine tone="strip" bits={bits} />
                <div className="pmp-mini-seek">
                  <LcdSeek
                    value={progress}
                    max={duration || 1}
                    onChange={onSeek}
                    label="Seek"
                    stopPropagation
                    height={3}
                  />
                  <LcdTimes progress={progress} duration={duration} tone="strip" />
                </div>
                <Suspense fallback={null}>
                  <PaceSlot compact stopPropagation />
                </Suspense>
                <div className="pmp-mini-tools">
                  <HardwareIconButton
                    label="Previous"
                    onClick={onPrev}
                    size={44}
                    stopPropagation
                  >
                    <Icon name="prev" size={15} />
                  </HardwareIconButton>
                  <button
                    type="button"
                    aria-label={track.liked ? "Unlike" : "Like"}
                    onClick={(e) => { e.stopPropagation(); onLike(); }}
                    className="pmp-mini-hit"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: track.liked ? color.accent : color.faint,
                      minWidth: 44,
                      minHeight: 44,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                  >
                    <span style={{ display: "flex", animation: track.liked ? "likePop 0.25s ease" : "none" }}>
                      <Icon name={track.liked ? "heart" : "heartempty"} size={16}/>
                    </span>
                  </button>
                  {onDislike ? (
                    <HardwareIconButton
                      label="Dislike this track"
                      active={!!track.disliked}
                      onClick={onDislike}
                      size={44}
                      stopPropagation
                    >
                      <Icon name={track.disliked ? "dislikefilled" : "dislike"} size={15} />
                    </HardwareIconButton>
                  ) : null}
                  {onShowQueue ? (
                    <HardwareIconButton
                      label="Up Next"
                      onClick={onShowQueue}
                      size={44}
                      stopPropagation
                    >
                      <Icon name="queue" size={16} />
                    </HardwareIconButton>
                  ) : null}
                  <button
                    type="button"
                    aria-label="Hide playback details"
                    onClick={(e) => { e.stopPropagation(); toggleExpanded(); }}
                    className="pmp-mini-hit"
                    style={{
                      marginLeft: "auto",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: color.muted,
                      minWidth: 44,
                      minHeight: 44,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M6 15l6-6 6 6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <BottomNavigation items={items} activeId={activeTab} onSelect={setScreen} />
      </div>

      {menu && (
        <TrackActionsMenu
          track={menu.track}
          playlistCtx={playlistCtx}
          activePlaylistId={menu.activePlaylistId}
          x={menu.x}
          y={menu.y}
          onClose={close}
        />
      )}
    </div>
  );
}
