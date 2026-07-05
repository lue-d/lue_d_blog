import { getContentList, getContentData } from "@/lib/content-supabase";
import { getGalleryImages } from "@/lib/gallery";
import ReflectionDetailClient from "./detail-client";
import type { ContentMeta } from "@/lib/content-supabase";

// 本地文件系统已知的 reflections slugs（作为最终回退）
const LOCAL_SLUGS = ["why-calligraphy", "digital-minimalism"];

export async function generateStaticParams() {
  const slugs = new Set(LOCAL_SLUGS);

  try {
    const { getContentList } = await import("@/lib/content-supabase");
    const items = await getContentList("reflections");
    for (const item of items) {
      if (item.slug) slugs.add(item.slug);
    }
  } catch (e) {
    console.error("[reflections] generateStaticParams Supabase 查询失败:", e);
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

export default async function ReflectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [content, gallery, allPosts] = await Promise.all([
    getContentData("reflections", slug),
    getGalleryImages("reflections", slug),
    getContentList("reflections"),
  ]);

  const relatedPosts = content
    ? computeRelated(allPosts, slug, content.meta.category)
    : [];

  return (
    <ReflectionDetailClient
      slug={slug}
      initialData={content}
      initialGallery={gallery}
      initialRelatedPosts={relatedPosts}
    />
  );
}
