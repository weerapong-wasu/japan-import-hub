import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['games', 'music', 'figures']),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroEmoji: z.string().default('🎌'),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles };
