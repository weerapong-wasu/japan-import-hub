// ============================================================
// POST /api/subscribe  { email }
// Saves a newsletter subscriber to Supabase.
// ============================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { getSupabase } from '../../lib/supabase';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const POST: APIRoute = async ({ request }) => {
  let email = '';
  try {
    const body = await request.json();
    email = String(body?.email ?? '').trim().toLowerCase();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ error: 'Please enter a valid email address.' }, 400);
  }

  const supabase = getSupabase();
  if (!supabase) {
    return json({ error: 'Newsletter is not configured yet — check back soon!' }, 503);
  }

  const { error } = await supabase
    .from('subscribers')
    .upsert({ email, source: 'site' }, { onConflict: 'email', ignoreDuplicates: true });

  if (error) {
    console.error('subscribe failed:', error);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }

  return json({ ok: true, message: "You're in! Watch your inbox for import deals." });
};
