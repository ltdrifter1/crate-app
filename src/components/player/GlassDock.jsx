import { lazy, Suspense } from "react";
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
import { HardwareIconButton } from "./DeviceChrome";

const EnergyShiftFeedback = lazy(() =>
  import("../listen/EnergyShiftButton").then((m) => ({ default: m.EnergyShiftFeedback }))
);

/**
 * Mobile dock — collapsed now-playing over the four tabs.
 * Cover + title + play/skip. Tap the bar opens the immersive player.
 * Pace lives on the hero and immersive decks, not here.
 */
export default function GlassDock({
  screen, setScreen, showAdmin = false,
  track,
  onTogglePlay, onSkip,
  isRadioMode, onOpen, playlistCtx, hypnoPocket,
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
  const { menu, openFromContext, close } = useTrackMenu();
  const tint = dockTintStyle(track);

  const activeTab = dockActiveTab(screen, { hasAdmin: showAdmin });
  const pct = duration > 0 ? Math.max(0, Math.min(100, (progress / duration) * 100)) : 0;

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
            className="pmp-mini-player"
            data-testid="mini-player"
          >
            <div className="pmp-mini-progress" aria-hidden="true">
              <div className="pmp-mini-progress__fill" style={{ width: `${pct}%` }} />
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => onOpen?.()}
              onContextMenu={(e) => openFromContext(e, track)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpen?.();
                }
              }}
              aria-label="Open now playing"
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
