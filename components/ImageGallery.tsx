"use client";

import Image from "next/image";
import type { GalleryImage } from "@/lib/gallery";

interface Props {
  images: GalleryImage[];
  onImageClick: (index: number) => void;
}

/**
 * 画廊展示组件
 * - 摄影类：CSS columns 瀑布流
 * - 书法/感悟类：CSS Grid 等宽网格
 */
export default function ImageGallery({ images, onImageClick }: Props) {
  if (images.length === 0) return null;

  // Determine layout by post_type (first image's type)
  const isPhotography = images[0]?.post_type === "photography";

  return (
    <section className="mt-12 mb-8">
      <h2 className="text-lg font-semibold font-[family-name:var(--font-serif)] tracking-wide mb-6 text-ink-text dark:text-ink-dark-text">
        作品图集
        <span className="text-sm font-normal text-ink-muted dark:text-ink-dark-muted ml-2">
          {images.length} 张
        </span>
      </h2>

      {isPhotography ? (
        /* 瀑布流布局（摄影） */
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {images.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => onImageClick(index)}
              className="block w-full break-inside-avoid cursor-zoom-in group"
            >
              <div className="relative rounded-lg overflow-hidden bg-ink-border/30">
                <Image
                  src={img.url}
                  alt={img.alt_text || `作品图片 ${index + 1}`}
                  width={480}
                  height={360}
                  unoptimized
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-500"
                />
                {img.caption && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs">{img.caption}</p>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* 网格布局（书法/感悟） */
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => onImageClick(index)}
              className="block cursor-zoom-in group"
            >
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-ink-border/30">
                <Image
                  src={img.url}
                  alt={img.alt_text || `作品图片 ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>
              {img.caption && (
                <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-1.5 text-center">
                  {img.caption}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
