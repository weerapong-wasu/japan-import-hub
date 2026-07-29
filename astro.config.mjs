import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// TODO: change to your real domain after deploy (e.g. https://japanimporthub.com)
export default defineConfig({
  site: 'https://example.com',
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
