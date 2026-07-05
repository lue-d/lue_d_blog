import "server-only";
import { supabaseAdmin } from "./supabase-admin";

export interface CommentStats {
  totalPhotography: number;
  totalCalligraphy: number;
  totalComments: number;
}

/**
 * 获取站点统计数据（服务端专用，构建时使用）
 * 使用 service_role key，绕过 RLS
 */
export async function getCommentStatsServer(): Promise<CommentStats> {
  const [photoRes, calliRes, commentRes] = await Promise.all([
    supabaseAdmin
      .from("photography")
      .select("*", { count: "exact", head: true })
      .eq("published", true),
    supabaseAdmin
      .from("calligraphy")
      .select("*", { count: "exact", head: true })
      .eq("published", true),
    supabaseAdmin
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("published", true),
  ]);

  return {
    totalPhotography: photoRes.count ?? 0,
    totalCalligraphy: calliRes.count ?? 0,
    totalComments: commentRes.count ?? 0,
  };
}
