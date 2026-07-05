import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function corsHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };
}

// ======== COS REST API 签名（纯 Web Crypto，无需 SDK）========

async function hmacSha1(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

async function sha1(data: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function hex(arr: ArrayBuffer): string {
  return Array.from(new Uint8Array(arr)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/** 生成 COS 签名并上传文件 */
async function putObject(
  bucket: string, region: string, key: string, body: Uint8Array,
  contentType: string, secretId: string, secretKey: string
): Promise<Response> {
  const host = `${bucket}.cos.${region}.myqcloud.com`;
  const url = `https://${host}/${encodeURI(key).replace(/%2F/g, "/")}`;
  const method = "PUT";

  const now = Math.floor(Date.now() / 1000);
  const signTime = `${now};${now + 3600}`;
  const keyTime = signTime;

  const httpHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "Host": host,
  };
  const headerList = "content-type;host";
  const urlParamList = "";

  const headersStr = headerList.split(";").map(k => `${k}=${encodeURIComponent(httpHeaders[k])}`).join("&");

  const httpString = `${method.toLowerCase()}\n/${key}\n\n${headersStr}\n`;

  const httpStringHash = await sha1(new TextEncoder().encode(httpString));
  const signString = `sha1\n${signTime}\n${httpStringHash}\n`;

  const signKey = await hmacSha1(new TextEncoder().encode(secretKey), keyTime);
  const signature = hex(await hmacSha1(signKey, signString));

  const auth = `q-sign-algorithm=sha1&q-ak=${secretId}&q-sign-time=${signTime}&q-key-time=${keyTime}&q-header-list=${headerList}&q-url-param-list=${urlParamList}&q-signature=${signature}`;

  return fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": auth,
      "Content-Type": contentType,
      "Host": host,
    },
    body,
  });
}

// ======== Handler ========

Deno.serve(async (req) => {
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

  // 验证管理员
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "未登录" }), { status: 401, headers: corsHeaders() });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "登录已过期" }), { status: 401, headers: corsHeaders() });
  }

  // 解析表单
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null;
  const slug = formData.get("slug") as string | null;
  const index = formData.get("index") as string | null;

  if (!file || !type || !slug || !index) {
    return new Response(JSON.stringify({ error: "缺少参数" }), { status: 400, headers: corsHeaders() });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return new Response(JSON.stringify({ error: "不支持的图片格式" }), { status: 400, headers: corsHeaders() });
  }

  if (file.size > MAX_SIZE) {
    return new Response(JSON.stringify({ error: "图片超过 10MB 限制" }), { status: 400, headers: corsHeaders() });
  }

  const safeSlug = slug.replace(/[^a-zA-Z0-9一-鿿_-]/g, "").slice(0, 100);
  const safeType = ["calligraphy", "photography", "reflections"].includes(type) ? type : "photography";
  const ext = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "webp";
  const key = `gallery/${safeType}/${safeSlug}/${index}-${Date.now()}.${ext}`;

  const bucket = Deno.env.get("COS_BUCKET")!;
  const region = Deno.env.get("COS_REGION")!;
  const secretId = Deno.env.get("COS_SECRET_ID")!;
  const secretKey = Deno.env.get("COS_SECRET_KEY")!;

  const buffer = new Uint8Array(await file.arrayBuffer());

  try {
    const res = await putObject(bucket, region, key, buffer, file.type, secretId, secretKey);

    if (!res.ok) {
      const errBody = await res.text();
      console.error("COS PUT failed:", res.status, errBody);
      return new Response(JSON.stringify({ error: `COS 上传失败 (${res.status})` }), { status: 500, headers: corsHeaders() });
    }

    const url = `https://${bucket}.cos.${region}.myqcloud.com/${key}`;
    return new Response(JSON.stringify({ url }), { status: 200, headers: corsHeaders() });
  } catch (err) {
    console.error("Upload error:", err);
    return new Response(JSON.stringify({ error: "上传失败" }), { status: 500, headers: corsHeaders() });
  }
});
