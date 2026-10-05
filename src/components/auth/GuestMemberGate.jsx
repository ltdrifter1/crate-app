/**
 * Signed-out Library / member-only surfaces. Home and radio stay open;
 * Club is the door. Chassis tokens only — no new visual language.
 *
 * `perks` previews what the signed-in page holds, so the tab is a shop window
 * instead of a blank page with one button.
 */
import { BTN_PRIMARY, color, font, fontDisplay, fontMono, fontPoster, homeSpace, radio } from "../../theme";

export default function GuestMemberGate({
  title = "Members only",
  copy = "Sign in from Profile to keep favorites, playlists, and your card.",
  cta = "Open Profile",
  eyebrow = null,
  perks = [],
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
      {eyebrow && (
        <div
          style={{
            fontFamily: fontMono,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: color.muted,
            marginBottom: 10,
          }}
        >
          {eyebrow}
        </div>
      )}
      <h1
        style={{
          margin: 0,
          fontFamily: perks.length ? fontPoster : fontDisplay,
          fontSize: perks.length ? 36 : 26,
          fontWeight: perks.length ? 800 : 650,
          letterSpacing: perks.length ? -0.6 : -0.4,
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
      {perks.length > 0 && (
        <ul
          aria-label="What your library holds"
          style={{
            listStyle: "none",
            margin: "24px 0 0",
            padding: 0,
            textAlign: "left",
            borderRadius: 14,
            overflow: "hidden",
            background: radio.moduleFace,
            border: radio.border,
          }}
        >
          {perks.map((perk, i) => (
            <li
              key={perk.label}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 14,
                padding: "13px 14px",
                borderTop: i === 0 ? "none" : `1px solid ${color.line}`,
              }}
            >
              <span
                style={{
                  width: 74,
                  flexShrink: 0,
                  fontFamily: fontMono,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: color.lcdSignal,
                }}
              >
                {perk.label}
              </span>
              <span style={{ fontFamily: font, fontSize: 14, lineHeight: 1.4, color: color.body }}>
                {perk.body}
              </span>
            </li>
          ))}
        </ul>
      )}
      {typeof onSignIn === "function" && (
        <button type="button" onClick={onSignIn} style={{ ...BTN_PRIMARY, marginTop: 24 }}>
          {cta}
        </button>
      )}
    </div>
  );
}
