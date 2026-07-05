"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CommentSection from "@/components/CommentSection";
import Breadcrumb from "@/components/Breadcrumb";
import Carousel from "@/components/Carousel";
import Lightbox from "@/components/Lightbox";
import RelatedPosts from "@/components/RelatedPosts";
import type { ContentMeta } from "@/lib/content-supabase";
import type { GalleryImage } from "@/lib/gallery";

export default function ReflectionDetailClient({
  slug,
  initialData,
  initialGallery,
  initialRelatedPosts,
}: {
  slug: string;
  initialData: { meta: ContentMeta; html: string } | null;
  initialGallery: GalleryImage[];
  initialRelatedPosts: ContentMeta[];
}) {
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-16 pb-24">
        <Breadcrumb
          items={[
            { label: "首页", href: "/" },
            { label: "感悟", href: "/reflections" },
            ...(initialData ? [{ label: initialData.meta.title }] : []),
          ]}
        />

        {!initialData ? (
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
        ) : (
          <article className="mt-8">
            <header className="mb-10">
              <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-serif)] tracking-wide mb-4">
                {initialData.meta.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-ink-muted dark:text-ink-dark-muted">
                {initialData.meta.date && <time>{initialData.meta.date}</time>}
                {initialData.meta.category && (
                  <>
                    <span className="text-ink-border">|</span>
                    <span>{initialData.meta.category}</span>
                  </>
                )}
              </div>
            </header>

            {/* 走马灯展示作品图片，无作品图片时回退到封面 */}
            {initialGallery.length > 0 ? (
              <div className="mb-10">
                <Carousel
                  images={initialGallery}
                  aspectRatio="16/9"
                  onImageClick={(idx) => {
                    setLightboxIndex(idx);
                    setLightboxOpen(true);
                  }}
                />
              </div>
            ) : initialData.meta.cover ? (
              <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-ink-border/30 mb-10">
                <Image
                  src={initialData.meta.cover}
                  alt={initialData.meta.title}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                  priority
                />
              </div>
            ) : null}

            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: initialData.html }}
            />
          </article>
        )}

        {initialData && initialRelatedPosts.length > 0 && (
          <RelatedPosts posts={initialRelatedPosts} basePath="/reflections" />
        )}

        {initialData && (
          <CommentSection
            postType="reflections"
            postSlug={slug}
            postTitle={initialData.meta.title}
          />
        )}
      </main>
      <Footer />

      <Lightbox
        images={initialGallery}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
