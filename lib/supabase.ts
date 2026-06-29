import { createClient } from "@supabase/supabase-js";

// 客户端实例（anon key，权限受 RLS 限制）
// 用于浏览器端组件：管理后台登录、表单提交等
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
