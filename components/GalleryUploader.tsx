"use client";

import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { compressImage, formatSize } from "@/lib/compress-image";
import {
  createGalleryImage,
  deleteGalleryImage,
  updateGallerySortOrder,
} from "@/lib/gallery-client";
import type { GalleryImage } from "@/lib/gallery";

type ContentType = "calligraphy" | "photography" | "reflections";

interface PendingImage {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
  uploadedUrl?: string;
  dbId?: string;
}

export interface GalleryUploaderHandle {
  /** Upload all pending images. Call after content is saved (slug is known). */
  uploadAll: (slug: string) => Promise<{ success: boolean; error?: string }>;
  /** Sync changes in edit mode: delete removed + update sort order + upload new. */
  syncChanges: (slug: string) => Promise<{ success: boolean; error?: string }>;
  /** Get the first pending file (File + preview blob URL), or null if none. */
  getFirstPendingFile: () => { file: File; preview: string } | null;
}

interface Props {
  postType: ContentType;
  existingImages: GalleryImage[];
}

const GalleryUploader = forwardRef<GalleryUploaderHandle, Props>(
  function GalleryUploader({ postType, existingImages }, ref) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [savedImages, setSavedImages] = useState<GalleryImage[]>(existingImages);
    const [pendingFiles, setPendingFiles] = useState<PendingImage[]>([]);
    const [removedIds, setRemovedIds] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [compressionNote, setCompressionNote] = useState("");

    // Merge saved + pending for display + DnD
    const allImages = [
      ...savedImages.map((img) => ({
        id: img.id,
        url: img.url,
        isPending: false,
        status: "done" as const,
      })),
      ...pendingFiles.map((p) => ({
        id: p.id,
        url: p.preview,
        isPending: true,
        status: p.status,
      })),
    ];

    const handleFileSelect = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newPending: PendingImage[] = files.map((file) => ({
          id: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          preview: URL.createObjectURL(file),
          status: "pending",
        }));

        setPendingFiles((prev) => [...prev, ...newPending]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      []
    );

    const removePending = useCallback((id: string) => {
      setPendingFiles((prev) => {
        const target = prev.find((p) => p.id === id);
        if (target) URL.revokeObjectURL(target.preview);
        return prev.filter((p) => p.id !== id);
      });
    }, []);

    const removeSaved = useCallback((img: GalleryImage) => {
      setSavedImages((prev) => prev.filter((s) => s.id !== img.id));
      setRemovedIds((prev) => [...prev, img.id]);
    }, []);

    // ---- DnD ----
    const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
      e.dataTransfer.setData("text/plain", String(index));
      (e.currentTarget as HTMLElement).style.opacity = "0.4";
    }, []);

    const handleDragEnd = useCallback((e: React.DragEvent) => {
      (e.currentTarget as HTMLElement).style.opacity = "1";
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }, []);

    const handleDrop = useCallback(
      (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
        if (isNaN(dragIndex) || dragIndex === dropIndex) return;

        const combined = [
          ...savedImages.map((s, idx) => ({ type: "saved" as const, index: idx })),
          ...pendingFiles.map((p, idx) => ({ type: "pending" as const, index: idx })),
        ];

        const dragged = combined[dragIndex];
        if (!dragged) return;

        const newSaved = [...savedImages];
        const newPending = [...pendingFiles];

        if (dragged.type === "saved") {
          const [moved] = newSaved.splice(dragged.index, 1);
          // Find where to insert in combined list after removal
          const adjustedDrop = dropIndex > dragIndex ? dropIndex - 1 : dropIndex;
          if (adjustedDrop < newSaved.length) {
            newSaved.splice(adjustedDrop, 0, moved);
          } else {
            newSaved.push(moved);
          }
        } else {
          const [moved] = newPending.splice(dragged.index, 1);
          // saved images take first positions
          const pendingStartIdx = newSaved.length;
          const adjustedDrop = dropIndex > dragIndex ? dropIndex - 1 : dropIndex;
          const insertAt = Math.max(0, adjustedDrop - pendingStartIdx);
          newPending.splice(Math.min(insertAt, newPending.length), 0, moved);
        }

        setSavedImages(newSaved);
        setPendingFiles(newPending);
      },
      [savedImages, pendingFiles]
    );

    // ---- Upload logic ----
    const uploadSingleFile = useCallback(
      async (item: PendingImage, slug: string, sortOrder: number): Promise<string | null> => {
        const result = await compressImage(item.file);
        if (result.compressed) {
          const saved = Math.round(
            (1 - result.compressedSize / result.originalSize) * 100
          );
          setCompressionNote(
            `"${item.file.name}": ${formatSize(result.originalSize)} → ${formatSize(result.compressedSize)}，节省 ${saved}%`
          );
        }

        // 步骤 1：从 Edge Function 获取 COS 预签名 URL
        const { data: presignData, error: presignErr } = await supabase.functions.invoke<{
          presignedUrl: string;
          publicUrl: string;
        }>("cos-upload", {
          body: {
            filename: result.fileName,
            contentType: result.blob.type,
            slug,
            type: postType,
            index: String(sortOrder),
          },
        });

        if (presignErr || !presignData) {
          throw new Error(presignErr?.message || "获取上传地址失败");
        }

        const { presignedUrl, publicUrl } = presignData;

        // 步骤 2：直传 COS（浏览器 → COS，不经 Edge Function 中转）
        const uploadRes = await fetch(presignedUrl, {
          method: "PUT",
          headers: { "Content-Type": result.blob.type },
          body: result.blob,
        });

        if (!uploadRes.ok) {
          throw new Error(`COS 上传失败 (${uploadRes.status})`);
        }

        const url = publicUrl;

        const record = await createGalleryImage({
          post_type: postType,
          post_slug: slug,
          url,
          sort_order: sortOrder,
        });

        if (!record) throw new Error("创建数据库记录失败");
        return record.id;
      },
      [postType]
    );

    const uploadAll = useCallback(
      async (slug: string): Promise<{ success: boolean; error?: string }> => {
        if (pendingFiles.length === 0) return { success: true };

        setUploading(true);
        const updated = [...pendingFiles];
        let errMsg = "";

        for (let i = 0; i < updated.length; i++) {
          const item = updated[i];
          if (item.status === "done") continue;

          updated[i] = { ...item, status: "uploading" };
          setPendingFiles([...updated]);

          try {
            const dbId = await uploadSingleFile(item, slug, savedImages.length + i);
            updated[i] = {
              ...item,
              status: "done",
              uploadedUrl: undefined,
              dbId: dbId || undefined,
            };
          } catch (err) {
            updated[i] = { ...item, status: "error" };
            errMsg = err instanceof Error ? err.message : "上传失败";
            break;
          }
        }

        if (errMsg) {
          setPendingFiles([...updated]);
          setUploading(false);
          return { success: false, error: errMsg };
        }

        // Move done to saved — use pending preview as temp URL
        // (blob URL is still valid until redirect/refresh loads real URLs from DB)
        const doneItems: GalleryImage[] = updated
          .filter((p) => p.status === "done" && p.dbId)
          .map((p, idx) => ({
            id: p.dbId!,
            post_type: postType,
            post_slug: slug,
            url: p.preview,
            alt_text: "",
            caption: "",
            sort_order: savedImages.length + idx,
          }));

        // Actually fetch the saved images fresh
        setSavedImages((prev) => [
          ...prev,
          ...doneItems.map((d, idx) => ({
            ...d,
            sort_order: prev.length + idx,
          })),
        ]);
        setPendingFiles([]);
        setUploading(false);
        setCompressionNote("");

        return { success: true };
      },
      [pendingFiles, savedImages.length, postType, uploadSingleFile]
    );

    const syncChanges = useCallback(
      async (slug: string): Promise<{ success: boolean; error?: string }> => {
        // Delete removed
        for (const id of removedIds) {
          await deleteGalleryImage(id);
        }

        // Update sort order
        for (let i = 0; i < savedImages.length; i++) {
          if (savedImages[i].sort_order !== i) {
            await updateGallerySortOrder(savedImages[i].id, i);
          }
        }

        // Upload new pending files
        if (pendingFiles.length > 0) {
          const uploadResult = await uploadAll(slug);
          if (!uploadResult.success) return uploadResult;
        }

        return { success: true };
      },
      [removedIds, savedImages, pendingFiles, uploadAll]
    );

    const getFirstPendingFile = useCallback(() => {
      const first = pendingFiles.find((p) => p.status === "pending");
      if (!first) return null;
      return { file: first.file, preview: first.preview };
    }, [pendingFiles]);

    useImperativeHandle(ref, () => ({ uploadAll, syncChanges, getFirstPendingFile }), [
      pendingFiles,
      savedImages,
      removedIds,
      postType,
      uploadAll,
      syncChanges,
      getFirstPendingFile,
    ]);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-ink-text dark:text-ink-dark-text">
            📷 作品图片
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs text-ink-accent hover:text-ink-green transition-colors disabled:opacity-50"
          >
            + 添加图片
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {allImages.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {allImages.map((img, index) => (
              <div
                key={img.id}
                draggable={!uploading}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`relative group aspect-square rounded-lg overflow-hidden bg-ink-border/30 border-2 ${
                  img.status === "error"
                    ? "border-red-400"
                    : "border-transparent hover:border-ink-accent/50"
                } transition-colors cursor-grab active:cursor-grabbing`}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 25vw"
                />

                {img.status === "uploading" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {img.status === "error" && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <span className="text-xs text-red-600 dark:text-red-400">失败</span>
                  </div>
                )}

                {!uploading && (
                  <button
                    type="button"
                    onClick={() =>
                      img.isPending
                        ? removePending(img.id)
                        : removeSaved(savedImages.find((s) => s.id === img.id)!)
                    }
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    ✕
                  </button>
                )}

                {img.isPending && img.status === "pending" && (
                  <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-ink-accent text-white">
                    待上传
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-ink-border/50 dark:border-ink-dark-muted/20 p-8 text-center">
            <p className="text-sm text-ink-muted dark:text-ink-dark-muted">
              还没有添加图片，点击右上角"添加图片"上传
            </p>
          </div>
        )}

        {uploading && (
          <p className="text-xs text-ink-accent">⏳ 正在上传中...</p>
        )}
        {compressionNote && !uploading && (
          <p className="text-xs text-green-600 dark:text-green-400">
            ✅ {compressionNote}
          </p>
        )}
        <p className="text-xs text-ink-muted dark:text-ink-dark-muted">
          💡 支持 JPG/PNG/WebP，上传时自动压缩。拖拽可调整排序。
        </p>
      </div>
    );
  }
);

export default GalleryUploader;
export type { GalleryImage };
