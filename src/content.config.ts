import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Matches the service list on the homepage. Add a category here before using it in a post. */
export const BLOG_CATEGORIES = ['Closets', 'Cabinetry', 'Media walls', 'Built-ins', 'Woodworking'] as const;

// One Markdown file per post in src/content/blog/. The file name is the URL: custom-vs-premade-cabinets.md → /blog/custom-vs-premade-cabinets
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        /** Card summary and the article's lead paragraph. Also the meta description unless metaDescription is set. */
        description: z.string(),
        publishDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        /** Defaults to the business. Don't invent staff names. */
        author: z.string().default('VBS Closets & Cabinets'),
        category: z.enum(BLOG_CATEGORIES),
        /** Path relative to the Markdown file, e.g. ../../assets/images/blog/photo.jpg */
        featuredImage: image(),
        featuredImageAlt: z.string(),
        /** Shown under the image. Required wording for stock photos: "Photo shows an example style." */
        featuredImageNote: z.string().optional(),
        /** Browser tab / search title. Defaults to "<title> | VBS Closets & Cabinets". */
        seoTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        /** Only for posts first published elsewhere. Defaults to the post's own URL. */
        canonical: z.url().optional(),
        /** Social sharing image. Defaults to a 1200px JPEG of the featured image. */
        ogImage: image().optional(),
        /** Drafts build in `astro dev` only, never in production. */
        draft: z.boolean().default(false),
      })
      .refine((post) => !post.updatedDate || post.updatedDate >= post.publishDate, {
        message: 'updatedDate must be on or after publishDate',
        path: ['updatedDate'],
      }),
});

export const collections = { blog };
