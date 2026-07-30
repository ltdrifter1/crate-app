import { useState } from "react";
import { CANONICAL_GENRES, migratePreferredGenres } from "../../lib/genres";
import { font, fontDisplay, fontMono, color, BTN_PRIMARY } from "../../theme";
import BrandMark from "../brand/BrandMark";

/**
 * First-visit intake — genres only. Everything else (mix lane, energy, scenes) is background.
 */
export default function GenreTasteOnboarding({
  initialGenres = [],
  onComplete,
  onSkip,
  title = "What do you like?",
  subtitle = "Pick the genres you want most of the time. We’ll play about 95% from these, and mix in a little from elsewhere so it stays alive.",
  confirmLabel = "Start listening",
  allowSkip = true,
}) {
  const [selected, setSelected] = useState(() =>
    migratePreferredGenres(initialGenres)
  );

  function toggle(g) {
    setSelected((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  const ready = selected.length >= 1;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: color.canvas,
        overflow: "auto",
        fontFamily: font,
        animation: "fadeIn 0.4s ease both",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "42vh",
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(242,243,245,0.08) 0%, transparent 55%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", maxWidth: 520, margin: "0 auto", padding: "48px 22px 140px" }}>
        <div style={{ marginBottom: 18 }}>
          <BrandMark size={40} />
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 650,
            letterSpacing: 1.8,
            color: color.accent,
            fontFamily: fontMono,
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Your taste
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(32px, 8vw, 44px)",
            fontWeight: 720,
            letterSpacing: -1.4,
            fontFamily: fontDisplay,
            color: color.ink,
            lineHeight: 1.02,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: "14px 0 28px",
            fontSize: 15,
            color: color.body,
            lineHeight: 1.5,
            maxWidth: 360,
          }}
        >
          {subtitle}
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            marginBottom: 28,
          }}
        >
          {CANONICAL_GENRES.map((g) => {
            const on = selected.includes(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggle(g)}
                aria-pressed={on}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
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
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 650,
                    fontFamily: fontDisplay,
                    letterSpacing: -0.3,
                    color: on ? color.accent : color.ink,
                  }}
                >
                  {g}
                </span>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 980,
                    border: on ? `none` : `1px solid ${color.lineStrong}`,
                    background: on ? color.accent : "transparent",
                    color: color.onAccent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  {on ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "stretch" }}>
          <button
            type="button"
            disabled={!ready}
            onClick={() => ready && onComplete?.(selected)}
            style={{
              ...BTN_PRIMARY,
              borderRadius: 980,
              padding: "16px 28px",
              opacity: ready ? 1 : 0.4,
              cursor: ready ? "pointer" : "default",
            }}
          >
            {confirmLabel}
          </button>
          {allowSkip && (
            <button
              type="button"
              onClick={() => onSkip?.()}
              style={{
                background: "none",
                border: "none",
                color: color.muted,
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                padding: "10px 0",
              }}
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
