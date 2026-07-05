import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import COS from "https://esm.sh/cos-nodejs-sdk-v5";

const COS_BUCKET = Deno.env.get("COS_BUCKET")!;
const COS_REGION = Deno.env.get("COS_REGION")!;
const COS_SECRET_ID = Deno.env.get("COS_SECRET_ID")!;
const COS_SECRET_KEY = Deno.env.get("COS_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// 允许的图片类型，防止恶意上传
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // 验证管理员身份
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "未登录" }), {
      status: 401,
      headers: corsHeaders(),
    });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "登录已过期" }), {
      status: 401,
      headers: corsHeaders(),
    });
  }

  // 解析表单
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null;
  const slug = formData.get("slug") as string | null;
  const index = formData.get("index") as string | null;

  if (!file || !type || !slug || !index) {
    return new Response(JSON.stringify({ error: "缺少参数" }), {
      status: 400,
      headers: corsHeaders(),
    });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return new Response(JSON.stringify({ error: "不支持的图片格式" }), {
      status: 400,
      headers: corsHeaders(),
    });
  }

  if (file.size > MAX_SIZE) {
    return new Response(JSON.stringify({ error: "图片超过 10MB 限制" }), {
      status: 400,
      headers: corsHeaders(),
    });
  }

  // 构建安全的文件路径
  const safeSlug = slug.replace(/[^a-zA-Z0-9一-鿿_-]/g, "").slice(0, 100);
  const safeType = ["calligraphy", "photography", "reflections"].includes(type)
    ? type
    : "photography";
  const ext = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "webp";
  const key = `gallery/${safeType}/${safeSlug}/${index}-${Date.now()}.${ext}`;

  const cos = new COS({
    SecretId: COS_SECRET_ID,
    SecretKey: COS_SECRET_KEY,
  });

  const buffer = new Uint8Array(await file.arrayBuffer());

  try {
    const result = await new Promise<{ Location?: string; statusCode?: number }>(
      (resolve, reject) => {
        cos.putObject(
          {
            Bucket: COS_BUCKET,
            Region: COS_REGION,
            Key: key,
            Body: buffer,
            ContentType: file.type,
          },
          (err, data) => {
            if (err) reject(err);
            else resolve(data);
          }
        );
      }
    );

    if (result.statusCode && result.statusCode >= 400) {
      return new Response(JSON.stringify({ error: "COS 上传失败" }), {
        status: 500,
        headers: corsHeaders(),
      });
    }

    const url = `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${key}`;

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (err) {
    console.error("COS upload error:", err);
    return new Response(JSON.stringify({ error: "上传失败" }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
});

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };
}
