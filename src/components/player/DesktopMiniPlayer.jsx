/**
 * Desktop sticky mini-player — subscribes to playback clock so App root
 * does not re-render on timeupdate.
 */
import {
  fontDisplay, fontMono, color, dock, motion,
} from "../../theme";
import { fmtTime } from "../../lib/harmony";
import { usePlayerPlayback } from "../../usePlayerPlayback";
import { useIsPlaying } from "../../usePlayerTransport";
import { EnergyShiftFeedback, EnergyShiftControl } from "../listen/EnergyShiftButton";

export default function DesktopMiniPlayer({
  track,
  isRadioMode,
  onOpen,
  onTogglePlay,
  onSkip,
  onLikeToggle,
  onSeek,
  OrbitalArtRing,
  IceOrbPlay,
  Icon,
  dockTintStyle,
}) {
  const { progress, duration } = usePlayerPlayback();
  const isPlaying = useIsPlaying();
  if (!track) return null;

  return (
    <div style={{ position: "fixed", bottom: 12, left: 232, right: 348, zIndex: 80 }}>
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
          size={44}
          onSeek={onSeek}
          artRadius={8}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 650, color: color.ink,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            letterSpacing: -0.2, fontFamily: fontDisplay,
          }}>
            {isRadioMode && (
              <span style={{
                display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                background: color.accent, marginRight: 8, verticalAlign: "middle",
                boxShadow: isPlaying ? `0 0 0 3px ${color.accentSoft}` : "none",
                animation: isPlaying ? "breathe 2s ease-in-out infinite" : "none",
              }} />
            )}
            {track.title}
          </div>
          <div style={{ fontSize: 11, color: color.muted, marginTop: 2 }}>
            {track.artist}
          </div>
        </div>
        <span style={{
          fontSize: 10, color: color.faint, fontFamily: fontMono,
          fontVariantNumeric: "tabular-nums", flexShrink: 0, letterSpacing: 0.2,
        }}>
          {fmtTime(progress)}{duration ? ` / ${fmtTime(duration)}` : ""}
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onLikeToggle(); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: track.liked ? color.accent : color.faint, padding: 4,
          }}
        >
          <Icon name={track.liked ? "heart" : "heartempty"} size={16} />
        </button>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, opacity: 0.85 }}>
          <IceOrbPlay
            isPlaying={isPlaying}
            onClick={onTogglePlay}
            size={36}
            iconSize={15}
            stopPropagation
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSkip(); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: color.muted, padding: 4 }}
          >
            <Icon name="skip" size={16} />
          </button>
          <EnergyShiftControl size={30} />
        </span>
      </div>
    </div>
  );
}
