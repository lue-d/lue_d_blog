import { getContentList, getContentData } from "@/lib/content-supabase";
import { getGalleryImages } from "@/lib/gallery";
import CalligraphyDetailClient from "./detail-client";
import type { ContentMeta } from "@/lib/content-supabase";

// 本地文件系统已知的 calligraphy slugs（作为最终回退）
const LOCAL_SLUGS = ["lanting-intro", "regular-script"];

export async function generateStaticParams() {
  const slugs = new Set(LOCAL_SLUGS);

  try {
    const { getContentList } = await import("@/lib/content-supabase");
    const items = await getContentList("calligraphy");
    for (const item of items) {
      if (item.slug) slugs.add(item.slug);
    }
  } catch (e) {
    console.error("[calligraphy] generateStaticParams Supabase 查询失败:", e);
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

function computeRelated(
  all: ContentMeta[],
  currentSlug: string,
  category?: string
): ContentMeta[] {
  const sameCategory = all.filter(
    (item) => item.slug !== currentSlug && category && item.category === category
  );
  const others = all.filter(
    (item) =>
      item.slug !== currentSlug &&
      (!category || item.category !== category)
  );
  return [...sameCategory, ...others].slice(0, 3);
}

export default async function CalligraphyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 构建时并行获取：文章内容 + 画廊图片 + 全量列表（用于相关推荐）
  const [content, gallery, allPosts] = await Promise.all([
    getContentData("calligraphy", slug),
    getGalleryImages("calligraphy", slug),
    getContentList("calligraphy"),
  ]);

  const relatedPosts = content
    ? computeRelated(allPosts, slug, content.meta.category)
    : [];

  return (
    <CalligraphyDetailClient
      slug={slug}
      initialData={content}
      initialGallery={gallery}
      initialRelatedPosts={relatedPosts}
    />
  );
}
