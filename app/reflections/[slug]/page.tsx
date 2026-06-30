import ReflectionDetailClient from "./detail-client";

// 本地文件系统已知的 reflections slugs（作为最终回退）
// 确保 output: "export" 在任何情况下至少有一个可用的路径
const LOCAL_SLUGS = ["why-calligraphy", "digital-minimalism"];

export async function generateStaticParams() {
  const slugs = new Set(LOCAL_SLUGS);

  // 尝试从 Supabase 获取更多 slugs
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

export default function ReflectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <ReflectionDetailClient params={params} />;
}
