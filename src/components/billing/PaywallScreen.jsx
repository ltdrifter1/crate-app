/**
 * Membership plans — Free / Club ($0.99/mo) / Premium ($10/yr with credits).
 * Soft upgrade surface (Free is always allowed into the app).
 * Checkout goes through Firebase → Stripe Checkout Sessions.
 */
import { useState } from "react";
import {
  font, fontDisplay, fontMono, color, radius, glass,
  APP_STYLE, BTN_PRIMARY, BTN_SECONDARY, BRAND_NAME,
} from "../../theme";
import {
  BILLING,
  PLAN_IDS,
  formatPriceClub,
  formatPricePremium,
  formatMoney,
  membershipSummary,
  planMarketingCopy,
} from "../../lib/entitlements";
import { startCheckout, openBillingPortal } from "../../lib/billing";
import BrandMark from "../brand/BrandMark";

export default function PaywallScreen({
  access = null,
  onSubscribe,
  onRefresh,
  onLogout,
  onContinueFree = null,
  refreshing = false,
  mode = "upgrade", // upgrade | manage
}) {
  const summary = membershipSummary(access);
  const plans = planMarketingCopy();
  const tier = access?.tier || PLAN_IDS.FREE;
  const [busyPlan, setBusyPlan] = useState(null);
  const [error, setError] = useState(null);

  async function handlePlan(planId) {
    setError(null);
    if (planId === PLAN_IDS.FREE) {
      onContinueFree?.();
      return;
    }
    if (typeof onSubscribe === "function") {
      // Parent wires Cloud Function checkout
      onSubscribe(null, planId);
      return;
    }
    setBusyPlan(planId);
    try {
      await startCheckout(planId);
    } catch (e) {
      setError(e?.message || "Couldn’t start checkout");
    } finally {
      setBusyPlan(null);
    }
  }

  async function handleManageBilling() {
    setError(null);
    setBusyPlan("portal");
    try {
      await openBillingPortal();
    } catch (e) {
      setError(e?.message || "Couldn’t open billing portal");
    } finally {
      setBusyPlan(null);
    }
  }

  return (
    <div
      style={{
        ...APP_STYLE,
        position: "fixed",
        inset: 0,
        zIndex: 360,
        alignItems: "stretch",
        justifyContent: "flex-start",
        padding: "40px 22px 48px",
        overflowY: "auto",
        background: `
          radial-gradient(ellipse 90% 55% at 50% -10%, rgba(169,199,228,0.08) 0%, transparent 55%),
          linear-gradient(180deg, #181C23 0%, ${color.canvas} 42%, ${color.canvas} 100%)
        `,
      }}
    >
      <div style={{ maxWidth: 440, width: "100%", margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <BrandMark size={40} />
        </div>

        <div style={{
          fontSize: 12,
          fontWeight: 650,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: color.muted,
          marginBottom: 12,
          fontFamily: fontMono,
        }}>
          {summary}
        </div>

        <h1 style={{
          margin: "0 0 12px",
          fontSize: "clamp(30px, 7vw, 38px)",
          fontWeight: 700,
          letterSpacing: -1.1,
          lineHeight: 1.05,
          fontFamily: fontDisplay,
          color: color.ink,
        }}>
          {mode === "manage" ? "Your membership" : "Pick your level"}
        </h1>

        <p style={{
          margin: "0 0 24px",
          fontSize: 16,
          lineHeight: 1.5,
          color: color.body,
          maxWidth: 360,
        }}>
          Free keeps limited streaming. Club unlocks the full crate and your card.
          Premium adds Club Credit for physical releases on {BRAND_NAME}.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {plans.map((plan) => {
            const current = plan.id === tier;
            const isClub = plan.id === PLAN_IDS.CLUB;
            const isPremium = plan.id === PLAN_IDS.PREMIUM;
            const busy = busyPlan === plan.id;
            return (
              <div
                key={plan.id}
                style={{
                  padding: "16px 18px",
                  borderRadius: radius.lg,
                  background: current ? "rgba(169,199,228,0.08)" : glass.plate,
                  border: `1px solid ${current ? color.accent : glass.border}`,
                  boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowSoft}`,
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 6,
                  alignItems: "baseline",
                }}>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: fontDisplay,
                    color: color.ink,
                  }}>
                    {plan.name}
                    {current && (
                      <span style={{
                        marginLeft: 8,
                        fontSize: 11,
                        fontFamily: fontMono,
                        color: color.accent,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}>
                        Current
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: fontDisplay,
                    color: color.ink,
                  }}>
                    {plan.price}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: color.body, lineHeight: 1.45, marginBottom: 10 }}>
                  {plan.blurb}
                </div>
                <ul style={{
                  margin: "0 0 14px",
                  padding: "0 0 0 18px",
                  color: color.muted,
                  fontSize: 13,
                  lineHeight: 1.5,
                }}>
                  {plan.perks.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                {!current && plan.id !== PLAN_IDS.FREE && (
                  <button
                    type="button"
                    disabled={!!busyPlan}
                    onClick={() => handlePlan(plan.id)}
                    style={{
                      ...(isPremium ? BTN_PRIMARY : BTN_SECONDARY),
                      width: "100%",
                      borderRadius: radius.md,
                      fontSize: 15,
                      opacity: busyPlan && !busy ? 0.55 : 1,
                    }}
                  >
                    {busy
                      ? "Opening Stripe…"
                      : isClub
                        ? `Join Club — ${formatPriceClub()}`
                        : `Go Premium — ${formatPricePremium()}`}
                  </button>
                )}
                {!current && plan.id === PLAN_IDS.FREE && onContinueFree && tier === PLAN_IDS.FREE && (
                  <button
                    type="button"
                    onClick={() => handlePlan(PLAN_IDS.FREE)}
                    style={{
                      ...BTN_SECONDARY,
                      width: "100%",
                      borderRadius: radius.md,
                      fontSize: 15,
                    }}
                  >
                    Continue on Free
                  </button>
                )}
                {current && plan.id === PLAN_IDS.FREE && onContinueFree && (
                  <button
                    type="button"
                    onClick={() => handlePlan(PLAN_IDS.FREE)}
                    style={{
                      ...BTN_SECONDARY,
                      width: "100%",
                      borderRadius: radius.md,
                      fontSize: 15,
                    }}
                  >
                    Keep listening on Free
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <p role="alert" style={{ fontSize: 13, color: color.alert, lineHeight: 1.45, marginBottom: 12 }}>
            {error}
          </p>
        )}

        {access?.tier === PLAN_IDS.PREMIUM && (
          <p style={{ fontSize: 13, color: color.body, lineHeight: 1.45, marginBottom: 16 }}>
            Club Credit on file: {formatMoney(access.creditBalance || 0)}
            {access.creditExpiresAt
              ? ` · use on physical releases before ${access.creditExpiresAt.toLocaleDateString?.("en-US", { month: "short", year: "numeric" }) || ""}`
              : ""}
          </p>
        )}

        {(tier === PLAN_IDS.CLUB || tier === PLAN_IDS.PREMIUM || access?.reason === "trial") && (
          <button
            type="button"
            onClick={handleManageBilling}
            disabled={!!busyPlan}
            style={{
              ...BTN_SECONDARY,
              width: "100%",
              borderRadius: radius.md,
              marginBottom: 12,
            }}
          >
            {busyPlan === "portal" ? "Opening…" : "Manage billing in Stripe"}
          </button>
        )}

        {onRefresh && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onRefresh}
            disabled={refreshing}
            style={{
              ...BTN_SECONDARY,
              width: "100%",
              borderRadius: radius.md,
              marginBottom: 12,
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            {refreshing ? "Checking…" : "I’ve paid — refresh"}
          </button>
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

        <p style={{ marginTop: 16, fontSize: 12, color: color.faint, lineHeight: 1.45 }}>
          Secure checkout via Stripe. Free includes {BILLING.freePlaysPerDay} plays/day.
          Club is {formatPriceClub()}. Premium is {formatPricePremium()} and includes{" "}
          {formatMoney(BILLING.premium.creditGrant)} Club Credit.
        </p>
      </div>
    </div>
  );
}
