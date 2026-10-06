# VBS Closets & Cabinets website

Production site: https://vbscabinets.ca

## Branches
- `main` — the live static site (single `index.html`, no build). Tagged as `legacy-static-v1`.
- `astro-redesign` — Astro + Tailwind CSS v4 rebuild (this branch). The original site is preserved unchanged in `legacy/`.

## Development (astro-redesign)
Requires Node 22.12+.

```
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs static files to dist/
npm run preview
```

## Deployment
Cloudflare Pages, static output (no adapter).
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION=22`

Files in `public/` (images, `_headers`, `robots.txt`, `sitemap.xml`) are copied to `dist/` as-is.

## Public contact
- Phone: 437-376-6267
- Email: vbscustom@gmail.com
- Instagram: @vbsclosetscabinets

## Image policy
All portfolio images in `public/assets/images/` are photographs supplied by VBS Closets & Cabinets. WebP is used where supported, with optimized JPEG fallbacks.
