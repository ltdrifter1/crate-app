import { memo, useMemo } from "react";
import { homeSpace, motion } from "../../theme";
import { channelCoverUrls } from "../../lib/sceneChannels";
import { Rail } from "./MusicSection";
import ChannelCard from "./ChannelCard";
import HomeBandHeader from "./HomeBandHeader";

/**
 * Channel surfing — first Home destination band.
 * One catalog sleeve per tile (not a 4-up mosaic) so Home does not fire
 * dozens of cover requests on first paint. Pictogram stays the bug / backup.
 */
function ChannelSurfingSection({
  channels = [],
  tracks = [],
  activeChannelId = null,
  onTuneChannel = null,
  first = true,
  delay = 0.02,
  title = "Channel Surfing",
  subtitle = "Flip the dial. Music stays on this stage.",
  featured = false,
}) {
  const coverById = useMemo(() => {
    const map = {};
    for (const channel of channels) {
      map[channel.id] = channelCoverUrls(tracks, channel, 1);
    }
    return map;
  }, [channels, tracks]);

  if (!channels.length) return null;

  const tile = featured ? Math.round(homeSpace.tileTicket * 0.92) : homeSpace.tileTicket;
  const lead = featured ? homeSpace.tileFeatured : tile;

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

      <Rail gap={homeSpace.shelfGap} padTop={24} padBottom={26} alignItems="flex-end">
        {channels.map((channel, i) => (
          <div
            key={channel.id}
            style={{
              animation: `rise 0.45s ${motion.ease} ${Math.min(i, 8) * 0.035}s both`,
            }}
          >
            <ChannelCard
              channel={channel}
              covers={coverById[channel.id] || []}
              active={activeChannelId === channel.id}
              size={i === 0 ? lead : tile}
              priority={i === 0}
              eager={i < 3}
              onClick={() => onTuneChannel?.(channel)}
            />
          </div>
        ))}
      </Rail>
    </section>
  );
}

export default memo(ChannelSurfingSection);
