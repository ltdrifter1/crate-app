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
const {
  evaluateListeningPlay,
  evaluateCreditSpend,
  FREE_PLAYS_PER_DAY,
} = require("./lib/listening");

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

/**
 * Callable: recordListeningEvent({ trackId })
 * Server-trusted free-play meter + track playCount + recentTracks.
 */
exports.recordListeningEvent = onCall(
  { invoker: "public" },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Sign in to play.");
    }
    const trackId = String(request.data?.trackId || "").trim();
    if (!trackId) {
      throw new HttpsError("invalid-argument", "trackId required");
    }

    const db = admin.firestore();
    const userRef = db.collection("users").doc(request.auth.uid);
    const trackRef = db.collection("tracks").doc(trackId);

    try {
      return await db.runTransaction(async (tx) => {
        const [userSnap, trackSnap] = await Promise.all([tx.get(userRef), tx.get(trackRef)]);
        if (!trackSnap.exists) {
          throw new HttpsError("not-found", "Track not found");
        }
        const user = userSnap.exists ? userSnap.data() : {};
        const decision = evaluateListeningPlay(user);
        if (!decision.allowed) {
          return {
            allowed: false,
            reason: decision.reason || "free_limit",
            playsToday: decision.meter?.playsToday ?? FREE_PLAYS_PER_DAY,
            playsDayKey: decision.meter?.playsDayKey || null,
            remaining: 0,
            freePlaysPerDay: FREE_PLAYS_PER_DAY,
          };
        }

        const entry = { trackId, playedAt: new Date().toISOString() };
        const prev = Array.isArray(user.recentTracks) ? user.recentTracks : [];
        const recentTracks = [entry, ...prev.filter((r) => r && r.trackId !== trackId)].slice(0, 50);
        const userUpdate = { recentTracks };
        if (decision.meter) {
          userUpdate.playsDayKey = decision.meter.playsDayKey;
          userUpdate.playsToday = decision.meter.playsToday;
        }
        tx.set(userRef, userUpdate, { merge: true });
        tx.update(trackRef, {
          playCount: admin.firestore.FieldValue.increment(1),
        });
        const playCount = (Number(trackSnap.data()?.playCount) || 0) + 1;
        return {
          allowed: true,
          full: !!decision.full,
          playsToday: decision.meter?.playsToday ?? null,
          playsDayKey: decision.meter?.playsDayKey ?? null,
          remaining: decision.full ? null : decision.remaining,
          freePlaysPerDay: FREE_PLAYS_PER_DAY,
          playCount,
          recentTracks,
        };
      });
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      console.error("recordListeningEvent failed", err);
      throw new HttpsError("internal", "Could not record play");
    }
  }
);

/**
 * Callable: spendClubCredit({ trackId, amount? })
 * Spends Premium Club Credit and files the cut into the member collection.
 */
exports.spendClubCredit = onCall(
  { invoker: "public" },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Sign in to spend Club Credit.");
    }
    const trackId = String(request.data?.trackId || "").trim();
    if (!trackId) {
      throw new HttpsError("invalid-argument", "trackId required");
    }

    const db = admin.firestore();
    const userRef = db.collection("users").doc(request.auth.uid);
    const trackRef = db.collection("tracks").doc(trackId);

    try {
      return await db.runTransaction(async (tx) => {
        const [userSnap, trackSnap] = await Promise.all([tx.get(userRef), tx.get(trackRef)]);
        if (!trackSnap.exists) {
          throw new HttpsError("not-found", "Release not found");
        }
        const track = trackSnap.data() || {};
        const user = userSnap.exists ? userSnap.data() : {};

        let amount = request.data?.amount;
        if (amount == null) {
          const member = track.memberPrice != null ? Number(track.memberPrice) : null;
          const retail = track.retailPrice != null ? Number(track.retailPrice) : null;
          if (Number.isFinite(member)) amount = member;
          else if (Number.isFinite(retail)) amount = Math.round(retail * 0.8 * 100) / 100;
          else amount = 12;
        }

        const decision = evaluateCreditSpend(user, amount);
        if (!decision.ok) {
          const map = {
            insufficient_credit: "Not enough Club Credit",
            premium_required: "Premium Club Credit required",
            invalid_amount: "Invalid amount",
          };
          throw new HttpsError("failed-precondition", map[decision.error] || decision.error);
        }

        const collection = {
          digital: [],
          vinyl: [],
          cassette: [],
          cd: [],
          clubcopy: [],
          wishlist: [],
          owned: [],
          ...(user.collection && typeof user.collection === "object" ? user.collection : {}),
        };
        for (const key of Object.keys(collection)) {
          collection[key] = Array.isArray(collection[key]) ? collection[key].filter(Boolean) : [];
        }
        if (!collection.clubcopy.includes(trackId)) collection.clubcopy = [...collection.clubcopy, trackId];
        if (!collection.owned.includes(trackId)) collection.owned = [...collection.owned, trackId];

        const spends = Array.isArray(user.clubCreditSpends) ? user.clubCreditSpends.slice(0, 49) : [];
        spends.unshift({
          trackId,
          amount: decision.spent,
          at: new Date().toISOString(),
          title: track.title || null,
          catalogNumber: track.catalogNumber || null,
        });

        tx.set(
          userRef,
          {
            clubCreditBalance: decision.clubCreditBalance,
            collection,
            clubCreditSpends: spends,
          },
          { merge: true }
        );

        return {
          ok: true,
          spent: decision.spent,
          clubCreditBalance: decision.clubCreditBalance,
          trackId,
          collection,
        };
      });
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      console.error("spendClubCredit failed", err);
      throw new HttpsError("internal", "Could not complete purchase");
    }
  }
);