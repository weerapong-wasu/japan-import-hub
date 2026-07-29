// ============================================================
// ENV HELPER — one place to read server-side configuration.
// Every getter returns null when the key is not set, so the
// site keeps working (with features disabled) before you
// finish the Stripe/Supabase setup. No crashes, no surprises.
// ============================================================

function read(name: string): string | null {
  const v = import.meta.env[name] ?? process.env[name];
  return v && String(v).trim() !== '' ? String(v).trim() : null;
}

export const ENV = {
  get stripeSecretKey() { return read('STRIPE_SECRET_KEY'); },
  get stripeWebhookSecret() { return read('STRIPE_WEBHOOK_SECRET'); },
  get stripeToolkitPriceId() { return read('STRIPE_TOOLKIT_PRICE_ID'); },
  get supabaseUrl() { return read('SUPABASE_URL'); },
  get supabaseServiceRoleKey() { return read('SUPABASE_SERVICE_ROLE_KEY'); },
  get siteUrl() { return read('PUBLIC_SITE_URL') ?? 'http://localhost:4321'; },
};

export const isStripeConfigured = () =>
  Boolean(ENV.stripeSecretKey && ENV.stripeToolkitPriceId);

export const isSupabaseConfigured = () =>
  Boolean(ENV.supabaseUrl && ENV.supabaseServiceRoleKey);
