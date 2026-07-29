/**
 * Membership entitlements — 1-month free trial, then $2.99/mo.
 * Stripe Payment Link is a placeholder until the live link is wired.
 */

export const BILLING = {
  priceMonthly: 2.99,
  currency: "USD",
  currencySymbol: "$",
  trialDays: 30,
  /** Replace with the live Stripe Payment Link when ready. */
  stripePaymentLink: "https://buy.stripe.com/PLACEHOLDER",
  productName: "Planet MP3",
  planId: "monthly",
};

/** Statuses that grant full access (set by Stripe webhook later). */
export const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "past_due", // grace — keep listening while Stripe retries
]);

export const TRIAL_STATUS = "trialing";

export function formatPriceMonthly(billing = BILLING) {
  const amount = Number(billing.priceMonthly).toFixed(2);
  return `${billing.currencySymbol}${amount}`;
}

export function addTrialDays(from = new Date(), days = BILLING.trialDays) {
  const start = from instanceof Date ? new Date(from.getTime()) : new Date(from);
  if (Number.isNaN(start.getTime())) {
    const fallback = new Date();
    fallback.setUTCDate(fallback.getUTCDate() + days);
    return fallback;
  }
  const end = new Date(start.getTime());
  end.setUTCDate(end.getUTCDate() + days);
  return end;
}

export function toIso(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  // Firestore Timestamp
  if (typeof value.toDate === "function") {
    try {
      return value.toDate().toISOString();
    } catch {
      return null;
    }
  }
  if (typeof value.seconds === "number") {
    return new Date(value.seconds * 1000).toISOString();
  }
  return null;
}

export function parseDate(value) {
  const iso = toIso(value);
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Default billing fields written on new user profiles.
 */
export function buildTrialFields(now = new Date()) {
  const started = now instanceof Date ? now : new Date(now);
  const ends = addTrialDays(started);
  return {
    plan: "trial",
    subscriptionStatus: TRIAL_STATUS,
    trialStartedAt: started.toISOString(),
    trialEndsAt: ends.toISOString(),
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  };
}

/**
 * True when a profile is missing billing/trial fields (needs one-time backfill).
 */
export function needsTrialBackfill(profile) {
  if (!profile) return false;
  return !profile.trialEndsAt && !ACTIVE_SUBSCRIPTION_STATUSES.has(profile.subscriptionStatus);
}

/**
 * Derive access from profile + admin flag.
 * @returns {{
 *   allowed: boolean,
 *   reason: 'admin'|'subscribed'|'trial'|'expired'|'none',
 *   plan: string|null,
 *   status: string|null,
 *   trialEndsAt: Date|null,
 *   daysLeft: number|null,
 *   priceLabel: string,
 *   stripePaymentLink: string,
 * }}
 */
export function getAccessState(profile, { now = new Date(), isAdmin = false } = {}) {
  const priceLabel = `${formatPriceMonthly()}/mo`;
  const base = {
    plan: profile?.plan || null,
    status: profile?.subscriptionStatus || null,
    trialEndsAt: parseDate(profile?.trialEndsAt),
    daysLeft: null,
    priceLabel,
    stripePaymentLink: BILLING.stripePaymentLink,
  };

  if (isAdmin) {
    return { ...base, allowed: true, reason: "admin" };
  }

  const status = String(profile?.subscriptionStatus || "").toLowerCase();
  if (ACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
    return { ...base, allowed: true, reason: "subscribed", status };
  }

  const ends = parseDate(profile?.trialEndsAt);
  if (ends) {
    const msLeft = ends.getTime() - (now instanceof Date ? now.getTime() : new Date(now).getTime());
    const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
    if (msLeft > 0) {
      return {
        ...base,
        allowed: true,
        reason: "trial",
        trialEndsAt: ends,
        daysLeft,
        status: status || TRIAL_STATUS,
        plan: profile?.plan || "trial",
      };
    }
    return {
      ...base,
      allowed: false,
      reason: "expired",
      trialEndsAt: ends,
      daysLeft: 0,
      status: status || "expired",
      plan: profile?.plan || "expired",
    };
  }

  // No trial clock and not subscribed — treat as blocked (should be rare after backfill)
  return {
    ...base,
    allowed: false,
    reason: "none",
    daysLeft: 0,
  };
}

export function membershipSummary(access) {
  if (!access) return "Membership";
  if (access.reason === "admin") return "Admin access";
  if (access.reason === "subscribed") return `Member · ${access.priceLabel}`;
  if (access.reason === "trial") {
    const n = access.daysLeft ?? 0;
    return n <= 1 ? "Trial · 1 day left" : `Trial · ${n} days left`;
  }
  if (access.reason === "expired") return "Trial ended";
  return "Membership required";
}

export function openStripeCheckout(link = BILLING.stripePaymentLink) {
  if (typeof window === "undefined") return false;
  const url = String(link || BILLING.stripePaymentLink);
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
