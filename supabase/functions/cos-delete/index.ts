import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function corsHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, x-client-info, apikey",
    "Access-Control-Max-Age": "86400",
  };
}

// HMAC-SHA1
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

    const body = await req.json();
    const { urls } = body as { urls: string[] };

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: "缺少 urls 参数" }), {
        status: 400, headers: corsHeaders(),
      });
    }

    const bucket = Deno.env.get("COS_BUCKET")!;
    const region = Deno.env.get("COS_REGION")!;
    const secretId = Deno.env.get("COS_SECRET_ID")!;
    const secretKey = Deno.env.get("COS_SECRET_KEY")!;
    const host = `${bucket}.cos.${region}.myqcloud.com`;

    let deleted = 0;
    let failed = 0;

    for (const url of urls) {
      try {
        // 从 URL 中提取 key（去掉 https://host/ 前缀）
        const prefix = `https://${host}/`;
        if (!url.startsWith(prefix)) {
          failed++;
          continue;
        }
        const key = url.slice(prefix.length);
        const uri = `/${key}`;

        // 生成 DELETE 预签名
        const now = Math.floor(Date.now() / 1000) - 1;
        const exp = now + 900;
        const signTime = `${now};${exp}`;

        const signKey = await hmacSha1(secretKey, signTime);

        // DELETE 不需要签 header 和 param
        const formatString = ["delete", uri, "", "", ""].join("\n");
        const formatSha1 = await sha1(formatString);
        const stringToSign = ["sha1", signTime, formatSha1, ""].join("\n");
        const signature = await hmacSha1(signKey, stringToSign);

        const authParams = [
          "q-sign-algorithm=sha1",
          `q-ak=${secretId}`,
          `q-sign-time=${signTime}`,
          `q-key-time=${signTime}`,
          "q-header-list=",
          "q-url-param-list=",
          `q-signature=${signature}`,
        ].join("&");

        const deleteUrl = `https://${host}${uri}?${authParams}`;

        const res = await fetch(deleteUrl, { method: "DELETE" });
        if (res.ok || res.status === 204) {
          deleted++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return new Response(JSON.stringify({ deleted, failed }), {
      status: 200, headers: corsHeaders(),
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "服务器内部错误", detail: String(err) }), {
      status: 500, headers: corsHeaders(),
    });
  }
});
