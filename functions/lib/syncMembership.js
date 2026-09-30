/**
 * Write Stripe subscription / checkout state onto Firestore users/{uid}.
 */
const admin = require("firebase-admin");
const {
  PLAN_IDS,
  planFromPriceId,
  planFromMetadata,
  buildPremiumCreditGrant,
  freePlanFields,
} = require("./plans");

function db() {
  return admin.firestore();
}

function customerIdOf(obj) {
  const c = obj?.customer;
  if (typeof c === "string" && c) return c;
  if (c && typeof c === "object" && typeof c.id === "string") return c.id;
  return null;
}

function uidFromMetadata(meta = {}) {
  const uid = meta.firebaseUid || meta.uid || null;
  return uid ? String(uid) : null;
}

function firstPriceIdFromSubscription(subscription) {
  const item = subscription?.items?.data?.[0];
  return item?.price?.id || item?.plan?.id || null;
}

/**
 * Prefer the live Stripe Price (portal upgrades/downgrades) over stale
 * checkout metadata that still says "club" after a Premium switch.
 */
function resolvePlan(subscription, sessionMeta = {}) {
  return (
    planFromPriceId(firstPriceIdFromSubscription(subscription)) ||
    planFromMetadata(subscription?.metadata || {}) ||
    planFromMetadata(sessionMeta) ||
    PLAN_IDS.CLUB
  );
}

/**
 * Basil / Dahlia invoices no longer have top-level `subscription`.
 * Fall back for older event payloads.
 */
function subscriptionIdFromInvoice(invoice) {
  const parent = invoice?.parent;
  if (parent?.type === "subscription_details") {
    const id = parent.subscription_details?.subscription;
    if (id) return id;
  }
  if (parent?.subscription_details?.subscription) {
    return parent.subscription_details.subscription;
  }
  return invoice?.subscription || null;
}

function unixToIso(seconds) {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n <= 0) return null;
  const d = new Date(n * 1000);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Build the Firestore patch for an active / past_due / trialing subscription.
 * Pure — used by tests. Does not reset Club Credit unless grantPremiumCredit
 * and this subscription has not already been granted.
 */
function buildMembershipPatch(subscription, {
  sessionMeta = {},
  grantPremiumCredit = false,
  existing = {},
  now = new Date(),
} = {}) {
  const plan = resolvePlan(subscription, sessionMeta);
  const status = String(subscription?.status || "active").toLowerCase();
  const clock = now instanceof Date ? now : new Date(now);
  const subId = subscription?.id || null;

  const payload = {
    plan,
    subscriptionStatus: status,
    stripeCustomerId: customerIdOf(subscription),
    stripeSubscriptionId: subId,
    stripePriceId: firstPriceIdFromSubscription(subscription),
    updatedFromStripeAt: clock.toISOString(),
  };

  const isNewSub = !existing.stripeSubscriptionId || existing.stripeSubscriptionId !== subId;
  if (!existing.planStartedAt || isNewSub) {
    payload.planStartedAt = clock.toISOString();
  }

  if (status === "trialing") {
    const trialEnd = unixToIso(subscription?.trial_end);
    const trialStart = unixToIso(subscription?.trial_start);
    if (trialEnd) payload.trialEndsAt = trialEnd;
    if (trialStart) payload.trialStartedAt = trialStart;
  }

  const alreadyGranted =
    existing.stripeSubscriptionId === subId &&
    String(existing.plan || "").toLowerCase() === PLAN_IDS.PREMIUM &&
    !!existing.clubCreditGrantedAt;

  if (plan === PLAN_IDS.PREMIUM && grantPremiumCredit && !alreadyGranted) {
    Object.assign(payload, buildPremiumCreditGrant(clock));
  }

  return { payload, plan, status };
}

async function resolveUid({ metadata, customer } = {}) {
  const fromMeta = uidFromMetadata(metadata || {});
  if (fromMeta) return fromMeta;
  const customerId = typeof customer === "string" ? customer : customer?.id;
  if (!customerId) return null;
  const snap = await db()
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();
  return snap.empty ? null : snap.docs[0].id;
}

async function readExistingUser(uid) {
  const snap = await db().collection("users").doc(uid).get();
  return snap.exists ? snap.data() || {} : {};
}

/**
 * Apply an active/past_due/trialing subscription to the member profile.
 */
async function applySubscriptionToUser(uid, subscription, { sessionMeta = {}, grantPremiumCredit = false } = {}) {
  if (!uid) throw new Error("Missing firebase uid");
  const existing = await readExistingUser(uid);
  const { payload, plan, status } = buildMembershipPatch(subscription, {
    sessionMeta,
    grantPremiumCredit,
    existing,
  });
  await db().collection("users").doc(uid).set(payload, { merge: true });
  return { uid, plan, status };
}

