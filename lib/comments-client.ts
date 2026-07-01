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
}

export interface CommentStats {
  totalCalligraphy: number;
  totalPhotography: number;
  totalComments: number;
  recentComments: Comment[];
}

export interface CreateCommentInput {
  post_type: string;
  post_slug: string;
  post_title: string;
  author_name: string;
  author_email: string;
  content: string;
}

/**
 * 获取某篇文章已审核通过的留言
 */
export async function getComments(
  postType: string,
  postSlug: string
): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_type", postType)
    .eq("post_slug", postSlug)
    .eq("published", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[comments-client] 获取留言失败:", error.message);
    return [];
  }

  return (data || []) as unknown as Comment[];
}

/**
 * 提交新留言（默认 published = false，需管理员审核）
 */
export async function createComment(
  input: CreateCommentInput
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("comments").insert({
    post_type: input.post_type,
    post_slug: input.post_slug,
    post_title: input.post_title,
    author_name: input.author_name.trim(),
    author_email: input.author_email.trim(),
    content: input.content.trim(),
    published: false,
  });

  if (error) {
    console.error("[comments-client] 提交留言失败:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 获取统计数据：各类型数量 + 最新留言
 */
export async function getCommentStats(): Promise<CommentStats> {
  // 并行获取：摄影数、书法数、已通过留言数、最新留言
  const [
    { count: photoCount },
    { count: calliCount },
    { count: commentCount, data: recentData },
  ] = await Promise.all([
    supabase
      .from("photography")
      .select("*", { count: "exact", head: true })
      .eq("published", true),
    supabase
      .from("calligraphy")
      .select("*", { count: "exact", head: true })
      .eq("published", true),
    supabase
      .from("comments")
      .select("*", { count: "exact" })
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return {
    totalPhotography: photoCount || 0,
    totalCalligraphy: calliCount || 0,
    totalComments: commentCount || 0,
    recentComments: ((recentData || []) as unknown as Comment[]).slice(0, 5),
  };
}
