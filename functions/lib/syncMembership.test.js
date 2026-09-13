/**
 * Pure helpers for Stripe → Firestore membership sync (no Firebase).
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

process.env.STRIPE_CLUB_PRICE_ID = "price_club";
process.env.STRIPE_PREMIUM_PRICE_ID = "price_premium";

const {
  resolvePlan,
  subscriptionIdFromInvoice,
  customerIdOf,
  uidFromMetadata,
  buildMembershipPatch,
  withCheckoutSessionId,
} = require("./syncMembership");

describe("resolvePlan", () => {
  it("prefers live price id over stale checkout metadata", () => {
    const sub = {
      metadata: { plan: "club" },
      items: { data: [{ price: { id: "price_premium" } }] },
    };
    assert.equal(resolvePlan(sub, { plan: "club" }), "premium");
  });

  it("falls back to metadata when price ids are unknown", () => {
    const sub = {
      metadata: { plan: "premium" },
      items: { data: [{ price: { id: "price_other" } }] },
    };
    assert.equal(resolvePlan(sub), "premium");
  });
});

describe("subscriptionIdFromInvoice", () => {
  it("reads Basil/Dahlia parent.subscription_details", () => {
    assert.equal(
      subscriptionIdFromInvoice({
        parent: {
          type: "subscription_details",
          subscription_details: { subscription: "sub_123" },
        },
      }),
      "sub_123"
    );
  });

  it("falls back to legacy invoice.subscription", () => {
    assert.equal(subscriptionIdFromInvoice({ subscription: "sub_legacy" }), "sub_legacy");
  });

  it("returns null when neither shape is present", () => {
    assert.equal(subscriptionIdFromInvoice({ id: "in_1" }), null);
  });
});

describe("ids", () => {
  it("normalizes customer objects", () => {
    assert.equal(customerIdOf({ customer: "cus_1" }), "cus_1");
    assert.equal(customerIdOf({ customer: { id: "cus_2" } }), "cus_2");
    assert.equal(customerIdOf({}), null);
  });

  it("reads firebase uid from metadata", () => {
    assert.equal(uidFromMetadata({ firebaseUid: "u1" }), "u1");
    assert.equal(uidFromMetadata({ uid: "u2" }), "u2");
    assert.equal(uidFromMetadata({}), null);
  });
});

describe("buildMembershipPatch", () => {
  const premiumSub = {
    id: "sub_p",
    status: "active",
    customer: "cus_1",
    metadata: { plan: "premium", firebaseUid: "u1" },
    items: { data: [{ price: { id: "price_premium" } }] },
  };

  it("does not reset Club Credit on subscription.updated", () => {
    const { payload } = buildMembershipPatch(premiumSub, {
      grantPremiumCredit: false,
      existing: {
        plan: "premium",
        stripeSubscriptionId: "sub_p",
        clubCreditBalance: 4,
        clubCreditGrantedAt: "2026-01-01T00:00:00.000Z",
        planStartedAt: "2026-01-01T00:00:00.000Z",
      },
      now: new Date("2026-06-01T00:00:00.000Z"),
    });
    assert.equal(payload.plan, "premium");
    assert.equal(payload.subscriptionStatus, "active");
    assert.equal(payload.clubCreditBalance, undefined);
    assert.equal(payload.planStartedAt, undefined);
  });

  it("grants credit once on checkout for a new Premium sub", () => {
    const { payload } = buildMembershipPatch(premiumSub, {
      grantPremiumCredit: true,
      existing: { plan: "free", subscriptionStatus: "free" },
      now: new Date("2026-01-01T00:00:00.000Z"),
    });
    assert.equal(payload.clubCreditBalance, 12);
    assert.equal(payload.clubCreditExpiresAt, "2027-01-01T00:00:00.000Z");
    assert.equal(payload.planStartedAt, "2026-01-01T00:00:00.000Z");
  });

  it("is idempotent when confirming the same checkout twice", () => {
    const { payload } = buildMembershipPatch(premiumSub, {
      grantPremiumCredit: true,
      existing: {
        plan: "premium",
        stripeSubscriptionId: "sub_p",
        clubCreditGrantedAt: "2026-01-01T00:00:00.000Z",
        clubCreditBalance: 3,
        planStartedAt: "2026-01-01T00:00:00.000Z",
      },
      now: new Date("2026-02-01T00:00:00.000Z"),
    });
    assert.equal(payload.clubCreditBalance, undefined);
  });

  it("writes Stripe trial window onto the profile", () => {
    const { payload } = buildMembershipPatch(
      {
        id: "sub_t",
        status: "trialing",
        customer: "cus_1",
        trial_start: 1767225600,
        trial_end: 1769817600,
        metadata: { plan: "club" },
        items: { data: [{ price: { id: "price_club" } }] },
      },
      { now: new Date("2026-01-01T00:00:00.000Z") }
    );
    assert.equal(payload.subscriptionStatus, "trialing");
    assert.equal(payload.trialEndsAt, "2026-01-31T00:00:00.000Z");
  });
});

describe("withCheckoutSessionId", () => {
  it("appends session_id placeholder once", () => {
    assert.equal(
      withCheckoutSessionId("https://app.example/?billing=success"),
      "https://app.example/?billing=success&session_id={CHECKOUT_SESSION_ID}"
    );
    assert.equal(
      withCheckoutSessionId("https://app.example/?billing=success&session_id={CHECKOUT_SESSION_ID}"),
      "https://app.example/?billing=success&session_id={CHECKOUT_SESSION_ID}"
    );
  });
});
