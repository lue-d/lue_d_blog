"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getContentListClient, type ContentMeta } from "@/lib/content-supabase-client";

export default function ReflectionsPage() {
  const [items, setItems] = useState<ContentMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContentListClient("reflections").then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-16 pb-24">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-serif)] tracking-wide">
            感悟
          </h1>
          <p className="text-ink-muted dark:text-ink-dark-muted mt-3">
            在流淌的时光里，记录每一次思考
          </p>
        </div>

        {loading ? (
          <div className="space-y-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="py-6 border-b border-ink-border dark:border-ink-dark-muted/20 last:border-0">
                <div className="flex gap-6">
                  <div className="w-24 h-24 rounded-lg bg-ink-border/20 animate-pulse flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 w-20 bg-ink-border/20 rounded animate-pulse" />
                    <div className="h-6 w-3/4 bg-ink-border/20 rounded animate-pulse mt-1" />
                    <div className="h-4 w-full bg-ink-border/20 rounded animate-pulse mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-ink-muted dark:text-ink-dark-muted mb-2">
              还没有文章
            </p>
            <p className="text-sm text-ink-muted dark:text-ink-dark-muted">
              在管理后台中创建并发布内容即可自动展示
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {items.map((item) => (
              <Link
                key={item.slug}
                href={`/reflections/${item.slug}`}
                className="block group py-6 border-b border-ink-border dark:border-ink-dark-muted/20 last:border-0"
              >
                <article className="flex gap-6">
                  {item.cover && (
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-ink-border/30">
                      <Image
                        src={item.cover}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <time className="text-xs text-ink-muted dark:text-ink-dark-muted">
                      {item.date}
                    </time>
                    <h2 className="text-xl font-semibold mt-1 group-hover:text-ink-accent transition-colors font-[family-name:var(--font-serif)]">
                      {item.title}
                    </h2>
                    <p className="text-sm text-ink-muted dark:text-ink-dark-muted mt-2 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
