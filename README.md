# Japan Import Hub

Affiliate content site for **Play-Asia** (import games) and **CDJapan** (J-pop & Japanese music).
Built with [Astro](https://astro.build) — static, fast, SEO-first, free to host.

## Quick start

```bash
npm install
npm run dev        # local preview at http://localhost:4321
npm run build      # production build → dist/
```

## Before going live — checklist

1. **Apply to both affiliate programs**
   - Play-Asia: https://www.playasia.com/affiliates (or via an affiliate network)
   - CDJapan: https://www.cdjapan.co.jp/aff/affiliate_info.html (needs a CDJapan customer account; approval ~2 business days)
2. **Add your affiliate IDs** in `src/site.config.ts` (replace the `REPLACE_*` placeholders).
   ⚠️ For CDJapan, copy the exact link format from your affiliate dashboard into `cdJapanLink()` — the redirect token is unique per affiliate.
3. **Set your domain** in `astro.config.mjs` (`site:` field) so the sitemap and canonical URLs are correct.
4. **Deploy** (free tiers are enough):
   - Push this folder to a GitHub repository
   - Connect the repo to [Vercel](https://vercel.com) or [Cloudflare Pages](https://pages.cloudflare.com) — both auto-detect Astro
   - Every push to `main` redeploys automatically → site online 24/7

## The 24-hour content engine

`scripts/generate-article.mjs` + `.github/workflows/daily-article.yml` give you a daily
AI-drafted article **with a human review gate**:

- Every day at 05:00 Bangkok time, GitHub Actions runs the generator
- Claude drafts one article from the topic pool (marked `draft: true` — never auto-published)
- A pull request is opened; you review on your phone, flip `draft: false`, merge → live

Setup: add `ANTHROPIC_API_KEY` in the GitHub repo → Settings → Secrets → Actions.

To extend the pipeline, add topics to `TOPIC_POOL` in `scripts/generate-article.mjs`.

## Content rules (important for account safety)

- No scraping Play-Asia/CDJapan product data — both programs provide **links/banners only**, no public product API
- No price claims that go stale; keep articles evergreen
- Affiliate links must keep `rel="nofollow sponsored"` (already handled in components)
- Affiliate disclosure page + per-article disclosure are built in — keep them

## Structure

```
src/
  site.config.ts        ← site name + AFFILIATE IDS (edit here)
  content/articles/     ← markdown articles (frontmatter-driven)
  pages/                ← home, /games, /music, /guides/[slug], about, disclosure
  components/           ← AffiliateCta, ArticleCard
  layouts/Base.astro    ← SEO meta, OG tags, header/footer
scripts/
  generate-article.mjs  ← daily Claude article generator
.github/workflows/
  daily-article.yml     ← daily cron → draft PR
```
