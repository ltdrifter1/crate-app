# Stripe + Firebase billing (Planet MP3)

## What this wires

| Plan | Stripe | Firestore |
|---|---|---|
| **Free** | — | `plan: free`, limited streaming |
| **Club** `$0.99/mo` | Subscription Checkout | `plan: club`, `subscriptionStatus: active` |
| **Premium** `$10/yr` | Subscription Checkout | `plan: premium` + **$12 Club Credit** (12 months) |

Flow:

1. App calls Cloud Function `createCheckoutSession({ plan })`
2. Stripe Checkout (subscription mode)
3. Webhook `stripeWebhook` updates `users/{uid}`
4. App refreshes profile on `?billing=success`

### Also deployed with billing functions

| Callable | Purpose |
|---|---|
| `recordListeningEvent` | Trusted free-play meter + `tracks.playCount` + `recentTracks` |
| `spendClubCredit` | Spend Premium Club Credit → file Club Copy into `collection` |

Deploy rules so clients cannot write `playsToday` / `playCount` directly:

```bash
firebase deploy --only firestore:rules,functions
```

## Deploy (Firebase)

Requires **Blaze** plan on project `crate-app-58494`.

```bash
# From repo root
cd functions && npm install && cd ..

# Set secrets (Secret Manager)
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET

# Set price IDs (params)
firebase functions:config:set unused=1  # optional legacy
# Prefer params at deploy:
firebase deploy --only functions \
  --force
```

Or with `.env` for emulator / params file `functions/.env`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CLUB_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...
```

For Firebase Functions v2 params, set:

```bash
firebase functions:params:set STRIPE_CLUB_PRICE_ID=price_xxx
firebase functions:params:set STRIPE_PREMIUM_PRICE_ID=price_yyy
```

Then:

```bash
firebase deploy --only functions,firestore:rules
```

## Stripe webhook

1. Dashboard → Developers → Webhooks → Add endpoint  
   URL: `https://us-central1-crate-app-58494.cloudfunctions.net/stripeWebhook`  
   (region may vary — check deploy output)
2. Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
3. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

Local forward:

```bash
stripe listen --forward-to http://127.0.0.1:5001/crate-app-58494/us-central1/stripeWebhook
```

## Provision products

```bash
export STRIPE_API_KEY=rk_or_sk_test_...
node scripts/stripe-provision-products.js
```

Creates **Planet MP3 Club** ($0.99/mo) and **Planet MP3 Premium** ($10/yr).

## Customer portal

`createPortalSession` opens Stripe Billing Portal. Enable it in Stripe Dashboard → Settings → Billing → Customer portal.

## Tax

If you charge US/EU customers, enable [Stripe Tax](https://docs.stripe.com/billing/taxes/collect-taxes) and register before turning on `automatic_tax` (not enabled by default in this integration).

## Sandbox note

A claimable Stripe sandbox was used during agent setup. Claim it before it expires, or recreate products on your own Stripe account and update the price IDs.
