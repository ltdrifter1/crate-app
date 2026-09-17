/**
 * Membership plans — during beta, prices and checkout are coming soon.
 * Soft upgrade surface (Free/beta trial is always allowed into the app).
 */
import { useState } from "react";
import {
  fontDisplay, fontMono, color, radius, glass,
  APP_STYLE, BTN_PRIMARY, BTN_SECONDARY,
} from "../../theme";
import {
  PLAN_IDS,
  formatMoney,
  membershipSummary,
  planMarketingCopy,
  PRICING_COMING_SOON,
  BETA_LAUNCH,
  BETA_LAUNCH_COPY,
} from "../../lib/entitlements";
import { startCheckout, openBillingPortal } from "../../lib/billing";
import BrandMark from "../brand/BrandMark";
import BetaLaunchNotice from "./BetaLaunchNotice";

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
  const billingLive = !PRICING_COMING_SOON;

  async function handlePlan(planId) {
    setError(null);
    if (planId === PLAN_IDS.FREE) {
      onContinueFree?.();
      return;
    }
    if (!billingLive) {
      setError("Payments aren’t live yet — this beta is a free trial.");
      return;
    }
    if (typeof onSubscribe === "function") {
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
    if (!billingLive) {
      setError("Billing management is coming soon.");
      return;
    }
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
          {BETA_LAUNCH
            ? "Beta launch"
            : mode === "manage"
              ? "Your membership"
              : "Pick your level"}
        </h1>

        <p style={{
          margin: "0 0 20px",
          fontSize: 16,
          lineHeight: 1.5,
          color: color.body,
          maxWidth: 360,
        }}>
          {BETA_LAUNCH
            ? BETA_LAUNCH_COPY.blurb
            : "Free keeps limited streaming. Club unlocks the full crate and your card. Premium adds Club Credit for Club Copy editions."}
        </p>

        {(BETA_LAUNCH || PRICING_COMING_SOON) && (
          <BetaLaunchNotice style={{ marginBottom: 20 }} />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {plans.map((plan) => {
            const current = plan.id === tier || (BETA_LAUNCH && plan.id === PLAN_IDS.FREE);
            const busy = busyPlan === plan.id;
            const paidPlan = plan.id !== PLAN_IDS.FREE;
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
                        {BETA_LAUNCH && plan.id === PLAN_IDS.FREE ? "Trial" : "Current"}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 700,
                    fontFamily: fontDisplay,
                    color: paidPlan && PRICING_COMING_SOON ? color.muted : color.ink,
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
                {!current && paidPlan && billingLive && (
                  <button
                    type="button"
                    disabled={!!busyPlan}
                    onClick={() => handlePlan(plan.id)}
                    style={{
                      ...(plan.id === PLAN_IDS.PREMIUM ? BTN_PRIMARY : BTN_SECONDARY),
                      width: "100%",
                      borderRadius: radius.md,
                      fontSize: 15,
                      opacity: busyPlan && !busy ? 0.55 : 1,
                    }}
                  >
                    {busy
                      ? "Opening Stripe…"
                      : plan.id === PLAN_IDS.CLUB
                        ? `Join Club — ${plan.price}`
                        : `Go Premium — ${plan.price}`}
                  </button>
                )}
                {!current && paidPlan && !billingLive && (
                  <div
                    style={{
                      ...BTN_SECONDARY,
                      width: "100%",
                      borderRadius: radius.md,
                      fontSize: 14,
                      opacity: 0.72,
                      cursor: "default",
                      textAlign: "center",
                      pointerEvents: "none",
                    }}
                  >
                    Coming soon
                  </div>
                )}
                {plan.id === PLAN_IDS.FREE && onContinueFree && (
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
                    {BETA_LAUNCH ? "Keep listening — free trial" : "Continue on Free"}
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

        {access?.tier === PLAN_IDS.PREMIUM && !PRICING_COMING_SOON && (
          <p style={{ fontSize: 13, color: color.body, lineHeight: 1.45, marginBottom: 16 }}>
            Club Credit on file: {formatMoney(access.creditBalance || 0)}
            {access.creditExpiresAt
              ? ` · use on physical releases before ${access.creditExpiresAt.toLocaleDateString?.("en-US", { month: "short", year: "numeric" }) || ""}`
              : ""}
          </p>
        )}

        {billingLive && (tier === PLAN_IDS.CLUB || tier === PLAN_IDS.PREMIUM || access?.reason === "trial") && (
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

        {billingLive && onRefresh && (
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
              fontFamily: fontDisplay,
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
          {PRICING_COMING_SOON
            ? "No payment is required during this beta launch. Club, Premium, and Club Copy checkout are coming soon."
            : "Secure checkout via Stripe when billing is live."}
        </p>
      </div>
    </div>
  );
}
