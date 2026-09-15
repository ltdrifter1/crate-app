/**
 * Static feature guide — same copy as the tour, scannable on Club.
 */
import {
  fontDisplay, fontMono, color, radius, glass, y2k, BTN_PRIMARY, motion,
} from "../../theme";
import { FEATURE_GUIDE_STEPS } from "../../lib/featureGuide";

export default function FeatureGuidePanel({
  steps = FEATURE_GUIDE_STEPS,
  onReplayTour = null,
}) {
  return (
    <section
      data-testid="feature-guide-panel"
      aria-label="How Planet MP3 works"
      style={{ maxWidth: 560 }}
    >
      <div
        style={{
          marginBottom: 22,
        }}
      >
        <div
          style={{
            fontSize: "clamp(28px, 7vw, 34px)",
            fontWeight: 720,
            letterSpacing: -1,
            lineHeight: 1.05,
            fontFamily: fontDisplay,
            color: color.ink,
            marginBottom: 8,
          }}
        >
          How it works
        </div>
        <p
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: color.body,
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          A short map of the crate. Same screens as the first-login tour.
        </p>
      </div>

      <ol
        style={{
          listStyle: "none",
          margin: "0 0 22px",
          padding: 0,
        }}
      >
        {steps.map((step, i) => (
          <li
            key={step.id}
            style={{
              display: "flex",
              gap: 14,
              padding: "14px 14px 14px 12px",
              marginBottom: 8,
              borderRadius: radius.lg,
              border: `1px solid ${glass.borderSoft}`,
              background: glass.plate,
              boxShadow: `inset 0 1px 0 ${glass.highlight}`,
              animation: `rise 0.4s ${motion.ease} ${Math.min(i, 7) * 0.03}s both`,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 28,
                flexShrink: 0,
                fontSize: 12,
                fontWeight: 700,
                fontFamily: fontMono,
                color: y2k.cyan,
                letterSpacing: 0.4,
                paddingTop: 3,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 650,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  color: color.muted,
                  fontFamily: fontMono,
                  marginBottom: 4,
                }}
              >
                {step.kicker}
              </div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 680,
                  letterSpacing: -0.3,
                  fontFamily: fontDisplay,
                  color: color.ink,
                  marginBottom: 4,
                }}
              >
                {step.title}
              </div>
              <div style={{ fontSize: 14, color: color.body, lineHeight: 1.4 }}>
                {step.body}
              </div>
            </div>
          </li>
        ))}
      </ol>

      {onReplayTour && (
        <button
          type="button"
          onClick={onReplayTour}
          style={{
            ...BTN_PRIMARY,
            width: "100%",
            borderRadius: 980,
          }}
        >
          Replay the tour
        </button>
      )}
    </section>
  );
}
