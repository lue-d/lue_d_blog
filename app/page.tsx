"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import DailyQuote from "@/components/DailyQuote";
import Footer from "@/components/Footer";
import StatsBar from "@/components/StatsBar";
import { getContentListClient, type ContentMeta } from "@/lib/content-supabase-client";

export default function Home() {
  const [calligraphies, setCalligraphies] = useState<ContentMeta[]>([]);
  const [photos, setPhotos] = useState<ContentMeta[]>([]);
  const [reflections, setReflections] = useState<ContentMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getContentListClient("calligraphy"),
      getContentListClient("photography"),
      getContentListClient("reflections"),
    ]).then(([c, p, r]) => {
      setCalligraphies(c.slice(0, 3));
      setPhotos(p.slice(0, 3));
      setReflections(r.slice(0, 3));
      setLoading(false);
    });
  }, []);

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero + 统计 */}
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-24">
          <h1 className="text-4xl md:text-6xl font-bold font-[family-name:var(--font-serif)] tracking-wider mb-6 text-center">
            与墨言
          </h1>

          <div className="relative flex justify-center">
            {/* 中间：每日正能量 */}
            <DailyQuote />

            {/* 右侧：统计（与正能量对齐） */}
            <div className="hidden md:block absolute right-0 top-0">
              <StatsBar />
            </div>
          </div>

          {/* 移动端：统计在下方，居中 */}
          <div className="md:hidden mt-8 flex justify-center">
            <StatsBar />
          </div>
        </section>

        {loading ? (
          <>
            <SkeletonSection />
            <SkeletonSection />
            <SkeletonSection />
          </>
        ) : (
          <>
            {/* 书法精选 */}
            {calligraphies.length > 0 && (
              <Section title="书法精选" href="/calligraphy">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {calligraphies.map((item) => (
                    <Card key={item.slug} item={item} href={`/calligraphy/${item.slug}`} />
                  ))}
                </div>
              </Section>
            )}

            {/* 摄影精选 */}
            {photos.length > 0 && (
              <Section title="摄影精选" href="/photography">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {photos.map((item) => (
                    <Card key={item.slug} item={item} href={`/photography/${item.slug}`} />
                  ))}
                </div>
              </Section>
            )}

            {/* 最新感悟 */}
            {reflections.length > 0 && (
              <Section title="最新感悟" href="/reflections">
                <div className="space-y-6 max-w-2xl mx-auto">
                  {reflections.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/reflections/${item.slug}`}
                      className="block group"
                    >
                      <article className="py-4 border-b border-ink-border dark:border-ink-dark-muted/20 last:border-0">
                        <time className="text-xs text-ink-muted dark:text-ink-dark-muted">
                          {item.date}
                        </time>
                        <h3 className="text-lg font-semibold mt-1 group-hover:text-ink-accent transition-colors font-[family-name:var(--font-serif)]">
                          {item.title}
                        </h3>
                        <p className="text-sm text-ink-muted dark:text-ink-dark-muted mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </article>
                    </Link>
                  ))}
                </div>
              </Section>
            )}

            {/* 空状态 */}
            {calligraphies.length === 0 && photos.length === 0 && reflections.length === 0 && (
              <section className="max-w-2xl mx-auto px-6 pb-32 text-center">
                <p className="text-ink-muted dark:text-ink-dark-muted mb-4">
                  内容还在准备中，先去管理后台添加一些作品吧
                </p>
                <p className="text-sm text-ink-muted dark:text-ink-dark-muted">
                  创建并发布内容后，这里将自动展示
                </p>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

/* ===== 内部组件 ===== */

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="max-w-5xl mx-auto px-6 pb-20">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold font-[family-name:var(--font-serif)] tracking-wide">
          {title}
        </h2>
        <Link
          href={href}
          className="text-sm text-ink-muted hover:text-ink-accent transition-colors"
        >
          查看全部 →
        </Link>
      </div>
      {children}
    </section>
  );
}

function Card({
  item,
  href,
}: {
  item: { slug: string; title: string; description: string; cover?: string | null };
  href: string;
}) {
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-ink-border/30 mb-3">
        {item.cover ? (
          <Image
            src={item.cover}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-muted text-sm">
            暂无图片
          </div>
        )}
      </div>
      <h3 className="text-base font-semibold group-hover:text-ink-accent transition-colors font-[family-name:var(--font-serif)]">
        {item.title}
      </h3>
      <p className="text-sm text-ink-muted dark:text-ink-dark-muted mt-1 line-clamp-2">
        {item.description}
      </p>
    </Link>
  );
}

function SkeletonSection() {
  return (
    <section className="max-w-5xl mx-auto px-6 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="h-7 w-28 bg-ink-border/30 rounded animate-pulse" />
        <div className="h-4 w-20 bg-ink-border/20 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="aspect-[4/3] rounded-lg bg-ink-border/20 animate-pulse mb-3" />
            <div className="h-5 w-3/4 bg-ink-border/20 rounded animate-pulse mb-1" />
            <div className="h-4 w-full bg-ink-border/20 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
}
