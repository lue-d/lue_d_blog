"use client";

import { useState, useEffect } from "react";
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

type ContentType = "photography" | "calligraphy" | "reflections";

function parsePath(pathname: string): { type: ContentType; slug: string } | null {
  const match = pathname.match(/^\/(photography|calligraphy|reflections)\/([^/]+)\/?$/);
  if (!match) return null;
  const type = match[1] as ContentType;
  if (type !== "photography" && type !== "calligraphy" && type !== "reflections") return null;
  return { type, slug: match[2] };
}

const CONFIG: Record<ContentType, {
  label: string;
  basePath: string;
  containerClass: string;
  carouselAspect: string;
  coverAspect: string;
  coverFit: string;
  notFoundMsg: string;
  notFoundLabel: string;
  metadata: (meta: ContentMeta) => React.ReactNode;
}> = {
  photography: {
    label: "摄影集",
    basePath: "/photography",
    containerClass: "max-w-4xl",
    carouselAspect: "3/2",
    coverAspect: "3/2",
    coverFit: "object-contain",
    notFoundMsg: "未找到该摄影作品",
    notFoundLabel: "← 返回摄影集",
    metadata: (meta) => (
      <div className="flex flex-wrap gap-4 text-sm text-ink-muted dark:text-ink-dark-muted mb-8">
        {meta.date && <span>{meta.date}</span>}
        {meta.location && <span>📍 {meta.location}</span>}
        {meta.camera && <span>📷 {meta.camera}</span>}
      </div>
    ),
  },
  calligraphy: {
    label: "书法集",
    basePath: "/calligraphy",
    containerClass: "max-w-3xl",
    carouselAspect: "4/3",
    coverAspect: "4/3",
    coverFit: "object-contain",
    notFoundMsg: "未找到该书法作品",
    notFoundLabel: "← 返回书法集",
    metadata: (meta) => (
      <div className="flex flex-wrap gap-4 text-sm text-ink-muted dark:text-ink-dark-muted mb-8">
        {meta.year && <span>{meta.year}</span>}
        {meta.medium && <span>材质：{meta.medium}</span>}
        {meta.category && <span>书体：{meta.category}</span>}
      </div>
    ),
  },
  reflections: {
    label: "感悟",
    basePath: "/reflections",
    containerClass: "max-w-3xl",
    carouselAspect: "16/9",
    coverAspect: "16/9",
    coverFit: "object-cover",
    notFoundMsg: "未找到该文章",
    notFoundLabel: "← 返回感悟",
    metadata: (meta) => (
      <div className="flex items-center gap-4 text-sm text-ink-muted dark:text-ink-dark-muted">
        {meta.date && <time>{meta.date}</time>}
        {meta.category && (
          <>
            <span className="text-ink-border">|</span>
            <span>{meta.category}</span>
          </>
        )}
      </div>
    ),
  },
};

export default function CatchAllClient() {
  const [parsed, setParsed] = useState<{ type: ContentType; slug: string } | null>(null);
  const [data, setData] = useState<{ meta: ContentMeta; html: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<ContentMeta[]>([]);

  useEffect(() => {
    const result = parsePath(window.location.pathname);
    setParsed(result);
    if (!result) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const { type, slug } = result;
    Promise.all([
      getContentDataClient(type, slug),
      getGalleryImagesClient(type, slug),
    ]).then(([contentResult, images]) => {
      if (!contentResult) {
        setNotFound(true);
      } else {
        setData(contentResult);
      }
      setGalleryImages(images);
      setLoading(false);

      // 相关推荐
      getContentListClient(type).then((all) => {
        const sameCategory = all.filter(
          (item) =>
            item.slug !== slug &&
            contentResult?.meta.category &&
            item.category === contentResult.meta.category
        );
        const others = all.filter(
          (item) =>
            item.slug !== slug &&
            (!contentResult?.meta.category || item.category !== contentResult.meta.category)
        );
        setRelatedPosts([...sameCategory, ...others].slice(0, 3));
      });
    });
  }, []);

  // 无效路径
  if (!loading && notFound && !parsed) {
    return (
      <>
        <Header />
        <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-16 pb-24 text-center">
          <p className="text-ink-muted">页面不存在</p>
          <Link href="/" className="text-sm text-ink-accent hover:text-ink-green transition-colors">
            ← 返回首页
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const ct = parsed?.type;
  const cfg = ct ? CONFIG[ct] : null;

  return (
    <>
      <Header />
      <main className={`flex-1 w-full ${cfg?.containerClass || "max-w-3xl"} mx-auto px-6 pt-16 pb-24`}>
        {ct && cfg && (
          <Breadcrumb
            items={[
              { label: "首页", href: "/" },
              { label: cfg.label, href: cfg.basePath },
              ...(data ? [{ label: data.meta.title }] : []),
            ]}
          />
        )}

        {loading ? (
          <article className="mt-8">
            <div className={`aspect-[${cfg?.coverAspect || "16/9"}] rounded-lg bg-ink-border/20 animate-pulse mb-8`} />
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
              {cfg?.notFoundMsg || "未找到"}
            </p>
            {ct && cfg && (
              <Link
                href={cfg.basePath}
                className="text-sm text-ink-accent hover:text-ink-green transition-colors"
              >
                {cfg.notFoundLabel}
              </Link>
            )}
          </div>
        ) : data && ct && cfg ? (
          <article className="mt-8">
            {/* 标题（感悟类型标题在前、图在后） */}
            {ct === "reflections" && (
              <header className="mb-10">
                <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-serif)] tracking-wide mb-4">
                  {data.meta.title}
                </h1>
                {cfg.metadata(data.meta)}
              </header>
            )}

            {/* 走马灯 / 封面 */}
            {galleryImages.length > 0 ? (
              <div className="mb-8">
                <Carousel
                  images={galleryImages}
                  aspectRatio={cfg.carouselAspect}
                  onImageClick={(idx) => {
                    setLightboxIndex(idx);
                    setLightboxOpen(true);
                  }}
                />
              </div>
            ) : data.meta.cover ? (
              <div className={`relative aspect-[${cfg.coverAspect}] rounded-lg overflow-hidden bg-ink-border/30 mb-8`}>
                <Image
                  src={data.meta.cover}
                  alt={data.meta.title}
                  fill
                  unoptimized
                  className={cfg.coverFit}
                  sizes="(max-width: 768px) 100vw, 896px"
                  priority
                />
              </div>
            ) : null}

            {/* 标题（摄影/书法类型标题在图后） */}
            {ct !== "reflections" && (
              <>
                <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-serif)] tracking-wide mb-4">
                  {data.meta.title}
                </h1>
                {cfg.metadata(data.meta)}
              </>
            )}

            <div className="prose" dangerouslySetInnerHTML={{ __html: data.html }} />
          </article>
        ) : null}

        {data && relatedPosts.length > 0 && ct && (
          <RelatedPosts posts={relatedPosts} basePath={cfg?.basePath || `/${ct}`} />
        )}

        {data && ct && (
          <CommentSection
            postType={ct}
            postSlug={parsed!.slug}
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
