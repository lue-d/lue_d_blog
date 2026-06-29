/**
 * 数据迁移脚本：将本地 MDX 文件导入 Supabase
 *
 * 用法: npx tsx scripts/migrate-to-supabase.ts
 *
 * 前置条件:
 *   1. Supabase 中已执行 supabase/migrations/001_init.sql 建表
 *   2. .env.local 中已配置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY
 */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { createClient } from "@supabase/supabase-js";

// 显式加载 .env.local（dotenv 默认只加载 .env）
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// ============================================================
// 配置
// ============================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ 缺少环境变量，请检查 .env.local");
  console.error("   NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 都是必需的");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 三种内容类型及其 MDX 文件所在目录
const CONTENT_DIR = path.join(process.cwd(), "content");

type ContentType = "calligraphy" | "photography" | "reflections";

// 每张表的字段映射
const TABLE_CONFIG: Record<
  ContentType,
  {
    table: string;
    // 将 MDX frontmatter 字段映射到数据库列
    fieldMap: Record<string, string>; // frontmatterKey → dbColumn
  }
> = {
  calligraphy: {
    table: "calligraphy",
    fieldMap: {
      title: "title",
      date: "date",
      description: "description",
      cover: "cover",
      year: "year",
      medium: "medium",
      category: "category",
    },
  },
  photography: {
    table: "photography",
    fieldMap: {
      title: "title",
      date: "date",
      description: "description",
      cover: "cover",
      location: "location",
      camera: "camera",
    },
  },
  reflections: {
    table: "reflections",
    fieldMap: {
      title: "title",
      date: "date",
      description: "description",
      category: "category",
    },
  },
};

// ============================================================
// 工具函数
// ============================================================

interface ParsedMdx {
  slug: string;
  frontmatter: Record<string, unknown>;
  content: string;
}

/**
 * 读取并解析单目录下的所有 MDX 文件
 */
function readMdxFiles(type: ContentType): ParsedMdx[] {
  const dir = path.join(CONTENT_DIR, type);

  if (!fs.existsSync(dir)) {
    console.warn(`⚠ 目录不存在: ${dir}`);
    return [];
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  return files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const { data, content } = matter(raw);
    return { slug, frontmatter: data, content };
  });
}

/**
 * 将一条 MDX 记录导入 Supabase
 */
async function importRecord(
  table: string,
  fieldMap: Record<string, string>,
  item: ParsedMdx
): Promise<boolean> {
  // 构建插入数据
  const row: Record<string, unknown> = {
    slug: item.slug,
    content: item.content.trim(),
    published: true,
  };

  // 映射 frontmatter 字段到数据库列
  for (const [fmKey, dbCol] of Object.entries(fieldMap)) {
    if (item.frontmatter[fmKey] !== undefined) {
      row[dbCol] = item.frontmatter[fmKey];
    }
  }

  const { error } = await supabase.from(table).upsert(row, {
    onConflict: "slug",
    ignoreDuplicates: false, // 更新已存在的记录
  });

  if (error) {
    console.error(`  ✗ ${item.slug}: ${error.message}`);
    return false;
  }

  return true;
}

// ============================================================
// 主流程
// ============================================================

async function migrate() {
  console.log("🚀 开始数据迁移...\n");

  const types: ContentType[] = ["calligraphy", "photography", "reflections"];
  let totalImported = 0;
  let totalFailed = 0;

  for (const type of types) {
    const config = TABLE_CONFIG[type];
    const items = readMdxFiles(type);

    if (items.length === 0) {
      console.log(`📭 ${type}: 没有找到 MDX 文件\n`);
      continue;
    }

    console.log(`📂 ${type} (${items.length} 篇):`);

    let imported = 0;
    let failed = 0;

    for (const item of items) {
      const ok = await importRecord(config.table, config.fieldMap, item);
      if (ok) {
        console.log(`  ✓ ${item.slug}`);
        imported++;
      } else {
        failed++;
      }
    }

    console.log(`  结果: ${imported} 成功, ${failed} 失败\n`);
    totalImported += imported;
    totalFailed += failed;
  }

  console.log("=".repeat(50));
  console.log(`✨ 迁移完成: ${totalImported} 成功, ${totalFailed} 失败`);
}

migrate().catch((err) => {
  console.error("❌ 迁移脚本执行失败:", err);
  process.exit(1);
});
