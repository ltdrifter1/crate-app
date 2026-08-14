/**
 * Club Credit — prepaid balance for physical purchases (Premium).
 * $10/year Premium grants $12 purchasing power by default.
 */
import { BILLING, formatMoney, parseDate, addDays, toIso } from "./entitlements";

export function creditGrantForPremium(billing = BILLING) {
  return Number(billing.premium.creditGrant) || 12;
}

export function formatCreditBalance(balance) {
  return formatMoney(Math.max(0, Number(balance) || 0));
}

/**
 * Fields to write when Premium activates (Stripe webhook / admin).
 * Grant credits and set 12-month expiry from purchase.
 */
export function buildPremiumCreditGrant(now = new Date(), billing = BILLING) {
  const started = now instanceof Date ? now : new Date(now);
  const expires = addDays(started, 365);
  return {
    clubCreditBalance: creditGrantForPremium(billing),
    clubCreditExpiresAt: expires.toISOString(),
    clubCreditGrantedAt: started.toISOString(),
    clubCreditGrantAmount: creditGrantForPremium(billing),
  };
}

export function creditIsExpired(profile, now = new Date()) {
  const expires = parseDate(profile?.clubCreditExpiresAt);
  if (!expires) return false;
  const clock = now instanceof Date ? now : new Date(now);
  return expires.getTime() <= clock.getTime();
}

export function usableCreditBalance(profile, now = new Date()) {
  if (creditIsExpired(profile, now)) return 0;
  return Math.max(0, Number(profile?.clubCreditBalance) || 0);
}

/**
 * Apply a physical purchase against credit.
 * Returns next profile credit fields (does not write).
 */
export function applyCreditSpend(profile, amount, now = new Date()) {
  const spend = Math.max(0, Number(amount) || 0);
  const bal = usableCreditBalance(profile, now);
  if (spend > bal) {
    return {
      ok: false,
      error: "Not enough Club Credit",
      clubCreditBalance: bal,
      remaining: bal,
    };
  }
  return {
    ok: true,
    clubCreditBalance: Math.round((bal - spend) * 100) / 100,
    remaining: Math.round((bal - spend) * 100) / 100,
    spent: spend,
    clubCreditExpiresAt: toIso(profile?.clubCreditExpiresAt),
  };
}

export function creditSummaryLine(profile, now = new Date()) {
  const bal = usableCreditBalance(profile, now);
  if (bal <= 0) {
    if (creditIsExpired(profile, now)) return "Club Credit expired";
    return "No Club Credit yet";
  }
  const expires = parseDate(profile?.clubCreditExpiresAt);
  if (expires) {
    const label = expires.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
    return `${formatCreditBalance(bal)} credit · until ${label}`;
  }
  return `${formatCreditBalance(bal)} Club Credit`;
}
