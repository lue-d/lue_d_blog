"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ContentType = "calligraphy" | "photography" | "reflections";

const TYPE_LABEL: Record<ContentType, string> = {
  calligraphy: "书法",
  photography: "摄影",
  reflections: "感悟",
};

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Record<ContentType, number>>({
    calligraphy: 0,
    photography: 0,
    reflections: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      const types: ContentType[] = [
        "calligraphy",
        "photography",
        "reflections",
      ];
      const results = await Promise.all(
        types.map(async (type) => {
          const { count, error } = await supabase
            .from(type)
            .select("*", { count: "exact", head: true });
          return { type, count: error ? 0 : (count ?? 0) };
        })
      );

      const newCounts = { ...counts };
      results.forEach(({ type, count }) => {
        newCounts[type] = count;
      });
      setCounts(newCounts);
      setLoading(false);
    }
    fetchCounts();
  }, []);

  const cards: { type: ContentType; href: string; description: string }[] = [
    {
      type: "calligraphy",
      href: "/admin/calligraphy",
      description: "管理书法作品，添加新作或编辑已有内容",
    },
    {
      type: "photography",
      href: "/admin/photography",
      description: "管理摄影作品，上传照片与描述",
    },
    {
      type: "reflections",
      href: "/admin/reflections",
      description: "管理感悟文章，记录生活思考",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold font-[family-name:var(--font-serif)] tracking-wide mb-8">
        仪表盘
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {cards.map(({ type, href, description }) => (
          <Link
            key={type}
            href={href}
            className="block p-6 rounded-xl border border-ink-border dark:border-ink-dark-muted/20 bg-white/60 dark:bg-white/5 hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold font-[family-name:var(--font-serif)]">
                {TYPE_LABEL[type]}
              </h2>
              <span className="text-2xl">
                {type === "calligraphy"
                  ? "🖌️"
                  : type === "photography"
                    ? "📷"
                    : "💭"}
              </span>
            </div>
            <p className="text-sm text-ink-muted dark:text-ink-dark-muted mb-4">
              {description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-ink-accent">
                {loading ? "—" : counts[type]}
              </span>
              <span className="text-xs text-ink-muted">条记录</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex gap-4">
        {cards.map(({ type, href }) => (
          <Link
            key={type}
            href={`${href}/new`}
            className="btn-primary text-sm"
          >
            + 新增{TYPE_LABEL[type]}
          </Link>
        ))}
      </div>
    </div>
  );
}
