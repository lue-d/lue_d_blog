import { getContentList } from "@/lib/content-supabase";
import ReflectionsListClient from "./list-client";

export default async function ReflectionsPage() {
  const items = await getContentList("reflections");
  return <ReflectionsListClient items={items} />;
}
