#!/usr/bin/env node
/**
 * Create Planet MP3 Club + Premium products/prices on the current Stripe account.
 * Usage: STRIPE_API_KEY=sk_or_rk_... node scripts/stripe-provision-products.js
 */
const Stripe = require("../functions/node_modules/stripe");

async function main() {
  const key = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("Set STRIPE_API_KEY first");
    process.exit(1);
  }
  const stripe = new Stripe(key, { apiVersion: "2026-07-29.dahlia" });

  const clubProduct = await stripe.products.create({
    name: "Planet MP3 Club",
    description: "Full streaming plus membership card access",
    metadata: { plan: "club" },
  });
  const clubPrice = await stripe.prices.create({
    product: clubProduct.id,
    currency: "usd",
    unit_amount: 99,
    recurring: { interval: "month" },
    metadata: { plan: "club" },
  });

  const premiumProduct = await stripe.products.create({
    name: "Planet MP3 Premium",
    description: "Annual Club Credit for physical purchases ($12 credit)",
    metadata: { plan: "premium" },
  });
  const premiumPrice = await stripe.prices.create({
    product: premiumProduct.id,
    currency: "usd",
    unit_amount: 1000,
    recurring: { interval: "year" },
    metadata: { plan: "premium", credit_grant: "12" },
  });

  console.log(
    JSON.stringify(
      {
        STRIPE_CLUB_PRODUCT_ID: clubProduct.id,
        STRIPE_CLUB_PRICE_ID: clubPrice.id,
        STRIPE_PREMIUM_PRODUCT_ID: premiumProduct.id,
        STRIPE_PREMIUM_PRICE_ID: premiumPrice.id,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
