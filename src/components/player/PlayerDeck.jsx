/**
 * Shared listening deck — artwork transport with LCD seek, planet play,
 * rounded hardware keys, and Slow / Fast pace controls. Hero + immersive.
 */
import { useEffect, useState } from "react";
import Icon from "../ui/Icon";
import { EnergyShiftFeedback, RabbitTurtleSlot } from "../listen/EnergyShiftButton";
import { PlayKey } from "./OrbitalControls";
import { HardwareIconButton, LcdTimeline } from "./DeviceChrome";
import { hasSeenDeckHint, markDeckHintSeen } from "../../lib/firstRunHint";
import { BTN_PRIMARY, color, fontMono, motion } from "../../theme";

function DeckHint({ showDislike }) {
  const [open, setOpen] = useState(() => !hasSeenDeckHint());

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => {
      markDeckHintSeen();
      setOpen(false);
    }, 4000);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;
  return (
    <p
      data-testid="deck-hint"
      style={{
        margin: "6px 2px 0",
        fontFamily: fontMono,
        fontSize: 10,
        fontWeight: 650,
        letterSpacing: 0.04,
        lineHeight: 1.35,
        color: color.muted,
        animation: `rise 0.35s ${motion.ease} both`,
      }}
    >
      Slow or Fast changes what plays next.
      {showDislike ? " Dislike steers the mix away." : ""}
    </p>
  );
}

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
  onShare = null,
  onShowQueue = null,
  liked = false,
  disliked = false,
  extraKeys = null,
  playSize = 48,
  stopPropagation = true,
  paceStopPropagation = true,
  feedbackBottom = "calc(100% + 10px)",
  seekStopPropagation = true,
  idle = false,
  playDisabled = false,
  onStart = null,
}) {
  return (
    <div className="pmp-deck pmp-deck-plate" data-testid="player-deck">
      {!idle && (
        <LcdTimeline
          progress={progress}
          duration={duration}
          onChange={onSeek}
          stopPropagation={seekStopPropagation}
        />
      )}
      <EnergyShiftFeedback bottom={feedbackBottom} />
      {idle ? (
        <div className="pmp-deck-keys pmp-deck-pad">
          <button
            type="button"
            aria-label="Start listening"
            disabled={playDisabled}
            onClick={(e) => {
              if (stopPropagation) e.stopPropagation();
              if (!playDisabled) onStart?.();
            }}
            className="pmp-press play-primary"
            style={{
              ...BTN_PRIMARY,
              width: "auto",
              height: 44,
              padding: "0 22px",
              opacity: playDisabled ? 0.6 : 1,
              cursor: playDisabled ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="play" size={15} />
            Start listening
          </button>
        </div>
      ) : (
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
        {onShare ? (
          <HardwareIconButton
            label="Share"
            onClick={onShare}
            stopPropagation={stopPropagation}
            size={36}
          >
            <Icon name="share" size={15} />
          </HardwareIconButton>
        ) : null}
        {onShowQueue ? (
          <HardwareIconButton
            label="Up next"
            onClick={onShowQueue}
            stopPropagation={stopPropagation}
            size={36}
          >
            <Icon name="queue" size={15} />
          </HardwareIconButton>
        ) : null}
        {extraKeys}
      </div>
      )}
      <RabbitTurtleSlot compact stopPropagation={paceStopPropagation} />
      <DeckHint showDislike={!idle && !!onDislike} />
    </div>
  );
}
