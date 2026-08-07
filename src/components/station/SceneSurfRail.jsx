import { memo, useMemo, useState } from "react";
import {
  color, fontDisplay, fontMono, glass, homeSpace, motion, chrome
} from "../../theme";
import { availableSceneChannels } from "../../lib/sceneChannels";
import { formatChannelNum } from "../../lib/mtvChannel";

/**
 * Channel dial — zap between scene channels with CH-IDs.
 * Literal machined dial plates (compact mode for the booth player).
 */
function SceneSurfRail({
  tracks = [],
  activeChannelId = null,
  onTuneChannel = null,
  compact = false,
  quiet = false,
}) {
  const channels = useMemo(() => availableSceneChannels(tracks, 2), [tracks]);
  const [zapId, setZapId] = useState(null);

  if (!channels.length) return null;

  const tune = (ch) => {
    setZapId(ch.id);
    window.setTimeout(() => setZapId(null), 420);
    onTuneChannel?.(ch);
  };

  const tileW = compact ? 108 : 132;
  const showQuietHeader = quiet && !compact;
  const showFullHeader = !compact && !quiet;

  return (
    <section
      aria-label="Channel surfing"
      style={{
        padding: compact ? "4px 0 2px" : (quiet ? "8px 0 6px" : "14px 0 8px"),
        width: "100%",
        maxWidth: compact ? 400 : "none",
        animation: quiet
          ? "none"
          : compact
            ? `rise 0.4s ${motion.ease} both`
            : `rise 0.55s ${motion.ease} 0.06s both`,
      }}
    >
      {showFullHeader && (
        <div style={{ padding: `0 ${homeSpace.gutter}px 12px` }}>
          <h3 style={{
            margin: 0,
            fontFamily: fontDisplay,
            fontSize: "clamp(20px, 3.6vw, 24px)",
            fontWeight: 750,
            letterSpacing: -0.3,
            color: color.ink,
          }}>
            Channel surfing
          </h3>
        </div>
      )}

      {showQuietHeader && (
        <div style={{ padding: `0 ${homeSpace.gutter}px 10px` }}>
          <div style={{
            fontFamily: fontDisplay, fontSize: 13, fontWeight: 650,
            letterSpacing: -0.1, color: color.muted,
          }}>
            Channel surfing
          </div>
        </div>
      )}

      {compact && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "0 2px 8px",
        }}>
          <div style={{
            fontFamily: fontDisplay,
            fontSize: 13,
            fontWeight: 650,
            letterSpacing: -0.1,
            color: color.muted,
          }}>
            Channel surfing
          </div>
          <div style={{
            fontFamily: fontMono,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: color.faint,
          }}>
            Zap a channel
          </div>
        </div>
      )}

      <div
        className="hide-scroll"
        style={{
          display: "flex",
          gap: compact ? 7 : 8,
          overflowX: "auto",
          padding: compact
            ? "2px 2px 6px"
            : `2px ${homeSpace.gutter}px 16px`,
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {channels.map((ch) => {
          const active = activeChannelId === ch.id;
          const zapping = zapId === ch.id;
          const chLabel = formatChannelNum(ch.num);
          const slug = ch.dialSlug || (ch.shortTitle || ch.title || "").toUpperCase();
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => tune(ch)}
              aria-pressed={active}
              aria-label={`${chLabel} ${ch.title}`}
              style={{
                flex: "0 0 auto",
                width: tileW,
                scrollSnapAlign: "start",
                textAlign: "left",
                padding: 0,
                borderRadius: 6,
                cursor: "pointer",
                border: `1px solid ${active ? color.accent : glass.borderSoft}`,
                background: active
                  ? `
                    linear-gradient(160deg, rgba(48,53,62,0.98) 0%, rgba(20,23,28,0.98) 72%)
                  `
                  : `
                    linear-gradient(160deg, rgba(41,46,54,0.96) 0%, rgba(21,24,29,0.98) 72%)
                  `,
                boxShadow: active
                  ? `inset 4px 0 0 ${color.accent}, inset 0 1px 0 ${glass.highlight}, inset 0 -1px 0 rgba(0,0,0,0.5)`
                  : `inset 0 1px 0 ${glass.highlight}, inset 0 -1px 0 rgba(0,0,0,0.5)`,
                overflow: "hidden",
                animation: zapping ? "channelZap 0.42s ease both" : undefined,
                color: color.ink,
                transition: `transform ${motion.fast} ${motion.ease}, box-shadow ${motion.base}`,
              }}
            >
              <div style={{
                padding: compact ? "8px 9px 6px" : "9px 10px 7px",
                borderBottom: `1px solid ${glass.borderSoft}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 6,
                background: `
                  linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 100%)
                `,
              }}>
                <span style={{
                  fontFamily: fontMono,
                  fontSize: compact ? 20 : 24,
                  fontWeight: 900,
                  letterSpacing: -1,
                  lineHeight: 1,
                  color: active ? color.accent : color.ink,
                }}>
                  {chLabel}
                </span>
                <span style={{
                  fontFamily: fontMono,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  color: active ? color.accent : color.muted,
                  padding: "2px 5px",
                  borderRadius: 3,
                  background: "rgba(8,9,11,0.42)",
                  border: `1px solid ${glass.borderSoft}`,
                }}>
                  {active ? "Tuned" : "Zap"}
                </span>
              </div>
              <div style={{ padding: compact ? "8px 9px 10px" : "9px 10px 11px" }}>
                <div style={{
                  fontFamily: fontMono,
                  fontSize: compact ? 11 : 12,
                  fontWeight: 800,
                  letterSpacing: 0.9,
                  textTransform: "uppercase",
                  color: color.ink,
                  lineHeight: 1.2,
                  minHeight: compact ? 24 : 15,
                }}>
                  {slug}
                </div>
                <div style={{
                  marginTop: compact ? 8 : 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}>
                  <span aria-hidden="true" style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: active ? color.accent : chrome.steel,
                    boxShadow: "none",
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily: fontMono,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    color: color.muted,
                  }}>
                    {ch.count} cuts
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default memo(SceneSurfRail);
