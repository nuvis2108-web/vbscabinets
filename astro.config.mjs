// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Static output (default) — deploys to Cloudflare Pages as plain files, no adapter needed.
export default defineConfig({
  site: 'https://vbscabinets.ca',
  // contact.html rather than contact/index.html: Cloudflare Pages then serves /contact with no redirect.
  build: { format: 'file' },
  trailingSlash: 'never',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
