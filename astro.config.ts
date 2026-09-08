import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://devstack.fyi',
  output: 'static',
  // Keep fixture/dev/build content caches inside each checkout (RE-008).
  cacheDir: './.astro/cache',
  trailingSlash: 'always',
  integrations: [mdx(), sitemap()],
  build: { format: 'directory', inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
  markdown: { syntaxHighlight: 'prism' },
});
