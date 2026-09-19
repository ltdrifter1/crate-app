/**
 * Shared listening deck — PS1 glass module with LCD seek, planet play,
 * chamfered hardware keys, and Slow/Fast pace. Hero + immersive.
 */
import Icon from "../ui/Icon";
import { EnergyShiftFeedback, PaceSlot } from "../listen/EnergyShiftButton";
import { PlayKey } from "./OrbitalControls";
import { HardwareIconButton, LcdTimeline } from "./DeviceChrome";

export default function PlayerDeck({
  progress = 0,
  duration = 0,
  onSeek = null,
  isPlaying = false,
  buffering = false,
  onTogglePlay = null,
  onPrev = null,
  onSkip = null,
  onLike = null,
  onDislike = null,
  liked = false,
  disliked = false,
  extraKeys = null,
  playSize = 48,
  stopPropagation = true,
  paceStopPropagation = true,
  feedbackBottom = "calc(100% + 10px)",
  seekStopPropagation = true,
}) {
  return (
    <div className="pmp-deck pmp-deck-plate" data-testid="player-deck">
      <LcdTimeline
        progress={progress}
        duration={duration}
        onChange={onSeek}
        stopPropagation={seekStopPropagation}
      />
      <EnergyShiftFeedback bottom={feedbackBottom} />
      <div className="pmp-deck-keys pmp-deck-pad">
        {onPrev ? (
          <HardwareIconButton
            label="Previous"
            onClick={onPrev}
            stopPropagation={stopPropagation}
            size={40}
          >
            <Icon name="prev" size={15} />
          </HardwareIconButton>
        ) : null}
        <PlayKey
          isPlaying={isPlaying}
          buffering={buffering}
          onClick={onTogglePlay}
          size={playSize}
          glowing={isPlaying && !buffering}
          stopPropagation={stopPropagation}
        />
        {onSkip ? (
          <HardwareIconButton
            label="Next"
            onClick={onSkip}
            stopPropagation={stopPropagation}
            size={40}
          >
            <Icon name="skip" size={15} />
          </HardwareIconButton>
        ) : null}
        {onLike ? (
          <HardwareIconButton
            label={liked ? "Unlike" : "Like"}
            active={!!liked}
            onClick={onLike}
            stopPropagation={stopPropagation}
            size={36}
          >
            <span style={{ display: "flex", animation: liked ? "likePop 0.25s ease" : "none" }}>
              <Icon name={liked ? "heart" : "heartempty"} size={15} />
            </span>
          </HardwareIconButton>
        ) : null}
        {onDislike ? (
          <HardwareIconButton
            label="Dislike this track"
            active={!!disliked}
            onClick={onDislike}
            stopPropagation={stopPropagation}
            size={36}
          >
            <Icon name={disliked ? "dislikefilled" : "dislike"} size={15} />
          </HardwareIconButton>
        ) : null}
        {extraKeys}
      </div>
      <PaceSlot compact stopPropagation={paceStopPropagation} />
    </div>
  );
}
