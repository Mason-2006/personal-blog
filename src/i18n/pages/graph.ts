import type { Lang } from "../config";

export const graph: Record<Lang, Record<string, string>> = {
  zh: {
    "graph.title": "笔记图谱",
    "graph.subtitle": "所有笔记的关联网络",
    "graph.noData": "暂无关联数据",
    "wikilinks.outlinks": "引用笔记",
    "wikilinks.backlinks": "被引用",
    "wikilinks.noOutlinks": "本笔记未引用其他笔记",
    "wikilinks.noBacklinks": "暂无其他笔记引用",
    "wikilinks.brokenLink": "页面不存在",
  },
  en: {
    "graph.title": "Note Graph",
    "graph.subtitle": "Network of all connected notes",
    "graph.noData": "No connection data yet",
    "wikilinks.outlinks": "References",
    "wikilinks.backlinks": "Cited By",
    "wikilinks.noOutlinks": "This note has no outgoing links",
    "wikilinks.noBacklinks": "No other notes link here yet",
    "wikilinks.brokenLink": "Page does not exist",
  },
};
