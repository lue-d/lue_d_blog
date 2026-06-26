import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

export interface ContentMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  cover?: string;
  category?: string;
  year?: string;
  medium?: string;
  camera?: string;
  location?: string;
}

const contentDir = path.join(process.cwd(), "content");

export function getContentList(type: "calligraphy" | "photography" | "reflections"): ContentMeta[] {
  const dir = path.join(contentDir, type);

  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  const items = files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data } = matter(raw);
      return {
        slug,
        title: data.title || slug,
        date: data.date ? String(data.date) : "",
        description: data.description || "",
        cover: data.cover || undefined,
        category: data.category || undefined,
        year: data.year || undefined,
        medium: data.medium || undefined,
        camera: data.camera || undefined,
        location: data.location || undefined,
      } as ContentMeta;
    })
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return items;
}

export async function getContentData(
  type: "calligraphy" | "photography" | "reflections",
  slug: string
): Promise<{ meta: ContentMeta; html: string } | null> {
  const filePath = path.join(contentDir, type, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const processed = await remark().use(html).process(content);
  const htmlContent = processed.toString();

  return {
    meta: {
      slug,
      title: data.title || slug,
      date: data.date ? String(data.date) : "",
      description: data.description || "",
      cover: data.cover || undefined,
      category: data.category || undefined,
      year: data.year ? String(data.year) : undefined,
      medium: data.medium || undefined,
      camera: data.camera || undefined,
      location: data.location || undefined,
    },
    html: htmlContent,
  };
}
