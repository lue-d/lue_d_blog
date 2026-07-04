import { supabase } from "./supabase";
import type { GalleryImage } from "./gallery";

type ContentType = "calligraphy" | "photography" | "reflections";

/**
 * 获取指定文章的所有画廊图片（按 sort_order 升序）
 * 客户端使用，受 RLS 限制
 */
export async function getGalleryImagesClient(
  type: ContentType,
  slug: string
): Promise<GalleryImage[]> {
  const { data, error } = await supabase
    .from("images")
    .select("*")
    .eq("post_type", type)
    .eq("post_slug", slug)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error(`[gallery-client] 获取 ${type}/${slug} 图片失败:`, error.message);
    return [];
  }

  return (data || []) as GalleryImage[];
}

/**
 * 获取指定文章的第一张画廊图 URL
 */
export async function getFirstGalleryImageClient(
  type: ContentType,
  slug: string
): Promise<string | null> {
  const { data, error } = await supabase
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

interface CreateImageInput {
  post_type: ContentType;
  post_slug: string;
  url: string;
  alt_text?: string;
  caption?: string;
  sort_order: number;
}

/**
 * 创建一条画廊图片记录
 */
export async function createGalleryImage(
  input: CreateImageInput
): Promise<GalleryImage | null> {
  const { data, error } = await supabase
    .from("images")
    .insert({
      post_type: input.post_type,
      post_slug: input.post_slug,
      url: input.url,
      alt_text: input.alt_text || "",
      caption: input.caption || "",
      sort_order: input.sort_order,
    })
    .select()
    .single();

  if (error) {
    console.error("[gallery-client] 创建图片记录失败:", error.message);
    return null;
  }

  return data as GalleryImage;
}

/**
 * 更新画廊图片的排序值
 */
export async function updateGallerySortOrder(
  id: string,
  sort_order: number
): Promise<boolean> {
  const { error } = await supabase
    .from("images")
    .update({ sort_order })
    .eq("id", id);

  if (error) {
    console.error("[gallery-client] 更新排序失败:", error.message);
    return false;
  }
  return true;
}

/**
 * 删除一条画廊图片记录
 */
export async function deleteGalleryImage(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("images")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[gallery-client] 删除图片失败:", error.message);
    return false;
  }
  return true;
}

/**
 * 删除指定文章的所有画廊图片记录
 */
export async function deleteAllGalleryImages(
  type: ContentType,
  slug: string
): Promise<boolean> {
  const { error } = await supabase
    .from("images")
    .delete()
    .eq("post_type", type)
    .eq("post_slug", slug);

  if (error) {
    console.error("[gallery-client] 批量删除图片失败:", error.message);
    return false;
  }
  return true;
}
