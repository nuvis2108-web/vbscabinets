import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

/** Published posts, newest first. Drafts are visible in `astro dev` only. */
export async function getPosts(): Promise<BlogPost[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());
}

export const postUrl = (post: BlogPost) => `/blog/${post.id}`;

/** Reading time from the raw Markdown, at roughly 220 words a minute. */
export function readingMinutes(post: BlogPost): number {
  const words = (post.body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** Up to `count` other posts: same category first, then the newest. */
export function relatedPosts(post: BlogPost, posts: BlogPost[], count = 2): BlogPost[] {
  const others = posts.filter((p) => p.id !== post.id);
  const sameCategory = others.filter((p) => p.data.category === post.data.category);
  const rest = others.filter((p) => p.data.category !== post.data.category);
  return [...sameCategory, ...rest].slice(0, count);
}

const dateFormat = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

export const formatDate = (date: Date) => dateFormat.format(date);

/** yyyy-mm-dd for <time datetime> and JSON-LD. */
export const isoDate = (date: Date) => date.toISOString().slice(0, 10);
