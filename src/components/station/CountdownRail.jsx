import {
  color, fontDisplay, fontMono, glass, homeSpace, motion, chrome
} from "../../theme";
import { stationDaypart } from "../../lib/station";
import { useIsPlaying } from "../../usePlayerTransport";
import CoverImage from "../ui/CoverImage";

/**
 * Home Countdown rail — TRL / MuchMusic chart energy.
 */
export default function CountdownRail({
  entries = [],
  onPlayTrack,
  onTuneIn = null,
  activeId = null,
  compact = false,
}) {
  const isPlaying = useIsPlaying();
  if (!entries.length) return null;
  const daypart = stationDaypart(new Date());
  const top = entries.slice(0, compact ? 5 : 10);

  return (
    <section
      aria-label="Countdown"
      style={{
        padding: compact
          ? `8px 0 ${Math.round(homeSpace.sectionPadBottom * 0.45)}px`
          : `${homeSpace.sectionPadTopFirst}px 0 ${homeSpace.sectionPadBottom}px`,
        animation: compact ? "none" : `rise 0.55s ${motion.ease} 0.02s both`,
      }}
    >
      <div style={{
        padding: `0 ${homeSpace.gutter}px ${compact ? 8 : 14}px`,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 12,
      }}>
        <div style={{ minWidth: 0 }}>
          {compact && (
            <div style={{
              fontFamily: fontDisplay,
              fontSize: 14,
              fontWeight: 650,
              letterSpacing: -0.1,
              color: color.muted,
            }}>
              Most requested
            </div>
          )}
          {!compact && (
            <>
              <h2 style={{
                margin: 0,
                fontFamily: fontDisplay,
                fontSize: "clamp(22px, 4vw, 26px)",
                fontWeight: 800,
                letterSpacing: -0.4,
                color: color.ink,
                lineHeight: 1.1,
              }}>
                Most Requested
              </h2>
              <p style={{
                margin: "6px 0 0",
                fontSize: 13,
                color: color.muted,
                maxWidth: 320,
                lineHeight: 1.4,
              }}>
                {daypart.vibe}. Vote from the player — climb the chart.
              </p>
            </>
          )}
        </div>
        {onTuneIn && (
          <button
            type="button"
            onClick={onTuneIn}
            style={{
              flexShrink: 0,
              padding: "10px 13px",
              borderRadius: 5,
              border: `1px solid ${glass.border}`,
              background: glass.chrome,
              color: color.ink,
              fontFamily: fontMono,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              cursor: "pointer",
              boxShadow: `inset 0 1px 0 ${glass.highlight}, inset 0 -1px 0 rgba(0,0,0,0.5)`,
            }}
          >
            Tune in
          </button>
        )}
      </div>

      <ol style={{
        listStyle: "none",
        margin: 0,
        padding: `0 ${homeSpace.gutter}px`,
        display: "flex",
        flexDirection: "column",
        gap: 5,
      }}>
        {top.map(({ rank, track, deltaLabel }) => {
          const active = activeId === track.id;
          return (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => onPlayTrack?.(track, top.map((e) => e.track))}
                aria-current={active ? "true" : undefined}
                aria-label={`#${rank} ${track.title} by ${track.artist}`}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                  padding: 0,
                  minHeight: 58,
                  borderRadius: 6,
                  overflow: "hidden",
                  border: `1px solid ${active ? color.accent : glass.borderSoft}`,
                  background: active
                    ? "linear-gradient(90deg, rgba(169,199,228,0.1) 0%, rgba(24,27,32,0.98) 28%)"
                    : "linear-gradient(90deg, rgba(37,42,49,0.96) 0%, rgba(20,23,28,0.98) 72%)",
                  boxShadow: active
                    ? `inset 4px 0 0 ${color.accent}, inset 0 1px 0 ${glass.highlight}`
                    : `inset 0 1px 0 ${glass.highlight}, inset 0 -1px 0 rgba(0,0,0,0.5)`,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{
                  width: rank <= 3 ? 50 : 44,
                  flexShrink: 0,
                  fontFamily: fontMono,
                  fontSize: rank === 1 ? 32 : rank <= 3 ? 27 : 20,
                  fontWeight: 900,
                  letterSpacing: -1.5,
                  color: active ? color.accent : (rank <= 3 ? chrome.bright : color.body),
                  textAlign: "center",
                }}>
                  {rank}
                </div>
                <div style={{
                  width: 56, height: 56, borderRadius: 0, flexShrink: 0,
                  overflow: "hidden",
                  background: color.surfaceRaised,
                  boxShadow: "inset 1px 0 0 rgba(255,255,255,0.08), inset -1px 0 0 rgba(0,0,0,0.35)",
                  outline: active && isPlaying ? `2px solid ${color.accent}` : "none",
                  outlineOffset: -2,
                }}>
                  <CoverImage src={track.albumCover} width={56} height={56} alt="" />
                </div>
                <div style={{ minWidth: 0, flex: 1, padding: "8px 10px" }}>
                  <div style={{
                    fontSize: 14, fontWeight: 700, color: active ? color.accent : color.ink,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {track.title}
                  </div>
                  <div style={{
                    fontSize: 12, color: color.muted, marginTop: 2,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {track.artist}
                  </div>
                </div>
                <div style={{
                  fontFamily: fontMono,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 0.8,
                  color: deltaLabel.includes("HOT") || deltaLabel.includes("↑")
                    ? chrome.bright
                    : color.faint,
                  flexShrink: 0,
                  paddingRight: 12,
                }}>
                  {deltaLabel}
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
