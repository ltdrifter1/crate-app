import { useState } from "react";
import {
  color, fontDisplay, fontMono, glass, homeSpace, motion, radius, chrome
} from "../../theme";
import { availableSceneChannels } from "../../lib/sceneChannels";
import { formatChannelNum } from "../../lib/mtvChannel";

/**
 * Channel dial — zap between scene channels with CH-IDs.
 * Premium frosted Y2K chrome plates (compact mode for the booth player).
 */
export default function SceneSurfRail({
  tracks = [],
  activeChannelId = null,
  onTuneChannel = null,
  compact = false,
}) {
  const channels = availableSceneChannels(tracks, 2);
  const [zapId, setZapId] = useState(null);

  if (!channels.length) return null;

  const tune = (ch) => {
    setZapId(ch.id);
    window.setTimeout(() => setZapId(null), 420);
    onTuneChannel?.(ch);
  };

  const tileW = compact ? 108 : 132;

  return (
    <section
      aria-label="Channel dial"
      style={{
        padding: compact ? "4px 0 2px" : "14px 0 8px",
        width: "100%",
        maxWidth: compact ? 400 : "none",
        animation: compact
          ? `rise 0.4s ${motion.ease} both`
          : `rise 0.55s ${motion.ease} 0.06s both`,
      }}
    >
      {!compact && (
        <div style={{ padding: `0 ${homeSpace.gutter}px 12px` }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}>
            <span aria-hidden="true" style={{
              width: 10, height: 10,
              borderRadius: 2,
              background: glass.chrome,
              border: `1px solid ${glass.border}`,
              boxShadow: `inset 0 1px 0 ${glass.highlight}, 0 0 0 1px rgba(18,20,26,0.06)`,
              transform: "rotate(45deg)",
            }} />
            <div style={{
              fontFamily: fontMono, fontSize: 10, fontWeight: 800,
              letterSpacing: 1.8, textTransform: "uppercase", color: chrome.steel,
            }}>
              Channels
            </div>
          </div>
          <h3 style={{
            margin: 0,
            fontFamily: fontDisplay,
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: -0.2,
            color: color.ink,
            textTransform: "uppercase",
          }}>
            Don’t touch that dial
          </h3>
          <p style={{ margin: "5px 0 0", fontSize: 14, fontWeight: 500, color: color.muted, lineHeight: 1.4 }}>
            Scene channels under the genres — zap one and play.
          </p>
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
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 750,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: color.muted,
          }}>
            Scene surf
          </div>
          <div style={{
            fontFamily: fontMono,
            fontSize: 9,
            fontWeight: 650,
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
                borderRadius: radius.lg,
                cursor: "pointer",
                border: `1px solid ${active ? glass.border : glass.borderSoft}`,
                background: active
                  ? `
                    linear-gradient(160deg, rgba(52,58,68,0.92) 0%, rgba(25,28,34,0.78) 45%, rgba(${hexToRgb(ch.accent)},0.22) 100%)
                  `
                  : `
                    linear-gradient(165deg, rgba(34,38,45,0.72) 0%, rgba(28,32,38,0.42) 100%)
                  `,
                boxShadow: active
                  ? `inset 0 1px 0 ${glass.highlight}, 0 10px 28px rgba(18,20,26,0.12), 0 0 0 1px rgba(18,20,26,0.06)`
                  : `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
                backdropFilter: glass.blurSoft,
                WebkitBackdropFilter: glass.blurSoft,
                overflow: "hidden",
                animation: zapping ? "channelZap 0.42s ease both" : undefined,
                color: color.ink,
                transition: `transform ${motion.fast} ${motion.ease}, box-shadow ${motion.base}`,
              }}
            >
              <div style={{
                padding: compact ? "7px 9px 5px" : "8px 10px 6px",
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
                  fontSize: compact ? 12 : 13,
                  fontWeight: 900,
                  letterSpacing: 0.4,
                  color: active ? color.ink : chrome.steel,
                }}>
                  {chLabel}
                </span>
                <span style={{
                  fontFamily: fontMono,
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  color: active ? color.body : color.faint,
                  padding: "2px 6px",
                  borderRadius: radius.pill,
                  background: active
                    ? "rgba(42,46,56,0.1)"
                    : "rgba(28,32,38,0.55)",
                  border: `1px solid ${glass.borderSoft}`,
                }}>
                  {active ? "Tuned" : "Zap"}
                </span>
              </div>
              <div style={{ padding: compact ? "8px 9px 10px" : "10px 10px 12px" }}>
                <div style={{
                  fontFamily: fontMono,
                  fontSize: compact ? 10 : 11,
                  fontWeight: 800,
                  letterSpacing: 1.0,
                  textTransform: "uppercase",
                  color: color.ink,
                  lineHeight: 1.2,
                  minHeight: compact ? 24 : 28,
                }}>
                  {slug}
                </div>
                {!compact && (
                  <div style={{
                    marginTop: 6,
                    fontSize: 10,
                    color: color.muted,
                    lineHeight: 1.3,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    {ch.tagline}
                  </div>
                )}
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
                    background: ch.accent || chrome.live,
                    boxShadow: `0 0 0 2px rgba(${hexToRgb(ch.accent || "#B8C0CC")},0.25)`,
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontFamily: fontMono,
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    color: color.faint,
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

function hexToRgb(hex) {
  if (!hex || typeof hex !== "string") return "184,192,204";
  const h = hex.replace("#", "");
  if (h.length !== 6) return "184,192,204";
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return "184,192,204";
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}
