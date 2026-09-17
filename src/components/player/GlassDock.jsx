import { lazy, Suspense } from "react";
import {
  color, dock, fontDisplay, fontMono, motion,
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

const EnergyShiftFeedback = lazy(() =>
  import("../listen/EnergyShiftButton").then((m) => ({ default: m.EnergyShiftFeedback }))
);
const EnergyShiftControl = lazy(() =>
  import("../listen/EnergyShiftButton").then((m) => ({ default: m.EnergyShiftControl }))
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
              size={42}
              onSeek={onSeek}
              artRadius={9}
            />

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
                    boxShadow: "none",
                    animation: isPlaying ? "stageLiveDot 1.6s ease-in-out infinite" : "none",
                  }}/>
                )}
                {track.title}
              </div>
              <div style={{
                fontSize: 11, color: color.muted, marginTop: 3,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {track.artist}
                </span>
                <span style={{
                  flexShrink: 0,
                  fontFamily: fontMono,
                  fontSize: 10,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: 0.2,
                  color: color.faint,
                }}>
                  {fmtTime(progress)}{duration ? ` / ${fmtTime(duration)}` : ""}
                </span>
              </div>
            </div>

            <button type="button" aria-label={track.liked ? "Unlike" : "Like"}
              onClick={(e) => { e.stopPropagation(); onLike(); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: track.liked ? color.ink : color.faint, padding: 8 }}>
              <span style={{ display: "flex", animation: track.liked ? "likePop 0.25s ease" : "none" }}>
                <Icon name={track.liked ? "heart" : "heartempty"} size={16}/>
              </span>
            </button>
            <button type="button" aria-label="Dislike this track"
              onClick={(e) => { e.stopPropagation(); onDislike?.(); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: track.disliked ? color.alert : color.faint, padding: 8 }}>
              <Icon name={track.disliked ? "dislikefilled" : "dislike"} size={16}/>
            </button>
            {onShowQueue && (
              <span className="dock-xtra" style={{ display: "flex" }}>
                <button type="button" aria-label="Up Next"
                  onClick={(e) => { e.stopPropagation(); onShowQueue(); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: color.faint, padding: 8 }}>
                  <Icon name="queue" size={16}/>
                </button>
              </span>
            )}
            <span className="dock-xtra" style={{ display: "flex" }}>
              <TrackMoreButton onClick={(e) => openFromButton(e, track)} />
            </span>
            <button type="button" aria-label="Previous"
              onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: color.muted, padding: 8 }}>
              <Icon name="prev" size={16}/>
            </button>
            <IceOrbPlay
              isPlaying={isPlaying}
              buffering={isBuffering}
              onClick={onTogglePlay}
              size={34}
              iconSize={14}
              stopPropagation
            />
            <button type="button" aria-label="Next"
              onClick={(e) => { e.stopPropagation(); onSkip(); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: color.muted, padding: 8 }}>
              <Icon name="skip" size={16}/>
            </button>
            <span style={{ display: "flex" }}>
              <Suspense fallback={null}>
                <EnergyShiftControl size={30} />
              </Suspense>
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
