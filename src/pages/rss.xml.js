// ============================================================
// /rss.xml — the site's RSS feed.
//
// This is the backbone of social media automation: services
// like Buffer, Zapier, IFTTT, and dlvr.it watch this feed and
// auto-post every new article to Facebook / X / Pinterest /
// Telegram etc. — no per-platform API keys needed on our side.
// ============================================================
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../site.config';

export async function GET(context) {
  const articles = (await getCollection('articles', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site,
    items: articles.map((a) => ({
      title: a.data.title,
      description: a.data.description,
      pubDate: a.data.pubDate,
      link: `/guides/${a.id}`,
      categories: [a.data.category],
    })),
    customData: '<language>en</language>',
  });
}
