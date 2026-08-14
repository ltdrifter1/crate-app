import {
  buildPremiumCreditGrant,
  usableCreditBalance,
  applyCreditSpend,
  creditSummaryLine,
  creditGrantForPremium,
} from "./clubCredit";

describe("clubCredit", () => {
  test("premium grant is $12 for $10", () => {
    expect(creditGrantForPremium()).toBe(12);
    const grant = buildPremiumCreditGrant(new Date("2026-01-01T00:00:00.000Z"));
    expect(grant.clubCreditBalance).toBe(12);
    expect(grant.clubCreditExpiresAt).toBe("2027-01-01T00:00:00.000Z");
  });

  test("usable balance respects expiry", () => {
    const profile = {
      clubCreditBalance: 12,
      clubCreditExpiresAt: "2026-01-01T00:00:00.000Z",
    };
    expect(usableCreditBalance(profile, new Date("2026-06-01T00:00:00.000Z"))).toBe(0);
    expect(
      usableCreditBalance(
        { ...profile, clubCreditExpiresAt: "2027-01-01T00:00:00.000Z" },
        new Date("2026-06-01T00:00:00.000Z")
      )
    ).toBe(12);
  });

  test("applyCreditSpend rejects overspend", () => {
    const profile = {
      clubCreditBalance: 5,
      clubCreditExpiresAt: "2027-01-01T00:00:00.000Z",
    };
    expect(applyCreditSpend(profile, 8).ok).toBe(false);
    expect(applyCreditSpend(profile, 3).clubCreditBalance).toBe(2);
  });

  test("summary line", () => {
    expect(creditSummaryLine({ clubCreditBalance: 0 })).toMatch(/No Club Credit/);
  });
});
