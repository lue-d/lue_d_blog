import { remark } from "remark";
import html from "remark-html";
import { supabase } from "./supabase";

// 与 lib/content-supabase.ts 保持一致的接口
export interface ContentMeta {
  slug: string;
  title: string;
  date: string;
  description: string;
  cover?: string;
  gallery_thumbnail?: string; // 首张画廊图，列表页缩略图回退
  category?: string;
  year?: string;
  medium?: string;
  camera?: string;
  location?: string;
}

type ContentType = "calligraphy" | "photography" | "reflections";

/** 安全解码百分号编码的 slug（中文等非 ASCII 字符可能被浏览器编码） */
function safeDecode(str: string): string {
  try {
    const decoded = decodeURIComponent(str);
    return decoded !== str ? decoded : str;
  } catch {
    return str;
  }
}

// 每张表的字段不同，只查询存在的列
const LIST_COLUMNS: Record<ContentType, string> = {
  calligraphy: "slug, title, date, description, cover, category, year, medium",
  photography: "slug, title, date, description, cover, location, camera",
  reflections: "slug, title, date, description, cover, category",
};

/**
 * 获取指定类型的已发布内容列表（客户端版本）
 * 使用 anon key，RLS 确保只有 published = true 的记录可见
 */
export async function getContentListClient(
  type: ContentType
): Promise<ContentMeta[]> {
  const { data, error } = await supabase
    .from(type)
    .select(LIST_COLUMNS[type])
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`[content-supabase-client] 获取 ${type} 列表失败:`, error.message);
    return [];
  }

  const items = ((data || []) as unknown as Record<string, unknown>[]).map((item) => ({
    slug: item.slug as string,
    title: item.title as string,
    date: item.date ? String(item.date) : "",
    description: (item.description as string) || "",
    cover: (item.cover as string) || undefined,
    category: (item.category as string) || undefined,
    year: (item.year as string) || undefined,
    medium: (item.medium as string) || undefined,
    camera: (item.camera as string) || undefined,
    location: (item.location as string) || undefined,
  }));

  // 批量获取画廊首图作为缩略图
  const slugs = items.map((item) => item.slug);
  if (slugs.length > 0) {
    const { data: imgData } = await supabase
      .from("images")
      .select("post_slug, url")
      .eq("post_type", type)
      .in("post_slug", slugs)
      .order("sort_order", { ascending: true });

    const seen = new Set<string>();
    for (const row of imgData || []) {
      const r = row as { post_slug: string; url: string };
      if (!seen.has(r.post_slug)) {
        seen.add(r.post_slug);
        const item = items.find((i) => i.slug === r.post_slug);
        if (item) {
          (item as Record<string, unknown>).gallery_thumbnail = r.url;
        }
      }
    }
  }

  return items;
}

/**
 * 获取单篇文章的元数据和 HTML 内容（客户端版本）
 * 用 remark + remark-html 将数据库中的 markdown 转为 HTML
 */
export async function getContentDataClient(
  type: ContentType,
  slug: string
): Promise<{ meta: ContentMeta; html: string } | null> {
  const decodedSlug = safeDecode(slug);
  const { data, error } = await supabase
    .from(type)
    .select("*")
    .eq("slug", decodedSlug)
    .eq("published", true)
    .single();

  if (error || !data) {
    console.error(
      `[content-supabase-client] 获取 ${type}/${slug} 失败:`,
      error?.message
    );
    return null;
  }

  const processed = await remark()
    .use(html)
    .process((data.content as string) || "");
  const htmlContent = processed.toString();

  return {
    meta: {
      slug: data.slug as string,
      title: data.title as string,
      date: data.date ? String(data.date) : "",
      description: (data.description as string) || "",
      cover: (data.cover as string) || undefined,
      category: (data.category as string) || undefined,
      year: (data.year as string) || undefined,
      medium: (data.medium as string) || undefined,
      camera: (data.camera as string) || undefined,
      location: (data.location as string) || undefined,
    },
    html: htmlContent,
  };
}
