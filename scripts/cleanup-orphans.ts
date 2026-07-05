/**
 * 清理孤儿数据：删除已不存在帖子对应的留言和画廊图片
 *
 * 用法：
 *   npx tsx scripts/cleanup-orphans.ts          # 仅检查，不删除
 *   npx tsx scripts/cleanup-orphans.ts --delete # 检查并删除
 */

import { createClient } from "@supabase/supabase-js";

// 从 .env.local 加载环境变量
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CONTENT_TYPES = ["calligraphy", "photography", "reflections"] as const;

async function main() {
  const shouldDelete = process.argv.includes("--delete");

  // 1. 收集所有现存帖子的 slug
  const existingSlugs = new Map<string, Set<string>>();
  for (const type of CONTENT_TYPES) {
    const { data, error } = await supabase
      .from(type)
      .select("slug");
    if (error) {
      console.error(`❌ 查询 ${type} 失败:`, error.message);
      process.exit(1);
    }
    existingSlugs.set(type, new Set((data || []).map((r: any) => r.slug)));
    console.log(`📋 ${type}: ${existingSlugs.get(type)!.size} 条记录`);
  }

  // 2. 查找孤儿评论
  console.log("\n🔍 检查孤儿留言...");
  const { data: allComments, error: commentsErr } = await supabase
    .from("comments")
    .select("*")
    .order("created_at", { ascending: false });

  if (commentsErr) {
    console.error("❌ 查询 comments 失败:", commentsErr.message);
    process.exit(1);
  }

  const orphanComments = (allComments || []).filter((c: any) => {
    const slugs = existingSlugs.get(c.post_type);
    return !slugs || !slugs.has(c.post_slug);
  });

  console.log(`   留言总数: ${(allComments || []).length}`);
  console.log(`   孤儿留言: ${orphanComments.length}`);

  if (orphanComments.length > 0) {
    console.log("\n   孤儿留言列表:");
    for (const c of orphanComments) {
      console.log(
        `   - [${c.post_type}] ${c.post_slug} | ${c.author_name}: ${c.content.slice(0, 40)}...`
      );
    }
  }

  // 3. 查找孤儿图片
  console.log("\n🔍 检查孤儿画廊图片...");
  const { data: allImages, error: imagesErr } = await supabase
    .from("images")
    .select("*")
    .order("created_at", { ascending: false });

  if (imagesErr) {
    console.error("❌ 查询 images 失败:", imagesErr.message);
    process.exit(1);
  }

  const orphanImages = (allImages || []).filter((img: any) => {
    const slugs = existingSlugs.get(img.post_type);
    return !slugs || !slugs.has(img.post_slug);
  });

  console.log(`   图片总数: ${(allImages || []).length}`);
  console.log(`   孤儿图片: ${orphanImages.length}`);

  if (orphanImages.length > 0) {
    console.log("\n   孤儿图片列表:");
    for (const img of orphanImages) {
      console.log(
        `   - [${img.post_type}] ${img.post_slug} | ${img.url.slice(0, 80)}`
      );
    }
  }

  // 4. 删除
  if (shouldDelete) {
    const orphanCommentIds = orphanComments.map((c: any) => c.id);
    const orphanImageIds = orphanImages.map((i: any) => i.id);

    if (orphanCommentIds.length > 0) {
      console.log(`\n🗑️  删除 ${orphanCommentIds.length} 条孤儿留言...`);
      const { error } = await supabase
        .from("comments")
        .delete()
        .in("id", orphanCommentIds);
      if (error) {
        console.error("❌ 删除留言失败:", error.message);
      } else {
        console.log("✅ 留言已删除");
      }
    }

    if (orphanImageIds.length > 0) {
      console.log(`\n🗑️  删除 ${orphanImageIds.length} 张孤儿图片...`);
      const { error } = await supabase
        .from("images")
        .delete()
        .in("id", orphanImageIds);
      if (error) {
        console.error("❌ 删除图片失败:", error.message);
      } else {
        console.log("✅ 图片已删除");
      }
    }

    if (orphanCommentIds.length === 0 && orphanImageIds.length === 0) {
      console.log("\n✅ 没有孤儿数据需要清理");
    }
  } else {
    console.log(
      "\n💡 这是预览模式，未实际删除。如需删除请运行："
    );
    console.log("   npx tsx scripts/cleanup-orphans.ts --delete");
  }
}

main().catch(console.error);
