import "server-only";
import { supabaseAdmin } from "./supabase-admin";

export interface GalleryImage {
  id: string;
  post_type: string;
  post_slug: string;
  url: string;
  alt_text: string;
  caption: string;
  sort_order: number;
}

type ContentType = "calligraphy" | "photography" | "reflections";

/**
 * 获取指定文章的所有画廊图片（按 sort_order 升序）
 * 服务端使用，可读取所有图片（不依赖 RLS）
 */
export async function getGalleryImages(
  type: ContentType,
  slug: string
): Promise<GalleryImage[]> {
  const { data, error } = await supabaseAdmin
    .from("images")
    .select("*")
    .eq("post_type", type)
    .eq("post_slug", slug)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error(`[gallery] 获取 ${type}/${slug} 图片失败:`, error.message);
    return [];
  }

  return (data || []) as GalleryImage[];
}

/**
 * 获取指定文章的第一张画廊图 URL
 * 用于列表页缩略图回退
 */
export async function getFirstGalleryImage(
  type: ContentType,
  slug: string
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("images")
    .select("url")
    .eq("post_type", type)
    .eq("post_slug", slug)
    .order("sort_order", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;
  return (data as { url: string }).url;
}

/**
 * 批量获取多篇文章的首张画廊图
 * 返回 Map<slug, url>，用于列表页批量查询
 */
export async function getFirstGalleryImages(
  type: ContentType,
  slugs: string[]
): Promise<Map<string, string>> {
  if (slugs.length === 0) return new Map();

  const { data, error } = await supabaseAdmin
    .from("images")
    .select("post_slug, url")
    .eq("post_type", type)
    .in("post_slug", slugs)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error(`[gallery] 批量获取 ${type} 首图失败:`, error.message);
    return new Map();
  }

  // 每个 slug 只取第一条（因为 SQL 无法直接 DISTINCT ON + ORDER BY）
  const seen = new Set<string>();
  const map = new Map<string, string>();
  for (const row of data || []) {
    const r = row as { post_slug: string; url: string };
    if (!seen.has(r.post_slug)) {
      seen.add(r.post_slug);
      map.set(r.post_slug, r.url);
    }
  }

  return map;
}
