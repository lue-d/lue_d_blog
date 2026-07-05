import { getContentList } from "@/lib/content-supabase";
import { getCommentStatsServer } from "@/lib/comments-server";
import HomeClient from "./home-client";

export default async function Home() {
  // 构建时并行获取所有数据，打入静态 HTML
  const [calligraphies, photos, reflections, stats] = await Promise.all([
    getContentList("calligraphy"),
    getContentList("photography"),
    getContentList("reflections"),
    getCommentStatsServer(),
  ]);

  return (
    <HomeClient
      calligraphies={calligraphies.slice(0, 3)}
      photos={photos.slice(0, 3)}
      reflections={reflections.slice(0, 3)}
      stats={stats}
    />
  );
}
