import "server-only";
import { createClient } from "@supabase/supabase-js";

// 服务端实例（service_role key，绕过 RLS）
// 仅用于 Server Components / API Routes
// 可读取所有数据（包括未发布的草稿）
// 禁止在客户端组件中导入此文件
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
