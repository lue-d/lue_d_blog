import PhotographyDetailClient from "./detail-client";

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

export default function PhotographyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <PhotographyDetailClient params={params} />;
}
