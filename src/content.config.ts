import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    pubDate: z.coerce.date(),
    category: z.enum(['Engineering', 'Music']),
    readTime: z.number().int().positive(),
    artwork: z.enum(['voice', 'music', 'eligibility']).optional(),
    order: z.number().int().nonnegative(),
  }),
});
export const collections = { blog };
