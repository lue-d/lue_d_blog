import { getContentList, getContentData } from "@/lib/content-supabase";
import { getGalleryImages } from "@/lib/gallery";
import PhotographyDetailClient from "./detail-client";
import type { ContentMeta } from "@/lib/content-supabase";

// 本地文件系统已知的 photography slugs（作为最终回退）
const LOCAL_SLUGS = ["summer-light", "xixi-dragon-boat"];

export async function generateStaticParams() {
  const slugs = new Set(LOCAL_SLUGS);

  try {
    const { getContentList } = await import("@/lib/content-supabase");
    const items = await getContentList("photography");
    for (const item of items) {
      if (item.slug) slugs.add(item.slug);
    }
  } catch (e) {
    console.error("[photography] generateStaticParams Supabase 查询失败:", e);
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

export default async function PhotographyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [content, gallery, allPosts] = await Promise.all([
    getContentData("photography", slug),
    getGalleryImages("photography", slug),
    getContentList("photography"),
  ]);

  const relatedPosts = content
    ? computeRelated(allPosts, slug, content.meta.category)
    : [];

  return (
    <PhotographyDetailClient
      slug={slug}
      initialData={content}
      initialGallery={gallery}
      initialRelatedPosts={relatedPosts}
    />
  );
}
