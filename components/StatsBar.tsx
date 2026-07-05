"use client";

import Link from "next/link";

interface StatsBarProps {
  totalPhotography: number;
  totalCalligraphy: number;
  totalComments: number;
}

export default function StatsBar({
  totalPhotography,
  totalCalligraphy,
  totalComments,
}: StatsBarProps) {
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
