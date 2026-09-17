import { lazy, Suspense } from "react";
import {
  color, dock, motion,
} from "../../theme";
import Icon from "../ui/Icon";
import BottomNavigation from "../home/BottomNavigation";
import { TrackActionsMenu, TrackMoreButton, useTrackMenu } from "../listen/TrackRow";
import { IceOrbPlay, OrbitalArtRing } from "../player/OrbitalControls";
import { fmtTime } from "../../lib/harmony";
import { primaryNavItems, dockActiveTab } from "../../lib/nav";
import FreePlaysMeter from "../billing/FreePlaysMeter";
import {
  useIsBuffering,
  useIsPlaying,
} from "../../usePlayerTransport";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { dockTintStyle } from "../../lib/dockTint";
import DeviceLcd, { formatTrackMeta } from "./DeviceLcd";
import { EnergyShiftButton } from "../listen/EnergyShiftButton";

const EnergyShiftFeedback = lazy(() =>
  import("../listen/EnergyShiftButton").then((m) => ({ default: m.EnergyShiftFeedback }))
);

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

  const hasPlayer = !!track && !hidePlayer;
  const { menu, openFromButton, openFromContext, close } = useTrackMenu();
  const tint = dockTintStyle(track);

  const activeTab = dockActiveTab(screen, { hasAdmin: showAdmin });

  return (
    <div
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
      {hasPlayer && (
        <div
          className="glass-dock"
          style={{
            borderRadius: dock.radius,
            overflow: "hidden",
            pointerEvents: "auto",
            marginBottom: 8,
            ...tint,
          }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onContextMenu={(e) => openFromContext(e, track)}
            onKeyDown={(e) => { if (e.key === "Enter") onOpen?.(); }}
            aria-label="Open now playing"
            style={{
              position: "relative",
              height: dock.playerH,
              padding: "8px 14px 8px 12px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              background: `
                linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)
              `,
              boxShadow: isRadioMode || hypnoPocket
                ? `inset 2px 0 0 ${color.accent}`
                : "none",
            }}
          >
            <OrbitalArtRing
              track={track}
              size={44}
              onSeek={onSeek}
              artRadius={6}
            />

            <DeviceLcd
              compact
              title={track.title}
              artist={track.artist}
              live={!!(isRadioMode || hypnoPocket) && isPlaying}
              bits={formatTrackMeta(track)}
              timeText={`${fmtTime(progress)}${duration ? ` / ${fmtTime(duration)}` : ""}`}
            />

            <EnergyShiftButton direction="down" size={42} compact stopPropagation />
            <button type="button" aria-label="Previous"
              onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: color.muted, padding: 6 }}>
              <Icon name="prev" size={16}/>
            </button>
            <IceOrbPlay
              isPlaying={isPlaying}
              buffering={isBuffering}
              onClick={onTogglePlay}
              size={36}
              iconSize={14}
              stopPropagation
            />
            <button type="button" aria-label="Next"
              onClick={(e) => { e.stopPropagation(); onSkip(); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: color.muted, padding: 6 }}>
              <Icon name="skip" size={16}/>
            </button>
            <EnergyShiftButton direction="up" size={42} compact stopPropagation />
            <span className="dock-xtra" style={{ display: "flex" }}>
              <button type="button" aria-label={track.liked ? "Unlike" : "Like"}
                onClick={(e) => { e.stopPropagation(); onLike(); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: track.liked ? color.accent : color.faint, padding: 6 }}>
                <span style={{ display: "flex", animation: track.liked ? "likePop 0.25s ease" : "none" }}>
                  <Icon name={track.liked ? "heart" : "heartempty"} size={16}/>
                </span>
              </button>
            </span>
            {onShowQueue && (
              <span className="dock-xtra" style={{ display: "flex" }}>
                <button type="button" aria-label="Up Next"
                  onClick={(e) => { e.stopPropagation(); onShowQueue(); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: color.faint, padding: 6 }}>
                  <Icon name="queue" size={16}/>
                </button>
              </span>
            )}
            <span className="dock-xtra" style={{ display: "flex" }}>
              <TrackMoreButton onClick={(e) => openFromButton(e, track)} />
            </span>
          </div>
        </div>
      )}

      <BottomNavigation items={items} activeId={activeTab} onSelect={setScreen} />

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
