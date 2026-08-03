#!/usr/bin/env node
/**
 * EVERGREEN ARTICLE ENGINE — generates 1–3 evergreen posts per run.
 *
 * Niche: EVERGREEN PRODUCT content for Japan Import Hub — immortal
 * franchises + timeless how-to collector guides. Never news, never
 * trends, never prices.
 *
 * Env:
 *   ANTHROPIC_API_KEY   required
 *   ARTICLES_PER_RUN    default 3   (1–3 recommended)
 *   AUTO_PUBLISH        default "true" → articles go LIVE (draft: false).
 *                       Set "false" to generate drafts for manual review.
 *   CLAUDE_MODEL        optional override; otherwise auto-discovers the
 *                       newest available Sonnet model from the API.
 *
 * Robustness: emits GitHub Actions ::error:: annotations so failures
 * are self-explanatory in the Actions log.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ARTICLES_DIR = path.resolve('src/content/articles');
const API_KEY = process.env.ANTHROPIC_API_KEY;
const PER_RUN = Math.min(3, Math.max(1, Number(process.env.ARTICLES_PER_RUN) || 3));
const AUTO_PUBLISH = (process.env.AUTO_PUBLISH ?? 'true').toLowerCase() !== 'false';

const fail = (msg) => { console.error(`::error::${msg}`); process.exit(1); };

if (!API_KEY) {
  fail(
    'ANTHROPIC_API_KEY secret is missing. Add it: repo → Settings → Secrets and variables → Actions → New repository secret → Name: ANTHROPIC_API_KEY, Value: your key from console.anthropic.com',
  );
}

const HEADERS = {
  'content-type': 'application/json',
  'x-api-key': API_KEY,
  'anthropic-version': '2023-06-01',
};

// ---------------------------------------------------------------
// Model auto-discovery: never break when model names rotate.
// ---------------------------------------------------------------
async function resolveModel() {
  if (process.env.CLAUDE_MODEL) return process.env.CLAUDE_MODEL;
  try {
    const res = await fetch('https://api.anthropic.com/v1/models?limit=100', { headers: HEADERS });
    if (res.ok) {
      const { data } = await res.json();
      const sonnets = (data ?? [])
        .filter((m) => m.id.includes('sonnet'))
        .sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0));
      if (sonnets[0]) {
        console.log(`Model auto-discovered: ${sonnets[0].id}`);
        return sonnets[0].id;
      }
      if (data?.[0]) return data[0].id;
    } else {
      console.warn(`Model listing returned ${res.status}; falling back to candidates.`);
    }
  } catch (e) {
    console.warn(`Model listing failed (${e.message}); falling back to candidates.`);
  }
  return null; // signal: use candidate loop
}

const MODEL_CANDIDATES = [
  'claude-sonnet-4-5',
  'claude-sonnet-4-5-20250929',
  'claude-sonnet-4-20250514',
  'claude-3-7-sonnet-latest',
  'claude-3-5-sonnet-latest',
];

async function callClaude(model, prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ model, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }),
  });
  return res;
}

async function generateWithFallback(prompt) {
  const discovered = await resolveModel();
  const tryList = discovered ? [discovered, ...MODEL_CANDIDATES] : MODEL_CANDIDATES;
  let lastErr = '';
  for (const model of tryList) {
    const res = await callClaude(model, prompt);
    if (res.ok) {
      const data = await res.json();
      return { text: data.content?.[0]?.text ?? '', model };
    }
    const body = await res.text();
    lastErr = `${model} → ${res.status}: ${body.slice(0, 200)}`;
    // model-not-found → try next candidate; other errors → abort loudly
    if (res.status !== 404 && !body.includes('not_found')) {
      fail(`Claude API error (not a model-name issue): ${lastErr}`);
    }
    console.warn(`Model unavailable, trying next: ${lastErr}`);
  }
  fail(`All model candidates failed. Last error: ${lastErr}`);
}

// ---------------------------------------------------------------
// Topic pool — EVERGREEN ONLY. Franchise + timeless how-to angles.
// Script skips slugs that already exist, so it works down this list.
// ---------------------------------------------------------------
const TOPIC_POOL = [
  // --- Core: Games / Retro ---
  { slug: 'importing-retro-games-guide', category: 'games', topic: 'A practical guide to importing retro Japanese games (Famicom to PS2 era)' },
  { slug: 'asia-english-versions-hidden-gem', category: 'games', topic: 'Why Asia-region English versions of Japanese games are the importer\'s hidden gem' },
  // --- Core: Figures / Merch ---
  { slug: 'nendoroid-collecting-starter-guide', category: 'figures', topic: 'Nendoroid collecting for beginners: pre-orders, storage and display' },
  { slug: 'scale-figures-explained', category: 'figures', topic: 'Scale figures explained: 1/7 vs 1/8, prize figures, and what the scales mean' },
  { slug: 'japanese-game-preorder-calendar-habits', category: 'games', topic: 'How to build a pre-order routine for Japanese game releases' },
  { slug: 'figure-preorder-timing-guide', category: 'figures', topic: 'The anime figure pre-order cycle: when to order and why waiting costs more' },
  { slug: 'retro-handhelds-import-guide', category: 'games', topic: 'Importing Japanese handhelds: Game Boy to PSP, what collectors should know' },
  { slug: 'displaying-protecting-figure-collection', category: 'figures', topic: 'Displaying and protecting an anime figure collection: UV, dust and shelf setups' },
  { slug: 'visual-novels-import-guide', category: 'games', topic: 'Importing visual novels from Japan: language barriers and where to start' },
  { slug: 'rhythm-games-import-guide', category: 'games', topic: 'Why rhythm games are the perfect first Japanese import' },
  // --- Secondary: Music (CDJapan) ---
  { slug: 'anime-soundtracks-collecting-guide', category: 'music', topic: 'Collecting anime soundtracks on CD and vinyl: a starter guide' },
  { slug: 'shipping-options-from-japan-compared', category: 'music', topic: 'Shipping methods from Japan compared: what collectors should choose' },
  { slug: 'concert-blurays-from-japan', category: 'music', topic: 'Buying Japanese concert Blu-rays: editions, region codes, and bonuses' },
  { slug: 'idol-cd-types-explained', category: 'music', topic: 'Idol CD Types (A/B/C) explained for international fans' },
  { slug: 'jpop-photobooks-and-packaging', category: 'music', topic: 'Why Japanese CD packaging and photobooks are worth collecting' },
  // --- MANGA EVERGREEN FRANCHISE LAYER ---
  { slug: 'one-piece-figure-collecting-guide', category: 'figures', topic: 'One Piece figure collecting: P.O.P, Figuarts ZERO, Ichiban Kuji and how to import them from Japan' },
  { slug: 'naruto-figure-collecting-guide', category: 'figures', topic: 'Naruto figure collecting: the import guide for a global generation of fans' },
  { slug: 'saint-seiya-myth-cloth-guide', category: 'figures', topic: 'Saint Seiya Myth Cloth collecting: why the die-cast armor line is a lifelong hobby, and how to import it' },
  { slug: 'evangelion-collecting-guide', category: 'figures', topic: 'Evangelion collecting: figures, model kits and why the franchise never fades' },
  { slug: 'sailor-moon-collecting-guide', category: 'figures', topic: 'Sailor Moon collecting: Figuarts, Proplica and importing the icons of magical girl history' },
  { slug: 'jojo-bizarre-adventure-collecting', category: 'figures', topic: 'JoJo\'s Bizarre Adventure collecting: statues, figures and manga editions worth importing' },
  { slug: 'demon-slayer-figure-guide', category: 'figures', topic: 'Demon Slayer figure collecting: navigating one of the biggest prize-figure lineups ever made' },
  { slug: 'berserk-manga-collecting-guide', category: 'figures', topic: 'Berserk collecting: deluxe manga editions, statues, and importing the dark fantasy masterpiece' },
  { slug: 'doraemon-collecting-guide', category: 'figures', topic: 'Doraemon collecting: Japan\'s national icon and the merchandise generations grew up with' },
  { slug: 'dragon-quest-slime-merch-guide', category: 'games', topic: 'Dragon Quest collecting: why Japan\'s beloved RPG has the most charming merchandise in gaming' },
  { slug: 'kinnikuman-figures-guide', category: 'figures', topic: 'Kinnikuman collecting: from keshi rubber figures to modern re-releases' },
  { slug: 'initial-d-collecting-guide', category: 'music', topic: 'Initial D collecting: manga, Eurobeat soundtracks and why the franchise keeps drifting on' },
  { slug: 'macross-collecting-guide', category: 'figures', topic: 'Macross collecting: transforming Valkyries and importing the mecha line that started it all' },
  { slug: 'hokuto-no-ken-collecting', category: 'figures', topic: 'Fist of the North Star collecting: manga editions and figures of a legend' },
  { slug: 'yugioh-japanese-cards-guide', category: 'games', topic: 'Importing Japanese Yu-Gi-Oh cards and merchandise: what collectors should know' },
  { slug: 'pokemon-japanese-exclusives-guide', category: 'games', topic: 'Japanese Pokemon exclusives: Pokemon Center items and why collectors import from Japan' },
  { slug: 'ghibli-merchandise-import-guide', category: 'figures', topic: 'Studio Ghibli merchandise: importing Totoro, Kiki and the timeless catalog from Japan' },
  { slug: 'gundam-manga-anime-media-guide', category: 'music', topic: 'Gundam beyond Gunpla: soundtracks, Blu-ray boxes and media worth importing' },
  { slug: 'detective-conan-collecting-guide', category: 'figures', topic: 'Detective Conan collecting: three decades of mystery merchandise from Japan' },
  { slug: 'sakura-cardcaptor-collecting-guide', category: 'figures', topic: 'Cardcaptor Sakura collecting: Clow Cards, figures and magical girl history' },
];

// ---------------------------------------------------------------
// Main loop — generate up to PER_RUN articles.
// ---------------------------------------------------------------
const existing = new Set((await readdir(ARTICLES_DIR)).map((f) => f.replace(/\.md$/, '')));
const queue = TOPIC_POOL.filter((t) => !existing.has(t.slug)).slice(0, PER_RUN);

if (queue.length === 0) {
  console.log('Topic pool exhausted — add new evergreen topics to TOPIC_POOL. Exiting successfully.');
  process.exit(0);
}

const sampleFile = (await readdir(ARTICLES_DIR)).find((f) => f.endsWith('.md'));
const sample = sampleFile ? await readFile(path.join(ARTICLES_DIR, sampleFile), 'utf8') : '';
const today = new Date().toISOString().slice(0, 10);

let written = 0;
for (const next of queue) {
  console.log(`\n=== Generating ${written + 1}/${queue.length}: ${next.slug} (${next.category}) ===`);

  const prompt = `You write for "Japan Import Hub", an affiliate content site helping a global English-speaking audience import Japanese video games, music (J-pop CDs, vinyl, Blu-rays) and anime figures/merchandise. Partner stores are Play-Asia (games, figures) and CDJapan (music).

OUR NICHE IS EVERGREEN PRODUCT CONTENT: immortal franchises and timeless collector knowledge. The article must read identically well in 5 years.

Write ONE complete article in Markdown with YAML frontmatter, on this topic:
"${next.topic}"

Rules:
- Frontmatter fields exactly: title, description (140-160 chars), category: ${next.category}, pubDate: ${today}, heroEmoji (one emoji), draft: ${AUTO_PUBLISH ? 'false' : 'true'}
- 700-1100 words. Practical, specific, EVERGREEN. NO specific prices, NO current stock claims, NO fabricated statistics, NO references to "this year" / recent events.
- Friendly expert tone, "anyone can do it" spirit. Use tables where genuinely useful.
- Naturally link to our free tool once: [Landed Cost Calculator](/calculator), and where relevant to /guides/spotting-bootleg-anime-figures.
- Do NOT include raw affiliate URLs — the site template injects store CTAs automatically.
- Output ONLY the markdown file content, nothing else.

Style reference (match structure and voice):
---8<---
${sample.slice(0, 3000)}
---8<---`;

  const { text: raw, model } = await generateWithFallback(prompt);
  let text = raw.replace(/^```(?:markdown|md)?\n/, '').replace(/\n```\s*$/, '').trim() + '\n';

  if (!text.startsWith('---')) {
    console.error(`::warning::${next.slug}: generated content missing frontmatter — skipped to protect the site.`);
    continue;
  }

  const outPath = path.join(ARTICLES_DIR, `${next.slug}.md`);
  await writeFile(outPath, text, 'utf8');
  written++;
  console.log(`✅ Written (${model}): ${outPath} — ${AUTO_PUBLISH ? 'LIVE on next deploy' : 'DRAFT (set draft: false to publish)'}`);
}

if (written === 0) fail('No articles were successfully generated this run.');
console.log(`\nDone: ${written} article(s) generated.`);
