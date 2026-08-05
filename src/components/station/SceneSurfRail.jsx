import {
  color, fontDisplay, fontMono, glass, homeSpace, motion, radius,
} from "../../theme";
import { availableSceneChannels } from "../../lib/sceneChannels";

/**
 * Scene surfing — style channels named for the scenes underneath.
 */
export default function SceneSurfRail({
  tracks = [],
  activeChannelId = null,
  onTuneChannel = null,
}) {
  const channels = availableSceneChannels(tracks, 2);
  if (!channels.length) return null;

  return (
    <section
      aria-label="Scene surfing"
      style={{
        padding: `10px 0 6px`,
        animation: `rise 0.55s ${motion.ease} 0.06s both`,
      }}
    >
      <div style={{ padding: `0 ${homeSpace.gutter}px 10px` }}>
        <div style={{
          fontFamily: fontMono, fontSize: 10, fontWeight: 800,
          letterSpacing: 1.5, textTransform: "uppercase", color: "#5C8CFF",
          marginBottom: 4,
        }}>
          Scene surfing
        </div>
        <h3 style={{
          margin: 0,
          fontFamily: fontDisplay,
          fontSize: 18,
          fontWeight: 750,
          letterSpacing: -0.3,
          color: color.ink,
        }}>
          Browse scenes
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: color.muted }}>
          The scenes under the genres — pick one and play.
        </p>
      </div>

      <div
        className="hide-scroll"
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          padding: `2px ${homeSpace.gutter}px 14px`,
          scrollSnapType: "x mandatory",
        }}
      >
        {channels.map((ch) => {
          const active = activeChannelId === ch.id;
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => onTuneChannel?.(ch)}
              aria-pressed={active}
              style={{
                flex: "0 0 auto",
                width: 158,
                scrollSnapAlign: "start",
                textAlign: "left",
                padding: 12,
                borderRadius: radius.md,
                cursor: "pointer",
                border: `1px solid ${active ? ch.accent : glass.borderSoft}`,
                background: `
                  linear-gradient(155deg, ${ch.accent}22 0%, rgba(255,255,255,0.65) 48%),
                  ${glass.fillStrong}
                `,
                boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
              }}
            >
              <div style={{
                fontFamily: fontMono, fontSize: 9, fontWeight: 800,
                letterSpacing: 1.2, textTransform: "uppercase",
                color: ch.accent, marginBottom: 8,
              }}>
                {active ? "Playing" : "Play"}
              </div>
              <div style={{
                fontFamily: fontDisplay, fontSize: 15, fontWeight: 750,
                letterSpacing: -0.25, color: color.ink, lineHeight: 1.15,
                minHeight: 36,
              }}>
                {ch.title}
              </div>
              <div style={{
                marginTop: 6, fontSize: 11, color: color.muted, lineHeight: 1.3,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {ch.tagline}
              </div>
              <div style={{
                marginTop: 10,
                fontFamily: fontMono, fontSize: 9, fontWeight: 700,
                letterSpacing: 0.6, color: color.faint,
              }}>
                {ch.count} cuts
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
