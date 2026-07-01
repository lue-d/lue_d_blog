"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CommentSection from "@/components/CommentSection";
import { getContentDataClient, type ContentMeta } from "@/lib/content-supabase-client";

export default function CalligraphyDetailClient({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [data, setData] = useState<{ meta: ContentMeta; html: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getContentDataClient("calligraphy", slug).then((result) => {
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
          href="/calligraphy"
          className="text-sm text-ink-muted hover:text-ink-accent transition-colors"
        >
          ← 返回书法集
        </Link>

        {loading ? (
          <article className="mt-8">
            <div className="aspect-[4/3] rounded-lg bg-ink-border/20 animate-pulse mb-8" />
            <div className="h-9 w-2/3 bg-ink-border/20 rounded animate-pulse mb-4" />
            <div className="flex gap-4 mb-8">
              <div className="h-4 w-16 bg-ink-border/20 rounded animate-pulse" />
              <div className="h-4 w-24 bg-ink-border/20 rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-ink-border/20 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-ink-border/20 rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-ink-border/20 rounded animate-pulse" />
            </div>
          </article>
        ) : notFound ? (
          <div className="text-center py-24">
            <p className="text-ink-muted dark:text-ink-dark-muted mb-2">
              未找到该书法作品
            </p>
            <Link
              href="/calligraphy"
              className="text-sm text-ink-accent hover:text-ink-green transition-colors"
            >
              ← 返回书法集
            </Link>
          </div>
        ) : data ? (
          <article className="mt-8">
            {data.meta.cover && (
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-ink-border/30 mb-8">
                <Image
                  src={data.meta.cover}
                  alt={data.meta.title}
                  fill
                  unoptimized
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 768px"
                  priority
                />
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-serif)] tracking-wide mb-4">
              {data.meta.title}
            </h1>

            <div className="flex flex-wrap gap-4 text-sm text-ink-muted dark:text-ink-dark-muted mb-8">
              {data.meta.year && <span>{data.meta.year}</span>}
              {data.meta.medium && <span>材质：{data.meta.medium}</span>}
              {data.meta.category && <span>书体：{data.meta.category}</span>}
            </div>

            <div className="prose" dangerouslySetInnerHTML={{ __html: data.html }} />
          </article>
        ) : null}

        {data && (
          <CommentSection
            postType="calligraphy"
            postSlug={slug}
            postTitle={data.meta.title}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
