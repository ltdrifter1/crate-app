import { memo } from "react";
import { homeSpace, motion } from "../../theme";
import { Rail } from "./MusicSection";
import ChannelCard from "./ChannelCard";
import HomeBandHeader from "./HomeBandHeader";

/**
 * Channel surfing — top Home dial band.
 * Same left-edge header as every other Home shelf; premium lives in the posters.
 */
function ChannelSurfingSection({
  channels = [],
  channelCovers = {},
  activeChannelId = null,
  onTuneChannel = null,
  first = true,
  delay = 0.04,
}) {
  if (!channels.length) return null;

  const tile = Math.round(homeSpace.tileFeatured * 1.06);

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
        title="Channel surfing"
        subtitle="Zap the dial — scenes with sleeve heat"
        eyebrow="Scene dial"
        meta={`${String(channels.length).padStart(2, "0")} channels`}
      />

      <Rail gap={homeSpace.shelfGap} padBottom={8}>
        {channels.map((channel, i) => (
          <div
            key={channel.id}
            style={{
              animation: `rise 0.4s ${motion.ease} ${Math.min(i, 8) * 0.03}s both`,
            }}
          >
            <ChannelCard
              channel={channel}
              covers={channelCovers[channel.id] || []}
              active={activeChannelId === channel.id}
              size={tile}
              onClick={() => onTuneChannel?.(channel)}
            />
          </div>
        ))}
      </Rail>
    </section>
  );
}

export default memo(ChannelSurfingSection);
