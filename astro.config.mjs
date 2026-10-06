// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// Static output (default) — deploys to Cloudflare Pages as plain files, no adapter needed.
export default defineConfig({
  site: 'https://vbscabinets.ca',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
