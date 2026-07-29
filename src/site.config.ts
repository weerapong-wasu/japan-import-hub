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
// AFFILIATE IDS — replace placeholders after your applications
// are approved. Links will not earn commission until you do.
// ------------------------------------------------------------
export const AFFILIATE = {
  // Play-Asia: after approval you get a tag like "?tagid=XXXXXX"
  // appended to product/category URLs.
  playAsiaTag: 'REPLACE_PLAYASIA_TAG',

  // CDJapan: after approval, generate links in the CDJapan
  // affiliate dashboard. They look like:
  // https://www.cdjapan.co.jp/aff/click.cgi/<PROGRAM>/<YOUR_ID>/<TARGET>
  cdJapanId: 'REPLACE_CDJAPAN_ID',
};

/** Build a Play-Asia link with the affiliate tag attached. */
export function playAsiaLink(path: string): string {
  const base = path.startsWith('http') ? path : `https://www.playasia.com${path}`;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}tagid=${AFFILIATE.playAsiaTag}`;
}

/** Build a CDJapan search/category link through the affiliate redirect. */
export function cdJapanLink(path: string): string {
  const target = path.startsWith('http') ? path : `https://www.cdjapan.co.jp${path}`;
  // NOTE: replace this pattern with the exact link format from your
  // CDJapan affiliate dashboard once approved — the program token
  // portion is unique per affiliate.
  return target + `#aff=${AFFILIATE.cdJapanId}`;
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
