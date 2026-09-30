/**
 * Membership entitlements — three levels:
 *   free     — limited digital streaming
 *   club     — full streaming + membership card (price TBD)
 *   premium  — Club Credits for physical purchases (price TBD)
 *
 * Checkout goes through Firebase Cloud Functions (Stripe Checkout Sessions)
 * once billing is live. Until then, the product ships as a beta free trial.
 *
 * PAYWALL_ENABLED: set false to give every account unlimited streaming
 * and hide Club/Premium upgrade surfaces. Flip back to restore gating.
 *
 * BETA_LAUNCH / PRICING_COMING_SOON: hide dollar amounts and checkout CTAs
 * while Stripe products/prices are unfinished.
 */

export const PLAN_IDS = {
  FREE: "free",
  CLUB: "club",
  PREMIUM: "premium",
};

/** Temporary: crate is open — all accounts stream unlimited. */
export const PAYWALL_ENABLED = false;

/** Public beta: full listening, no charges. */
export const BETA_LAUNCH = true;

/** Hide Club / Premium / Club Copy dollar amounts until Stripe is configured. */
export const PRICING_COMING_SOON = true;

export const BETA_LAUNCH_COPY = {
  badge: "Beta",
  profileNote:
    "Planet MP3 is in beta. Full access is included during this trial period.",
  priceLabel: "—",
};

export const BILLING = {
  currency: "USD",
  currencySymbol: "$",
  productName: "Planet MP3",
  /** Free tier daily play cap (full tracks counted). */
  freePlaysPerDay: 20,
  /** Checkout via Firebase Cloud Function (preferred). Payment links are fallback only. */
  checkoutMode: "cloud_function",
  club: {
    id: PLAN_IDS.CLUB,
    label: "Club",
    price: 0.99,
    interval: "month",
    /** Optional Payment Link fallback if Cloud Functions are unavailable. */
    stripePaymentLink: "",
  },
  premium: {
    id: PLAN_IDS.PREMIUM,
    label: "Premium",
    price: 10,
    interval: "year",
    /** Credits granted when Premium is purchased ($10 → $12 power). */
    creditGrant: 12,
    creditBonus: 2,
    /** Optional Payment Link fallback if Cloud Functions are unavailable. */
    stripePaymentLink: "",
  },
};

/** Statuses that grant paid plan privileges (set by Stripe webhook later). */
export const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "past_due", // grace — keep access while Stripe retries
]);

export const TRIAL_STATUS = "trialing";

export function formatMoney(amount, billing = BILLING) {
  const n = Number(amount);
  const fixed = Number.isFinite(n) ? n.toFixed(2) : "0.00";
  // Drop trailing .00 for whole dollars in marketing copy when clean
  const pretty = fixed.endsWith(".00") ? String(Math.round(n)) : fixed;
  return `${billing.currencySymbol}${pretty}`;
}

export function formatPriceMonthly(billing = BILLING) {
  return formatMoney(billing.club.price, billing);
}

export function formatPriceClub(billing = BILLING) {
  return `${formatMoney(billing.club.price, billing)}/mo`;
}

export function formatPricePremium(billing = BILLING) {
  return `${formatMoney(billing.premium.price, billing)}/yr`;
}

