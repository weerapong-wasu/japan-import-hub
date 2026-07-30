#!/usr/bin/env node
/**
 * Daily article generator — the "24-hour engine".
 *
 * Uses the Claude API to draft one new evergreen article per run,
 * picking a topic that does not already exist in src/content/articles.
 *
 * Requires:  ANTHROPIC_API_KEY  environment variable.
 *
 * Usage:     npm run generate:article
 *
 * The article is written as a DRAFT (draft: true) so it never publishes
 * without human review — flip `draft: false` in the frontmatter to publish.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ARTICLES_DIR = path.resolve('src/content/articles');
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5';

if (!API_KEY) {
  console.error('ERROR: set ANTHROPIC_API_KEY before running.');
  process.exit(1);
}

// ---------------------------------------------------------------
// Topic pool — add/remove freely. The script skips topics whose
// slug already exists, so it works through this list day by day.
// ---------------------------------------------------------------
// Ordered by priority: Games/Retro and Figures lead (core niches),
// Music follows (secondary niche via CDJapan).
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
  // Immortal franchises with multi-generation global fanbases. Each article
  // = collector/import guide angle (NEVER news, NEVER "upcoming releases").
  // High search volume + buyer intent + zero expiry date.
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

const existing = new Set(
  (await readdir(ARTICLES_DIR)).map((f) => f.replace(/\.md$/, ''))
);
const next = TOPIC_POOL.find((t) => !existing.has(t.slug));

if (!next) {
  console.log('Topic pool exhausted — add new topics to TOPIC_POOL in scripts/generate-article.mjs');
  process.exit(0);
}

console.log(`Generating: ${next.slug} (${next.category})`);

// Give the model one existing article as a style reference
const sampleFile = (await readdir(ARTICLES_DIR)).find((f) => f.endsWith('.md'));
const sample = sampleFile ? await readFile(path.join(ARTICLES_DIR, sampleFile), 'utf8') : '';

const today = new Date().toISOString().slice(0, 10);

const prompt = `You write for "Japan Import Hub", an affiliate content site helping a global English-speaking audience import Japanese video games, music (J-pop CDs, vinyl, Blu-rays) and anime figures/merchandise. Partner stores are Play-Asia (games, figures) and CDJapan (music).

Write ONE complete article in Markdown with YAML frontmatter, on this topic:
"${next.topic}"

Rules:
- Frontmatter fields exactly: title, description (140-160 chars), category: ${next.category}, pubDate: ${today}, heroEmoji (one emoji), draft: true
- 700-1100 words. Practical, specific, evergreen. NO specific prices, NO current stock claims, NO fabricated statistics.
- Friendly expert tone, "anyone can do this" spirit. Use tables where genuinely useful.
- Do NOT include raw affiliate URLs — the site template injects store CTAs automatically.
- Output ONLY the markdown file content, nothing else.

Style reference (match structure and voice):
---8<---
${sample.slice(0, 3000)}
---8<---`;

const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-api-key': API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: MODEL,
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  }),
});

if (!res.ok) {
  console.error(`Claude API error ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const data = await res.json();
let text = data.content?.[0]?.text ?? '';
// strip accidental code fences
text = text.replace(/^```(?:markdown|md)?\n/, '').replace(/\n```\s*$/, '').trim() + '\n';

if (!text.startsWith('---')) {
  console.error('Generated content missing frontmatter — aborting to protect the site.');
  process.exit(1);
}

const outPath = path.join(ARTICLES_DIR, `${next.slug}.md`);
await writeFile(outPath, text, 'utf8');
console.log(`✅ Draft written: ${outPath}`);
console.log('Review it, set draft: false, commit, and it goes live on next deploy.');
