"use client";

import { use } from "react";
import Link from "next/link";
import ContentForm from "@/components/ContentForm";

type ContentType = "calligraphy" | "photography" | "reflections";

const TYPE_LABEL: Record<ContentType, string> = {
  calligraphy: "书法",
  photography: "摄影",
  reflections: "感悟",
};

const VALID_TYPES: ContentType[] = ["calligraphy", "photography", "reflections"];

export default function AdminNewPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = use(params);

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

  return (
    <div className="max-w-2xl">
      <Link
        href={`/admin/${ct}`}
        className="text-sm text-ink-muted hover:text-ink-accent transition-colors"
      >
        ← 返回{label}管理
      </Link>

      <h1 className="text-2xl font-bold font-[family-name:var(--font-serif)] tracking-wide mt-4 mb-8">
        新增{label}
      </h1>

      <ContentForm type={ct} mode="create" />
    </div>
  );
}
