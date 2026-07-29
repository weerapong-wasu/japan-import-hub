// ============================================================
// STRIPE SERVER CLIENT — server use ONLY.
// ============================================================
import Stripe from 'stripe';
import { ENV } from './env';

let client: Stripe | null = null;

/** Returns a singleton Stripe client, or null when not configured. */
export function getStripe(): Stripe | null {
  if (!ENV.stripeSecretKey) return null;
  if (!client) {
    client = new Stripe(ENV.stripeSecretKey);
  }
  return client;
}
