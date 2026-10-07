import type { APIRoute } from 'astro';
import { site } from '@/data/site';
import { getPosts, isoDate, postUrl } from '@/lib/blog';

// Generated at build time so new blog posts are listed automatically. Replaces the old hand-written public/sitemap.xml.
const staticPages = [
  { path: '/', changefreq: 'monthly', priority: '1.0' },
  { path: '/contact', changefreq: 'yearly', priority: '0.8' },
  { path: '/blog', changefreq: 'weekly', priority: '0.7' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.2' },
];

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const urls = [
    ...staticPages.map(
      (page) =>
        `  <url><loc>${site.url}${page.path}</loc><changefreq>${page.changefreq}</changefreq><priority>${page.priority}</priority></url>`,
    ),
    ...posts
      // Posts with an external canonical belong in that site's sitemap, not ours.
      .filter((post) => !post.data.canonical)
      .map(
        (post) =>
          `  <url><loc>${site.url}${postUrl(post)}</loc><lastmod>${isoDate(post.data.updatedDate ?? post.data.publishDate)}</lastmod><priority>0.6</priority></url>`,
      ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
