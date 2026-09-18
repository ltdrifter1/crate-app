/**
 * Desktop sticky mini-player — same device language as the dock / hero.
 */
import {
  fontDisplay, color, dock, motion, radio,
} from "../../theme";
import { fmtTime } from "../../lib/harmony";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { useIsPlaying } from "../../usePlayerTransport";
import { EnergyShiftFeedback, EnergyShiftButton } from "../listen/EnergyShiftButton";
import FreePlaysMeter from "../billing/FreePlaysMeter";
import { freePlaysMeterLabel } from "../../lib/freePlays";
import Icon from "../ui/Icon";
import { PlayKey } from "./OrbitalControls";
import { dockTintStyle } from "../../lib/dockTint";
import CoverImage from "../ui/CoverImage";
import { LcdMetaLine, LcdSeek, LcdTimes, trackLcdBits } from "./DeviceChrome";

export default function DesktopMiniPlayer({
  track,
  isRadioMode,
  onOpen,
  onTogglePlay,
  onSkip,
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
  const bits = trackLcdBits(track, [playsLabel]);

  return (
    <div style={{ position: "fixed", bottom: 12, left: 232, right: 348, zIndex: 80 }}>
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
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
          overflow: "hidden",
          position: "relative",
          animation: `dockRise 0.4s ${motion.ease} both`,
          padding: "10px 16px",
          background: radio.stripFace,
          ...dockTintStyle(track),
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
          <LcdMetaLine bits={bits} />
          <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 4 }}>
            <LcdSeek
              value={progress}
              max={duration || 1}
              onChange={onSeek}
              label="Seek"
              stopPropagation
              height={4}
            />
            <LcdTimes progress={progress} duration={duration} />
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
        <EnergyShiftButton direction="down" size={36} />
        <PlayKey
          isPlaying={isPlaying}
          onClick={onTogglePlay}
          size={40}
          iconSize={16}
          stopPropagation
          glowing={isPlaying}
        />
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSkip(); }}
          aria-label="Next"
          style={{ background: "none", border: "none", cursor: "pointer", color: color.ink, padding: 4 }}
        >
          <Icon name="skip" size={16} />
        </button>
        <EnergyShiftButton direction="up" size={36} />
      </div>
    </div>
  );
}
