import { useState } from "react";
import { CANONICAL_GENRES, migratePreferredGenres } from "../../lib/genres";
import {
  ADVENTUROUS_LABELS,
  DEPTH_LABELS,
  TASTE_AXIS_DEFAULT,
  normalizeTasteProfile,
  tasteProfileStats,
  tasteProfileBlurb,
} from "../../lib/tasteProfile";
import { font, fontDisplay, fontMono, color, radius, BTN_PRIMARY } from "../../theme";
import BrandMark from "../brand/BrandMark";
import TasteAxisSlider from "../listen/TasteAxisSlider";

/**
 * First-visit intake — genres, then adventurous + depth.
 * Everything else (mix lane, energy, scenes) stays background.
 */
export default function GenreTasteOnboarding({
  initialGenres = [],
  initialAdventurous = TASTE_AXIS_DEFAULT,
  initialDepth = TASTE_AXIS_DEFAULT,
  onComplete,
  onSkip,
  title = "Select your favourite genres",
  subtitle = "You can change these anytime in Club.",
  confirmLabel = "Continue",
  allowSkip = true,
}) {
  const [step, setStep] = useState(0); // 0 genres · 1 taste axes · 2 summary
  const [selected, setSelected] = useState(() =>
    migratePreferredGenres(initialGenres)
  );
  const [adventurous, setAdventurous] = useState(() =>
    normalizeTasteProfile({ adventurous: initialAdventurous }).adventurous
  );
  const [depth, setDepth] = useState(() =>
    normalizeTasteProfile({ depth: initialDepth }).depth
  );

  function toggle(g) {
    setSelected((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  const ready = selected.length >= 1;
  const taste = { genres: selected, adventurous, depth };
  const stats = tasteProfileStats(taste);

  function finish() {
    onComplete?.(taste);
  }

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
            "radial-gradient(ellipse at 50% 0%, rgba(169,199,228,0.07) 0%, transparent 55%)",
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
          {step === 0 ? "Your interests" : step === 1 ? "Your taste" : "All set"}
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
          {step === 0
            ? title
            : step === 1
              ? "Shape your picks"
              : "Your taste"}
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
          {step === 0
            ? subtitle
            : step === 1
              ? "Two quick dials. Change them anytime in Club."
              : tasteProfileBlurb(taste)}
        </p>

        {step === 0 && (
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
                      borderRadius: radius.md,
                      border: on ? "none" : `1px solid ${color.lineStrong}`,
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
        )}

        {step === 1 && (
          <div style={{ marginBottom: 28 }}>
            <TasteAxisSlider
              id="onboard-adventurous"
              title={ADVENTUROUS_LABELS.title}
              hint={ADVENTUROUS_LABELS.hint}
              lowLabel={ADVENTUROUS_LABELS.low}
              highLabel={ADVENTUROUS_LABELS.high}
              value={adventurous}
              onChange={setAdventurous}
            />
            <TasteAxisSlider
              id="onboard-depth"
              title={DEPTH_LABELS.title}
              hint={DEPTH_LABELS.hint}
              lowLabel={DEPTH_LABELS.low}
              highLabel={DEPTH_LABELS.high}
              value={depth}
              onChange={setDepth}
            />
          </div>
        )}

        {step === 2 && (
          <div style={{ marginBottom: 28 }}>
            {stats.map((row) => (
              <div key={row.id} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 5,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 650, color: color.ink }}>
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: fontMono,
                      color: color.faint,
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {row.pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 4,
                    background: "rgba(169,199,228,0.12)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${row.pct}%`,
                      borderRadius: 4,
                      background:
                        "linear-gradient(90deg, #A9C7E4 0%, #7FA3C4 100%)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "stretch" }}>
          <button
            type="button"
            disabled={step === 0 && !ready}
            onClick={() => {
              if (step === 0) {
                if (ready) setStep(1);
                return;
              }
              if (step === 1) {
                setStep(2);
                return;
              }
              finish();
            }}
            style={{
              ...BTN_PRIMARY,
              borderRadius: radius.md,
              padding: "16px 28px",
              opacity: step === 0 && !ready ? 0.4 : 1,
              cursor: step === 0 && !ready ? "default" : "pointer",
            }}
          >
            {step === 0 ? confirmLabel : step === 1 ? "Continue" : "Enter the club"}
          </button>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
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
              Back
            </button>
          )}
          {allowSkip && step === 0 && (
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
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
