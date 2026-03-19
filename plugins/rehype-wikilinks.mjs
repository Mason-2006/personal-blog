import { visit } from 'unist-util-visit';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const LANG_FROM_PATH_RE = /\.(en|zh)\.(md|mdx)$/;
const SLUG_FROM_HREF_RE = /^\/posts\/(.+)$/;

let validSlugs = null;

function getValidSlugs(blogDir) {
  if (validSlugs) return validSlugs;
  const dir = resolve(blogDir || 'src/blog');
  const files = readdirSync(dir).filter(f => /\.(md|mdx)$/.test(f));
  validSlugs = new Set();
  for (const f of files) {
    const base = f.replace(/\.(md|mdx)$/, '').replace(/\.(en|zh)$/, '');
    validSlugs.add(base);
  }
  return validSlugs;
}

function extractLang(vfile) {
  const frontmatterLang = vfile?.data?.astro?.frontmatter?.lang;
  if (frontmatterLang === 'en' || frontmatterLang === 'zh') return frontmatterLang;

  const filePath = vfile?.path || vfile?.history?.[0] || '';
  const match = filePath.match(LANG_FROM_PATH_RE);
  if (match) return match[1];

  return 'en';
}

export default function rehypeWikilinks(options = {}) {
  const slugs = getValidSlugs(options.blogDir);

  return (tree, vfile) => {
    const lang = extractLang(vfile);

    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const cls = node.properties?.className;
      if (!Array.isArray(cls) || !cls.includes('wikilink')) return;

      const href = node.properties.href || '';
      const slugMatch = href.match(SLUG_FROM_HREF_RE);
      if (!slugMatch) return;

      const slug = slugMatch[1];

      if (slugs.has(slug)) {
        node.properties.href = `/${lang}/posts/${slug}`;
      } else {
        cls.push('wikilink--broken');
        delete node.properties.href;
        node.properties.title = 'Page does not exist';
      }
    });
  };
}
