/**
 * Signed-out Library / member-only surfaces. Home and radio stay open;
 * Club is the door. Chassis tokens only — no new visual language.
 */
import { BTN_PRIMARY, color, font, fontDisplay, homeSpace } from "../../theme";

export default function GuestMemberGate({
  title = "Members only",
  copy = "Sign in from Profile to keep favorites, playlists, and your card.",
  cta = "Open Profile",
  onSignIn,
}) {
  return (
    <div
      data-testid="guest-member-gate"
      style={{
        padding: `${homeSpace.sectionGap || 32}px 24px 96px`,
        textAlign: "center",
        maxWidth: 420,
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontFamily: fontDisplay,
          fontSize: 26,
          fontWeight: 650,
          letterSpacing: -0.4,
          color: color.ink,
        }}
      >
        {title}
      </h1>
      <p
        style={{
          margin: "12px 0 0",
          fontFamily: font,
          fontSize: 15,
          lineHeight: 1.45,
          color: color.muted,
        }}
      >
        {copy}
      </p>
      {typeof onSignIn === "function" && (
        <button type="button" onClick={onSignIn} style={{ ...BTN_PRIMARY, marginTop: 24 }}>
          {cta}
        </button>
      )}
    </div>
  );
}
