// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';
import vitePluginLatexEnv from './plugins/vite-plugin-latex-env.mjs';
// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  site: 'https://yourblog.com',
  i18n: {
    locales: ['zh', 'en'],
    defaultLocale: 'zh',
    routing: {
      prefixDefaultLocale: true,
    },
  },
  integrations: [
    mdx(),
    sitemap(),
  ],
  vite: {
    plugins: [vitePluginLatexEnv(), tailwindcss()],
  },
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      [rehypeMathjax, {
        tex: {
          packages: ['base', 'ams', 'newcommand', 'configmacros'],
          inlineMath: [['$', '$']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']],
        },
      }],
    ],
    shikiConfig: {
      theme: 'rose-pine',
      wrap: true,
    },
  },
});
