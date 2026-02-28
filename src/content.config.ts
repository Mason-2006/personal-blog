import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default("Anonymous"),
    tags: z.array(z.string()).default([]),
    image: z
      .object({
        url: z.string(),
        alt: z.string(),
      })
      .optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    type: z.enum(["core", "marginalia"]).default("core"),
    series: z.string().optional(),
    noteId: z.string().optional(),
    lang: z.enum(["zh", "en"]).default("zh"),
    category: z.string().optional(),
  }),
});

export const collections = { blog };
