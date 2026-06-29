import ReflectionDetailClient from "./detail-client";

export async function generateStaticParams() {
  const { getContentList } = await import("@/lib/content-supabase");
  const items = await getContentList("reflections");
  return items.map((item) => ({ slug: item.slug }));
}

export default function ReflectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <ReflectionDetailClient params={params} />;
}
