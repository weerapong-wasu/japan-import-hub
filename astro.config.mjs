import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// Live production URL — canonical tags, OG tags and sitemap.xml all read
// from this. Swap to a custom domain later (e.g. https://japanimporthub.com)
// the moment one is connected in Vercel; nothing else needs to change.
export default defineConfig({
  site: 'https://japan-import-hub.vercel.app',
  // Static by default — every content page stays pre-rendered (fast + SEO).
  // Only routes that opt out with `export const prerender = false`
  // (our /api/* endpoints and the download page) run on the server.
  output: 'static',
  adapter: vercel(),
  integrations: [sitemap({ filter: (page) => !page.includes('/api/') })],
  trailingSlash: 'never',
  build: {
    format: 'file'
  }
});
