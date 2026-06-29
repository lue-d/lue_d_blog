import CalligraphyDetailClient from "./detail-client";

export async function generateStaticParams() {
  const { getContentList } = await import("@/lib/content-supabase");
  const items = await getContentList("calligraphy");
  return items.map((item) => ({ slug: item.slug }));
}

export default function CalligraphyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <CalligraphyDetailClient params={params} />;
}
