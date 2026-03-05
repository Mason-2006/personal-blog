import rss from "@astrojs/rss";
import type { Lang } from "../../i18n/translations";
import { getPostsByLang, getBaseSlug } from "../../lib/i18n-posts";

export function getStaticPaths() {
  return [{ params: { lang: "zh" } }, { params: { lang: "en" } }];
}

export async function GET(context: any) {
  const lang = context.params.lang as Lang;
  const posts = await getPostsByLang(lang);
  const sorted = posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  const titles: Record<Lang, string> = {
    zh: "我的博客",
    en: "My Blog",
  };
  const descriptions: Record<Lang, string> = {
    zh: "探索技术、分享思考、记录成长的个人博客",
    en: "A personal blog exploring mathematics, physics, and programming",
  };

  return rss({
    title: titles[lang],
    description: descriptions[lang],
    site: context.site,
    items: sorted.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/${lang}/posts/${getBaseSlug(post.id)}/`,
      categories: post.data.tags,
      author: post.data.author,
    })),
    customData: `<language>${lang === "zh" ? "zh-CN" : "en"}</language>`,
  });
}