async function applyCheckoutCompleted(session, stripe) {
  const uid =
    session.client_reference_id ||
    uidFromMetadata(session.metadata || {}) ||
    (await resolveUid({ metadata: session.metadata, customer: session.customer }));
  if (!uid) {
    console.warn("checkout.session.completed missing firebase uid", session.id);
    return null;
  }

  let subscription = null;
  if (session.subscription) {
    subscription =
      typeof session.subscription === "string"
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription;
  }

  if (!subscription) {
    await db().collection("users").doc(uid).set(
      {
        stripeCustomerId: customerIdOf(session),
        updatedFromStripeAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return null;
  }

  const plan =
    planFromPriceId(firstPriceIdFromSubscription(subscription)) ||
    planFromMetadata(session.metadata || {}) ||
    PLAN_IDS.CLUB;

  if (!subscription.metadata?.firebaseUid || !subscription.metadata?.plan) {
    try {
      await stripe.subscriptions.update(subscription.id, {
        metadata: {
          ...(subscription.metadata || {}),
          firebaseUid: uid,
          plan,
        },
      });
    } catch (e) {
      console.warn("Could not stamp subscription metadata", e.message);
    }
  }

  return applySubscriptionToUser(uid, subscription, {
    sessionMeta: { ...(session.metadata || {}), plan },
    grantPremiumCredit: plan === PLAN_IDS.PREMIUM,
  });
}

async function applySubscriptionUpdated(subscription) {
  const uid = await resolveUid({
    metadata: subscription.metadata,
    customer: subscription.customer,
  });
  if (!uid) {
    console.warn("subscription.updated missing firebaseUid", subscription.id);
    return null;
  }
  const status = String(subscription.status || "").toLowerCase();
  if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") {
    await db().collection("users").doc(uid).set(
      {
        ...freePlanFields(),
        stripeCustomerId: customerIdOf(subscription),
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: status,
        updatedFromStripeAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { uid, plan: PLAN_IDS.FREE, status };
  }
  return applySubscriptionToUser(uid, subscription, {
    grantPremiumCredit: false,
  });
}

async function applySubscriptionDeleted(subscription) {
  const uid = await resolveUid({
    metadata: subscription.metadata,
    customer: subscription.customer,
  });
  if (!uid) return null;
  await db().collection("users").doc(uid).set(
    {
      ...freePlanFields(),
      stripeCustomerId: customerIdOf(subscription),
      stripeSubscriptionId: null,
      updatedFromStripeAt: new Date().toISOString(),
    },
    { merge: true }
  );
  return { uid, plan: PLAN_IDS.FREE, status: "canceled" };
}

/**
 * Yearly Premium renewal — refresh Club Credit on invoice.paid.
 */
async function applyInvoicePaid(invoice, stripe) {
  const subscriptionRef = subscriptionIdFromInvoice(invoice);
  if (!subscriptionRef) return null;
  const subscription =
    typeof subscriptionRef === "string"
      ? await stripe.subscriptions.retrieve(subscriptionRef)
      : subscriptionRef;
  const uid = await resolveUid({
    metadata: subscription.metadata,
    customer: subscription.customer || invoice.customer,
  });
  if (!uid) return null;
  const plan = resolvePlan(subscription);
  if (plan !== PLAN_IDS.PREMIUM) return null;
  // Skip the first invoice if we already granted on checkout.session.completed
  // billing_reason: subscription_create | subscription_cycle
  if (invoice.billing_reason === "subscription_create") return null;
  const grant = buildPremiumCreditGrant(new Date());
  await db().collection("users").doc(uid).set(
    {
      ...grant,
      plan: PLAN_IDS.PREMIUM,
      subscriptionStatus: "active",
      updatedFromStripeAt: new Date().toISOString(),
    },
    { merge: true }
  );
  return { uid, plan, credit: grant.clubCreditBalance };
}

function withCheckoutSessionId(url) {
  const raw = String(url || "").trim();
  if (!raw) return raw;
  if (raw.includes("{CHECKOUT_SESSION_ID}")) return raw;
  const sep = raw.includes("?") ? "&" : "?";
  return `${raw}${sep}session_id={CHECKOUT_SESSION_ID}`;
}

module.exports = {
  applyCheckoutCompleted,
  applySubscriptionUpdated,
  applySubscriptionDeleted,
  applyInvoicePaid,
  applySubscriptionToUser,
  buildMembershipPatch,
  resolvePlan,
  subscriptionIdFromInvoice,
  customerIdOf,
  uidFromMetadata,
  firstPriceIdFromSubscription,
  withCheckoutSessionId,
};
