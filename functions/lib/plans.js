/**
 * Plan ↔ Stripe Price mapping and membership field builders.
 * Keep in sync with src/lib/entitlements.js + clubCredit.js (client).
 */

const PLAN_IDS = {
  FREE: "free",
  CLUB: "club",
  PREMIUM: "premium",
};

const CREDIT_GRANT_PREMIUM = 12;

function env(name, fallback = "") {
  const v = process.env[name];
  return v == null || v === "" ? fallback : String(v);
}

function priceIdForPlan(plan) {
  const p = String(plan || "").toLowerCase();
  if (p === PLAN_IDS.PREMIUM) {
    return env("STRIPE_PREMIUM_PRICE_ID");
  }
  return env("STRIPE_CLUB_PRICE_ID");
}

function planFromPriceId(priceId) {
  const id = String(priceId || "");
  if (id && id === env("STRIPE_PREMIUM_PRICE_ID")) return PLAN_IDS.PREMIUM;
  if (id && id === env("STRIPE_CLUB_PRICE_ID")) return PLAN_IDS.CLUB;
  return null;
}

function planFromMetadata(meta = {}) {
  const p = String(meta.plan || meta.planetPlan || "").toLowerCase();
  if (p === PLAN_IDS.CLUB || p === PLAN_IDS.PREMIUM) return p;
  return null;
}

function addDays(from, days) {
  const start = from instanceof Date ? new Date(from.getTime()) : new Date(from);
  const end = new Date(start.getTime());
  end.setUTCDate(end.getUTCDate() + days);
  return end;
}

function buildPremiumCreditGrant(now = new Date()) {
  const started = now instanceof Date ? now : new Date(now);
  return {
    clubCreditBalance: CREDIT_GRANT_PREMIUM,
    clubCreditExpiresAt: addDays(started, 365).toISOString(),
    clubCreditGrantedAt: started.toISOString(),
    clubCreditGrantAmount: CREDIT_GRANT_PREMIUM,
  };
}

function freePlanFields(now = new Date()) {
  return {
    plan: PLAN_IDS.FREE,
    subscriptionStatus: "free",
    stripeSubscriptionId: null,
    clubCreditBalance: 0,
    clubCreditExpiresAt: null,
    planStartedAt: (now instanceof Date ? now : new Date(now)).toISOString(),
  };
}

module.exports = {
  PLAN_IDS,
  CREDIT_GRANT_PREMIUM,
  env,
  priceIdForPlan,
  planFromPriceId,
  planFromMetadata,
  buildPremiumCreditGrant,
  freePlanFields,
};
