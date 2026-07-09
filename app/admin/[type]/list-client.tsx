"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { deleteAllGalleryImages } from "@/lib/gallery-client";
import type { ContentMeta } from "@/lib/content-supabase";
import { showToast, consumeStashedToast } from "@/components/Toast";

type ContentType = "calligraphy" | "photography" | "reflections";

const TYPE_LABEL: Record<ContentType, string> = {
  calligraphy: "书法",
  photography: "摄影",
  reflections: "感悟",
};

const VALID_TYPES: ContentType[] = ["calligraphy", "photography", "reflections"];

export default function AdminListClient({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = use(params);
  const [items, setItems] = useState<(ContentMeta & { id: string; published: boolean })[]>([]);
  const [galleryCounts, setGalleryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  if (!VALID_TYPES.includes(type as ContentType)) {
    return (
      <div className="text-center py-24">
        <p className="text-ink-muted">无效的内容类型</p>
        <Link href="/admin" className="text-sm text-ink-accent mt-2 inline-block">
          ← 返回仪表盘
        </Link>
      </div>
    );
  }

  const ct = type as ContentType;
  const label = TYPE_LABEL[ct];

  useEffect(() => {
    // 消费从创建/编辑页传来的 toast
    consumeStashedToast();
  }, []);

  useEffect(() => {
    async function fetchItems() {
      const { data, error } = await supabase
        .from(ct)
        .select("*")
        .order("date", { ascending: false });

      if (!error && data) {
        setItems(data as (ContentMeta & { id: string; published: boolean })[]);

        // 批量查询画廊图数量
        const slugs = (data as { slug: string }[]).map((d) => d.slug);
        if (slugs.length > 0) {
          const { data: countData } = await supabase
            .from("images")
            .select("post_slug")
            .eq("post_type", ct)
            .in("post_slug", slugs);

          const counts: Record<string, number> = {};
          for (const row of countData || []) {
            const r = row as { post_slug: string };
            counts[r.post_slug] = (counts[r.post_slug] || 0) + 1;
          }
          setGalleryCounts(counts);
        }
      }
      setLoading(false);
    }
    fetchItems();
  }, [ct]);

  const handleDelete = async (id: string, slug: string) => {
    if (!confirm("确定删除？此操作不可撤销。")) return;
    setDeleting(id);

    // 清理画廊图片记录
    await deleteAllGalleryImages(ct, slug);

    // 清理关联留言
    await supabase.from("comments").delete().eq("post_type", ct).eq("post_slug", slug);

    const { error } = await supabase.from(ct).delete().eq("id", id);
    if (!error) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      showToast("success", `${label}已删除`);
    } else {
      showToast("error", `删除失败: ${error.message}`);
    }
    setDeleting(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-serif)] tracking-wide">
          {label}管理
        </h1>
        <Link href={`/admin/${ct}/new`} className="btn-primary text-sm" title={`新增${label}作品`}>
          + 新增{label}
        </Link>
      </div>

      {loading ? (
        <p className="text-ink-muted text-sm">加载中...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-ink-muted mb-2">还没有{label}内容</p>
          <Link
            href={`/admin/${ct}/new`}
            className="text-sm text-ink-accent hover:text-ink-green transition-colors"
          >
            创建第一篇{label} →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-border dark:border-ink-dark-muted/20 text-left">
                <th className="py-3 pr-4 font-medium text-ink-muted w-16">封面</th>
                <th className="py-3 pr-4 font-medium text-ink-muted">标题</th>
                <th className="py-3 pr-4 font-medium text-ink-muted">日期</th>
                <th className="py-3 pr-4 font-medium text-ink-muted">状态</th>
                <th className="py-3 pr-4 font-medium text-ink-muted w-16">图片</th>
                <th className="py-3 pr-4 font-medium text-ink-muted w-24">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-ink-border/50 dark:border-ink-dark-muted/10 hover:bg-ink-border/10"
                >
                  <td className="py-3 pr-4">
                    {item.cover ? (
                      <div className="relative w-12 h-9 rounded overflow-hidden bg-ink-border/30">
                        <Image
                          src={item.cover}
                          alt={item.title}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-9 rounded bg-ink-border/20 flex items-center justify-center text-xs text-ink-muted">
                        —
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-ink-muted ml-2 text-xs">
                      /{item.slug}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-ink-muted text-xs">
                    {item.date}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        item.published
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {item.published ? "已发布" : "草稿"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-xs text-ink-muted">
                    {galleryCounts[item.slug] ? (
                      <span className="text-ink-accent font-medium">
                        {galleryCounts[item.slug]}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/${ct}/edit?id=${item.id}`}
                        className="text-xs text-ink-accent hover:text-ink-green transition-colors"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id, item.slug)}
                        disabled={deleting === item.id}
                        className="text-xs text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        {deleting === item.id ? "删除中" : "删除"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
