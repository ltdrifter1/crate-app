import { lazy, Suspense } from "react";
import {
  color, dock, fontDisplay, motion, radio,
} from "../../theme";
import Icon from "../ui/Icon";
import BottomNavigation from "../home/BottomNavigation";
import { TrackActionsMenu, TrackMoreButton, useTrackMenu } from "../listen/TrackRow";
import { PlayKey } from "../player/OrbitalControls";
import { fmtTime } from "../../lib/harmony";
import { primaryNavItems, dockActiveTab } from "../../lib/nav";
import FreePlaysMeter from "../billing/FreePlaysMeter";
import {
  useIsBuffering,
  useIsPlaying,
} from "../../usePlayerTransport";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { dockTintStyle } from "../../lib/dockTint";
import CoverImage from "../ui/CoverImage";
import { LcdMetaLine, LcdSeek, trackLcdBits } from "./DeviceChrome";

const EnergyShiftFeedback = lazy(() =>
  import("../listen/EnergyShiftButton").then((m) => ({ default: m.EnergyShiftFeedback }))
);
const EnergyShiftButton = lazy(() =>
  import("../listen/EnergyShiftButton").then((m) => ({ default: m.EnergyShiftButton }))
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
  const bits = trackLcdBits(track);

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
              minHeight: dock.playerH,
              padding: "8px 10px 8px 10px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              background: radio.stripFace,
              boxShadow: isRadioMode || hypnoPocket
                ? `inset 2px 0 0 ${color.accent}`
                : "none",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 6,
                overflow: "hidden",
                flexShrink: 0,
                border: "1px solid rgba(232,234,238,0.12)",
                background: "#101218",
              }}
            >
              {track.albumCover ? (
                <CoverImage
                  src={track.albumCover}
                  alt=""
                  width={48}
                  height={48}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{
                  width: "100%", height: "100%", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontFamily: fontDisplay, fontWeight: 700, color: color.muted, fontSize: 16,
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
                fontSize: 12, color: color.muted, marginTop: 2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {track.artist}
              </div>
              <LcdMetaLine bits={[
                ...bits,
                `${fmtTime(progress)}${duration ? ` / ${fmtTime(duration)}` : ""}`,
              ]} />
            </div>

            <button type="button" aria-label={track.liked ? "Unlike" : "Like"}
              className="dock-xtra"
              onClick={(e) => { e.stopPropagation(); onLike(); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: track.liked ? color.accent : color.faint, padding: 8 }}>
              <span style={{ display: "flex", animation: track.liked ? "likePop 0.25s ease" : "none" }}>
                <Icon name={track.liked ? "heart" : "heartempty"} size={16}/>
              </span>
            </button>
            <span className="dock-xtra" style={{ display: "flex" }}>
              <TrackMoreButton onClick={(e) => openFromButton(e, track)} />
            </span>
            <PlayKey
              isPlaying={isPlaying}
              buffering={isBuffering}
              onClick={onTogglePlay}
              size={40}
              iconSize={16}
              stopPropagation
              glowing={isPlaying && !isBuffering}
            />
            <span style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
              <Suspense fallback={null}>
                <EnergyShiftButton direction="down" size={34} />
                <EnergyShiftButton direction="up" size={34} />
              </Suspense>
            </span>
          </div>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ padding: "0 12px 6px" }}
          >
            <LcdSeek
              value={progress}
              max={duration || 1}
              onChange={onSeek}
              label="Seek"
              stopPropagation
              height={4}
            />
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
