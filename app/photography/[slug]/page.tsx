import PhotographyDetailClient from "./detail-client";

export async function generateStaticParams() {
  const { getContentList } = await import("@/lib/content-supabase");
  const items = await getContentList("photography");
  return items.map((item) => ({ slug: item.slug }));
}

export default function PhotographyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <PhotographyDetailClient params={params} />;
}