/** What to show in UI for a plan — dollar amounts only when billing is live. */
export function marketingPriceLabel(planId, billing = BILLING) {
  const id = normalizePlanId(planId);
  if (PRICING_COMING_SOON && id !== PLAN_IDS.FREE) {
    return BETA_LAUNCH_COPY.priceLabel;
  }
  if (id === PLAN_IDS.PREMIUM) return formatPricePremium(billing);
  if (id === PLAN_IDS.CLUB) return formatPriceClub(billing);
  return formatMoney(0, billing);
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

export function addDays(from = new Date(), days = 30) {
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

/** @deprecated — kept for older tests/imports; Free is the default now. */
export function addTrialDays(from = new Date(), days = 30) {
  return addDays(from, days);
}

/**
 * Default billing fields for new users — Free tier (limited streaming).
 * No forced paywall; Club / Premium are upgrades.
 */
export function buildFreePlanFields(now = new Date()) {
  const started = now instanceof Date ? now : new Date(now);
  return {
    plan: PLAN_IDS.FREE,
    subscriptionStatus: "free",
    trialStartedAt: null,
    trialEndsAt: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    clubCreditBalance: 0,
    clubCreditExpiresAt: null,
    planStartedAt: started.toISOString(),
  };
}

/** @deprecated alias — new accounts use Free, not a blocking trial. */
export function buildTrialFields(now = new Date()) {
  return buildFreePlanFields(now);
}

/**
 * Backfill profiles missing a plan into Free (non-destructive for paid).
 */
export function needsPlanBackfill(profile) {
  if (!profile) return false;
  if (ACTIVE_SUBSCRIPTION_STATUSES.has(String(profile.subscriptionStatus || "").toLowerCase())) {
    return false;
  }
  const plan = String(profile.plan || "").toLowerCase();
  if (plan === PLAN_IDS.FREE || plan === PLAN_IDS.CLUB || plan === PLAN_IDS.PREMIUM) {
    return false;
  }
  // Legacy trialing with future trialEndsAt still counts as having a plan clock
  if (profile.trialEndsAt && String(profile.subscriptionStatus || "").toLowerCase() === TRIAL_STATUS) {
    return false;
  }
  return !profile.plan || plan === "trial" || plan === "expired";
}

/** @deprecated — use needsPlanBackfill */
export function needsTrialBackfill(profile) {
  return needsPlanBackfill(profile);
}

export function normalizePlanId(plan) {
  const p = String(plan || "").toLowerCase();
  if (p === PLAN_IDS.CLUB || p === "monthly") return PLAN_IDS.CLUB;
  if (p === PLAN_IDS.PREMIUM || p === "yearly" || p === "annual") return PLAN_IDS.PREMIUM;
  if (p === "trial") return PLAN_IDS.CLUB; // legacy trial → treat as club privileges while active
  return PLAN_IDS.FREE;
}

/**
 * Membership feature matrix derived from profile.
 * Free users are always allowed into the app (limited streaming when paywall is on).
 */
function computeAccessState(profile, { now = new Date(), isAdmin = false } = {}) {
  const clock = now instanceof Date ? now : new Date(now);
  const base = {
    plan: normalizePlanId(profile?.plan),
    status: profile?.subscriptionStatus || null,
    trialEndsAt: parseDate(profile?.trialEndsAt),
    daysLeft: null,
    priceLabel: formatPriceClub(),
    premiumPriceLabel: formatPricePremium(),
    stripePaymentLink: BILLING.club.stripePaymentLink,
    clubPaymentLink: BILLING.club.stripePaymentLink,
    premiumPaymentLink: BILLING.premium.stripePaymentLink,
    streaming: "limited", // limited | full
    membershipCard: false,
    clubCredits: false,
    creditBalance: Number(profile?.clubCreditBalance) || 0,
    creditExpiresAt: parseDate(profile?.clubCreditExpiresAt),
    freePlaysPerDay: BILLING.freePlaysPerDay,
    tier: PLAN_IDS.FREE,
    allowed: true, // Free is a real tier — never hard-block the app
    reason: "free",
    canUpgradeClub: true,
    canUpgradePremium: true,
  };

  if (isAdmin) {
    return {
      ...base,
      allowed: true,
      reason: "admin",
      tier: PLAN_IDS.PREMIUM,
      streaming: "full",
      membershipCard: true,
      clubCredits: true,
      canUpgradeClub: false,
      canUpgradePremium: false,
      plan: PLAN_IDS.PREMIUM,
    };
  }

  const status = String(profile?.subscriptionStatus || "").toLowerCase();
  const plan = normalizePlanId(profile?.plan);

  // Legacy trial window still grants Club-level streaming
  const trialEnds = parseDate(profile?.trialEndsAt);
  if (status === TRIAL_STATUS && trialEnds && trialEnds.getTime() > clock.getTime()) {
    const msLeft = trialEnds.getTime() - clock.getTime();
    const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
    return {
      ...base,
      allowed: true,
      reason: "trial",
      tier: PLAN_IDS.CLUB,
      plan: PLAN_IDS.CLUB,
      status: TRIAL_STATUS,
      trialEndsAt: trialEnds,
      daysLeft,
      streaming: "full",
      membershipCard: true,
      clubCredits: false,
      canUpgradeClub: true,
      canUpgradePremium: true,
    };
  }

  const paidActive = ACTIVE_SUBSCRIPTION_STATUSES.has(status);

  if (paidActive && plan === PLAN_IDS.PREMIUM) {
    const creditOk =
      base.creditBalance > 0 &&
      (!base.creditExpiresAt || base.creditExpiresAt.getTime() > clock.getTime());
    return {
      ...base,
      allowed: true,
      reason: "premium",
      tier: PLAN_IDS.PREMIUM,
      plan: PLAN_IDS.PREMIUM,
      status,
      streaming: "full",
      membershipCard: true,
      clubCredits: true,
      creditBalance: creditOk ? base.creditBalance : base.creditBalance,
      canUpgradeClub: false,
      canUpgradePremium: false,
      priceLabel: formatPricePremium(),
      stripePaymentLink: BILLING.premium.stripePaymentLink,
    };
  }

  if (paidActive && (plan === PLAN_IDS.CLUB || plan === PLAN_IDS.FREE)) {
    // Active sub with club (or legacy monthly)
    return {
      ...base,
      allowed: true,
      reason: "club",
      tier: PLAN_IDS.CLUB,
      plan: PLAN_IDS.CLUB,
      status,
      streaming: "full",
      membershipCard: true,
      clubCredits: false,
      canUpgradeClub: false,
      canUpgradePremium: true,
      stripePaymentLink: BILLING.club.stripePaymentLink,
    };
  }

  // Explicit free / expired / none → limited streaming
  return {
    ...base,
    allowed: true,
    reason: "free",
    tier: PLAN_IDS.FREE,
    plan: PLAN_IDS.FREE,
    status: status || "free",
    streaming: "limited",
    membershipCard: false,
    clubCredits: false,
    canUpgradeClub: true,
    canUpgradePremium: true,
  };
}

export function getAccessState(profile, { now = new Date(), isAdmin = false, paywallEnabled = PAYWALL_ENABLED } = {}) {
  const access = computeAccessState(profile, { now, isAdmin });
  if (paywallEnabled) return access;
  return {
    ...access,
    allowed: true,
    streaming: "full",
    canUpgradeClub: false,
    canUpgradePremium: false,
  };
}

export function membershipSummary(access) {
  if (!access) return "Membership";
  if (access.reason === "admin") return "Admin · full access";
  if (access.reason === "premium") {
    if (PRICING_COMING_SOON) return "Premium";
    const bal = Number(access.creditBalance) || 0;
    return bal > 0
      ? `Premium · ${formatMoney(bal)} credit`
      : `Premium · ${access.premiumPriceLabel || formatPricePremium()}`;
  }
  if (access.reason === "club") {
    return PRICING_COMING_SOON
      ? "Club"
      : `Club · ${access.priceLabel || formatPriceClub()}`;
  }
  if (access.reason === "trial") {
    const n = access.daysLeft ?? 0;
    return n <= 1 ? "Trial · 1 day left" : `Trial · ${n} days left`;
  }
  if (access.reason === "free") {
    if (BETA_LAUNCH) return "Beta";
    if (access.streaming === "full") return "Member";
    return `Free · ${access.freePlaysPerDay || BILLING.freePlaysPerDay} plays/day`;
  }
  return BETA_LAUNCH ? "Beta" : "Member";
}

export function planMarketingCopy() {
  const comingSoon = PRICING_COMING_SOON;
  return [
    {
      id: PLAN_IDS.FREE,
      name: BETA_LAUNCH ? "Listening" : "Free",
      price: BETA_LAUNCH ? "Included" : "\$0",
      blurb: BETA_LAUNCH
        ? "The full catalog, unlimited."
        : "Limited digital streaming.",
      perks: BETA_LAUNCH
        ? ["Unlimited listening", "Your likes and tastes", "Radio, charts, and sets"]
        : [
            `${BILLING.freePlaysPerDay} plays per day`,
            "Browse the catalog",
            "Save likes and tastes",
          ],
    },
    {
      id: PLAN_IDS.CLUB,
      name: "Club",
      price: comingSoon ? BETA_LAUNCH_COPY.priceLabel : formatPriceClub(),
      blurb: comingSoon
        ? "Membership card and early Club Copy."
        : "Full streaming plus your membership card.",
      perks: [
        "Unlimited listening",
        "Digital membership card",
        "Early Club Copy access",
        comingSoon ? "Available later" : "This month’s picks",
      ],
    },
    {
      id: PLAN_IDS.PREMIUM,
      name: "Premium",
      price: comingSoon ? BETA_LAUNCH_COPY.priceLabel : formatPricePremium(),
      blurb: comingSoon
        ? "Club Credit for physical editions."
        : `Pay ${formatMoney(BILLING.premium.price)} once a year — get ${formatMoney(BILLING.premium.creditGrant)} Club Credit for Club Copy editions.`,
      perks: [
        "Everything in Club",
        comingSoon
          ? "Club Credit"
          : `${formatMoney(BILLING.premium.creditGrant)} Club Credit on file`,
        comingSoon ? "Physical editions" : "Buy Club Copy with credit on liner notes",
        comingSoon ? "Available later" : "Good for 12 months",
      ],
    },
  ];
}

export function openStripeCheckout(link = BILLING.club.stripePaymentLink) {
  if (typeof window === "undefined") return false;
  const url = String(link || BILLING.club.stripePaymentLink || "");
  if (!url || /PLACEHOLDER/i.test(url)) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

export function paymentLinkForPlan(planId) {
  if (normalizePlanId(planId) === PLAN_IDS.PREMIUM) {
    return BILLING.premium.stripePaymentLink || "";
  }
  return BILLING.club.stripePaymentLink || "";
}
