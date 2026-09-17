import { fontDisplay, fontMono, color, radius, glass } from "../../theme";
import { BETA_LAUNCH, BETA_LAUNCH_COPY, PRICING_COMING_SOON } from "../../lib/entitlements";

/**
 * Honest beta copy — full listening, no prices, payments coming soon.
 */
export default function BetaLaunchNotice({ compact = false, style = null }) {
  if (!BETA_LAUNCH && !PRICING_COMING_SOON) return null;

  return (
    <div
      role="status"
      data-testid="beta-launch-notice"
      style={{
        padding: compact ? "12px 14px" : "16px 18px",
        borderRadius: radius.lg,
        border: `1px solid ${glass.borderSoft}`,
        background: `
          linear-gradient(180deg, rgba(123,167,255,0.10) 0%, transparent 58%),
          ${glass.plate}
        `,
        boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
        ...style,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          color: color.accent,
          fontFamily: fontMono,
          marginBottom: compact ? 4 : 8,
        }}
      >
        {BETA_LAUNCH_COPY.kicker}
      </div>
      <div
        style={{
          fontSize: compact ? 15 : 17,
          fontWeight: 700,
          fontFamily: fontDisplay,
          color: color.ink,
          letterSpacing: -0.3,
          marginBottom: compact ? 2 : 6,
        }}
      >
        {BETA_LAUNCH_COPY.title}
      </div>
      <div style={{ fontSize: compact ? 13 : 14, color: color.body, lineHeight: 1.45 }}>
        {BETA_LAUNCH_COPY.blurb}
      </div>
    </div>
  );
}
