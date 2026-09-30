/**
 * Sanity tests for functions/lib/plans.js (no Firebase).
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  PLAN_IDS,
  priceIdForPlan,
  planFromPriceId,
  buildPremiumCreditGrant,
  freePlanFields,
} = require("./plans");

test("priceIdForPlan reads env", () => {
  process.env.STRIPE_CLUB_PRICE_ID = "price_club";
  process.env.STRIPE_PREMIUM_PRICE_ID = "price_premium";
  assert.equal(priceIdForPlan("club"), "price_club");
  assert.equal(priceIdForPlan("premium"), "price_premium");
  assert.equal(planFromPriceId("price_premium"), PLAN_IDS.PREMIUM);
});

test("premium grant is 12 for a year", () => {
  const g = buildPremiumCreditGrant(new Date("2026-01-01T00:00:00.000Z"));
  assert.equal(g.clubCreditBalance, 12);
  assert.equal(g.clubCreditExpiresAt, "2027-01-01T00:00:00.000Z");
});

test("freePlanFields", () => {
  const f = freePlanFields(new Date("2026-06-01T00:00:00.000Z"));
  assert.equal(f.plan, "free");
  assert.equal(f.subscriptionStatus, "free");
});
