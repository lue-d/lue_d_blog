"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getComments,
  createComment,
  type Comment,
} from "@/lib/comments-client";

interface Props {
  postType: string;
  postSlug: string;
  postTitle: string;
}

export default function CommentSection({ postType, postSlug, postTitle }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // 表单
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchComments = useCallback(() => {
    setLoading(true);
    getComments(postType, postSlug).then((data) => {
      setComments(data);
      setLoading(false);
    });
  }, [postType, postSlug]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const trimmedName = authorName.trim();
    const trimmedEmail = authorEmail.trim();
    const trimmedContent = content.trim();

    if (!trimmedName) errs.authorName = "请输入昵称";
    else if (trimmedName.length > 50) errs.authorName = "昵称不超过 50 字";

    if (!trimmedEmail) errs.authorEmail = "请输入电子邮箱";
    else if (!/\S+@\S+\.\S+/.test(trimmedEmail))
      errs.authorEmail = "邮箱格式不正确";

    if (!trimmedContent) errs.content = "请输入留言内容";
    else if (trimmedContent.length > 2000) errs.content = "留言不超过 2000 字";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const result = await createComment({
      post_type: postType,
      post_slug: postSlug,
      post_title: postTitle,
      author_name: authorName.trim(),
      author_email: authorEmail.trim(),
      content: content.trim(),
    });
    setSubmitting(false);

    if (result.success) {
      setSubmitted(true);
      setAuthorName("");
      setAuthorEmail("");
      setContent("");
    } else {
      setErrors({ submit: result.error || "提交失败，请稍后重试" });
    }
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "今天";
    if (days === 1) return "昨天";
    if (days < 7) return `${days} 天前`;
    return d.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <section id="comments" className="mt-16 pt-12 border-t border-ink-border dark:border-ink-dark-muted/20">
      <h2 className="text-xl font-bold font-[family-name:var(--font-serif)] tracking-wide mb-8">
        留言 ({comments.length})
      </h2>

      {/* 留言列表 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-ink-border/30" />
                <div className="h-4 w-20 bg-ink-border/20 rounded" />
                <div className="h-3 w-16 bg-ink-border/20 rounded" />
              </div>
              <div className="h-4 w-3/4 bg-ink-border/20 rounded ml-11" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-ink-muted dark:text-ink-dark-muted">
          暂无留言，来发表第一条留言吧
        </p>
      ) : (
        <div className="space-y-6 mb-12">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              {/* 头像占位 */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-ink-accent/10 flex items-center justify-center text-xs font-medium text-ink-accent">
                {c.author_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-ink-text dark:text-ink-dark-text">
                    {c.author_name}
                  </span>
                  <span className="text-xs text-ink-muted/70 dark:text-ink-dark-muted/70">
                    {formatDate(c.created_at)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-ink-text/85 dark:text-ink-dark-text/85 whitespace-pre-wrap">
                  {c.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 提交表单 */}
      <div className="bg-ink-paper/50 dark:bg-ink-dark-bg/50 rounded-lg border border-ink-border dark:border-ink-dark-muted/20 p-6">
        <h3 className="text-base font-semibold font-[family-name:var(--font-serif)] mb-4">
          发表留言
        </h3>

        {submitted ? (
          <div className="text-center py-6">
            <p className="text-ink-green dark:text-ink-green font-medium mb-2">
              ✅ 留言已提交
            </p>
            <p className="text-sm text-ink-muted dark:text-ink-dark-muted">
              审核通过后将公开展示
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-3 text-sm text-ink-accent hover:text-ink-green transition-colors"
            >
              再写一条
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* 昵称 + 邮箱 并排 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-ink-text dark:text-ink-dark-text">
                  昵称 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className={`input ${
                    errors.authorName ? "border-red-400" : ""
                  }`}
                  placeholder="你的昵称"
                  maxLength={50}
                />
                {errors.authorName && (
                  <p className="text-xs text-red-400 mt-1">{errors.authorName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-ink-text dark:text-ink-dark-text">
                  电子邮箱 <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  className={`input ${
                    errors.authorEmail ? "border-red-400" : ""
                  }`}
                  placeholder="your@email.com"
                  maxLength={200}
                />
                {errors.authorEmail && (
                  <p className="text-xs text-red-400 mt-1">
                    {errors.authorEmail}
                  </p>
                )}
              </div>
            </div>

            {/* 留言内容 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-ink-text dark:text-ink-dark-text">
                留言内容 <span className="text-red-400">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className={`input resize-y ${
                  errors.content ? "border-red-400" : ""
                }`}
                placeholder="写下你想说的话..."
                maxLength={2000}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.content ? (
                  <p className="text-xs text-red-400">{errors.content}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-ink-muted">
                  {content.length}/2000
                </span>
              </div>
            </div>

            {/* 提交错误 */}
            {errors.submit && (
              <p className="text-sm text-red-400">{errors.submit}</p>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full sm:w-auto"
            >
              {submitting ? "提交中..." : "提交留言"}
            </button>

            <p className="text-xs text-ink-muted dark:text-ink-dark-muted">
              留言内容需审核通过后才会公开展示
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
