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

function firstPriceIdFromSubscription(subscription) {
  const item = subscription?.items?.data?.[0];
  return item?.price?.id || item?.plan?.id || null;
}

function resolvePlan(subscription, sessionMeta = {}) {
  return (
    planFromMetadata(subscription?.metadata || {}) ||
    planFromMetadata(sessionMeta) ||
    planFromPriceId(firstPriceIdFromSubscription(subscription)) ||
    PLAN_IDS.CLUB
  );
}

/**
 * Apply an active/past_due subscription to the member profile.
 */
async function applySubscriptionToUser(uid, subscription, { sessionMeta = {}, grantPremiumCredit = false } = {}) {
  if (!uid) throw new Error("Missing firebase uid");
  const plan = resolvePlan(subscription, sessionMeta);
  const status = String(subscription.status || "active").toLowerCase();
  const now = new Date();

  const payload = {
    plan,
    subscriptionStatus: status,
    stripeCustomerId: subscription.customer || null,
    stripeSubscriptionId: subscription.id || null,
    planStartedAt: now.toISOString(),
    stripePriceId: firstPriceIdFromSubscription(subscription),
    updatedFromStripeAt: now.toISOString(),
  };

  if (plan === PLAN_IDS.PREMIUM && (grantPremiumCredit || status === "active")) {
    // Grant / refresh annual credit when Premium activates or renews
    Object.assign(payload, buildPremiumCreditGrant(now));
  }

  await db().collection("users").doc(uid).set(payload, { merge: true });
  return { uid, plan, status };
}

async function applyCheckoutCompleted(session, stripe) {
  const uid =
    session.client_reference_id ||
    session.metadata?.firebaseUid ||
    session.metadata?.uid ||
    null;
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
    // Shouldn't happen for mode=subscription, but record customer at least
    await db().collection("users").doc(uid).set(
      {
        stripeCustomerId: session.customer || null,
        updatedFromStripeAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return null;
  }

  // Ensure subscription metadata carries uid/plan for later events
  const plan =
    planFromMetadata(session.metadata || {}) ||
    planFromPriceId(firstPriceIdFromSubscription(subscription)) ||
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
  const uid = subscription.metadata?.firebaseUid || subscription.metadata?.uid;
  if (!uid) {
    console.warn("subscription.updated missing firebaseUid", subscription.id);
    return null;
  }
  const status = String(subscription.status || "").toLowerCase();
  if (status === "canceled" || status === "unpaid" || status === "incomplete_expired") {
    await db().collection("users").doc(uid).set(
      {
        ...freePlanFields(),
        stripeCustomerId: subscription.customer || null,
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
  const uid = subscription.metadata?.firebaseUid || subscription.metadata?.uid;
  if (!uid) return null;
  await db().collection("users").doc(uid).set(
    {
      ...freePlanFields(),
      stripeCustomerId: subscription.customer || null,
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
  if (!invoice.subscription) return null;
  const subscription =
    typeof invoice.subscription === "string"
      ? await stripe.subscriptions.retrieve(invoice.subscription)
      : invoice.subscription;
  const uid = subscription.metadata?.firebaseUid || subscription.metadata?.uid;
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

module.exports = {
  applyCheckoutCompleted,
  applySubscriptionUpdated,
  applySubscriptionDeleted,
  applyInvoicePaid,
  applySubscriptionToUser,
};
