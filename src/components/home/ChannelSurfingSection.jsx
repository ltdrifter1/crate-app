import { memo } from "react";
import { homeSpace, motion } from "../../theme";
import { Rail } from "./MusicSection";
import ChannelCard from "./ChannelCard";
import HomeBandHeader from "./HomeBandHeader";

/**
 * Channel surfing — first Home destination band.
 * Art-first station tiles; music stays on this stage.
 */
function ChannelSurfingSection({
  channels = [],
  activeChannelId = null,
  onTuneChannel = null,
  first = true,
  delay = 0.02,
  title = "Channel Surfing",
  subtitle = "Flip the dial. Music stays on this stage.",
}) {
  if (!channels.length) return null;

  const tile = homeSpace.tileTicket;

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
        title={title}
        subtitle={subtitle}
        action={null}
        meta={`${channels.length} channels`}
      />

      <Rail gap={homeSpace.shelfGap} padTop={20} padBottom={26}>
        {channels.map((channel, i) => (
          <div
            key={channel.id}
            style={{
              animation: `rise 0.45s ${motion.ease} ${Math.min(i, 8) * 0.035}s both`,
            }}
          >
            <ChannelCard
              channel={channel}
              active={activeChannelId === channel.id}
              size={tile}
              priority={i === 0}
              eager={i > 0 && i < 3}
              onClick={() => onTuneChannel?.(channel)}
            />
          </div>
        ))}
      </Rail>
    </section>
  );
}

export default memo(ChannelSurfingSection);
