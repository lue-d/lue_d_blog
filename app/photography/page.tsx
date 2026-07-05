import { getContentList } from "@/lib/content-supabase";
import PhotographyListClient from "./list-client";

export default async function PhotographyPage() {
  const items = await getContentList("photography");
  return <PhotographyListClient items={items} />;
}
