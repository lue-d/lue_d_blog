"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import ContentForm from "@/components/ContentForm";

type ContentType = "calligraphy" | "photography" | "reflections";

const TYPE_LABEL: Record<ContentType, string> = {
  calligraphy: "书法",
  photography: "摄影",
  reflections: "感悟",
};

const VALID_TYPES: ContentType[] = ["calligraphy", "photography", "reflections"];

export default function AdminEditPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = use(params);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    async function fetchItem() {
      const { supabase } = await import("@/lib/supabase");
      const { data: item, error: fetchError } = await supabase
        .from(ct)
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !item) {
        setError("未找到该记录");
      } else {
        setData(item);
      }
      setLoading(false);
    }
    fetchItem();
  }, [ct, id]);

  if (loading) {
    return (
      <div className="text-center py-24">
        <p className="text-ink-muted text-sm">加载中...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-24">
        <p className="text-ink-muted mb-2">{error || "未找到该记录"}</p>
        <Link
          href={`/admin/${ct}`}
          className="text-sm text-ink-accent inline-block mt-2"
        >
          ← 返回{label}管理
        </Link>
      </div>
    );
  }

  // 将数据库记录转换为表单初始值
  const initialData = {
    id: data.id as string,
    title: data.title as string,
    slug: data.slug as string,
    date: data.date ? String(data.date) : "",
    description: (data.description as string) || "",
    cover: (data.cover as string) || "",
    content: (data.content as string) || "",
    published: (data.published as boolean) ?? true,
    year: (data.year as string) || "",
    medium: (data.medium as string) || "",
    category: (data.category as string) || "",
    location: (data.location as string) || "",
    camera: (data.camera as string) || "",
  };

  return (
    <div className="max-w-2xl">
      <Link
        href={`/admin/${ct}`}
        className="text-sm text-ink-muted hover:text-ink-accent transition-colors"
      >
        ← 返回{label}管理
      </Link>

      <h1 className="text-2xl font-bold font-[family-name:var(--font-serif)] tracking-wide mt-4 mb-2">
        编辑{label}
      </h1>
      <p className="text-sm text-ink-muted mb-8">/{data.slug as string}</p>

      <ContentForm type={ct} mode="edit" initialData={initialData} />
    </div>
  );
}
