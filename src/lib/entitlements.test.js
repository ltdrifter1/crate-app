import {
  BILLING,
  addTrialDays,
  buildTrialFields,
  formatPriceMonthly,
  getAccessState,
  membershipSummary,
  needsTrialBackfill,
  toIso,
} from "./entitlements";

describe("entitlements", () => {
  test("formats monthly price", () => {
    expect(formatPriceMonthly()).toBe("$2.99");
    expect(BILLING.trialDays).toBe(30);
    expect(BILLING.stripePaymentLink).toContain("PLACEHOLDER");
  });

  test("buildTrialFields covers one month", () => {
    const start = new Date("2026-01-01T00:00:00.000Z");
    const fields = buildTrialFields(start);
    expect(fields.plan).toBe("trial");
    expect(fields.subscriptionStatus).toBe("trialing");
    expect(fields.trialStartedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(fields.trialEndsAt).toBe(addTrialDays(start).toISOString());
    expect(fields.stripeCustomerId).toBeNull();
  });

  test("needsTrialBackfill when trialEndsAt missing", () => {
    expect(needsTrialBackfill({ uid: "a" })).toBe(true);
    expect(needsTrialBackfill({ trialEndsAt: "2026-02-01T00:00:00.000Z" })).toBe(false);
    expect(needsTrialBackfill({ subscriptionStatus: "active" })).toBe(false);
  });

  test("trial grants access until expiry", () => {
    const now = new Date("2026-01-15T12:00:00.000Z");
    const access = getAccessState(
      {
        subscriptionStatus: "trialing",
        trialEndsAt: "2026-01-31T00:00:00.000Z",
        plan: "trial",
      },
      { now }
    );
    expect(access.allowed).toBe(true);
    expect(access.reason).toBe("trial");
    expect(access.daysLeft).toBeGreaterThan(0);
    expect(membershipSummary(access)).toMatch(/Trial/);
  });

  test("expired trial blocks access", () => {
    const access = getAccessState(
      {
        subscriptionStatus: "trialing",
        trialEndsAt: "2026-01-01T00:00:00.000Z",
      },
      { now: new Date("2026-02-01T00:00:00.000Z") }
    );
    expect(access.allowed).toBe(false);
    expect(access.reason).toBe("expired");
    expect(access.daysLeft).toBe(0);
  });

  test("active subscription grants access", () => {
    const access = getAccessState(
      { subscriptionStatus: "active", plan: "monthly" },
      { now: new Date("2026-06-01T00:00:00.000Z") }
    );
    expect(access.allowed).toBe(true);
    expect(access.reason).toBe("subscribed");
  });

  test("admin always allowed", () => {
    const access = getAccessState({}, { isAdmin: true, now: new Date() });
    expect(access.allowed).toBe(true);
    expect(access.reason).toBe("admin");
  });

  test("toIso handles Firestore-like timestamps", () => {
    expect(toIso({ seconds: 1700000000, nanoseconds: 0 })).toBe(
      new Date(1700000000 * 1000).toISOString()
    );
    expect(toIso({ toDate: () => new Date("2026-03-01T00:00:00.000Z") })).toBe(
      "2026-03-01T00:00:00.000Z"
    );
  });
});
