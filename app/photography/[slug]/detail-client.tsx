"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CommentSection from "@/components/CommentSection";
import { getContentDataClient, type ContentMeta } from "@/lib/content-supabase-client";

export default function PhotographyDetailClient({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [data, setData] = useState<{ meta: ContentMeta; html: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getContentDataClient("photography", slug).then((result) => {
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
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 pt-16 pb-24">
        <Link
          href="/photography"
          className="text-sm text-ink-muted hover:text-ink-accent transition-colors"
        >
          ← 返回摄影集
        </Link>

        {loading ? (
          <article className="mt-8">
            <div className="aspect-[3/2] rounded-lg bg-ink-border/20 animate-pulse mb-8" />
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
              未找到该摄影作品
            </p>
            <Link
              href="/photography"
              className="text-sm text-ink-accent hover:text-ink-green transition-colors"
            >
              ← 返回摄影集
            </Link>
          </div>
        ) : data ? (
          <article className="mt-8">
            {data.meta.cover && (
              <div className="relative aspect-[3/2] rounded-lg overflow-hidden bg-ink-border/30 mb-8">
                <Image
                  src={data.meta.cover}
                  alt={data.meta.title}
                  fill
                  unoptimized
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 896px"
                  priority
                />
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-serif)] tracking-wide mb-4">
              {data.meta.title}
            </h1>

            <div className="flex flex-wrap gap-4 text-sm text-ink-muted dark:text-ink-dark-muted mb-8">
              {data.meta.date && <span>{data.meta.date}</span>}
              {data.meta.location && <span>📍 {data.meta.location}</span>}
              {data.meta.camera && <span>📷 {data.meta.camera}</span>}
            </div>

            <div className="prose" dangerouslySetInnerHTML={{ __html: data.html }} />
          </article>
        ) : null}

        {data && (
          <CommentSection
            postType="photography"
            postSlug={slug}
            postTitle={data.meta.title}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
