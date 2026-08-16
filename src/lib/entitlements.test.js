import {
  BILLING,
  PLAN_IDS,
  addTrialDays,
  buildFreePlanFields,
  buildTrialFields,
  formatPriceClub,
  formatPriceMonthly,
  formatPricePremium,
  getAccessState,
  membershipSummary,
  needsPlanBackfill,
  needsTrialBackfill,
  planMarketingCopy,
  toIso,
} from "./entitlements";

describe("entitlements three-tier", () => {
  test("prices match Free / Club / Premium", () => {
    expect(formatPriceMonthly()).toBe("$0.99");
    expect(formatPriceClub()).toBe("$0.99/mo");
    expect(formatPricePremium()).toBe("$10/yr");
    expect(BILLING.freePlaysPerDay).toBe(20);
    expect(BILLING.premium.creditGrant).toBe(12);
    expect(BILLING.checkoutMode).toBe("cloud_function");
  });

  test("new accounts default to Free", () => {
    const fields = buildFreePlanFields(new Date("2026-01-01T00:00:00.000Z"));
    expect(fields.plan).toBe(PLAN_IDS.FREE);
    expect(fields.subscriptionStatus).toBe("free");
    expect(fields.clubCreditBalance).toBe(0);
    expect(buildTrialFields().plan).toBe(PLAN_IDS.FREE);
  });

  test("needsPlanBackfill for legacy empty profiles", () => {
    expect(needsPlanBackfill({ uid: "a" })).toBe(true);
    expect(needsPlanBackfill({ plan: "free", subscriptionStatus: "free" })).toBe(false);
    expect(needsPlanBackfill({ subscriptionStatus: "active", plan: "club" })).toBe(false);
    expect(needsTrialBackfill({ uid: "a" })).toBe(true);
  });

  test("free always allowed with limited streaming", () => {
    const access = getAccessState(
      { plan: "free", subscriptionStatus: "free" },
      { now: new Date("2026-06-01T00:00:00.000Z") }
    );
    expect(access.allowed).toBe(true);
    expect(access.tier).toBe("free");
    expect(access.streaming).toBe("limited");
    expect(access.membershipCard).toBe(false);
    expect(membershipSummary(access)).toMatch(/Free/);
  });

  test("club grants full streaming + card", () => {
    const access = getAccessState(
      { plan: "club", subscriptionStatus: "active" },
      { now: new Date("2026-06-01T00:00:00.000Z") }
    );
    expect(access.allowed).toBe(true);
    expect(access.reason).toBe("club");
    expect(access.streaming).toBe("full");
    expect(access.membershipCard).toBe(true);
    expect(access.clubCredits).toBe(false);
    expect(access.canUpgradePremium).toBe(true);
  });

  test("premium grants credits", () => {
    const access = getAccessState(
      {
        plan: "premium",
        subscriptionStatus: "active",
        clubCreditBalance: 12,
        clubCreditExpiresAt: "2027-06-01T00:00:00.000Z",
      },
      { now: new Date("2026-06-01T00:00:00.000Z") }
    );
    expect(access.reason).toBe("premium");
    expect(access.streaming).toBe("full");
    expect(access.clubCredits).toBe(true);
    expect(access.creditBalance).toBe(12);
    expect(membershipSummary(access)).toMatch(/Premium/);
  });

  test("legacy trial still grants club streaming", () => {
    const access = getAccessState(
      {
        subscriptionStatus: "trialing",
        trialEndsAt: "2026-01-31T00:00:00.000Z",
        plan: "trial",
      },
      { now: new Date("2026-01-15T12:00:00.000Z") }
    );
    expect(access.allowed).toBe(true);
    expect(access.reason).toBe("trial");
    expect(access.streaming).toBe("full");
    expect(access.membershipCard).toBe(true);
  });

  test("expired trial falls back to free limited", () => {
    const access = getAccessState(
      {
        subscriptionStatus: "trialing",
        trialEndsAt: "2026-01-01T00:00:00.000Z",
        plan: "trial",
      },
      { now: new Date("2026-02-01T00:00:00.000Z") }
    );
    expect(access.allowed).toBe(true);
    expect(access.tier).toBe("free");
    expect(access.streaming).toBe("limited");
  });

  test("admin always full", () => {
    const access = getAccessState({}, { isAdmin: true, now: new Date() });
    expect(access.reason).toBe("admin");
    expect(access.streaming).toBe("full");
    expect(access.clubCredits).toBe(true);
  });

  test("planMarketingCopy has three levels", () => {
    const plans = planMarketingCopy();
    expect(plans.map((p) => p.id)).toEqual(["free", "club", "premium"]);
    const premium = plans.find((p) => p.id === "premium");
    expect(premium.blurb).toMatch(/Club Credit/i);
    expect(premium.perks.some((p) => /Club Copy/i.test(p))).toBe(true);
  });

  test("addTrialDays still works", () => {
    const start = new Date("2026-01-01T00:00:00.000Z");
    expect(addTrialDays(start, 30).toISOString()).toBe("2026-01-31T00:00:00.000Z");
  });

  test("toIso handles Firestore-like timestamps", () => {
    expect(toIso({ seconds: 1700000000, nanoseconds: 0 })).toBe(
      new Date(1700000000 * 1000).toISOString()
    );
  });
});
