/**
 * Post-build: 配置 GitHub Pages 的 SPA fallback
 *
 * 1. 删除 out/404/ 目录（Next.js 生成的 _not-found 页面）
 *    → 避免和 404.html 文件冲突
 * 2. 复制 index.html → 404.html
 *    → GitHub Pages 对不存在的路径返回 404.html
 *    → App Shell 加载后，客户端路由接管导航
 */
import { copyFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "out");
const indexPath = join(outDir, "index.html");
const notFoundPath = join(outDir, "404.html");
const notFoundDir = join(outDir, "404");
const notFoundAltDir = join(outDir, "_not-found");

// 1. 删除冲突的 404/ 目录
if (existsSync(notFoundDir)) {
  rmSync(notFoundDir, { recursive: true, force: true });
  console.log("🗑️  已删除 out/404/ 目录（避免与 404.html 冲突）");
}

// 2. 删除 _not-found/ 目录（不需要，SPA fallback 已覆盖）
if (existsSync(notFoundAltDir)) {
  rmSync(notFoundAltDir, { recursive: true, force: true });
  console.log("🗑️  已删除 out/_not-found/ 目录");
}

// 3. 复制 index.html → 404.html (SPA fallback)
copyFileSync(indexPath, notFoundPath);
console.log("✅ 已复制 index.html → 404.html (SPA fallback)");
