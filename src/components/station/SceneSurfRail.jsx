import { useState } from "react";
import {
  color, fontDisplay, fontMono, homeSpace, motion,
} from "../../theme";
import { availableSceneChannels } from "../../lib/sceneChannels";
import { formatChannelNum } from "../../lib/mtvChannel";

/**
 * Channel dial — zap between scene channels with CH-IDs.
 * Late-90s MTV / MuchMusic remote energy, not glass browse cards.
 */
export default function SceneSurfRail({
  tracks = [],
  activeChannelId = null,
  onTuneChannel = null,
}) {
  const channels = availableSceneChannels(tracks, 2);
  const [zapId, setZapId] = useState(null);

  if (!channels.length) return null;

  const tune = (ch) => {
    setZapId(ch.id);
    window.setTimeout(() => setZapId(null), 420);
    onTuneChannel?.(ch);
  };

  return (
    <section
      aria-label="Channel dial"
      style={{
        padding: `14px 0 8px`,
        animation: `rise 0.55s ${motion.ease} 0.06s both`,
      }}
    >
      <div style={{ padding: `0 ${homeSpace.gutter}px 12px` }}>
        <div style={{
          fontFamily: fontMono, fontSize: 10, fontWeight: 900,
          letterSpacing: 1.8, textTransform: "uppercase", color: "#FF3B4E",
          marginBottom: 4,
        }}>
          Channels
        </div>
        <h3 style={{
          margin: 0,
          fontFamily: fontDisplay,
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: -0.35,
          color: color.ink,
          textTransform: "uppercase",
        }}>
          Don’t touch that dial
        </h3>
        <p style={{ margin: "5px 0 0", fontSize: 13, color: color.muted, lineHeight: 1.4 }}>
          Scene channels under the genres — zap one and play.
        </p>
      </div>

      <div
        className="hide-scroll"
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          padding: `2px ${homeSpace.gutter}px 16px`,
          scrollSnapType: "x mandatory",
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
                width: 132,
                scrollSnapAlign: "start",
                textAlign: "left",
                padding: 0,
                borderRadius: 0,
                cursor: "pointer",
                border: `2px solid ${active ? ch.accent : "rgba(22,24,30,0.18)"}`,
                background: active
                  ? `linear-gradient(180deg, ${ch.accent} 0%, ${ch.accent} 28%, #12141A 28%, #0C0E12 100%)`
                  : "linear-gradient(180deg, #1A1D24 0%, #12141A 100%)",
                boxShadow: active
                  ? `0 12px 28px rgba(22,24,30,0.28), inset 0 1px 0 rgba(255,255,255,0.18)`
                  : `inset 0 1px 0 rgba(255,255,255,0.08)`,
                overflow: "hidden",
                animation: zapping ? "channelZap 0.42s ease both" : undefined,
                color: color.onDark,
              }}
            >
              <div style={{
                padding: "8px 10px 6px",
                borderBottom: active
                  ? "1px solid rgba(255,255,255,0.25)"
                  : `3px solid ${ch.accent}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 6,
                background: active ? "transparent" : "rgba(255,255,255,0.03)",
              }}>
                <span style={{
                  fontFamily: fontMono,
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: 0.4,
                  color: active ? "#fff" : ch.accent,
                }}>
                  {chLabel}
                </span>
                <span style={{
                  fontFamily: fontMono,
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  color: active ? "rgba(255,255,255,0.85)" : "rgba(242,244,247,0.45)",
                }}>
                  {active ? "Tuned" : "Zap"}
                </span>
              </div>
              <div style={{ padding: "10px 10px 12px" }}>
                <div style={{
                  fontFamily: fontMono,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: 1.0,
                  textTransform: "uppercase",
                  color: color.onDark,
                  lineHeight: 1.2,
                  minHeight: 28,
                }}>
                  {slug}
                </div>
                <div style={{
                  marginTop: 6,
                  fontSize: 10,
                  color: "rgba(242,244,247,0.5)",
                  lineHeight: 1.3,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                  {ch.tagline}
                </div>
                <div style={{
                  marginTop: 10,
                  fontFamily: fontMono,
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  color: "rgba(242,244,247,0.35)",
                }}>
                  {ch.count} cuts
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
