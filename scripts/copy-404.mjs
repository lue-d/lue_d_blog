/**
 * Post-build: 复制 index.html → 404.html
 * GitHub Pages 对不存在的路径会返回 404.html。
 * 将 index.html (App Shell) 复制为 404.html，
 * 让客户端路由接管所有页面导航。
 */
import { copyFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "out");
const indexPath = join(outDir, "index.html");
const notFoundPath = join(outDir, "404.html");

copyFileSync(indexPath, notFoundPath);
console.log("✅ 已复制 index.html → 404.html (SPA fallback)");
