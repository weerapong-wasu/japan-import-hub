# PROJECT STATUS — Japan Import Hub
> Session handoff note · Updated: 2026-07-31 · For any new Claude/Yaya session: read this first.

## What this is
Affiliate content site + digital product. Astro 5 + Vercel (auto-deploy from this repo's `main`).
Live: **https://japan-import-hub.vercel.app**

## Current state — DONE ✅
- 18 evergreen articles (10 figures / 5 games / 3 music), incl. 8 franchise pillar guides
  (Dragon Ball, Gunpla, Captain Tsubasa, Slam Dunk, One Piece, Naruto, Saint Seiya, Sailor Moon)
- Landed Cost Calculator (/calculator) — live FX via frankfurter.app, offline fallback
- Affiliate LIVE: Play-Asia `affiliate_id=6032549` · CDJapan `aff_id=A664570` (see ⚠️ below)
- SEO: sitemap, robots.txt, RSS (/rss.xml), JSON-LD (Article/Breadcrumb/WebSite/Org), OG image, 404 page
- Legal: /privacy, /terms, /disclosure
- CI/CD: push to main → GitHub Actions → Vercel deploy (secret VERCEL_TOKEN in repo)
- Article engine: `scripts/generate-article.mjs` — 35-topic evergreen pool (16 manga franchises queued),
  workflow `.github/workflows/daily-article.yml` (05:00 Bangkok, drafts PR) — DORMANT until
  `ANTHROPIC_API_KEY` secret is added
- Stripe/Supabase code complete but UNCONFIGURED (graceful degradation active):
  checkout, webhook, secure download, newsletter, magic-link auth + wishlist, schema.sql ready

## Pending — USER ACTIONS ⏳
1. Social launch (see LAUNCH-KIT-SOCIAL.md delivered in chat): Pinterest/FB/X/Reddit + Buffer→RSS
2. Google Search Console: verify (env `PUBLIC_GSC_VERIFICATION`) + submit sitemap
3. GA4: create property → env `PUBLIC_GA_MEASUREMENT_ID` in Vercel → redeploy
4. Hostinger domain: buy .com (domain only, no hosting) → add in Vercel Domains → DNS
   (A @ 76.76.21.21, CNAME www cname.vercel-dns.com) → then update `site:` in astro.config.mjs
   + robots.txt sitemap URL in one commit
5. ⚠️ CDJapan link format UNVERIFIED — `?aff_id=A664570` is a best-guess query param
   (original `#aff=` fragment was broken; fragments never reach servers). Confirm exact format
   from CDJapan affiliate dashboard link-creation tool, then update `cdJapanLink()` in src/site.config.ts
6. `ANTHROPIC_API_KEY` secret in GitHub → activates daily article engine
7. Phase 2 income: Stripe keys + Supabase project per LAUNCH-TONIGHT.md (toolkit.zip product file
   was delivered in chat — upload to Supabase Storage private bucket `products`)
8. 🔒 SECURITY: revoke the GitHub fine-grained PAT + Vercel token that were shared in chat
   (deploy pipeline no longer needs them — CI uses the VERCEL_TOKEN repo secret)

## Strategy lock
Niche: **Manga Evergreen Franchise × Collector Intent** (nostalgia buyers, 30–50, global).
Rules: evergreen only (how-to / vs / collecting guides), NO news/trends/prices-in-content.
Distribution priority: Pinterest + SEO (compounding) > Reddit (short-term) > FB/X (optional).

## Key files
- `src/site.config.ts` — affiliate IDs + link builders + product copy
- `scripts/generate-article.mjs` — topic pool (add topics here)
- `LAUNCH-TONIGHT.md` — Stripe/Supabase/Vercel env setup guide
- `.env.example` — all env vars documented
