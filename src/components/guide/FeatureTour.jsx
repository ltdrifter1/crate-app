/**
 * Short first-login feature tour — one idea per screen, skip anytime.
 * Not a survey. TasteTuner already handled the mix.
 */
import { useState } from "react";
import {
  font, fontDisplay, fontMono, color, y2k, glass, radius,
  BTN_PRIMARY, motion,
} from "../../theme";
import { FEATURE_GUIDE_STEPS } from "../../lib/featureGuide";

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
          radial-gradient(ellipse 80% 70% at 20% 0%, rgba(101,230,255,0.10) 0%, transparent 55%),
          radial-gradient(ellipse 50% 50% at 90% 10%, rgba(123,167,255,0.08) 0%, transparent 50%),
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
          minHeight: "min(680px, calc(100dvh - 32px))",
          display: "flex",
          flexDirection: "column",
          padding: "18px 22px 22px",
          borderRadius: radius.xl,
          border: `1px solid ${glass.border}`,
          background: glass.plate || color.surfaceSolid,
          boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowLift || "0 24px 60px rgba(0,0,0,0.45)"}`,
          backdropFilter: glass.blur,
          WebkitBackdropFilter: glass.blur,
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
            {replay ? "Replay" : "Quick tour"}
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
            padding: "12px 0 28px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 1.8,
              fontFamily: fontMono,
              color: y2k.cyan,
              marginBottom: 18,
            }}
          >
            {String(index + 1).padStart(2, "0")}
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
              fontSize: "clamp(34px, 9vw, 44px)",
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
                  width: i === index ? 20 : 6,
                  height: 6,
                  borderRadius: 99,
                  background: i <= index ? y2k.cyan : "rgba(255,255,255,0.12)",
                  boxShadow: i === index ? `0 0 10px ${y2k.cyanGlow}` : "none",
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
              borderRadius: 980,
            }}
          >
            {last ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
