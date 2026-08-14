/**
 * Planet MP3 Cloud Functions — Stripe Checkout + webhook → Firestore membership.
 *
 * Secrets (Firebase Secret Manager / functions env):
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 *   STRIPE_CLUB_PRICE_ID
 *   STRIPE_PREMIUM_PRICE_ID
 */
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
const Stripe = require("stripe");
const {
  PLAN_IDS,
  priceIdForPlan,
  env,
} = require("./lib/plans");
const {
  applyCheckoutCompleted,
  applySubscriptionUpdated,
  applySubscriptionDeleted,
  applyInvoicePaid,
} = require("./lib/syncMembership");

if (!admin.apps.length) {
  admin.initializeApp();
}

const stripeSecret = defineSecret("STRIPE_SECRET_KEY");
const webhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const clubPriceId = defineString("STRIPE_CLUB_PRICE_ID", { default: "" });
const premiumPriceId = defineString("STRIPE_PREMIUM_PRICE_ID", { default: "" });

function stripeClient(apiKey) {
  return new Stripe(apiKey, {
    apiVersion: "2026-07-29.dahlia",
    typescript: false,
  });
}

function randomSuffix(n = 8) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < n; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function injectPriceEnv() {
  // Params → process.env for lib/plans helpers
  if (clubPriceId.value()) process.env.STRIPE_CLUB_PRICE_ID = clubPriceId.value();
  if (premiumPriceId.value()) process.env.STRIPE_PREMIUM_PRICE_ID = premiumPriceId.value();
}

async function getOrCreateCustomer(stripe, uid, email) {
  const ref = admin.firestore().collection("users").doc(uid);
  const snap = await ref.get();
  const existing = snap.exists ? snap.data()?.stripeCustomerId : null;
  if (existing) {
    try {
      const customer = await stripe.customers.retrieve(existing);
      if (!customer.deleted) return customer;
    } catch {
      /* recreate below */
    }
  }
  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: { firebaseUid: uid },
  });
  await ref.set({ stripeCustomerId: customer.id }, { merge: true });
  return customer;
}

/**
 * Callable: createCheckoutSession({ plan: 'club'|'premium', successUrl, cancelUrl })
 * Returns { url, sessionId }
 */
exports.createCheckoutSession = onCall(
  {
    secrets: [stripeSecret],
    invoker: "public",
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Sign in to upgrade.");
    }
    injectPriceEnv();
    const plan = String(request.data?.plan || "").toLowerCase();
    if (plan !== PLAN_IDS.CLUB && plan !== PLAN_IDS.PREMIUM) {
      throw new HttpsError("invalid-argument", "plan must be club or premium");
    }
    const priceId = priceIdForPlan(plan);
    if (!priceId) {
      throw new HttpsError(
        "failed-precondition",
        `Missing Stripe price for ${plan}. Set STRIPE_CLUB_PRICE_ID / STRIPE_PREMIUM_PRICE_ID.`
      );
    }

    const successUrl = String(request.data?.successUrl || "").trim();
    const cancelUrl = String(request.data?.cancelUrl || "").trim();
    if (!successUrl || !cancelUrl) {
      throw new HttpsError("invalid-argument", "successUrl and cancelUrl required");
    }

    const stripe = stripeClient(stripeSecret.value());
    const uid = request.auth.uid;
    const email = request.auth.token?.email || null;
    const customer = await getOrCreateCustomer(stripe, uid, email);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      client_reference_id: uid,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { firebaseUid: uid, plan },
      subscription_data: {
        metadata: { firebaseUid: uid, plan },
      },
      allow_promotion_codes: true,
      integration_identifier: `planetmp3-checkout-${randomSuffix()}`,
    });

    return { url: session.url, sessionId: session.id, plan };
  }
);

/**
 * Callable: createPortalSession({ returnUrl })
 * Returns { url }
 */
exports.createPortalSession = onCall(
  {
    secrets: [stripeSecret],
    invoker: "public",
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Sign in to manage billing.");
    }
    const returnUrl = String(request.data?.returnUrl || "").trim();
    if (!returnUrl) {
      throw new HttpsError("invalid-argument", "returnUrl required");
    }
    const stripe = stripeClient(stripeSecret.value());
    const snap = await admin.firestore().collection("users").doc(request.auth.uid).get();
    const customerId = snap.exists ? snap.data()?.stripeCustomerId : null;
    if (!customerId) {
      throw new HttpsError("failed-precondition", "No Stripe customer yet — subscribe first.");
    }
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: portal.url };
  }
);

/**
 * HTTP: Stripe webhook → sync Firestore membership.
 * Endpoint: https://<region>-crate-app-58494.cloudfunctions.net/stripeWebhook
 */
exports.stripeWebhook = onRequest(
  {
    secrets: [stripeSecret, webhookSecret],
    cors: false,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    injectPriceEnv();
    const stripe = stripeClient(stripeSecret.value());
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        webhookSecret.value()
      );
    } catch (err) {
      console.error("Webhook signature verification failed", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed":
          await applyCheckoutCompleted(event.data.object, stripe);
          break;
        case "customer.subscription.updated":
          await applySubscriptionUpdated(event.data.object);
          break;
        case "customer.subscription.deleted":
          await applySubscriptionDeleted(event.data.object);
          break;
        case "invoice.paid":
          await applyInvoicePaid(event.data.object, stripe);
          break;
        default:
          break;
      }
      res.json({ received: true });
    } catch (err) {
      console.error("Webhook handler error", event.type, err);
      res.status(500).send("Webhook handler failed");
    }
  }
);

/** Health / config peek (no secrets). */
exports.billingHealth = onRequest(async (_req, res) => {
  injectPriceEnv();
  res.json({
    ok: true,
    clubPriceConfigured: Boolean(env("STRIPE_CLUB_PRICE_ID") || clubPriceId.value()),
    premiumPriceConfigured: Boolean(env("STRIPE_PREMIUM_PRICE_ID") || premiumPriceId.value()),
  });
});
