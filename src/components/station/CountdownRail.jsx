import {
  color, fontDisplay, fontMono, glass, homeSpace, motion, radius, artShadow,
} from "../../theme";
import { stationDaypart } from "../../lib/station";

/**
 * Home Countdown rail — TRL / MuchMusic chart energy.
 */
export default function CountdownRail({
  entries = [],
  onPlayTrack,
  onTuneIn = null,
  activeId = null,
  isPlaying = false,
}) {
  if (!entries.length) return null;
  const daypart = stationDaypart(new Date());
  const top = entries.slice(0, 10);

  return (
    <section
      aria-label="Countdown"
      style={{
        padding: `${homeSpace.sectionPadTopFirst}px 0 ${homeSpace.sectionPadBottom}px`,
        animation: `rise 0.55s ${motion.ease} 0.02s both`,
      }}
    >
      <div style={{
        padding: `0 ${homeSpace.gutter}px 14px`,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 12,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: fontMono,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            color: "#FF3B4E",
            marginBottom: 6,
          }}>
            Live countdown · {daypart.label}
          </div>
          <h2 style={{
            margin: 0,
            fontFamily: fontDisplay,
            fontSize: "clamp(22px, 4vw, 28px)",
            fontWeight: 750,
            letterSpacing: -0.5,
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
        </div>
        {onTuneIn && (
          <button
            type="button"
            onClick={onTuneIn}
            style={{
              flexShrink: 0,
              padding: "12px 14px",
              borderRadius: radius.sm,
              border: "1px solid rgba(255,59,78,0.35)",
              background: "linear-gradient(165deg, #FF5A6A 0%, #D61F33 100%)",
              color: "#fff",
              fontFamily: fontMono,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              cursor: "pointer",
              boxShadow: "0 10px 22px rgba(214,31,51,0.25)",
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
        gap: 6,
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
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: radius.md,
                  border: `1px solid ${active ? color.ink : glass.borderSoft}`,
                  background: active
                    ? "rgba(22,24,30,0.06)"
                    : "rgba(255,255,255,0.55)",
                  boxShadow: active
                    ? `inset 0 1px 0 ${glass.highlight}`
                    : `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{
                  width: 36,
                  flexShrink: 0,
                  fontFamily: fontMono,
                  fontSize: rank === 1 ? 22 : 16,
                  fontWeight: 800,
                  letterSpacing: -0.5,
                  color: rank <= 3 ? "#FF3B4E" : color.ink,
                  textAlign: "center",
                }}>
                  {rank}
                </div>
                {track.albumCover ? (
                  <img
                    src={track.albumCover}
                    alt=""
                    width={44}
                    height={44}
                    loading="lazy"
                    style={{
                      borderRadius: 6,
                      objectFit: "cover",
                      flexShrink: 0,
                      boxShadow: artShadow.quiet,
                      outline: active && isPlaying ? `2px solid ${color.ink}` : "none",
                    }}
                  />
                ) : (
                  <div style={{
                    width: 44, height: 44, borderRadius: 6, flexShrink: 0,
                    background: color.surfaceRaised,
                  }} />
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 650, color: color.ink,
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
                    ? "#FF3B4E"
                    : color.faint,
                  flexShrink: 0,
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
