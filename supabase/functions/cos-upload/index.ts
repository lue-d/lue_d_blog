import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

function corsHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, x-client-info, apikey",
    "Access-Control-Max-Age": "86400",
  };
}

// HMAC-SHA1: key 和 data 都是字符串（与 Node.js crypto.createHmac 行为一致）
async function hmacSha1(key: string, data: string): Promise<string> {
  const keyBytes = new TextEncoder().encode(key);
  const dataBytes = new TextEncoder().encode(data);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, dataBytes);
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// SHA1 哈希
async function sha1(data: string): Promise<string> {
  const bytes = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest("SHA-1", bytes);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  // OPTIONS 预检请求 —— 必须最先处理
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, x-client-info, apikey",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // 所有其他响应统一用 try-catch 确保 CORS 头不丢失
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: corsHeaders(),
      });
    }

    // 验证用户身份
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "未登录" }), {
        status: 401, headers: corsHeaders(),
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "登录已过期" }), {
        status: 401, headers: corsHeaders(),
      });
    }

    // 解析请求参数
    const body = await req.json();
    const { filename, contentType, slug, type, index } = body as {
      filename: string; contentType: string; slug: string; type: string; index: string;
    };

    if (!filename || !contentType || !slug || !type || !index) {
      return new Response(JSON.stringify({ error: "缺少参数" }), {
        status: 400, headers: corsHeaders(),
      });
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return new Response(JSON.stringify({ error: "不支持的图片格式" }), {
        status: 400, headers: corsHeaders(),
      });
    }

    const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100) || "post";
    const safeType = ["calligraphy", "photography", "reflections"].includes(type) ? type : "photography";
    const ext = filename.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "webp";
    const key = `gallery/${safeType}/${safeSlug}/${index}-${Date.now()}.${ext}`;

    const bucket = Deno.env.get("COS_BUCKET")!;
    const region = Deno.env.get("COS_REGION")!;
    const secretId = Deno.env.get("COS_SECRET_ID")!;
    const secretKey = Deno.env.get("COS_SECRET_KEY")!;
    const host = `${bucket}.cos.${region}.myqcloud.com`;

    const uri = `/${key}`;

    // 生成预签名 URL（签名放在 query string，浏览器直传 COS）
    const now = Math.floor(Date.now() / 1000) - 1;
    const exp = now + 900;
    const signTime = `${now};${exp}`;

    // 签名 content-type 头
    const headerList = "content-type";
    const headerStr = `content-type=${encodeURIComponent(contentType.toLowerCase())}`;

    // SignKey
    const signKey = await hmacSha1(secretKey, signTime);

    // FormatString
    const formatString = ["put", uri, "", headerStr, ""].join("\n");

    // StringToSign
    const formatSha1 = await sha1(formatString);
    const stringToSign = ["sha1", signTime, formatSha1, ""].join("\n");

    // Signature
    const signature = await hmacSha1(signKey, stringToSign);

    // 组装签名 query 参数
    const authParams = [
      "q-sign-algorithm=sha1",
      `q-ak=${secretId}`,
      `q-sign-time=${signTime}`,
      `q-key-time=${signTime}`,
      `q-header-list=${headerList}`,
      "q-url-param-list=",
      `q-signature=${signature}`,
    ].join("&");

    const presignedUrl = `https://${host}${uri}?${authParams}`;
    const publicUrl = `https://${host}${uri}`;

    return new Response(JSON.stringify({ presignedUrl, publicUrl }), {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "服务器内部错误", detail: String(err) }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
});
