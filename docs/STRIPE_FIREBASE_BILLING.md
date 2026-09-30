# Stripe + Firebase billing (Planet MP3)

## What this wires

| Plan | Stripe | Firestore (`users/{uid}`) |
|---|---|---|
| **Free** | — | `plan: free`, `subscriptionStatus: free`, 20 plays/day |
| **Club** `$0.99/mo` | Subscription Checkout | `plan: club`, `subscriptionStatus: active` (or `past_due` grace) |
| **Premium** `$10/yr` | Subscription Checkout | `plan: premium` + **$12 Club Credit** (12 months) |

Membership is **Firestore-only**. Firebase Auth custom claims are **not** used for Club / Premium (the `admin` claim / admin UID is separate). The client derives entitlements with `getAccessState(profile)`; the Cloud Function `recordListeningEvent` is the trusted play meter.

Flow:

1. App calls Cloud Function `createCheckoutSession({ plan })` (`us-central1`)
2. Stripe Checkout (subscription mode)
3. Webhook `stripeWebhook` **and/or** callable `confirmCheckoutSession` update `users/{uid}`
4. App settles `?billing=success&session_id={CHECKOUT_SESSION_ID}` — confirms the session, refreshes the profile, and only toasts “unlocked” once the plan is actually paid

### Also deployed with billing functions

| Callable / HTTP | Purpose |
|---|---|
| `createCheckoutSession` | Start Club / Premium Checkout |
| `confirmCheckoutSession` | Apply membership on return (covers webhook delay) |
| `createPortalSession` | Stripe Customer Portal (cancel / update card) |
| `stripeWebhook` | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` |
| `billingHealth` | Public peek: whether price IDs are configured (no secrets) |
| `recordListeningEvent` | Trusted free-play meter + `tracks.playCount` + `recentTracks` |
| `spendClubCredit` | Spend Premium Club Credit → file Club Copy into `collection` |

Deploy rules so clients cannot write `playsToday` / `playCount` / paid `plan` directly:

```bash
firebase deploy --only firestore:rules,functions
```

## Deploy (Firebase)

Requires **Blaze** plan on project `crate-app-58494`. Functions are pinned to **`us-central1`** (client `getFunctions(app, "us-central1")` must match).

```bash
# From repo root
cd functions && npm install && cd ..

# Set secrets (Secret Manager)
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET

# Prefer a restricted key (rk_test_… / rk_live_…) with Checkout + Billing + Customers.
```

Or with `.env` for emulator / params file `functions/.env` (do not commit):

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CLUB_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...
```

For Firebase Functions v2 params:

```bash
firebase functions:params:set STRIPE_CLUB_PRICE_ID=price_xxx
firebase functions:params:set STRIPE_PREMIUM_PRICE_ID=price_yyy
```

Then:

```bash
firebase deploy --only functions,firestore:rules
```

After deploy, confirm:

```text
https://us-central1-crate-app-58494.cloudfunctions.net/billingHealth
```

should return `{ ok: true, clubPriceConfigured: true, premiumPriceConfigured: true }`.

## Stripe webhook

1. Dashboard → Developers → Webhooks → Add endpoint  
   URL: `https://us-central1-crate-app-58494.cloudfunctions.net/stripeWebhook`
2. Events (all required):
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
3. Copy signing secret → `STRIPE_WEBHOOK_SECRET` (test and live are **different** secrets)
4. If signature verification fails (HTTP 400), the function is not seeing the raw body or the secret is for the wrong endpoint/mode.

Local forward:

```bash
stripe listen --forward-to http://127.0.0.1:5001/crate-app-58494/us-central1/stripeWebhook
```

## Provision products

```bash
export STRIPE_API_KEY=rk_or_sk_test_...
node scripts/stripe-provision-products.js
```

Creates **Planet MP3 Club** ($0.99/mo) and **Planet MP3 Premium** ($10/yr). Paste the printed `STRIPE_CLUB_PRICE_ID` / `STRIPE_PREMIUM_PRICE_ID` into Functions params. Price IDs are how portal upgrades are recognized — metadata alone is not enough.

