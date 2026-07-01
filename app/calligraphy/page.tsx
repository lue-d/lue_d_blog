"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { getContentListClient, type ContentMeta } from "@/lib/content-supabase-client";

export default function CalligraphyPage() {
  const [items, setItems] = useState<ContentMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContentListClient("calligraphy").then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 pt-16 pb-24">
        <Breadcrumb
          items={[
            { label: "首页", href: "/" },
            { label: "书法集" },
          ]}
        />
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-serif)] tracking-wide">
            书法集
          </h1>
          <p className="text-ink-muted dark:text-ink-dark-muted mt-3">
            笔墨之间，见字如面
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="aspect-[4/3] rounded-lg bg-ink-border/20 animate-pulse mb-3" />
                <div className="h-5 w-3/4 bg-ink-border/20 rounded animate-pulse mb-1" />
                <div className="h-4 w-1/2 bg-ink-border/20 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState type="书法作品" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => (
              <Link
                key={item.slug}
                href={`/calligraphy/${item.slug}`}
                className="group block"
              >
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-ink-border/30 mb-3">
                  {item.cover ? (
                    <Image
                      src={item.cover}
                      alt={item.title}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-muted">
                      暂无图片
                    </div>
                  )}
                </div>
                <h2 className="text-lg font-semibold group-hover:text-ink-accent transition-colors font-[family-name:var(--font-serif)]">
                  {item.title}
                </h2>
                {item.year && (
                  <p className="text-sm text-ink-muted dark:text-ink-dark-muted mt-1">
                    {item.year}{item.medium ? ` · ${item.medium}` : ""}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function EmptyState({ type }: { type: string }) {
  return (
    <div className="text-center py-24">
      <p className="text-ink-muted dark:text-ink-dark-muted mb-2">
        还没有{type}
      </p>
      <p className="text-sm text-ink-muted dark:text-ink-dark-muted">
        在管理后台中创建并发布内容即可自动展示
      </p>
    </div>
  );
}
