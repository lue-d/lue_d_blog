"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getContentDataClient, type ContentMeta } from "@/lib/content-supabase-client";

export default function ReflectionDetailClient({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [data, setData] = useState<{ meta: ContentMeta; html: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getContentDataClient("reflections", slug).then((result) => {
      if (!result) {
        setNotFound(true);
      } else {
        setData(result);
      }
      setLoading(false);
    });
  }, [slug]);

  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-16 pb-24">
        <Link
          href="/reflections"
          className="text-sm text-ink-muted hover:text-ink-accent transition-colors"
        >
          ← 返回感悟
        </Link>

        {loading ? (
          <article className="mt-8">
            <div className="h-9 w-2/3 bg-ink-border/20 rounded animate-pulse mb-4" />
            <div className="flex gap-4 mb-10">
              <div className="h-4 w-20 bg-ink-border/20 rounded animate-pulse" />
            </div>
            <div className="aspect-[16/9] rounded-lg bg-ink-border/20 animate-pulse mb-10" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-ink-border/20 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-ink-border/20 rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-ink-border/20 rounded animate-pulse" />
            </div>
          </article>
        ) : notFound ? (
          <div className="text-center py-24">
            <p className="text-ink-muted dark:text-ink-dark-muted mb-2">
              未找到该文章
            </p>
            <Link
              href="/reflections"
              className="text-sm text-ink-accent hover:text-ink-green transition-colors"
            >
              ← 返回感悟
            </Link>
          </div>
        ) : data ? (
          <article className="mt-8">
            <header className="mb-10">
              <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-serif)] tracking-wide mb-4">
                {data.meta.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-ink-muted dark:text-ink-dark-muted">
                {data.meta.date && <time>{data.meta.date}</time>}
                {data.meta.category && (
                  <>
                    <span className="text-ink-border">|</span>
                    <span>{data.meta.category}</span>
                  </>
                )}
              </div>
            </header>

            {data.meta.cover && (
              <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-ink-border/30 mb-10">
                <Image
                  src={data.meta.cover}
                  alt={data.meta.title}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                  priority
                />
              </div>
            )}

            <div className="prose" dangerouslySetInnerHTML={{ __html: data.html }} />
          </article>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