## Customer portal

`createPortalSession` opens Stripe Billing Portal. Enable it in Stripe Dashboard → Settings → Billing → Customer portal (allow cancel, update payment method, and plan switch if you want Club ↔ Premium).

## Tax

If you charge US/EU customers, enable [Stripe Tax](https://docs.stripe.com/billing/taxes/collect-taxes) and complete a registration **before** turning on `automatic_tax` (not enabled in this integration). Without a registration Stripe calculates $0 tax and does not error.

## Live verification checklist (Luke)

Do this in **Stripe test mode** first, signed in as a non-admin Free user.

### 0. Env / deploy

- [ ] `STRIPE_SECRET_KEY` is a **test** restricted key (or `sk_test_`) on the same Stripe account as the price IDs
- [ ] `STRIPE_CLUB_PRICE_ID` and `STRIPE_PREMIUM_PRICE_ID` are set (`billingHealth` both `true`)
- [ ] `STRIPE_WEBHOOK_SECRET` matches the **test** endpoint above
- [ ] `firebase deploy --only functions,firestore:rules` has been run from this branch
- [ ] Customer portal is enabled in the Stripe Dashboard
- [ ] You are **not** signed in as the hardcoded admin UID (admin bypasses the paywall)

### 1. Soft paywall (Free)

- [ ] Free user can browse and play up to 20 tracks today
- [ ] Dock / Club show the remaining-plays chip
- [ ] Play 21 → toast “Free limit reached” and the plans sheet opens (“Pick your level”)
- [ ] **Continue on Free** / × closes the sheet; playback stays stopped until Club or tomorrow
- [ ] Club / Premium CTAs say `$0.99/mo` and `$10/yr`

### 2. Club checkout

- [ ] **Join Club** redirects to Stripe Checkout (not a blank page / `failed-precondition`)
- [ ] Pay with test card `4242…`
- [ ] Return URL includes `billing=success` and `session_id=cs_…`
- [ ] App toasts **Club unlocked** (not a false unlock while still Free)
- [ ] Firestore `users/{uid}` has `plan: club`, `subscriptionStatus: active`, `stripeCustomerId`, `stripeSubscriptionId`
- [ ] Unlimited plays (meter gone); membership card badge reads Club
- [ ] Stripe Dashboard → webhook `checkout.session.completed` is 2xx

### 3. Premium + Club Credit

- [ ] From Club (or Free), **Go Premium** → Checkout $10/yr
- [ ] After return, `plan: premium`, `clubCreditBalance: 12`, `clubCreditExpiresAt` ~1 year out
- [ ] Spend credit on a Club Copy from liner notes → balance drops and stays dropped after a page refresh
- [ ] Changing a card / toggling cancel-at-period-end in the portal must **not** reset credit to $12

### 4. Cancel / expire / dunning

- [ ] **Manage billing in Stripe** opens the Customer Portal
- [ ] Cancel subscription → after Stripe sends `customer.subscription.deleted` (or status `canceled`), profile returns to Free + 20 plays/day; credit is cleared
- [ ] (Optional) Fail a renewal with `4000 0000 0000 0341` → `past_due` still has full streaming until Stripe marks `unpaid` / `canceled`

### 5. Race / refresh

- [ ] If webhook is slow, return from Checkout still unlocks (via `confirmCheckoutSession`)
- [ ] If it does not, **I’ve paid — refresh** updates the profile and closes the sheet

## Still blocked without secrets / Luke’s Stripe account

These cannot be verified in this repo/CI:

- Real Checkout redirect, Payment Element methods, and 3DS
- Webhook signature + delivery (needs `STRIPE_WEBHOOK_SECRET` + deployed `stripeWebhook`)
- Price IDs matching the live/test catalog
- Customer Portal configuration
- Tax registrations / `automatic_tax`
- Production (`rk_live_` / `sk_live_`) vs test keys
- Whether Functions secrets are already set on `crate-app-58494`

A claimable Stripe sandbox used during earlier agent setup may have expired — recreate products with `scripts/stripe-provision-products.js` on Luke’s account if price IDs 404.
