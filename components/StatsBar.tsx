"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCommentStats, type CommentStats } from "@/lib/comments-client";

export default function StatsBar() {
  const [stats, setStats] = useState<CommentStats | null>(null);

  useEffect(() => {
    getCommentStats().then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        <div className="h-5 w-24 bg-ink-border/20 rounded" />
        <div className="h-5 w-24 bg-ink-border/20 rounded" />
        <div className="h-5 w-24 bg-ink-border/20 rounded" />
      </div>
    );
  }

  const { totalPhotography, totalCalligraphy, totalComments } = stats;

  return (
    <div className="flex flex-col gap-3 text-sm">
      <Link
        href="/photography"
        className="flex items-center gap-2 text-ink-muted hover:text-ink-accent transition-colors"
      >
        <span>📷</span>
        <strong className="text-ink-text dark:text-ink-dark-text">
          {totalPhotography}
        </strong>
        <span>张摄影</span>
      </Link>
      <Link
        href="/calligraphy"
        className="flex items-center gap-2 text-ink-muted hover:text-ink-accent transition-colors"
      >
        <span>✒️</span>
        <strong className="text-ink-text dark:text-ink-dark-text">
          {totalCalligraphy}
        </strong>
        <span>幅书法</span>
      </Link>
      <span className="flex items-center gap-2 text-ink-muted">
        <span>💬</span>
        <strong className="text-ink-text dark:text-ink-dark-text">
          {totalComments}
        </strong>
        <span>条留言</span>
      </span>
    </div>
  );
}
