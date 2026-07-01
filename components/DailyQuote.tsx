"use client";

import quotes from "@/data/quotes.json";

/**
 * 每日正能量文案
 *
 * 根据日期每天轮换一句名言/诗句，
 * 跨年跨月自动循环。
 */
export default function DailyQuote() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const index = dayOfYear % quotes.length;
  const quote = quotes[index];

  return (
    <div className="max-w-lg mx-auto text-center md:text-left">
      {/* 正文 */}
      <blockquote className="relative z-10">
        <p className="text-lg md:text-xl leading-relaxed text-ink-muted dark:text-ink-dark-muted font-[family-name:var(--font-serif)] tracking-wide">
          {quote.text}
        </p>
      </blockquote>

      {/* 出处 */}
      <p className="mt-4 text-sm text-ink-muted/70 dark:text-ink-dark-muted/70 tracking-wide">
        —— {quote.source}
      </p>

      {/* 标签 */}
      <div className="mt-5">
        <span className="inline-block text-xs tracking-wider text-ink-accent/60 border border-ink-accent/20 rounded-full px-3 py-0.5">
          每日正能量
        </span>
      </div>
    </div>
  );
}
