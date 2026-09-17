import { fontDisplay, color } from "../../theme";
import { BETA_LAUNCH, BETA_LAUNCH_COPY } from "../../lib/entitlements";

const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 20,
  padding: "0 8px",
  borderRadius: 6,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "rgba(247,248,250,0.78)",
  fontFamily: fontDisplay,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0.02,
  lineHeight: 1,
};

/** Quiet Apple-style mark. Use on chrome — never a paragraph. */
export default function BetaBadge({ style = null }) {
  if (!BETA_LAUNCH) return null;
  return (
    <span data-testid="beta-badge" style={{ ...badgeStyle, ...style }}>
      {BETA_LAUNCH_COPY.badge}
    </span>
  );
}

/** One-line trial note for profile details only. */
export function ProfileBetaNote({ style = null }) {
  if (!BETA_LAUNCH) return null;
  return (
    <p
      data-testid="beta-launch-notice"
      style={{
        margin: 0,
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: -0.1,
        lineHeight: 1.45,
        color: color.muted,
        maxWidth: 340,
        ...style,
      }}
    >
      {BETA_LAUNCH_COPY.profileNote}
    </p>
  );
}

export { badgeStyle as betaBadgeStyle };
