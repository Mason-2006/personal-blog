import { getCollection } from "astro:content";
import { getBaseSlug, getLangFromPostId } from "./i18n-posts";
import type { Lang } from "../i18n/config";

const WIKILINK_RE = /\[\[([^\[\]]+?)\]\]/g;

export interface WikilinkTarget {
  slug: string;
  title: string;
  exists: boolean;
}

export interface WikilinkData {
  outlinks: Map<string, WikilinkTarget[]>;
  backlinks: Map<string, WikilinkTarget[]>;
}

export interface GraphNode {
  id: string;
  title: string;
  description?: string;
  series?: string;
  type: "core" | "marginalia";
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface PreviewData {
  title: string;
  description: string;
  excerpt: string;
}

export function extractExcerpt(rawBody: string, maxLength = 150): string {
  let text = rawBody
    .replace(/^import\s+.*$/gm, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\$\$[\s\S]*?\$\$/g, "")
    .replace(/\$[^$\n]+\$/g, "")
    .replace(/\\begin\{[^}]*\}[\s\S]*?\\end\{[^}]*\}/g, "")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/---+/g, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > maxLength * 0.6 ? truncated.slice(0, lastSpace) : truncated) + "…";
}

/** Extract unique wikilink slugs from raw MDX content */
export function extractWikilinks(content: string): string[] {
  const slugs = new Set<string>();
  let match;
  const re = new RegExp(WIKILINK_RE.source, "g");
  while ((match = re.exec(content)) !== null) {
    const inner = match[1];
    const pipeIdx = inner.indexOf("|");
    const slug = (pipeIdx >= 0 ? inner.slice(0, pipeIdx) : inner).trim();
    if (slug) slugs.add(slug);
  }
  return [...slugs];
}

/** Build outlinks, backlinks, and graph data from all blog posts */
export async function buildWikilinkData(
  lang: Lang
): Promise<{ wikilinks: WikilinkData; graph: GraphData; previews: Map<string, PreviewData> }> {
  const allPosts = await getCollection("blog", ({ data }) => !data.draft);

  const slugTitleMap = new Map<string, string>();
  const slugDescMap = new Map<string, string>();
  const slugSeriesMap = new Map<string, string | undefined>();
  const slugTypeMap = new Map<string, "core" | "marginalia">();
  const validSlugs = new Set<string>();
  const slugBodyMap = new Map<string, string>();

  for (const post of allPosts) {
    const base = getBaseSlug(post.id);
    const postLang = getLangFromPostId(post.id);
    validSlugs.add(base);

    if (postLang === lang || !slugTitleMap.has(base)) {
      slugTitleMap.set(base, post.data.title);
      slugDescMap.set(base, post.data.description);
      slugSeriesMap.set(base, post.data.series);
      slugTypeMap.set(base, post.data.type || "core");
      const body = (post as any).body || "";
      slugBodyMap.set(base, body);
    }
  }

  // Phase 2: Extract outlinks, compute backlinks, build graph edges
  const outlinksMap = new Map<string, WikilinkTarget[]>();
  const backlinksMap = new Map<string, WikilinkTarget[]>();
  const graphLinks: GraphLink[] = [];

  for (const slug of validSlugs) {
    outlinksMap.set(slug, []);
    backlinksMap.set(slug, []);
  }

    for (const base of validSlugs) {
    const body = slugBodyMap.get(base) || "";
    const targets = extractWikilinks(body);

    const outlinks: WikilinkTarget[] = [];
    const seenTargets = new Set<string>();

    for (const targetSlug of targets) {
      if (targetSlug === base) continue;
      if (seenTargets.has(targetSlug)) continue;
      seenTargets.add(targetSlug);

      const exists = validSlugs.has(targetSlug);
      outlinks.push({
        slug: targetSlug,
        title: slugTitleMap.get(targetSlug) || targetSlug,
        exists,
      });

      if (exists) {
        graphLinks.push({ source: base, target: targetSlug });
        if (!backlinksMap.has(targetSlug)) {
          backlinksMap.set(targetSlug, []);
        }
        backlinksMap.get(targetSlug)!.push({
          slug: base,
          title: slugTitleMap.get(base) || base,
          exists: true,
        });
      }
    }
    outlinksMap.set(base, outlinks);
  }

  // Phase 3: Build graph nodes and preview data
  const graphNodes: GraphNode[] = [];
  const previews = new Map<string, PreviewData>();
  for (const base of validSlugs) {
    graphNodes.push({
      id: base,
      title: slugTitleMap.get(base) || base,
      description: slugDescMap.get(base),
      series: slugSeriesMap.get(base),
      type: slugTypeMap.get(base) || "core",
    });
    previews.set(base, {
      title: slugTitleMap.get(base) || base,
      description: slugDescMap.get(base) || "",
      excerpt: extractExcerpt(slugBodyMap.get(base) || ""),
    });
  }

  return {
    wikilinks: { outlinks: outlinksMap, backlinks: backlinksMap },
    graph: { nodes: graphNodes, links: graphLinks },
    previews,
  };
}
