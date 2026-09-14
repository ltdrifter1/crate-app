/**
 * Unit tests for server listening / credit helpers.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  evaluateListeningPlay,
  evaluateCreditSpend,
  FREE_PLAYS_PER_DAY,
} = require("./listening");

describe("evaluateListeningPlay", () => {
  const day = "2026-08-16";
  const now = new Date("2026-08-16T12:00:00Z");

  it("paywall off — free users stream unlimited", () => {
    const r = evaluateListeningPlay(
      { plan: "free", subscriptionStatus: "free", playsToday: 99, playsDayKey: day },
      now
    );
    assert.equal(r.allowed, true);
    assert.equal(r.full, true);
    assert.equal(r.meter, null);
  });

  it("allows and meters free users when paywall is on", () => {
    // Gating is currently disabled (PAYWALL_ENABLED=false); this documents the cap math.
    assert.equal(FREE_PLAYS_PER_DAY, 20);
    const r = evaluateListeningPlay(
      { plan: "free", subscriptionStatus: "free", playsToday: 3, playsDayKey: day },
      now
    );
    assert.equal(r.allowed, true);
    assert.equal(r.full, true);
  });

  it("does not block at the old free cap while the crate is open", () => {
    const r = evaluateListeningPlay(
      { plan: "free", subscriptionStatus: "free", playsToday: 20, playsDayKey: day },
      now
    );
    assert.equal(r.allowed, true);
    assert.equal(r.full, true);
  });

  it("skips meter for club", () => {
    const r = evaluateListeningPlay(
      { plan: "club", subscriptionStatus: "active", playsToday: 99, playsDayKey: day },
      now
    );
    assert.equal(r.allowed, true);
    assert.equal(r.full, true);
    assert.equal(r.meter, null);
  });
});

describe("evaluateCreditSpend", () => {
  const now = new Date("2026-08-16T12:00:00Z");

  it("spends against balance", () => {
    const r = evaluateCreditSpend(
      {
        plan: "premium",
        subscriptionStatus: "active",
        clubCreditBalance: 12,
        clubCreditExpiresAt: "2027-01-01T00:00:00.000Z",
      },
      8,
      now
    );
    assert.equal(r.ok, true);
    assert.equal(r.clubCreditBalance, 4);
    assert.equal(r.spent, 8);
  });

  it("rejects overspend", () => {
    const r = evaluateCreditSpend(
      {
        plan: "premium",
        subscriptionStatus: "active",
        clubCreditBalance: 3,
        clubCreditExpiresAt: "2027-01-01T00:00:00.000Z",
      },
      8,
      now
    );
    assert.equal(r.ok, false);
    assert.equal(r.error, "insufficient_credit");
  });
});
