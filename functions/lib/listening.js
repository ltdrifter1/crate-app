/**
 * Server listening meter + credit spend helpers (Admin SDK / Cloud Functions).
 * Keep day-key + free-cap logic aligned with src/lib/freePlays.js.
 */

const FREE_PLAYS_PER_DAY = 20;

function playsDayKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function isFullStreaming(user = {}) {
  const status = String(user.subscriptionStatus || "").toLowerCase();
  const plan = String(user.plan || "").toLowerCase();
  if (status === "active" && (plan === "club" || plan === "premium")) return true;
  if (status === "trialing") {
    const ends = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
    if (ends && !Number.isNaN(ends.getTime()) && ends.getTime() > Date.now()) return true;
  }
  return false;
}

function normalizePlayMeter(user = {}, now = new Date()) {
  const day = playsDayKey(now);
  const storedDay = user.playsDayKey || null;
  const count = storedDay === day ? Math.max(0, Number(user.playsToday) || 0) : 0;
  return { playsDayKey: day, playsToday: count };
}

/**
 * Decide whether this play is allowed and compute next meter fields.
 * @returns {{ allowed: boolean, full: boolean, meter: {playsDayKey:string, playsToday:number}|null, remaining: number, reason?: string }}
 */
function evaluateListeningPlay(user = {}, now = new Date()) {
  if (isFullStreaming(user)) {
    return {
      allowed: true,
      full: true,
      meter: null,
      remaining: Infinity,
    };
  }
  const meter = normalizePlayMeter(user, now);
  const remaining = Math.max(0, FREE_PLAYS_PER_DAY - meter.playsToday);
  if (remaining <= 0) {
    return {
      allowed: false,
      full: false,
      meter,
      remaining: 0,
      reason: "free_limit",
    };
  }
  return {
    allowed: true,
    full: false,
    meter: {
      playsDayKey: meter.playsDayKey,
      playsToday: meter.playsToday + 1,
    },
    remaining: remaining - 1,
  };
}

function usableCreditBalance(user = {}, now = new Date()) {
  const expires = user.clubCreditExpiresAt ? new Date(user.clubCreditExpiresAt) : null;
  if (expires && !Number.isNaN(expires.getTime()) && expires.getTime() <= now.getTime()) {
    return 0;
  }
  return Math.max(0, Number(user.clubCreditBalance) || 0);
}

/**
 * Apply Club Credit spend for a physical / Club Copy purchase.
 */
function evaluateCreditSpend(user = {}, amount, now = new Date()) {
  const spend = Math.round(Math.max(0, Number(amount) || 0) * 100) / 100;
  if (spend <= 0) {
    return { ok: false, error: "invalid_amount" };
  }
  const plan = String(user.plan || "").toLowerCase();
  const status = String(user.subscriptionStatus || "").toLowerCase();
  const hasPremium = plan === "premium" && status === "active";
  if (!hasPremium && usableCreditBalance(user, now) <= 0) {
    return { ok: false, error: "premium_required" };
  }
  const bal = usableCreditBalance(user, now);
  if (spend > bal) {
    return { ok: false, error: "insufficient_credit", balance: bal };
  }
  return {
    ok: true,
    spent: spend,
    clubCreditBalance: Math.round((bal - spend) * 100) / 100,
  };
}

module.exports = {
  FREE_PLAYS_PER_DAY,
  playsDayKey,
  isFullStreaming,
  normalizePlayMeter,
  evaluateListeningPlay,
  usableCreditBalance,
  evaluateCreditSpend,
};
