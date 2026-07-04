"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CommentSection from "@/components/CommentSection";
import Breadcrumb from "@/components/Breadcrumb";
import Carousel from "@/components/Carousel";
import Lightbox from "@/components/Lightbox";
import RelatedPosts from "@/components/RelatedPosts";
import { getContentDataClient, getContentListClient, type ContentMeta } from "@/lib/content-supabase-client";
import { getGalleryImagesClient } from "@/lib/gallery-client";
import type { GalleryImage } from "@/lib/gallery";

export default function ReflectionDetailClient({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [data, setData] = useState<{ meta: ContentMeta; html: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<ContentMeta[]>([]);

  useEffect(() => {
    Promise.all([
      getContentDataClient("reflections", slug),
      getGalleryImagesClient("reflections", slug),
    ]).then(([result, images]) => {
      if (!result) {
        setNotFound(true);
      } else {
        setData(result);
      }
      setGalleryImages(images);
      setLoading(false);
      // 获取相关推荐
      getContentListClient("reflections").then((all) => {
        const sameCategory = all.filter(
          (item) =>
            item.slug !== slug &&
            result?.meta.category &&
            item.category === result.meta.category
        );
        const others = all.filter(
          (item) =>
            item.slug !== slug &&
            (!result?.meta.category || item.category !== result.meta.category)
        );
        setRelatedPosts([...sameCategory, ...others].slice(0, 3));
      });
    });
  }, [slug]);

  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-16 pb-24">
        <Breadcrumb
          items={[
            { label: "首页", href: "/" },
            { label: "感悟", href: "/reflections" },
            ...(data ? [{ label: data.meta.title }] : []),
          ]}
        />

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

            {/* 走马灯展示作品图片，无作品图片时回退到封面 */}
            {galleryImages.length > 0 ? (
              <div className="mb-10">
                <Carousel
                  images={galleryImages}
                  aspectRatio="16/9"
                  onImageClick={(idx) => {
                    setLightboxIndex(idx);
                    setLightboxOpen(true);
                  }}
                />
              </div>
            ) : data.meta.cover ? (
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
            ) : null}

            <div className="prose" dangerouslySetInnerHTML={{ __html: data.html }} />
          </article>
        ) : null}

        {data && relatedPosts.length > 0 && (
          <RelatedPosts posts={relatedPosts} basePath="/reflections" />
        )}

        {data && (
          <CommentSection
            postType="reflections"
            postSlug={slug}
            postTitle={data.meta.title}
          />
        )}
      </main>
      <Footer />

      <Lightbox
        images={galleryImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
