"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import Image from "next/image";
import type { GalleryImage } from "@/lib/gallery";

interface Props {
  images: GalleryImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 自定义灯箱组件
 * - 全屏遮罩 + 毛玻璃背景
 * - 左右箭头翻页
 * - 键盘导航（← → Esc）
 * - 移动端触摸滑动
 * - 底部页码 + 说明文字
 */
export default function Lightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
}: Props) {
  const [index, setIndex] = useState(currentIndex);
  const touchStartX = useRef(0);

  // Sync with prop on open
  useEffect(() => {
    if (isOpen) setIndex(currentIndex);
  }, [isOpen, currentIndex]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case "ArrowLeft":
          setIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
          break;
        case "ArrowRight":
          setIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
          break;
        case "Escape":
          onClose();
          break;
      }
    },
    [isOpen, images.length, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          setIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        } else {
          setIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        }
      }
    },
    [images.length]
  );

  if (!isOpen) return null;

  const current = images[index];
  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
        aria-label="关闭"
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
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Prev button */}
      {images.length > 1 && (
        <button
          onClick={() => setIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
          className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          aria-label="上一张"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* Next button */}
      {images.length > 1 && (
        <button
          onClick={() => setIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
          className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          aria-label="下一张"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* Image container */}
      <div
        className="relative z-10 max-w-[90vw] max-h-[85vh] w-full h-full flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={current.url}
          alt={current.alt_text || current.caption || `图片 ${index + 1}`}
          width={0}
          height={0}
          unoptimized
          className="object-contain"
          sizes="90vw"
          style={{ maxWidth: "90vw", maxHeight: "85vh", width: "auto", height: "auto" }}
        />
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 inset-x-0 z-10 flex flex-col items-center pb-6">
        {/* Pagination dots */}
        {images.length > 1 && (
          <div className="flex gap-2 mb-3">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === index
                    ? "bg-white w-6"
                    : "bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`第 ${i + 1} 张`}
              />
            ))}
          </div>
        )}

        {/* Counter + Caption */}
        <p className="text-white/80 text-sm text-center px-6">
          {images.length > 1 && (
            <span className="text-white/50">{index + 1} / {images.length}</span>
          )}
          {current.caption && (
            <>
              {images.length > 1 && <span className="mx-2 text-white/30">·</span>}
              <span>{current.caption}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
