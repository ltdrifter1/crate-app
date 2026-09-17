/**
 * Desktop sticky mini-player — subscribes to playback clock so App root
 * does not re-render on timeupdate.
 */
import {
  color, dock, motion,
} from "../../theme";
import { fmtTime } from "../../lib/harmony";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { useIsPlaying } from "../../usePlayerTransport";
import { EnergyShiftFeedback, EnergyShiftButton } from "../listen/EnergyShiftButton";
import DeviceLcd, { formatTrackMeta } from "./DeviceLcd";
import FreePlaysMeter from "../billing/FreePlaysMeter";
import { freePlaysMeterLabel } from "../../lib/freePlays";
import Icon from "../ui/Icon";
import { IceOrbPlay, OrbitalArtRing } from "./OrbitalControls";
import { dockTintStyle } from "../../lib/dockTint";

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
          ...dockTintStyle(track),
        }}
      >
        <OrbitalArtRing
          track={track}
          progress={progress}
          duration={duration}
          size={48}
          onSeek={onSeek}
          artRadius={6}
        />
        <DeviceLcd
          compact
          title={track.title}
          artist={track.artist}
          live={!!isRadioMode && isPlaying}
          bits={formatTrackMeta(track, playsLabel ? [playsLabel] : [])}
          timeText={`${fmtTime(progress)}${duration ? ` / ${fmtTime(duration)}` : ""}`}
        />
        <EnergyShiftButton direction="down" size={48} compact={false} stopPropagation />
        <IceOrbPlay
          isPlaying={isPlaying}
          onClick={onTogglePlay}
          size={40}
          iconSize={16}
          stopPropagation
        />
        <button
          type="button"
          aria-label="Next"
          onClick={(e) => { e.stopPropagation(); onSkip(); }}
          style={{ background: "none", border: "none", cursor: "pointer", color: color.muted, padding: 4 }}
        >
          <Icon name="skip" size={16} />
        </button>
        <EnergyShiftButton direction="up" size={48} compact={false} stopPropagation />
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
        <button
          type="button"
          aria-label="Dislike this track"
          onClick={(e) => { e.stopPropagation(); onDislike?.(); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: track.disliked ? color.alert : color.faint, padding: 4,
          }}
        >
          <Icon name={track.disliked ? "dislikefilled" : "dislike"} size={16} />
        </button>
      </div>
    </div>
  );
}
