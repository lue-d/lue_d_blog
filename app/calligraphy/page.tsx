import { getContentList } from "@/lib/content-supabase";
import CalligraphyListClient from "./list-client";

export default async function CalligraphyPage() {
  const items = await getContentList("calligraphy");
  return <CalligraphyListClient items={items} />;
}
