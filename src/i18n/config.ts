export const languages = {
  zh: "中文",
  en: "English",
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = "zh";
