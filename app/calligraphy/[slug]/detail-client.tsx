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

export default function CalligraphyDetailClient({
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
            { label: "书法集", href: "/calligraphy" },
            ...(initialData ? [{ label: initialData.meta.title }] : []),
          ]}
        />

        {!initialData ? (
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
        ) : (
          <article className="mt-8">
            {/* 走马灯展示作品图片，无作品图片时回退到封面 */}
            {initialGallery.length > 0 ? (
              <div className="mb-8">
                <Carousel
                  images={initialGallery}
                  aspectRatio="4/3"
                  onImageClick={(idx) => {
                    setLightboxIndex(idx);
                    setLightboxOpen(true);
                  }}
                />
              </div>
            ) : initialData.meta.cover ? (
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-ink-border/30 mb-8">
                <Image
                  src={initialData.meta.cover}
                  alt={initialData.meta.title}
                  fill
                  unoptimized
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 768px"
                  priority
                />
              </div>
            ) : null}

            <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-serif)] tracking-wide mb-4">
              {initialData.meta.title}
            </h1>

            <div className="flex flex-wrap gap-4 text-sm text-ink-muted dark:text-ink-dark-muted mb-8">
              {initialData.meta.year && <span>{initialData.meta.year}</span>}
              {initialData.meta.medium && <span>材质：{initialData.meta.medium}</span>}
              {initialData.meta.category && <span>书体：{initialData.meta.category}</span>}
            </div>

            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: initialData.html }}
            />
          </article>
        )}

        {initialData && initialRelatedPosts.length > 0 && (
          <RelatedPosts posts={initialRelatedPosts} basePath="/calligraphy" />
        )}

        {initialData && (
          <CommentSection
            postType="calligraphy"
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
