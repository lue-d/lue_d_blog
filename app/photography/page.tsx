"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getContentListClient, type ContentMeta } from "@/lib/content-supabase-client";

export default function PhotographyPage() {
  const [items, setItems] = useState<ContentMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContentListClient("photography").then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-6 pt-16 pb-24">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-serif)] tracking-wide">
            摄影集
          </h1>
          <p className="text-ink-muted dark:text-ink-dark-muted mt-3">
            用镜头捕捉光影，记录每一个瞬间
          </p>
        </div>

        {loading ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="break-inside-avoid">
                <div className="rounded-lg bg-ink-border/20 animate-pulse w-full aspect-[3/2]" />
                <div className="h-5 w-3/4 bg-ink-border/20 rounded animate-pulse mt-2" />
                <div className="h-4 w-1/2 bg-ink-border/20 rounded animate-pulse mt-1" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-ink-muted dark:text-ink-dark-muted mb-2">
              还没有摄影作品
            </p>
            <p className="text-sm text-ink-muted dark:text-ink-dark-muted">
              在管理后台中创建并发布内容即可自动展示
            </p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {items.map((item) => (
              <Link
                key={item.slug}
                href={`/photography/${item.slug}`}
                className="group block break-inside-avoid"
              >
                <div className="relative rounded-lg overflow-hidden bg-ink-border/30">
                  {item.cover ? (
                    <Image
                      src={item.cover}
                      alt={item.title}
                      width={600}
                      height={400}
                      unoptimized
                      className="w-full h-auto group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full aspect-[3/2] flex items-center justify-center text-ink-muted">
                      暂无图片
                    </div>
                  )}
                </div>
                <h2 className="text-base font-semibold mt-2 group-hover:text-ink-accent transition-colors font-[family-name:var(--font-serif)]">
                  {item.title}
                </h2>
                <div className="text-xs text-ink-muted dark:text-ink-dark-muted mt-1">
                  {item.date}
                  {item.location ? ` · ${item.location}` : ""}
                  {item.camera ? ` · ${item.camera}` : ""}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
