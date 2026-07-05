"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import type { GalleryImage } from "@/lib/gallery";

interface Props {
  images: GalleryImage[];
  onImageClick?: (index: number) => void;
  /** CSS aspect-ratio value, e.g. "3/2", "4/3", "16/9". Default "3/2". */
  aspectRatio?: string;
}

/**
 * 走马灯图片轮播组件
 * - 淡入淡出自动轮播（3.5s 间隔）
 * - 悬停暂停 + 显示左右箭头
 * - 圆点指示器 + 计数器
 * - 点击图片触发 onImageClick（用于 Lightbox 预览）
 */
export default function Carousel({
  images,
  onImageClick,
  aspectRatio = "3/2",
}: Props) {
  const [current, setCurrent] = useState(0);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);

  const len = images.length;

  const goTo = useCallback(
    (idx: number) => setCurrent(((idx % len) + len) % len),
    [len]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Touch swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) next(); else prev();
      }
    },
    [next, prev]
  );

  // Auto-play
  useEffect(() => {
    if (len <= 1 || hovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(next, 3500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [len, hovered, next]);

  if (len === 0) return null;

  return (
    <div
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ aspectRatio }}
    >
      {/* 图片层 */}
      <div className="relative w-full h-full rounded-lg overflow-hidden bg-ink-border/30">
        {images.map((img, idx) => (
          <button
            key={img.id}
            type="button"
            onClick={() => onImageClick?.(idx)}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out cursor-zoom-in ${
              idx === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <Image
              src={img.url}
              alt={img.alt_text || img.caption || `图片 ${idx + 1}`}
              fill
              unoptimized
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 896px"
              priority={idx === 0}
            />
            {img.caption && idx === current && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <p className="text-white text-sm text-center">{img.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 左右箭头 */}
      {len > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="上一张"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="下一张"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* 底部指示点 + 计数器 */}
      {len > 1 && (
        <>
          <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); goTo(idx); }}
                className={`rounded-full transition-all duration-300 w-2.5 h-2.5 sm:w-2 sm:h-2 ${
                  idx === current
                    ? "bg-white w-6 sm:w-6"
                    : "bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`第 ${idx + 1} 张`}
              />
            ))}
          </div>
          <div className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded bg-black/40 text-white text-xs">
            {current + 1} / {len}
          </div>
        </>
      )}

      {/* 首张标记 */}
      {hovered && len > 1 && (
        <div className="absolute top-3 left-3 z-20 px-2 py-0.5 rounded bg-black/40 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          点击预览
        </div>
      )}
    </div>
  );
}
