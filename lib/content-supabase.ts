import { remark } from "remark";
import html from "remark-html";
import { supabaseAdmin } from "./supabase-admin";
import * as localContent from "./content";

// 与 lib/content.ts 保持一致的接口
// 所有可选字段映射到数据库表中对应的列
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
 * 获取指定类型的已发布内容列表
 * 按日期降序排列，仅返回 published = true 的记录
 * 当 Supabase 无数据时自动回退到本地 MDX 文件
 */
export async function getContentList(
  type: ContentType
): Promise<ContentMeta[]> {
  let data: unknown[] | null = null;
  let error: { message: string } | null = null;

  try {
    const result = await supabaseAdmin
      .from(type)
      .select(LIST_COLUMNS[type])
      .eq("published", true)
      .order("date", { ascending: false });
    data = (result.data || []) as unknown[] | null;
    error = result.error;
  } catch (e) {
    console.error(`[content-supabase] 查询 ${type} 列表异常:`, e);
    console.log(`[content-supabase] 回退到本地 MDX 文件 (${type})`);
    return localContent.getContentList(type);
  }

  if (error) {
    console.error(`[content-supabase] 获取 ${type} 列表失败:`, error.message);
    console.log(`[content-supabase] 回退到本地 MDX 文件 (${type})`);
    return localContent.getContentList(type);
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

  // 当 Supabase 返回空数组时，回退到本地 MDX 文件
  // 确保 output: "export" 模式下 generateStaticParams() 至少有一个路径
  if (items.length === 0) {
    console.log(`[content-supabase] Supabase 无 ${type} 数据，回退到本地 MDX 文件`);
    return localContent.getContentList(type);
  }

  return items;
}

/**
 * 获取单篇文章的元数据和 HTML 内容
 * 用 remark + remark-html 将数据库中的 markdown 转为 HTML
 * 当 Supabase 无数据时自动回退到本地 MDX 文件
 */
export async function getContentData(
  type: ContentType,
  slug: string
): Promise<{ meta: ContentMeta; html: string } | null> {
  let data: Record<string, unknown> | null = null;
  let error: { message: string } | null = null;

  const decodedSlug = safeDecode(slug);
  try {
    const result = await supabaseAdmin
      .from(type)
      .select("*")
      .eq("slug", decodedSlug)
      .single();
    data = result.data as Record<string, unknown> | null;
    error = result.error;
  } catch (e) {
    console.error(`[content-supabase] 查询 ${type}/${slug} 异常:`, e);
    console.log(`[content-supabase] 回退到本地 MDX 文件 (${type}/${decodedSlug})`);
    return localContent.getContentData(type, decodedSlug);
  }

  if (error || !data) {
    console.error(
      `[content-supabase] 获取 ${type}/${slug} 失败:`,
      error?.message
    );
    console.log(`[content-supabase] 回退到本地 MDX 文件 (${type}/${decodedSlug})`);
    return localContent.getContentData(type, decodedSlug);
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
