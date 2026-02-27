#!/usr/bin/env node

/**
 * new-post.mjs — Interactive CLI for creating new blog posts from templates.
 *
 * Usage:
 *   npm run new-post
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, readSync } from 'node:fs';
import { join } from 'node:path';

// ── Config ───────────────────────────────────────────────────────────────────

const BLOG_DIR = 'src/blog';
const TEMPLATE_DIR = 'templates';

const TEMPLATES = {
  1: { file: 'core-note.mdx',        label: 'Core Note',         desc: '讲义式数学笔记 (Definition / Theorem / Proof)' },
  2: { file: 'problem-set.mdx',      label: 'Problem Set',       desc: '习题集 / 作业整理' },
  3: { file: 'interview-problem.mdx', label: 'Interview Problem', desc: '面试题 / 短证明题' },
  4: { file: 'short-proof.mdx',      label: 'Short Proof',       desc: '独立的定理证明' },
  5: { file: 'reflection.mdx',       label: 'Reflection',        desc: '随想 / 非数学类短文' },
};

const SERIES = {
  RA: 'Real Analysis',
  LA: 'Linear Algebra',
  PR: 'Probability',
  CA: 'Calculus / Analysis',
  CM: 'Classical Mechanics',
  EM: 'Electromagnetism',
  SR: 'Special Relativity',
  QM: 'Quantum Mechanics',
  CX: 'Complex Analysis',
};

// ── I/O (synchronous stdin — works with both TTY and piped input) ─────────

function ask(question) {
  process.stdout.write(question);
  let input = '';
  const buf = Buffer.alloc(1);
  while (true) {
    try {
      const bytesRead = readSync(0, buf, 0, 1);
      if (bytesRead === 0) break;
      const char = buf.toString('utf-8');
      if (char === '\n') break;
      input += char;
    } catch {
      break;
    }
  }
  return input.trim();
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-|-$/g, '');
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nextNoteNumber(seriesCode) {
  const blogDir = join(process.cwd(), BLOG_DIR);
  if (!existsSync(blogDir)) return 1;
  const prefix = `${seriesCode}-`;
  let max = 0;
  for (const file of readdirSync(blogDir)) {
    if (!file.endsWith('.mdx') && !file.endsWith('.md')) continue;
    try {
      const content = readFileSync(join(blogDir, file), 'utf-8');
      const match = content.match(new RegExp(`noteId:\\s*["']?${prefix}(\\d+)["']?`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    } catch { /* skip */ }
  }
  return max + 1;
}

// ── Main ─────────────────────────────────────────────────────────────────────

console.log('\n📝 New Post\n');

console.log('Templates:');
for (const [key, tmpl] of Object.entries(TEMPLATES)) {
  console.log(`  ${key}. ${tmpl.label.padEnd(20)} ${tmpl.desc}`);
}
const tmplChoice = ask('\nTemplate [1-5]: ');
const template = TEMPLATES[tmplChoice];
if (!template) { console.error('Invalid choice.'); process.exit(1); }

const title = ask('Title: ');
if (!title) { console.error('Title is required.'); process.exit(1); }

const description = ask('Description (1 sentence): ');
const langInput = ask('Language [en/zh] (default: en): ').toLowerCase();
const lang = langInput === 'zh' ? 'zh' : 'en';

let series = '', noteId = '', tags = '', category = '';
const isCore = template.file === 'core-note.mdx' || template.file === 'problem-set.mdx';

if (isCore) {
  console.log('\nSeries:');
  for (const [code, name] of Object.entries(SERIES)) {
    console.log(`  ${code.padEnd(4)} ${name}`);
  }
  const seriesInput = ask('\nSeries code (e.g. RA, CX): ').toUpperCase();
  if (SERIES[seriesInput]) {
    series = seriesInput;
  } else {
    const custom = ask('Custom series name (or Enter to skip): ');
    if (custom) {
      series = seriesInput;
      console.log(`  ⚠  Add "${seriesInput}" to seriesNames in translations.ts`);
    }
  }
  if (series) {
    const nextNum = nextNoteNumber(series);
    noteId = `${series}-${String(nextNum).padStart(3, '0')}`;
    console.log(`  → noteId: ${noteId}`);
  }
  const tagsInput = ask('Tags (comma-separated, default auto): ');
  tags = tagsInput || `Mathematics, ${SERIES[series] || series}`;
} else {
  const defaultCat = template.file.includes('interview') ? 'interview'
    : template.file.includes('proof') ? 'proof' : 'reflection';
  const catInput = ask(`Category [interview/problem/proof/reflection] (default: ${defaultCat}): `);
  category = catInput || defaultCat;
  const tagsInput = ask('Tags (comma-separated, default: Mathematics): ');
  tags = tagsInput || 'Mathematics';
}

const slug = slugify(title);
const filename = `${slug}.mdx`;
const outPath = join(process.cwd(), BLOG_DIR, filename);

if (existsSync(outPath)) {
  const ow = ask(`⚠  ${filename} exists. Overwrite? [y/N]: `).toLowerCase();
  if (ow !== 'y') { console.log('Aborted.'); process.exit(0); }
}

const tmplPath = join(process.cwd(), TEMPLATE_DIR, template.file);
let content = readFileSync(tmplPath, 'utf-8');

content = content.replace(/^title: "TITLE"$/m, `title: "${title}"`);
content = content.replace(/^description: "DESCRIPTION"$/m, `description: "${description || title}"`);
content = content.replace(/^pubDate: DATE$/m, `pubDate: ${today()}`);
content = content.replace(/^lang: "en"$/m, `lang: "${lang}"`);
const tagArray = tags.split(',').map(t => `"${t.trim()}"`).join(', ');
content = content.replace(/^tags: \[.*\]$/m, `tags: [${tagArray}]`);

if (isCore) {
  content = content.replace(/^series: "SERIES_CODE"$/m, `series: "${series}"`);
  content = content.replace(/SERIES_CODE-NUM/g, noteId);
  content = content.replace(/SERIES_NAME/g, SERIES[series] || series);
  content = content.replace(/SERIES_CODE/g, series);
} else {
  content = content.replace(/^category: ".*"$/m, `category: "${category}"`);
  content = content.replace(/TOPIC/g, tags.split(',')[0]?.trim() || 'Mathematics');
}

writeFileSync(outPath, content, 'utf-8');
console.log(`\n✓ Created: ${BLOG_DIR}/${filename}`);
if (noteId) console.log(`  noteId: ${noteId}`);
console.log(`  Open and start writing!\n`);