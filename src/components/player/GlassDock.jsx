import { lazy, Suspense } from "react";
import {
  artShadow, color, dock, fontDisplay, motion, neons, radio,
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
        className={`glass-dock pmp-dock-stack pmp-dock-faceplate${hasPlayer ? " pmp-dock-stack--playing" : ""}`}
        style={{
          borderRadius: dock.radius,
          overflow: "hidden",
          pointerEvents: "auto",
          background: radio.moduleFace,
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.08), 0 16px 36px rgba(0,0,0,0.45)",
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
                background: radio.lcdFace,
                boxShadow: isRadioMode || hypnoPocket
                  ? `inset 3px 0 0 ${color.alert}`
                  : `inset 0 2px 10px rgba(0,0,0,0.45), inset 0 1px 0 rgba(168,255,106,0.12)`,
              }}
            >
              <div
                className="pmp-mini-cover"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  overflow: "hidden",
                  flexShrink: 0,
                  border: "1.5px solid rgba(255,255,255,0.12)",
                  background: color.surfaceRaised,
                  boxShadow: artShadow.raised,
                }}
              >
                {track.albumCover ? (
                  <CoverImage
                    src={track.albumCover}
                    alt=""
                    width={44}
                    height={44}
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
                  fontSize: 14, fontWeight: 700, color: color.lcdInk,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontFamily: fontDisplay, letterSpacing: -0.2,
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
                  fontSize: 12, color: color.lcdMute, marginTop: 2,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontFamily: fontDisplay, letterSpacing: -0.1,
                }}>
                  {track.artist}
                </div>
              </div>

              <VuBars isPlaying={isPlaying} track={track} />

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

      <style>{`
        @keyframes pmpVuPulse1 { 0%,100%{height:3px} 40%{height:10px} 70%{height:6px} }
        @keyframes pmpVuPulse2 { 0%,100%{height:5px} 35%{height:12px} 65%{height:4px} }
        @keyframes pmpVuPulse3 { 0%,100%{height:7px} 30%{height:14px} 60%{height:9px} }
        @keyframes pmpVuPulse4 { 0%,100%{height:4px} 45%{height:11px} 75%{height:3px} }
        @keyframes pmpVuPulse5 { 0%,100%{height:6px} 38%{height:13px} 68%{height:5px} }
      `}</style>

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

/** Five-bar VU meter — animates when playing, frozen when paused. */
function VuBars({ isPlaying, track }) {
  const energy = track?.energy ?? 5;
  const base = Math.max(0.4, energy / 10);
  const bars = [
    { anim: "pmpVuPulse2", dur: 0.55, delay: 0,    color: neons.cyan   },
    { anim: "pmpVuPulse4", dur: 0.6,  delay: 0.1,  color: neons.lime   },
    { anim: "pmpVuPulse1", dur: 0.5,  delay: 0.05, color: neons.phosphor },
    { anim: "pmpVuPulse3", dur: 0.65, delay: 0.12, color: neons.lime   },
    { anim: "pmpVuPulse5", dur: 0.58, delay: 0.08, color: neons.cyan   },
  ];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 2,
        height: 14,
        flexShrink: 0,
        opacity: isPlaying ? 0.85 : 0.28,
      }}
    >
      {bars.map((b, i) => (
        <div
          key={i}
          style={{
            width: 3,
            borderRadius: 1.5,
            background: b.color,
            height: isPlaying ? undefined : `${Math.round(4 + base * 8)}px`,
            animation: isPlaying
              ? `${b.anim} ${b.dur}s ease-in-out ${b.delay}s infinite`
              : "none",
            boxShadow: isPlaying ? `0 0 4px ${b.color}` : "none",
          }}
        />
      ))}
    </div>
  );
}
