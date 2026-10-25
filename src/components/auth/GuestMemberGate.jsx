/**
 * Signed-out Library / member-only surfaces. Home and radio stay open;
 * Club is the door. Chassis tokens only — no new visual language.
 *
 * `perks` previews what the signed-in page holds, so the tab is a shop window
 * instead of a blank page with one button. Same page header as Discover, so
 * the tab reads as a page, not a dialog floating in an empty desktop.
 */
import { BTN_PRIMARY, color, font, fontDisplay, fontMono, homeSpace, radio } from "../../theme";
import PageHeader from "../layout/PageHeader";

export default function GuestMemberGate({
  title = "Members only",
  copy = "Sign in from Profile to keep favorites, playlists, and your card.",
  cta = "Open Profile",
  eyebrow = null,
  perks = [],
  onSignIn,
  onOpenMenu = null,
}) {
  return (
    <div data-testid="guest-member-gate" style={{ paddingBottom: 96 }}>
      <PageHeader title={title} subtitle={copy} onOpenMenu={onOpenMenu} />
      <div style={{ padding: `20px ${homeSpace.gutter}px 0`, maxWidth: 1100 }}>
        {eyebrow && (
          <div
            style={{
              fontFamily: fontMono,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: color.muted,
              marginBottom: 12,
            }}
          >
            {eyebrow}
          </div>
        )}
        {perks.length > 0 && (
          <ul
            aria-label="What your library holds"
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              // One card per row on phones; side by side once there's room.
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            {perks.map((perk) => (
              <li
                key={perk.label}
                style={{
                  padding: "18px 18px 20px",
                  borderRadius: 14,
                  background: radio.moduleFace,
                  border: radio.border,
                }}
              >
                <div
                  style={{
                    fontFamily: fontMono,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    color: color.lcdSignal,
                    marginBottom: 8,
                  }}
                >
                  {perk.label}
                </div>
                <div style={{ fontFamily: font, fontSize: 15, lineHeight: 1.45, color: color.body }}>
                  {perk.body}
                </div>
              </li>
            ))}
          </ul>
        )}
        {typeof onSignIn === "function" && (
          <button
            type="button"
            onClick={onSignIn}
            style={{
              ...BTN_PRIMARY,
              width: "auto",
              minWidth: 220,
              padding: "14px 28px",
              marginTop: 24,
              fontFamily: fontDisplay,
            }}
          >
            {cta}
          </button>
        )}
      </div>
    </div>
  );
}
