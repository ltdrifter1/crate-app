/**
 * Your genres — the only user-facing listen control.
 * Daypart / vibes / scenes stay automatic.
 */
import { fontDisplay, fontMono, color } from "../../theme";
import { CANONICAL_GENRES } from "../../lib/genres";

export default function GenreTasteSheet({
  onClose,
  selectedGenres = [],
  onSave,
  onClearGenreFocus = null,
  genreFocus = null,
  onBuildSet = null,
}) {
  const selected = new Set(selectedGenres || []);

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
            Your genres
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
            What should we play most?
          </h2>
          <p style={{
            margin: "0 0 24px",
            fontSize: 15,
            color: color.body,
            lineHeight: 1.45,
            maxWidth: 360,
          }}>
            About 95% from your picks, 5% from elsewhere. Time of day shapes the mood in the background.
          </p>

          {genreFocus && onClearGenreFocus && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 24,
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
                  Playing now
                </div>
                <div style={{ fontSize: 17, fontWeight: 650, fontFamily: fontDisplay }}>
                  {genreFocus}
                </div>
              </div>
              <button
                type="button"
                onClick={onClearGenreFocus}
                style={{
                  padding: "8px 14px",
                  borderRadius: 980,
                  border: `1px solid ${color.lineStrong}`,
                  background: "transparent",
                  color: color.body,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            </div>
          )}

          <GenreToggleList
            selected={selected}
            onToggle={(g, next) => {
              const arr = CANONICAL_GENRES.filter((x) =>
                x === g ? next : selected.has(x)
              );
              onSave?.(arr);
            }}
          />

          {onBuildSet && (
            <button
              type="button"
              onClick={onBuildSet}
              style={{
                marginTop: 28,
                width: "100%",
                padding: "16px 20px",
                borderRadius: 980,
                border: "none",
                background: color.accent,
                color: color.onAccent,
                fontSize: 15,
                fontWeight: 650,
                cursor: "pointer",
              }}
            >
              Build a set
            </button>
          )}
          {onBuildSet && (
            <div style={{
              marginTop: 10,
              fontSize: 13,
              color: color.muted,
              textAlign: "center",
              lineHeight: 1.4,
            }}>
              Choose how long you’re listening — we shape the energy for you.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GenreToggleList({ selected, onToggle }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {CANONICAL_GENRES.map((g) => {
        const on = selected.has(g);
        return (
          <button
            key={g}
            type="button"
            onClick={() => onToggle(g, !on)}
            aria-pressed={on}
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
            <span style={{
              fontSize: 17,
              fontWeight: 600,
              fontFamily: fontDisplay,
              color: on ? color.accent : color.ink,
            }}>
              {g}
            </span>
            <span style={{
              width: 22,
              height: 22,
              borderRadius: 980,
              border: on ? "none" : `1px solid ${color.lineStrong}`,
              background: on ? color.accent : "transparent",
              color: color.onAccent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }} aria-hidden="true">
              {on ? "✓" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
