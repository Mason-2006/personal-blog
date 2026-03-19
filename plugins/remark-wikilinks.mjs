import { visit } from 'unist-util-visit';

// Matches [[slug]] or [[slug|display text]], non-greedy
const WIKILINK_RE = /\[\[([^\[\]]+?)\]\]/g;

export default function remarkWikilinks() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || !WIKILINK_RE.test(node.value)) return;
      WIKILINK_RE.lastIndex = 0;

      const children = [];
      let lastIndex = 0;
      let match;

      while ((match = WIKILINK_RE.exec(node.value)) !== null) {
        const [full, inner] = match;
        const before = node.value.slice(lastIndex, match.index);
        if (before) children.push({ type: 'text', value: before });

        const pipeIdx = inner.indexOf('|');
        const slug = (pipeIdx >= 0 ? inner.slice(0, pipeIdx) : inner).trim();
        const display = (pipeIdx >= 0 ? inner.slice(pipeIdx + 1) : inner).trim();

        if (!slug) {
          // Empty [[]] — leave as plain text
          children.push({ type: 'text', value: full });
        } else {
          children.push({
            type: 'link',
            url: `/posts/${slug}`,
            data: {
              hProperties: {
                className: ['wikilink'],
                'data-slug': slug,
              },
            },
            children: [{ type: 'text', value: display || slug }],
          });
        }
        lastIndex = match.index + full.length;
      }

      const after = node.value.slice(lastIndex);
      if (after) children.push({ type: 'text', value: after });

      if (children.length > 0) {
        parent.children.splice(index, 1, ...children);
        return index + children.length;
      }
    });
  };
}
