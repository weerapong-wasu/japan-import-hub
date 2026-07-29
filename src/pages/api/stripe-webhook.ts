// ============================================================
// POST /api/stripe-webhook
// Stripe calls this after a successful payment.
// 1. Verifies the signature (so nobody can fake an order)
// 2. Records the order in Supabase
// Setup: Stripe Dashboard → Developers → Webhooks → Add endpoint
//   URL   : https://YOUR-DOMAIN/api/stripe-webhook
//   Event : checkout.session.completed
// ============================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { getStripe } from '../../lib/stripe';
import { getSupabase } from '../../lib/supabase';
import { ENV } from '../../lib/env';

export const POST: APIRoute = async ({ request }) => {
  const stripe = getStripe();
  if (!stripe || !ENV.stripeWebhookSecret) {
    return new Response('Webhook not configured', { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) return new Response('Missing signature', { status: 400 });

  let event;
  try {
    const payload = await request.text(); // raw body required for verification
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      ENV.stripeWebhookSecret,
    );
  } catch (err) {
    console.error('webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      id: string;
      payment_intent: string | null;
      customer_details?: { email?: string | null } | null;
      amount_total: number | null;
      currency: string | null;
      payment_status: string;
    };

    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('orders').upsert(
        {
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent ?? null,
          product: 'toolkit',
          email: session.customer_details?.email ?? null,
          amount_total: session.amount_total,
          currency: session.currency,
          status: session.payment_status === 'paid' ? 'paid' : session.payment_status,
        },
        { onConflict: 'stripe_session_id' },
      );
      if (error) console.error('order insert failed:', error);
    } else {
      // Supabase not set up yet — payment still succeeded on Stripe's side,
      // buyer still gets the download via session verification. Just log it.
      console.warn('order received but Supabase not configured:', session.id);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
