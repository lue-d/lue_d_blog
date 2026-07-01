import { supabase } from "./supabase";

export interface Comment {
  id: string;
  post_type: string;
  post_slug: string;
  post_title: string;
  author_name: string;
  author_email: string;
  content: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  calligraphy: "书法",
  photography: "摄影",
  reflections: "感悟",
};

export function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] || type;
}

/**
 * 获取全部留言（含未审核），需要管理员登录态
 * RLS 策略：auth.role() = 'authenticated' 才可读取全部
 */
export async function getAllComments(filter?: {
  post_type?: string;
  published?: boolean;
}): Promise<Comment[]> {
  let query = supabase
    .from("comments")
    .select("*")
    .order("created_at", { ascending: false });

  if (filter?.post_type) {
    query = query.eq("post_type", filter.post_type);
  }

  if (filter?.published !== undefined) {
    query = query.eq("published", filter.published);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[comments-admin] 获取留言列表失败:", error.message);
    return [];
  }

  return (data || []) as unknown as Comment[];
}

/**
 * 切换留言审核状态（需管理员登录态）
 */
export async function togglePublish(
  id: string,
  published: boolean
): Promise<void> {
  const { error } = await supabase
    .from("comments")
    .update({ published })
    .eq("id", id);

  if (error) {
    console.error("[comments-admin] 更新留言状态失败:", error.message);
    throw new Error(error.message);
  }
}

/**
 * 删除留言（需管理员登录态）
 */
export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from("comments").delete().eq("id", id);

  if (error) {
    console.error("[comments-admin] 删除留言失败:", error.message);
    throw new Error(error.message);
  }
}

/**
 * 获取留言统计数据（管理员视图）
 */
export async function getAdminCommentStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
}> {
  const [
    { count: total },
    { count: pending },
    { count: approved },
  ] = await Promise.all([
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("published", false),
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("published", true),
  ]);

  return {
    total: total || 0,
    pending: pending || 0,
    approved: approved || 0,
  };
}
