import { defaultLang, type Lang, languages } from "./config";
import { about } from "./pages/about";
import { common } from "./pages/common";
import { home } from "./pages/home";
import { marginalia } from "./pages/marginalia";
import { graph } from "./pages/graph";
import { notes } from "./pages/notes";
import { posts } from "./pages/posts";

export { defaultLang, type Lang, languages };

const merge = (...sources: Array<Record<Lang, Record<string, string>>>) => {
  const merged = (Object.keys(languages) as Lang[]).reduce(
    (acc, lang) => {
      acc[lang] = {};
      return acc;
    },
    {} as Record<Lang, Record<string, string>>,
  );

  for (const source of sources) {
    for (const lang of Object.keys(languages) as Lang[]) {
      merged[lang] = { ...merged[lang], ...source[lang] };
    }
  }

  return merged;
};

export const translations: Record<Lang, Record<string, string>> = merge(
  common,
  home,
  about,
  posts,
  notes,
  marginalia,
  graph,
);

export const seriesNames: Record<Lang, Record<string, string>> = {
  zh: {
    RA: "实分析",
    LA: "线性代数",
    PR: "概率论",
    CA: "微积分 / 分析",
    CM: "经典力学",
    EM: "电磁学",
    SR: "狭义相对论",
    QM: "量子力学",
    CX: "复分析",
  },
  en: {
    RA: "Real Analysis",
    LA: "Linear Algebra",
    PR: "Probability",
    CA: "Calculus / Analysis",
    CM: "Classical Mechanics",
    EM: "Electromagnetism",
    SR: "Special Relativity",
    QM: "Quantum Mechanics",
    CX: "Complex Analysis",
  },
};

export const categoryNames: Record<Lang, Record<string, string>> = {
  zh: {
    interview: "面试题",
    problem: "习题",
    proof: "简短证明",
    reflection: "随想",
  },
  en: {
    interview: "Interview Problems",
    problem: "Problems",
    proof: "Short Proofs",
    reflection: "Reflections",
  },
};

// Series accent colors — used for color-coded borders on post items
export const seriesColors: Record<string, string> = {
  RA: "#5b7b9b",  // steel blue — Real Analysis
  LA: "#7b5b9b",  // muted purple — Linear Algebra
  PR: "#5b9b7b",  // sage green — Probability
  CA: "#9b7b5b",  // warm amber — Calculus / Analysis (matches site accent)
  CM: "#8b6b4b",  // earthy brown — Classical Mechanics
  EM: "#6b8b9b",  // slate teal — Electromagnetism
  SR: "#9b5b6b",  // dusted rose — Special Relativity
  QM: "#6b5b8b",  // twilight purple — Quantum Mechanics
  CX: "#5b8b6b",  // forest green — Complex Analysis
};

// Category accent colors for marginalia
export const categoryColors: Record<string, string> = {
  interview: "#9b9b5b",  // olive
  problem: "#7b8b5b",   // moss
  proof: "#5b7b9b",     // steel blue
  reflection: "#9b6b7b", // mauve
};
