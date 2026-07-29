// ============================================================
// POST /api/checkout
// Creates a Stripe Checkout Session for the Import Toolkit and
// returns { url } to redirect the buyer to Stripe's hosted page.
// No card data ever touches our server (PCI handled by Stripe).
// ============================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { getStripe } from '../../lib/stripe';
import { ENV, isStripeConfigured } from '../../lib/env';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async () => {
  if (!isStripeConfigured()) {
    return json(
      { error: 'Payments are not configured yet. Please check back soon!' },
      503,
    );
  }

  const stripe = getStripe()!;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: ENV.stripeToolkitPriceId!, quantity: 1 }],
      success_url: `${ENV.siteUrl}/toolkit/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${ENV.siteUrl}/toolkit?cancelled=1`,
      // Lets us email the download link later + record the order
      customer_creation: 'if_required',
      allow_promotion_codes: true,
    });

    return json({ url: session.url });
  } catch (err) {
    console.error('checkout error:', err);
    return json({ error: 'Could not start checkout. Please try again.' }, 500);
  }
};
