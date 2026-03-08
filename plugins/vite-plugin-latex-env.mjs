/**
 * vite-plugin-latex-env.mjs
 *
 * A Vite plugin that pre-processes .mdx and .md files to wrap bare LaTeX
 * math environments in $$ ... $$ delimiters BEFORE MDX's JSX parser runs.
 *
 * This allows pasting LaTeX directly from Overleaf without modification.
 *
 * Supported environments:
 *   equation, equation*, align, align*, gather, gather*,
 *   multline, multline*, flalign, flalign*, alignat, alignat*,
 *   split, cases, CD
 */

const MATH_ENV_NAMES = [
  'equation', 'equation\\*',
  'align', 'align\\*',
  'gather', 'gather\\*',
  'multline', 'multline\\*',
  'flalign', 'flalign\\*',
  'alignat', 'alignat\\*',
  'split', 'cases', 'CD',
];

const envGroup = MATH_ENV_NAMES.join('|');

// Match \begin{env}...\end{env} that is NOT already wrapped in $$
// Requires the \begin to be at the start of a line (after optional whitespace)
const ENV_REGEX = new RegExp(
  `(^|\\n)([ \\t]*)(\\\\begin\\{(?:${envGroup})\\}[\\s\\S]*?\\\\end\\{(?:${envGroup})\\})`,
  'g'
);

// Match \[ ... \] display math
const BRACKET_REGEX = /(^|\n)([ \t]*)\\\[([\s\S]*?)\\\]/g;

/**
 * Check if a match position is already inside a $$ ... $$ block.
 */
function isInsideDollarBlock(source, matchIndex) {
  // Count $$ occurrences before this position
  let count = 0;
  let idx = 0;
  while (idx < matchIndex) {
    const pos = source.indexOf('$$', idx);
    if (pos === -1 || pos >= matchIndex) break;
    count++;
    idx = pos + 2;
  }
  // If odd number of $$ before us, we're inside a $$ block
  return count % 2 === 1;
}

function transformLatexEnvs(code) {
  if (!code.includes('\\begin{') && !code.includes('\\[')) {
    return code;
  }

  // First pass: wrap \begin{env}...\end{env}
  let result = code.replace(ENV_REGEX, (match, prefix, indent, block, offset) => {
    if (isInsideDollarBlock(code, offset)) return match;
    return `${prefix}${indent}$$\n${block.trim()}\n$$`;
  });

  // Second pass: wrap \[ ... \]
  result = result.replace(BRACKET_REGEX, (match, prefix, indent, content, offset) => {
    if (isInsideDollarBlock(result, offset)) return match;
    return `${prefix}${indent}$$\n${content.trim()}\n$$`;
  });

  return result;
}

export default function vitePluginLatexEnv() {
  return {
    name: 'vite-plugin-latex-env',
    enforce: /** @type {const} */ ('pre'),
    transform(code, id) {
      if (!id.endsWith('.mdx') && !id.endsWith('.md')) return null;
      const transformed = transformLatexEnvs(code);
      if (transformed === code) return null;
      return { code: transformed, map: null };
    },
  };
}
