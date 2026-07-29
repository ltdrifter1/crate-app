/**
 * Paywall — shown when the free trial ends and there is no active subscription.
 * Stripe Payment Link is a placeholder until the live checkout URL is set.
 */
import {
  font, fontDisplay, color, radius, glass,
  APP_STYLE, BTN_PRIMARY, BTN_SECONDARY, BRAND_NAME,
} from "../../theme";
import {
  BILLING,
  formatPriceMonthly,
  membershipSummary,
  openStripeCheckout,
} from "../../lib/entitlements";
import BrandMark from "../brand/BrandMark";

export default function PaywallScreen({
  access = null,
  onSubscribe,
  onRefresh,
  onLogout,
  refreshing = false,
}) {
  const price = formatPriceMonthly();
  const summary = membershipSummary(access);
  const link = access?.stripePaymentLink || BILLING.stripePaymentLink;
  const isPlaceholder = /PLACEHOLDER/i.test(link);

  function handleSubscribe() {
    if (typeof onSubscribe === "function") {
      onSubscribe(link);
      return;
    }
    openStripeCheckout(link);
  }

  return (
    <div
      style={{
        ...APP_STYLE,
        alignItems: "stretch",
        justifyContent: "center",
        padding: "48px 28px 40px",
        background: `
          radial-gradient(ellipse 90% 55% at 50% -10%, rgba(255,255,255,0.08) 0%, transparent 55%),
          linear-gradient(180deg, #0A0A0C 0%, ${color.canvas} 42%, ${color.canvas} 100%)
        `,
      }}
    >
      <div style={{ maxWidth: 400, width: "100%", margin: "0 auto" }}>
        <div style={{ marginBottom: 36 }}>
          <BrandMark size={40} />
        </div>

        <div style={{
          fontSize: 13,
          fontWeight: 650,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: color.muted,
          marginBottom: 14,
          fontFamily: font,
        }}>
          {summary}
        </div>

        <h1 style={{
          margin: "0 0 14px",
          fontSize: "clamp(32px, 8vw, 40px)",
          fontWeight: 700,
          letterSpacing: -1.2,
          lineHeight: 1.05,
          fontFamily: fontDisplay,
          color: color.ink,
        }}>
          Keep listening on {BRAND_NAME}
        </h1>

        <p style={{
          margin: "0 0 28px",
          fontSize: 17,
          lineHeight: 1.5,
          color: color.body,
          maxWidth: 340,
        }}>
          Your free month is over. Subscribe for {price}/month to keep your radio, library, and Custom Mix.
        </p>

        <div
          style={{
            padding: "18px 20px",
            borderRadius: radius.lg,
            background: glass.fill,
            border: `1px solid ${glass.borderSoft}`,
            marginBottom: 22,
          }}
        >
          <div style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 6,
          }}>
            <div style={{
              fontSize: 18,
              fontWeight: 650,
              fontFamily: fontDisplay,
              color: color.ink,
              letterSpacing: -0.3,
            }}>
              Monthly
            </div>
            <div style={{
              fontSize: 22,
              fontWeight: 700,
              fontFamily: fontDisplay,
              color: color.ink,
              letterSpacing: -0.5,
            }}>
              {price}
              <span style={{ fontSize: 14, fontWeight: 500, color: color.muted }}> / mo</span>
            </div>
          </div>
          <div style={{ fontSize: 14, color: color.muted, lineHeight: 1.45 }}>
            Cancel anytime. Full catalog access while subscribed.
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubscribe}
          style={{
            ...BTN_PRIMARY,
            width: "100%",
            borderRadius: 980,
            marginBottom: 12,
            fontSize: 17,
          }}
        >
          Subscribe — {price}/mo
        </button>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            style={{
              ...BTN_SECONDARY,
              width: "100%",
              borderRadius: 980,
              marginBottom: 12,
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            {refreshing ? "Checking…" : "I’ve subscribed — refresh"}
          </button>
        )}

        {isPlaceholder && (
          <p style={{
            margin: "4px 0 20px",
            fontSize: 12,
            lineHeight: 1.45,
            color: color.faint,
          }}>
            Checkout link is a placeholder — paste your Stripe Payment Link when it’s ready.
          </p>
        )}

        {!isPlaceholder && (
          <p style={{
            margin: "4px 0 20px",
            fontSize: 13,
            lineHeight: 1.45,
            color: color.muted,
          }}>
            After you finish checkout, come back and tap refresh. Access unlocks once Stripe confirms.
          </p>
        )}

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            style={{
              background: "none",
              border: "none",
              color: color.faint,
              fontSize: 14,
              fontFamily: font,
              cursor: "pointer",
              padding: "8px 0",
              width: "100%",
              textAlign: "center",
            }}
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
