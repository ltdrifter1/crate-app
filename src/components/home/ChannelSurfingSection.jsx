import { memo, useEffect, useState } from "react";
import { homeSpace, motion } from "../../theme";
import { runAfterDelay } from "../../lib/afterPaint";
import { Rail } from "./MusicSection";
import ChannelCard from "./ChannelCard";
import HomeBandHeader from "./HomeBandHeader";

/** First paint: a handful of stations. The rest wait until the browser is idle. */
export const FIRST_STATIONS = 6;

/**
 * Channel surfing — first Home destination band.
 * Each tile is a small PS1 plate from /channels/*.png (no album-sleeve fetch).
 */
function ChannelSurfingSection({
  channels = [],
  tracks = [],
  activeChannelId = null,
  onTuneChannel = null,
  first = true,
  delay = 0.02,
  title = "Channel Surfing",
  subtitle = "Flip the dial.",
  featured = false,
}) {
  const [showAll, setShowAll] = useState(process.env.NODE_ENV === "test");
  useEffect(() => {
    if (process.env.NODE_ENV === "test") return undefined;
    if (channels.length <= FIRST_STATIONS) return undefined;
    return runAfterDelay(() => setShowAll(true), 1800);
  }, [channels.length]);

  const visible = showAll ? channels : channels.slice(0, FIRST_STATIONS);

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
        {visible.map((channel, i) => (
          <div
            key={channel.id}
            style={{
              animation: `rise 0.45s ${motion.ease} ${Math.min(i, 8) * 0.035}s both`,
            }}
          >
            <ChannelCard
              channel={channel}
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
