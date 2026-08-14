/**
 * Client billing — call Firebase Cloud Functions for Stripe Checkout / Portal.
 */
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase";
import { PLAN_IDS, openStripeCheckout, paymentLinkForPlan } from "./entitlements";

let functionsInstance = null;

function functions() {
  if (!functionsInstance) {
    functionsInstance = getFunctions(app);
  }
  return functionsInstance;
}

/**
 * Start Checkout for club | premium.
 * Prefers Cloud Function; falls back to Payment Link if configured.
 */
export async function startCheckout(plan, { successUrl, cancelUrl } = {}) {
  const normalized = String(plan || "").toLowerCase() === PLAN_IDS.PREMIUM
    ? PLAN_IDS.PREMIUM
    : PLAN_IDS.CLUB;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const success =
    successUrl ||
    `${origin}/?billing=success&plan=${normalized}`;
  const cancel =
    cancelUrl ||
    `${origin}/?billing=cancel&plan=${normalized}`;

  try {
    const callable = httpsCallable(functions(), "createCheckoutSession");
    const { data } = await callable({
      plan: normalized,
      successUrl: success,
      cancelUrl: cancel,
    });
    if (data?.url) {
      window.location.assign(data.url);
      return { ok: true, method: "checkout", sessionId: data.sessionId };
    }
  } catch (err) {
    console.warn("createCheckoutSession failed, trying payment link", err);
    const link = paymentLinkForPlan(normalized);
    if (link && !/PLACEHOLDER/i.test(link)) {
      openStripeCheckout(link);
      return { ok: true, method: "payment_link" };
    }
    throw err;
  }
  throw new Error("Checkout did not return a URL");
}

export async function openBillingPortal({ returnUrl } = {}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const callable = httpsCallable(functions(), "createPortalSession");
  const { data } = await callable({
    returnUrl: returnUrl || `${origin}/?billing=portal`,
  });
  if (data?.url) {
    window.location.assign(data.url);
    return { ok: true };
  }
  throw new Error("Portal did not return a URL");
}

export function readBillingQuery(search = "") {
  try {
    const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    return {
      billing: q.get("billing"),
      plan: q.get("plan"),
    };
  } catch {
    return { billing: null, plan: null };
  }
}
