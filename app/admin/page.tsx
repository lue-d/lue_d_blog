"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getAdminCommentStats } from "@/lib/comments-admin";

const GITHUB_REPO = "lue-d/lue_d_blog";

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
  const [commentStats, setCommentStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
  });
  const [loading, setLoading] = useState(true);

  const [deploying, setDeploying] = useState(false);
  const [deployMsg, setDeployMsg] = useState("");

  useEffect(() => {
    async function fetchCounts() {
      const types: ContentType[] = [
        "calligraphy",
        "photography",
        "reflections",
      ];
      const [contentResults, commentStatsResult] = await Promise.all([
        Promise.all(
          types.map(async (type) => {
            const { count, error } = await supabase
              .from(type)
              .select("*", { count: "exact", head: true });
            return { type, count: error ? 0 : (count ?? 0) };
          })
        ),
        getAdminCommentStats(),
      ]);

      const newCounts = { ...counts };
      contentResults.forEach(({ type, count }) => {
        newCounts[type] = count;
      });
      setCounts(newCounts);
      setCommentStats(commentStatsResult);
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
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
        {/* 留言卡片 */}
        <Link
          href="/admin/comments"
          className="block p-6 rounded-xl border border-ink-border dark:border-ink-dark-muted/20 bg-white/60 dark:bg-white/5 hover:shadow-card-hover transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold font-[family-name:var(--font-serif)]">
              留言
            </h2>
            <span className="text-2xl">💬</span>
          </div>
          <p className="text-sm text-ink-muted dark:text-ink-dark-muted mb-4">
            审核和管理访客留言
          </p>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-ink-accent">
              {loading ? "—" : commentStats.total}
            </span>
            <span className="text-xs text-ink-muted">
              {loading ? "" : `${commentStats.pending} 待审核`}
            </span>
          </div>
        </Link>
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

      {/* 发布更新 */}
      <div className="mt-12 p-6 rounded-xl border border-ink-border dark:border-ink-dark-muted/20 bg-white/60 dark:bg-white/5">
        <h2 className="text-lg font-semibold font-[family-name:var(--font-serif)] mb-2">
          发布更新
        </h2>
        <p className="text-sm text-ink-muted dark:text-ink-dark-muted mb-4">
          内容修改后，点击此按钮重新构建并部署网站，约 1-2 分钟生效。
          首次使用需要输入 GitHub Personal Access Token（需 workflows 权限）。
        </p>
        <button
          onClick={async () => {
            setDeploying(true);
            setDeployMsg("");
            const token = prompt(
              "请输入 GitHub Personal Access Token（首次使用）：\n\n创建方法：GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → 选择仓库 + Workflows 权限"
            );
            if (!token) {
              setDeploying(false);
              return;
            }
            try {
              const res = await fetch(
                `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/deploy.yml/dispatches`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.github+json",
                  },
                  body: JSON.stringify({ ref: "master" }),
                }
              );
              if (res.ok) {
                setDeployMsg("已触发部署，约 1-2 分钟后生效");
              } else {
                setDeployMsg(`触发失败 (${res.status})，请检查 Token 权限`);
              }
            } catch {
              setDeployMsg("网络错误，请重试");
            }
            setDeploying(false);
          }}
          disabled={deploying}
          className="px-4 py-2 bg-ink-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {deploying ? "触发中..." : "🚀 发布更新"}
        </button>
        {deployMsg && (
          <p className="mt-3 text-sm text-ink-accent">{deployMsg}</p>
        )}
      </div>
    </div>
  );
}
