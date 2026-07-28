import { fontDisplay, fontMono, color } from "../../theme";
import {
  daypartIntents,
  vibeIntents,
  suggestedDaypart,
  listenFocusLabel,
} from "../../lib/listenIntent";
import { mixLaneById } from "../../lib/mixLanes";

/**
 * Unified Listen for… sheet — daypart + vibe + optional browse focus.
 * All starts resolve through the same listen pool.
 */
export default function ListenForSheet({
  onClose,
  mixLane,
  mixLaneLocked = false,
  listenFocus = null,
  intentLabel = "",
  onSelectDaypart,
  onFollowClock,
  onClearFocus,
  onSelectVibe,
  onStartRadio,
}) {
  const clock = suggestedDaypart();
  const dayparts = daypartIntents();
  const vibes = vibeIntents();
  const active = mixLaneById(mixLane);
  const focusLabel = listenFocusLabel(listenFocus || {});

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, overflow: "hidden" }}>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #0A0A0A 0%, #000 55%, #000 100%)",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(242,243,245,0.07) 0%, transparent 48%)",
        }}
      />

      <div
        className="hide-scroll"
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "20px 20px 8px",
          flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: color.surfaceRaised,
              border: "none",
              borderRadius: 980,
              width: 36,
              height: 36,
              cursor: "pointer",
              color: color.muted,
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          padding: "8px 22px 48px",
          maxWidth: 520,
          margin: "0 auto",
          width: "100%",
          animation: "rise 0.45s cubic-bezier(0.22,1,0.36,1) both",
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 650,
            letterSpacing: 1.8,
            textTransform: "uppercase",
            color: color.accent,
            fontFamily: fontMono,
            marginBottom: 10,
          }}>
            Listen for…
          </div>
          <h2 style={{
            margin: 0,
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: -1,
            color: color.ink,
            fontFamily: fontDisplay,
            marginBottom: 10,
          }}>
            What are you here for?
          </h2>
          <p style={{
            margin: "0 0 20px",
            fontSize: 15,
            color: color.body,
            lineHeight: 1.45,
            maxWidth: 340,
          }}>
            One pool for radio and timed mixes — daypart, vibe, and browse focus stack together.
          </p>

          {focusLabel && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 28,
              padding: "12px 0",
              borderTop: `1px solid ${color.line}`,
              borderBottom: `1px solid ${color.line}`,
            }}>
              <div>
                <div style={{
                  fontSize: 11,
                  fontWeight: 650,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  color: color.faint,
                  fontFamily: fontMono,
                  marginBottom: 4,
                }}>
                  Focus
                </div>
                <div style={{ fontSize: 17, fontWeight: 650, fontFamily: fontDisplay, color: color.ink }}>
                  {focusLabel}
                </div>
              </div>
              {onClearFocus && (
                <button
                  type="button"
                  onClick={onClearFocus}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 980,
                    border: `1px solid ${color.lineStrong}`,
                    background: "transparent",
                    color: color.body,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          <div style={{
            fontSize: 12,
            fontWeight: 650,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: color.faint,
            fontFamily: fontMono,
            marginBottom: 10,
          }}>
            Right now
          </div>
          <div style={{
            marginBottom: 8,
            fontSize: 13,
            color: color.muted,
          }}>
            {intentLabel || `Playing ${active.label}`}
            {mixLaneLocked ? " · locked" : ` · clock says ${clock.label}`}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 12 }}>
            {dayparts.map((d) => {
              const selected = mixLane === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onSelectDaypart?.(d.id)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    padding: "16px 4px",
                    background: "none",
                    border: "none",
                    borderBottom: `1px solid ${color.line}`,
                    cursor: "pointer",
                    textAlign: "left",
                    color: color.ink,
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: 18,
                      fontWeight: 650,
                      fontFamily: fontDisplay,
                      letterSpacing: -0.3,
                      color: selected ? color.accent : color.ink,
                    }}>
                      {d.label}
                    </div>
                    <div style={{ fontSize: 13, color: color.muted, marginTop: 3 }}>
                      {d.blurb}
                    </div>
                  </div>
                  {selected && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 650,
                      letterSpacing: 0.8,
                      textTransform: "uppercase",
                      color: color.accent,
                      fontFamily: fontMono,
                    }}>
                      On
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 36 }}>
            {mixLaneLocked && (
              <button
                type="button"
                onClick={() => onFollowClock?.()}
                style={{
                  padding: "10px 16px",
                  borderRadius: 980,
                  border: `1px solid ${color.lineStrong}`,
                  background: "transparent",
                  color: color.body,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Follow clock ({clock.label})
              </button>
            )}
            {onStartRadio && (
              <button
                type="button"
                onClick={() => onStartRadio?.()}
                style={{
                  padding: "10px 16px",
                  borderRadius: 980,
                  border: "none",
                  background: color.accent,
                  color: color.onAccent,
                  fontSize: 13,
                  fontWeight: 650,
                  cursor: "pointer",
                }}
              >
                Start {intentLabel || `${active.label} radio`}
              </button>
            )}
          </div>

          <div style={{
            fontSize: 12,
            fontWeight: 650,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: color.faint,
            fontFamily: fontMono,
            marginBottom: 10,
          }}>
            For a while
          </div>
          <div style={{
            marginBottom: 14,
            fontSize: 13,
            color: color.muted,
            lineHeight: 1.4,
          }}>
            Timed mixes with an energy arc
            {focusLabel ? ` · stays in ${focusLabel}` : ""}.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {vibes.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelectVibe?.(v.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 4px",
                  background: "none",
                  border: "none",
                  borderBottom: `1px solid ${color.line}`,
                  cursor: "pointer",
                  textAlign: "left",
                  color: color.ink,
                }}
              >
                <div>
                  <div style={{
                    fontSize: 17,
                    fontWeight: 600,
                    fontFamily: fontDisplay,
                  }}>
                    {v.label}
                  </div>
                  <div style={{ fontSize: 13, color: color.muted, marginTop: 2 }}>
                    {v.blurb}
                  </div>
                </div>
                <span style={{ color: color.faint, fontSize: 18 }} aria-hidden="true">›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
