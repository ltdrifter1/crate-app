/**
 * Short first-login feature tour — one idea per screen, skip anytime.
 * Not a survey. TasteTuner already handled the mix.
 */
import { useState } from "react";
import {
  font, fontDisplay, fontMono, color, y2k, glass, radio,
  BTN_PRIMARY, motion,
} from "../../theme";
import { FEATURE_GUIDE_STEPS } from "../../lib/featureGuide";
import { SCENE_CHANNELS } from "../../lib/sceneChannels";

/** First four station inks — the tour teaches the dial's colour before you meet it. */
const TOUR_INKS = SCENE_CHANNELS.slice(0, 4).map((c) => c.accent);

/**
 * A small picture of the thing each step is describing. Text-only cards left
 * two thirds of this dialog empty and taught nothing about the interface.
 */
function TourPlate({ id }) {
  const frame = {
    display: "grid",
    gap: 8,
    padding: 14,
    borderRadius: radio.radiusLcd,
    background: radio.lcdFace,
    border: radio.lcdBorder,
    boxShadow: radio.lcdShadow,
  };

  if (id === "home") {
    return (
      <div aria-hidden="true" style={{ ...frame, gridTemplateColumns: "repeat(4, 1fr)" }}>
        {TOUR_INKS.map((accent, i) => (
          <div key={i} style={{ display: "grid", gap: 4 }}>
            <div
              style={{
                position: "relative",
                aspectRatio: "1 / 1",
                borderRadius: 4,
                background: "rgba(216,223,232,0.10)",
                border: "1px solid rgba(216,223,232,0.14)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 14,
                  height: 9,
                  borderRadius: 2,
                  background: accent,
                }}
              />
            </div>
            <div style={{ height: 2, borderRadius: 1, background: accent }} />
          </div>
        ))}
      </div>
    );
  }

  if (id === "explore") {
    const grid = SCENE_CHANNELS.slice(0, 6).map((c) => c.accent);
    return (
      <div aria-hidden="true" style={{ ...frame, gridTemplateColumns: "repeat(3, 1fr)" }}>
        {grid.map((accent, i) => (
          <div
            key={i}
            style={{
              position: "relative",
              aspectRatio: "1 / 1",
              borderRadius: 4,
              overflow: "hidden",
              background: `linear-gradient(150deg, ${accent}66 0%, ${accent}22 70%, rgba(216,223,232,0.05) 100%)`,
              border: "1px solid rgba(216,223,232,0.16)",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 3,
                background: accent,
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  // library — a small crate of saved sleeves
  return (
    <div aria-hidden="true" style={{ ...frame, gap: 6 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 6,
            borderRadius: 4,
            background: "rgba(216,223,232,0.06)",
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 3,
              flexShrink: 0,
              background: TOUR_INKS[i],
              opacity: 0.85,
            }}
          />
          <span style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(216,223,232,0.22)" }} />
          <span style={{ width: 22, height: 5, borderRadius: 3, background: "rgba(216,223,232,0.12)" }} />
        </div>
      ))}
    </div>
  );
}

export default function FeatureTour({
  steps = FEATURE_GUIDE_STEPS,
  onComplete,
  onSkip,
  replay = false,
}) {
  const [index, setIndex] = useState(0);
  const last = index >= steps.length - 1;
  const step = steps[index] || steps[0];

  function finish(viaSkip) {
    if (viaSkip) onSkip?.();
    else onComplete?.();
  }

  function next() {
    if (last) finish(false);
    else setIndex((i) => i + 1);
  }

  const headingId = "feature-tour-title";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      data-testid="feature-tour"
      data-replay={replay ? "true" : "false"}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 280,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: `
          radial-gradient(ellipse 80% 70% at 20% 0%, rgba(91,101,116,0.10) 0%, transparent 55%),
          radial-gradient(ellipse 50% 50% at 90% 10%, rgba(91,101,116,0.08) 0%, transparent 50%),
          ${color.canvas}
        `,
        overflow: "auto",
        fontFamily: font,
        animation: "fadeIn 0.35s ease both",
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 420,
          minHeight: "min(520px, calc(100dvh - 32px))",
          maxHeight: "calc(100dvh - 32px)",
          display: "flex",
          flexDirection: "column",
          padding: "18px 22px 22px",
          borderRadius: radio.radiusTight,
          border: radio.borderChrome,
          background: radio.moduleFace,
          boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowLift || "0 24px 60px rgba(58,66,80,0.45)"}`,
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 44,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              color: y2k.cyan,
              fontFamily: fontMono,
            }}
          >
            {String(index + 1).padStart(2, "0")} {replay ? "Replay" : "Insert"}
          </span>
          <button
            type="button"
            onClick={() => finish(true)}
            aria-label="Skip tour"
            style={{
              border: "none",
              background: "transparent",
              color: color.muted,
              fontSize: 15,
              fontWeight: 600,
              fontFamily: font,
              cursor: "pointer",
              padding: "8px 4px",
              letterSpacing: -0.1,
            }}
          >
            Skip
          </button>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "8px 0 20px",
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <TourPlate id={step.id} />
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 650,
              letterSpacing: 0.4,
              color: color.muted,
              fontFamily: font,
              marginBottom: 10,
            }}
          >
            {step.kicker}
          </div>
          <h1
            id={headingId}
            style={{
              fontSize: "clamp(30px, 7.5vw, 38px)",
              fontWeight: 720,
              letterSpacing: -1.4,
              lineHeight: 1.02,
              fontFamily: fontDisplay,
              color: color.ink,
              margin: "0 0 16px",
            }}
          >
            {step.title}
          </h1>
          <p
            style={{
              fontSize: 18,
              fontWeight: 500,
              lineHeight: 1.4,
              color: color.body,
              margin: 0,
              maxWidth: 360,
            }}
          >
            {step.body}
          </p>
        </div>

        <div>
          <div
            aria-hidden="true"
            style={{ display: "flex", gap: 6, marginBottom: 18, justifyContent: "center" }}
          >
            {steps.map((s, i) => (
              <span
                key={s.id}
                style={{
                  width: i === index ? 16 : 6,
                  height: 6,
                  borderRadius: 2,
                  background: i <= index ? color.lcdSignal : "rgba(61,70,84,0.16)",
                  boxShadow: i === index ? radio.lcdGlow : "none",
                  transition: `width ${motion.fast} ${motion.ease}, background ${motion.base}`,
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={next}
            style={{
              ...BTN_PRIMARY,
              width: "100%",
              borderRadius: 8,
            }}
          >
            {last ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
