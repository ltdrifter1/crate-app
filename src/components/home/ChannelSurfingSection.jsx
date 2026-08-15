import { memo } from "react";
import {
  chrome,
  color,
  fontDisplay,
  fontMono,
  homeSpace,
  motion,
  y2k,
} from "../../theme";
import { Rail } from "./MusicSection";
import ChannelCard from "./ChannelCard";

/**
 * Channel surfing — premium dial band at the top of Home.
 * Art-first channel posters under a broadcast header (not a generic shelf).
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
        overflow: "hidden",
        animation: `rise 0.55s ${motion.ease} ${delay}s both`,
      }}
    >
      {/* Atmosphere — tuner bloom, no chassis card */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse 85% 70% at 0% 0%, rgba(${chrome.cyanRgb},0.12) 0%, transparent 55%),
            radial-gradient(ellipse 55% 50% at 100% 80%, rgba(123,167,255,0.06) 0%, transparent 50%),
            linear-gradient(180deg, rgba(14,18,24,0.55) 0%, transparent 70%)
          `,
        }}
      />

      {/* Header */}
      <div
        style={{
          position: "relative",
          padding: `8px ${homeSpace.gutter}px 0`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 14,
            flexWrap: "wrap",
            paddingBottom: 14,
            borderBottom: `1px solid rgba(${chrome.cyanRgb},0.18)`,
            marginBottom: 16,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: chrome.signal,
                  boxShadow: `0 0 0 2px rgba(${chrome.cyanRgb},0.2), 0 0 12px rgba(${chrome.cyanRgb},0.45)`,
                  animation: "breathe 2.4s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  fontFamily: fontMono,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 1.8,
                  textTransform: "uppercase",
                  color: chrome.steel,
                }}
              >
                Scene dial
              </span>
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: fontDisplay,
                fontSize: "clamp(26px, 6.5vw, 36px)",
                fontWeight: 800,
                letterSpacing: -0.9,
                textTransform: "uppercase",
                color: y2k.offWhite,
                lineHeight: 0.95,
              }}
            >
              Channel surfing
            </h2>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 14,
                fontWeight: 500,
                color: color.muted,
                lineHeight: 1.4,
                maxWidth: 340,
              }}
            >
              Zap the dial — scenes with sleeve heat, one tap to tune.
            </p>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid rgba(101,230,255,0.2)",
              background: `
                linear-gradient(180deg, rgba(101,230,255,0.06) 0%, transparent 100%),
                rgba(8,12,16,0.65)
              `,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: fontMono,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: chrome.signal,
              }}
            >
              {String(channels.length).padStart(2, "0")}
            </span>
            <span
              style={{
                fontFamily: fontMono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: color.muted,
              }}
            >
              channels
            </span>
          </div>
        </div>
      </div>

      {/* Poster rail */}
      <Rail gap={14} padBottom={10}>
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
