// ============================================================
// GET /api/download?session_id=cs_...
// Secure delivery of the Import Toolkit:
// 1. Verifies with Stripe that this Checkout Session is PAID
// 2. Generates a 60-minute signed URL from Supabase Storage
//    (private bucket "products", file "toolkit.zip")
// 3. Redirects the buyer to the file
// Nobody can download without a real paid session id.
// ============================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { getStripe } from '../../lib/stripe';
import { getSupabase } from '../../lib/supabase';

const BUCKET = 'products';
const FILE = 'toolkit.zip';

const fail = (message: string, status = 400) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ url }) => {
  const sessionId = url.searchParams.get('session_id') ?? '';
  if (!sessionId.startsWith('cs_')) return fail('Missing or invalid session id.');

  const stripe = getStripe();
  if (!stripe) return fail('Payments are not configured yet.', 503);

  // 1. Verify payment with Stripe (source of truth)
  let paid = false;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    paid = session.payment_status === 'paid';
  } catch {
    return fail('Purchase not found.', 404);
  }
  if (!paid) return fail('This purchase has not been completed.', 402);

  // 2. Signed URL from private storage
  const supabase = getSupabase();
  if (!supabase) {
    return fail(
      'Download storage is not configured yet. Please contact us with your receipt and we will send the file.',
      503,
    );
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(FILE, 60 * 60, { download: 'japan-import-toolkit.zip' });

  if (error || !data?.signedUrl) {
    console.error('signed url failed:', error);
    return fail('Could not generate download link. Please contact us with your receipt.', 500);
  }

  // 3. Send the buyer straight to the file
  return new Response(null, {
    status: 302,
    headers: { Location: data.signedUrl, 'Cache-Control': 'no-store' },
  });
};
