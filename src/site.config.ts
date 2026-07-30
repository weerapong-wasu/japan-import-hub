// ============================================================
// SITE CONFIG — edit this file only, everything else picks it up
// ============================================================

export const SITE = {
  name: 'Japan Import Hub',
  tagline: 'Import games & Japanese music, made easy for everyone',
  description:
    'Guides, reviews and buying tips for importing Japanese video games, J-pop CDs, vinyl and Blu-rays from Play-Asia and CDJapan. No Japanese needed.',
  author: 'Japan Import Hub',
  locale: 'en',
};

// ------------------------------------------------------------
// AFFILIATE IDS — LIVE (approved 2026-07-30)
// ------------------------------------------------------------
export const AFFILIATE = {
  // Play-Asia affiliate program — confirmed link format from dashboard:
  // https://www.play-asia.com/?affiliate_id=XXXXXXX
  playAsiaTag: '6032549',

  // CDJapan affiliate program — approved (Affiliate ID: A664570).
  // TEMP: using a query-param fallback until we confirm the exact
  // tracking link format from the CDJapan dashboard's link-creation
  // tool (Affiliate Top → likely under "Campaign Participation" or a
  // "Banner/Text Link" page) — a URL #fragment (the old code) is NEVER
  // sent to the server, so it would have tracked zero commission.
  cdJapanId: 'A664570',
};

/** Build a Play-Asia link with the affiliate tag attached. */
export function playAsiaLink(path: string): string {
  // NOTE: real domain has a hyphen — playasia.com (no hyphen) is a
  // different domain and would have silently dropped the affiliate tag.
  const base = path.startsWith('http') ? path : `https://www.play-asia.com${path}`;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}affiliate_id=${AFFILIATE.playAsiaTag}`;
}

/** Build a CDJapan search/category link through the affiliate redirect. */
export function cdJapanLink(path: string): string {
  const target = path.startsWith('http') ? path : `https://www.cdjapan.co.jp${path}`;
  const sep = target.includes('?') ? '&' : '?';
  // TEMP best-guess query param — swap for the exact format from the
  // CDJapan affiliate dashboard's link generator once confirmed.
  return `${target}${sep}aff_id=${AFFILIATE.cdJapanId}`;
}

// ------------------------------------------------------------
// DIGITAL PRODUCT — Income stream #2 (Stripe)
// Price is controlled in Stripe (STRIPE_TOOLKIT_PRICE_ID);
// this block is only for display copy on the /toolkit page.
// ------------------------------------------------------------
export const PRODUCT = {
  name: 'Japan Import Master Toolkit',
  displayPrice: '$9.99',
  tagline: 'Everything you need to import from Japan with zero mistakes',
  includes: [
    'Japan Import Master Guide (17-chapter PDF) — shops, shipping, customs, payments',
    'Pre-Purchase Checklist (printable PDF) — never get burned by bootlegs or region locks',
    'Import Price & Order Tracker (spreadsheet) — landed-cost calculator built in',
    'Shop Comparison Cheat Sheet — CDJapan vs Play-Asia vs proxies, when to use which',
    'Free lifetime updates',
  ],
};
