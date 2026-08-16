import { memo } from "react";
import { homeSpace, motion } from "../../theme";
import { Rail } from "./MusicSection";
import ChannelCard from "./ChannelCard";
import HomeBandHeader from "./HomeBandHeader";

/**
 * Channel surfing — first Home destination band.
 * Future-ticket rail; clean App Store section header.
 */
function ChannelSurfingSection({
  channels = [],
  channelCovers = {},
  activeChannelId = null,
  onTuneChannel = null,
  first = true,
  delay = 0.02,
}) {
  if (!channels.length) return null;

  const ticketW = homeSpace.tileTicket;

  return (
    <section
      aria-label="Channel surfing"
      className="pmp-channel-surf"
      style={{
        position: "relative",
        marginTop: first ? homeSpace.sectionGapFirst : homeSpace.sectionGap,
        animation: `rise 0.5s ${motion.ease} ${delay}s both`,
      }}
    >
      <HomeBandHeader
        title="Channel Surfing"
        subtitle="Pick a scene. Instant dial."
        action={null}
        meta={`${channels.length} channels`}
      />

      <Rail gap={homeSpace.shelfGap} padBottom={6}>
        {channels.map((channel, i) => (
          <div
            key={channel.id}
            style={{
              animation: `rise 0.45s ${motion.ease} ${Math.min(i, 8) * 0.035}s both`,
            }}
          >
            <ChannelCard
              channel={channel}
              covers={channelCovers[channel.id] || []}
              active={activeChannelId === channel.id}
              size={ticketW}
              onClick={() => onTuneChannel?.(channel)}
            />
          </div>
        ))}
      </Rail>
    </section>
  );
}

export default memo(ChannelSurfingSection);
