import { defaultLang, type Lang } from "./config";
import { translations } from "./translations";

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split("/");
  if (lang === "zh" || lang === "en") return lang;
  return defaultLang;
}

export function t(lang: Lang, key: string): string {
  return translations[lang][key] || translations[defaultLang][key] || key;
}

export function localizedPath(lang: Lang, path: string): string {
  // Ensure path starts with /
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `/${lang}${cleanPath}`;
}

export function switchLangPath(currentPath: string, targetLang: Lang): string {
  // Replace /zh/ or /en/ prefix with the target language
  return currentPath.replace(/^\/(zh|en)/, `/${targetLang}`);
}

export function formatDate(date: Date, lang: Lang): string {
  const locale = lang === "zh" ? "zh-CN" : "en-GB";
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDayMonth(date: Date, lang: Lang): string {
  const locale = lang === "zh" ? "zh-CN" : "en-GB";
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
  });
}

export function getMonthName(date: Date, lang: Lang): string {
  const locale = lang === "zh" ? "zh-CN" : "en-GB";
  return date.toLocaleDateString(locale, { month: "long" });
}
