"use client";

import Link from "next/link";
import Image from "next/image";
import type { ContentMeta } from "@/lib/content-supabase-client";

interface Props {
  posts: ContentMeta[];
  basePath: string; // e.g. "/photography"
}

/**
 * 相关推荐卡片区
 * 3 列 grid，优先展示同分类文章
 */
export default function RelatedPosts({ posts, basePath }: Props) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-ink-border dark:border-ink-dark-muted/20">
      <h2 className="text-xl font-bold font-[family-name:var(--font-serif)] mb-6">
        相关推荐
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((item) => (
          <Link
            key={item.slug}
            href={`${basePath}/${item.slug}`}
            className="group block"
          >
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-ink-border/30 mb-2 shadow-card group-hover:shadow-card-hover transition-shadow duration-500">
              {item.gallery_thumbnail ?? item.cover ? (
                <Image
                  src={(item.gallery_thumbnail ?? item.cover)!}
                  alt={item.title}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-muted text-sm">
                  暂无图片
                </div>
              )}
            </div>
            <h3 className="text-sm font-semibold group-hover:text-ink-accent transition-colors line-clamp-1 font-[family-name:var(--font-serif)]">
              {item.title}
            </h3>
            <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-0.5 line-clamp-1">
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
