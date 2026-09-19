/**
 * Desktop sticky mini-player — same device language as the dock / hero.
 */
import {
  fontDisplay, color, dock, glass, motion,
} from "../../theme";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { useIsPlaying } from "../../usePlayerTransport";
import { EnergyShiftFeedback, PaceSlot } from "../listen/EnergyShiftButton";
import FreePlaysMeter from "../billing/FreePlaysMeter";
import { freePlaysMeterLabel } from "../../lib/freePlays";
import Icon from "../ui/Icon";
import { PlayKey } from "./OrbitalControls";
import { dockTintStyle } from "../../lib/dockTint";
import CoverImage from "../ui/CoverImage";
import { LcdMetaLine, LcdSeek, LcdTimes, HardwareIconButton, formatBitrate, trackLcdBits } from "./DeviceChrome";

export default function DesktopMiniPlayer({
  track,
  isRadioMode,
  onOpen,
  onTogglePlay,
  onSkip,
  onPrev = null,
  onLikeToggle,
  onDislike = null,
  onSeek,
  playsRemaining = null,
  access = null,
  onOpenPlans = null,
}) {
  const { progress, duration } = usePlayerPlayback();
  const isPlaying = useIsPlaying();
  if (!track) return null;
  const playsLabel = freePlaysMeterLabel(playsRemaining, access);
  const bits = trackLcdBits(track, [
    formatBitrate(track),
    playsLabel,
  ]);

  return (
    <div style={{ position: "fixed", bottom: 12, left: 244, right: 72, zIndex: 80 }}>
      <FreePlaysMeter
        variant="banner"
        remaining={playsRemaining}
        access={access}
        onUpgrade={onOpenPlans}
        style={{ marginBottom: 8 }}
      />
      <EnergyShiftFeedback />
      <div
        onClick={onOpen}
        className="glass-dock"
        style={{
          borderRadius: dock.radius,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          cursor: "pointer",
          overflow: "hidden",
          position: "relative",
          animation: `dockRise 0.4s ${motion.ease} both`,
          padding: "10px 16px 8px",
          background: glass.fillStrong,
          backdropFilter: glass.blurHeavy,
          WebkitBackdropFilter: glass.blurHeavy,
          ...dockTintStyle(track),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 6,
            overflow: "hidden",
            flexShrink: 0,
            border: "1px solid rgba(91,101,116,0.12)",
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
          ) : null}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 650, color: color.ink,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            letterSpacing: -0.2, fontFamily: fontDisplay,
          }}>
            {isRadioMode && (
              <span style={{
                display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                background: color.alert, marginRight: 8, verticalAlign: "middle",
                animation: isPlaying ? "breathe 2s ease-in-out infinite" : "none",
              }} />
            )}
            {track.title}
          </div>
          <div style={{
            fontSize: 12, color: color.muted, marginTop: 2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {track.artist}
          </div>
          <LcdMetaLine bits={bits} tone="strip" />
          <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 4 }}>
            <LcdSeek
              value={progress}
              max={duration || 1}
              onChange={onSeek}
              label="Seek"
              stopPropagation
              height={4}
            />
            <LcdTimes progress={progress} duration={duration} tone="strip" />
          </div>
        </div>
        <button
          type="button"
          aria-label={track.liked ? "Unlike" : "Like"}
          onClick={(e) => { e.stopPropagation(); onLikeToggle(); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: track.liked ? color.accent : color.faint, padding: 4,
          }}
        >
          <Icon name={track.liked ? "heart" : "heartempty"} size={16} />
        </button>
        {onPrev && (
          <HardwareIconButton
            label="Previous"
            onClick={onPrev}
            size={32}
            stopPropagation
          >
            <Icon name="prev" size={14} />
          </HardwareIconButton>
        )}
        <PlayKey
          isPlaying={isPlaying}
          onClick={onTogglePlay}
          size={40}
          iconSize={16}
          stopPropagation
          glowing={isPlaying}
        />
        <HardwareIconButton
          label="Next"
          onClick={onSkip}
          size={32}
          stopPropagation
        >
          <Icon name="skip" size={14} />
        </HardwareIconButton>
        </div>
      <div
        onClick={(e) => e.stopPropagation()}
        className="pmp-deck"
        style={{ padding: "0 2px 2px" }}
      >
        <PaceSlot compact stopPropagation />
      </div>
      </div>
    </div>
  );
}
