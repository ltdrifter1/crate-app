/**
 * Client billing — call Firebase Cloud Functions for Stripe Checkout / Portal.
 */
import { getFirebase } from "../firebase";
import { PLAN_IDS, getAccessState, openStripeCheckout, paymentLinkForPlan } from "./entitlements";
import { FUNCTIONS_REGION } from "./functionsRegion";

let functionsInstance = null;

async function functions() {
  if (!functionsInstance) {
    const { app } = await getFirebase();
    const { getFunctions } = await import("firebase/functions");
    functionsInstance = getFunctions(app, FUNCTIONS_REGION);
  }
  return functionsInstance;
}

async function callable(name) {
  const { httpsCallable } = await import("firebase/functions");
  return httpsCallable(await functions(), name);
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
    `${origin}/?billing=success&plan=${normalized}&session_id={CHECKOUT_SESSION_ID}`;
  const cancel =
    cancelUrl ||
    `${origin}/?billing=cancel&plan=${normalized}`;

  try {
    const call = await callable("createCheckoutSession");
    const { data } = await call({
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
  const call = await callable("createPortalSession");
  const { data } = await call({
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
      sessionId: q.get("session_id") || q.get("sessionId"),
    };
  } catch {
    return { billing: null, plan: null, sessionId: null };
  }
}

export async function confirmCheckout(sessionId) {
  const id = String(sessionId || "").trim();
  if (!id) throw new Error("Missing checkout session");
  const call = await callable("confirmCheckoutSession");
  const { data } = await call({ sessionId: id });
  return data || {};
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPaidAccess(access) {
  if (!access) return false;
  return (
    access.tier === PLAN_IDS.CLUB ||
    access.tier === PLAN_IDS.PREMIUM ||
    access.reason === "trial" ||
    access.reason === "admin"
  );
}

/**
 * After Stripe redirects home, confirm the session (if present) and wait
 * briefly for Firestore membership to land. Does not toast or mutate the URL.
 */
export async function settleBillingReturn({
  search = "",
  confirmSession = confirmCheckout,
  refreshProfile,
  now = new Date(),
  attempts = 5,
  delayMs = 1200,
} = {}) {
  const q = readBillingQuery(search);
  if (q.billing !== "success") {
    return { applied: false, pending: false, reason: q.billing || "none", query: q };
  }

  if (q.sessionId && typeof confirmSession === "function") {
    try {
      await confirmSession(q.sessionId);
    } catch (err) {
      console.warn("confirmCheckoutSession failed", err);
    }
  }

  if (typeof refreshProfile !== "function") {
    return { applied: false, pending: true, query: q };
  }

  let profile = null;
  let access = null;
  for (let i = 0; i < attempts; i += 1) {
    profile = await refreshProfile();
    access = getAccessState(profile, { now });
    if (isPaidAccess(access)) {
      return { applied: true, pending: false, access, plan: access.tier, profile, query: q };
    }
    if (i < attempts - 1) await sleep(delayMs);
  }
  return { applied: false, pending: true, access, profile, query: q };
}

export function stripBillingQuery(href) {
  try {
    const url = new URL(href);
    url.searchParams.delete("billing");
    url.searchParams.delete("plan");
    url.searchParams.delete("session_id");
    url.searchParams.delete("sessionId");
    return url.pathname + url.search + url.hash;
  } catch {
    return href;
  }
}
