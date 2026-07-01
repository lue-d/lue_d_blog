"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getAllComments,
  togglePublish,
  deleteComment,
  getTypeLabel,
  getAdminCommentStats,
  type Comment,
} from "@/lib/comments-admin";

const TYPE_FILTER_OPTIONS = [
  { value: "", label: "全部类型" },
  { value: "calligraphy", label: "书法" },
  { value: "photography", label: "摄影" },
  { value: "reflections", label: "感悟" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "全部状态" },
  { value: "pending", label: "待审核" },
  { value: "approved", label: "已通过" },
];

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });

  // 筛选
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // 操作状态
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const filter: { post_type?: string; published?: boolean } = {};
    if (typeFilter) filter.post_type = typeFilter;
    if (statusFilter === "pending") filter.published = false;
    else if (statusFilter === "approved") filter.published = true;

    Promise.all([getAllComments(filter), getAdminCommentStats()]).then(
      ([list, s]) => {
        setComments(list);
        setStats(s);
        setLoading(false);
      }
    );
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleTogglePublish(id: string, current: boolean) {
    setActionLoading(id);
    try {
      await togglePublish(id, !current);
      await fetchData();
    } catch {
      alert("操作失败，请重试");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(id);
    try {
      await deleteComment(id);
      setDeleteConfirm(null);
      await fetchData();
    } catch {
      alert("删除失败，请重试");
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function truncate(text: string, max: number): string {
    return text.length > max ? text.slice(0, max) + "..." : text;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-serif)] tracking-wide">
          留言管理
        </h1>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-lg border border-ink-border dark:border-ink-dark-muted/20 bg-white/60 dark:bg-white/5">
          <p className="text-xs text-ink-muted mb-1">全部留言</p>
          <p className="text-2xl font-bold text-ink-text dark:text-ink-dark-text">
            {stats.total}
          </p>
        </div>
        <div className="p-4 rounded-lg border border-amber-300 dark:border-amber-700/30 bg-amber-50/60 dark:bg-amber-500/5">
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">
            待审核
          </p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
            {stats.pending}
          </p>
        </div>
        <div className="p-4 rounded-lg border border-green-300 dark:border-green-700/30 bg-green-50/60 dark:bg-green-500/5">
          <p className="text-xs text-green-600 dark:text-green-400 mb-1">
            已通过
          </p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {stats.approved}
          </p>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex gap-3 mb-6">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input w-auto text-sm"
        >
          {TYPE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto text-sm"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {(typeFilter || statusFilter) && (
          <button
            onClick={() => {
              setTypeFilter("");
              setStatusFilter("");
            }}
            className="text-sm text-ink-muted hover:text-ink-accent transition-colors"
          >
            清除筛选
          </button>
        )}
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-ink-border/10 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-ink-muted dark:text-ink-dark-muted">
            {typeFilter || statusFilter
              ? "没有匹配的留言"
              : "暂无留言"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`p-4 rounded-lg border bg-white/60 dark:bg-white/5 transition-colors ${
                c.published
                  ? "border-ink-border dark:border-ink-dark-muted/20"
                  : "border-amber-300 dark:border-amber-700/30 bg-amber-50/30 dark:bg-amber-500/5"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* 头部信息 */}
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <span className="text-sm font-medium text-ink-text dark:text-ink-dark-text">
                      {c.author_name}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {c.author_email}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        c.published
                          ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                      }`}
                    >
                      {c.published ? "已通过" : "待审核"}
                    </span>
                  </div>

                  {/* 留言内容 */}
                  <p className="text-sm text-ink-text/80 dark:text-ink-dark-text/80 mb-2 whitespace-pre-wrap">
                    {c.content}
                  </p>

                  {/* 关联信息 */}
                  <div className="flex items-center flex-wrap gap-3 text-xs text-ink-muted">
                    <span>
                      {getTypeLabel(c.post_type)} ·{" "}
                      <Link
                        href={`/${c.post_type}/${c.post_slug}/#comments`}
                        target="_blank"
                        className="text-ink-accent hover:text-ink-green transition-colors"
                      >
                        {truncate(c.post_title, 20)}
                      </Link>
                    </span>
                    <span>{formatDate(c.created_at)}</span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() =>
                      handleTogglePublish(c.id, c.published)
                    }
                    disabled={actionLoading === c.id}
                    className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                      actionLoading === c.id
                        ? "opacity-50 cursor-not-allowed"
                        : c.published
                          ? "bg-ink-border/20 text-ink-muted hover:bg-ink-border/40"
                          : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/10 dark:text-green-400"
                    }`}
                  >
                    {actionLoading === c.id
                      ? "..."
                      : c.published
                        ? "驳回"
                        : "通过"}
                  </button>

                  {deleteConfirm === c.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={actionLoading === c.id}
                        className="text-xs px-2 py-1.5 rounded-md bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-500/10 dark:text-red-400"
                      >
                        确认
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-xs px-2 py-1.5 rounded-md bg-ink-border/20 text-ink-muted hover:bg-ink-border/40"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(c.id)}
                      className="text-xs px-3 py-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5 transition-colors"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
