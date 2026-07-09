"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { compressImage, formatSize } from "@/lib/compress-image";
import GalleryUploader, { type GalleryUploaderHandle, type GalleryImage } from "./GalleryUploader";
import { useFormDraft } from "@/hooks/useFormDraft";
import { showToast, stashToast } from "@/components/Toast";

type ContentType = "calligraphy" | "photography" | "reflections";

const TYPE_LABEL: Record<ContentType, string> = {
  calligraphy: "书法",
  photography: "摄影",
  reflections: "感悟",
};

interface FormData {
  title: string;
  slug: string;
  date: string;
  description: string;
  cover: string;
  content: string;
  published: boolean;
  year: string;
  medium: string;
  category: string;
  location: string;
  camera: string;
}

const EMPTY_FORM: FormData = {
  title: "",
  slug: "",
  date: new Date().toISOString().split("T")[0],
  description: "",
  cover: "",
  content: "",
  published: true,
  year: "",
  medium: "",
  category: "",
  location: "",
  camera: "",
};

export default function ContentForm({
  type,
  initialData,
  mode,
  existingGalleryImages = [],
}: {
  type: ContentType;
  initialData?: Partial<FormData> & { id?: string };
  mode: "create" | "edit";
  existingGalleryImages?: GalleryImage[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM, ...initialData });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const coverFileRef = useRef<File | null>(null);
  const coverExplicitlySet = useRef(!!initialData?.cover);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initialData?.cover || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [compressionNote, setCompressionNote] = useState("");
  const galleryRef = useRef<GalleryUploaderHandle>(null);

  // 草稿自动保存 & 恢复
  const draftId = (initialData as { id?: string } | undefined)?.id;
  const { save, clearDraft, getDraft, draftRestored } = useFormDraft<FormData>({
    type,
    mode,
    id: draftId,
    initialData: { ...EMPTY_FORM, ...initialData },
  });

  // 挂载时恢复草稿
  useEffect(() => {
    const draft = getDraft();
    if (draft) {
      setForm(draft);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 每次表单变化自动保存
  useEffect(() => {
    save(form);
  }, [form, save]);

  const update = (key: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTitleChange = useCallback(
    (title: string) => {
      update("title", title);
      // 新建模式下自动生成 slug
      if (mode === "create") {
        const slug = title
          .replace(/[^\w]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
          .toLowerCase()
          || `post-${Date.now().toString(36)}`;
        update("slug", slug);
      }
    },
    [mode]
  );

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    coverExplicitlySet.current = true;
    coverFileRef.current = file;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const uploadCover = async (file: File): Promise<string | null> => {

    // 客户端压缩：最长边 2000px，WebP 格式，质量 0.8
    const result = await compressImage(file);
    if (result.compressed) {
      const saved = Math.round(
        (1 - result.compressedSize / result.originalSize) * 100
      );
      setCompressionNote(
        `${formatSize(result.originalSize)} → ${formatSize(result.compressedSize)}，节省 ${saved}%`
      );
    } else {
      setCompressionNote("");
    }

    // 文件名可能含中文等非 ASCII 字符，生成安全文件名
    const ext = result.fileName.split(".").pop() || "webp";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const cosKey = `covers/${safeName}`;

    // 步骤 1：获取 COS 预签名 URL
    let presignData: { presignedUrl: string; publicUrl: string } | null = null;
    let presignErr: Error | null = null;
    try {
      const res = await supabase.functions.invoke<{
        presignedUrl: string;
        publicUrl: string;
      }>("cos-upload", {
        body: {
          filename: result.fileName,
          contentType: result.blob.type,
          key: cosKey,
        },
      });
      presignData = res.data;
      presignErr = res.error;
    } catch (networkErr) {
      throw new Error(
        `无法连接上传服务（${networkErr instanceof Error ? networkErr.message : "网络错误"}），请检查网络或登录是否过期`
      );
    }

    if (presignErr || !presignData) {
      throw new Error(`获取上传地址失败: ${presignErr?.message || "未知错误"}`);
    }

    // 步骤 2：直传 COS
    let uploadRes: Response;
    try {
      uploadRes = await fetch(presignData.presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": result.blob.type },
        body: result.blob,
      });
    } catch (networkErr) {
      throw new Error(
        `无法连接对象存储（${networkErr instanceof Error ? networkErr.message : "网络错误"}）`
      );
    }

    if (!uploadRes.ok) {
      throw new Error(`COS 上传失败 (${uploadRes.status})`);
    }

    return presignData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 如果未显式选择封面，默认使用第一张作品图片作为封面
      let finalCoverFile = coverFileRef.current;
      if (!finalCoverFile && !form.cover && !coverExplicitlySet.current) {
        const firstPending = galleryRef.current?.getFirstPendingFile();
        if (firstPending) {
          finalCoverFile = firstPending.file;
          // 同步更新 UI 状态
          coverFileRef.current = firstPending.file;
          setCoverFile(firstPending.file);
          setCoverPreview(firstPending.preview);
        }
      }

      // 上传封面图
      let coverUrl = form.cover;
      if (finalCoverFile) {
        coverUrl = (await uploadCover(finalCoverFile)) || "";
      }

      const payload = {
        title: form.title,
        slug: form.slug,
        date: form.date,
        description: form.description,
        cover: coverUrl,
        content: form.content,
        published: form.published,
        // 类型特有字段
        ...(type === "calligraphy"
          ? { year: form.year, medium: form.medium, category: form.category }
          : {}),
        ...(type === "photography"
          ? { location: form.location, camera: form.camera }
          : {}),
        ...(type === "reflections" ? { category: form.category } : {}),
      };

      if (mode === "create") {
        let insertError: Error | null = null;
        try {
          const res = await supabase.from(type).insert(payload);
          insertError = res.error;
        } catch (networkErr) {
          throw new Error(
            `无法连接服务器（${networkErr instanceof Error ? networkErr.message : "网络错误"}），请检查网络连接`
          );
        }
        if (insertError) throw new Error(insertError.message);

        // Upload gallery images after content is saved (slug exists)
        if (galleryRef.current) {
          const galleryResult = await galleryRef.current.uploadAll(form.slug);
          if (!galleryResult.success) {
            setError(galleryResult.error || "画廊图片上传失败");
            setLoading(false);
            return;
          }
        }
      } else {
        let updateError: Error | null = null;
        try {
          const res = await supabase
            .from(type)
            .update(payload)
            .eq("id", initialData?.id);
          updateError = res.error;
        } catch (networkErr) {
          throw new Error(
            `无法连接服务器（${networkErr instanceof Error ? networkErr.message : "网络错误"}），请检查网络连接`
          );
        }
        if (updateError) throw new Error(updateError.message);

        // Sync gallery changes
        if (galleryRef.current) {
          const galleryResult = await galleryRef.current.syncChanges(form.slug);
          if (!galleryResult.success) {
            setError(galleryResult.error || "画廊图片同步失败");
            setLoading(false);
            return;
          }
        }
      }

      stashToast("success", mode === "create" ? `${label}创建成功` : `${label}更新成功`);
      router.push(`/admin/${type}`);
      router.refresh();
      clearDraft();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "操作失败";
      setError(msg);
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const label = TYPE_LABEL[type];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {draftRestored && !error && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
          <span>📝</span>
          <span>已恢复上次未保存的草稿</span>
          <button
            type="button"
            onClick={() => {
              clearDraft();
              setForm({ ...EMPTY_FORM, ...initialData } as FormData);
            }}
            className="ml-auto text-xs underline hover:no-underline"
          >
            丢弃草稿
          </button>
        </div>
      )}

      {/* 标题 */}
      <Field label="标题" required>
        <input
          type="text"
          value={form.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
          className="input"
          placeholder={`${label}作品标题`}
        />
      </Field>

      {/* Slug */}
      <Field label="Slug" required>
        <input
          type="text"
          value={form.slug}
          onChange={(e) => update("slug", e.target.value)}
          required
          className="input"
          placeholder="url-friendly-slug"
        />
      </Field>

      {/* 日期 + 发布状态 */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="日期" required>
          <input
            type="date"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
            required
            className="input"
          />
        </Field>
        <Field label="发布状态">
          <label className="flex items-center gap-2 h-[42px] cursor-pointer">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => update("published", e.target.checked)}
              className="w-4 h-4 rounded border-ink-border"
            />
            <span className="text-sm text-ink-muted">
              {form.published ? "已发布" : "草稿"}
            </span>
          </label>
        </Field>
      </div>

      {/* 描述 */}
      <Field label="描述">
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className="input"
          rows={2}
          placeholder="简短描述，用于列表展示"
        />
      </Field>

      {/* 封面图 */}
      <Field label="封面图">
        <div className="space-y-3">
          {coverPreview && (
            <div className="relative w-48 aspect-[4/3] rounded-lg overflow-hidden bg-ink-border/30">
              <Image
                src={coverPreview}
                alt="封面预览"
                fill
                unoptimized
                className="object-cover"
                sizes="192px"
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="text-sm text-ink-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-ink-border/30 file:text-ink-text hover:file:bg-ink-border/50"
          />
          {form.cover && !coverFile && (
            <p className="text-xs text-ink-muted truncate">
              当前: {form.cover}
            </p>
          )}
          {coverFile && !loading && (
            <p className="text-xs text-ink-accent">
              💡 上传时将自动压缩（最长边 2000px，WebP）
            </p>
          )}
          {compressionNote && (
            <p className="text-xs text-green-600 dark:text-green-400">
              ✅ {compressionNote}
            </p>
          )}
        </div>
      </Field>

      {/* 画廊图片（多图上传 & 拖拽排序） */}
      <GalleryUploader
        ref={galleryRef}
        postType={type}
        existingImages={existingGalleryImages}
      />

      {/* 类型特有字段 */}
      {type === "calligraphy" && (
        <div className="grid grid-cols-3 gap-4">
          <Field label="年份">
            <input
              type="text"
              value={form.year}
              onChange={(e) => update("year", e.target.value)}
              className="input"
              placeholder="2026"
            />
          </Field>
          <Field label="材质">
            <input
              type="text"
              value={form.medium}
              onChange={(e) => update("medium", e.target.value)}
              className="input"
              placeholder="宣纸 · 兼毫"
            />
          </Field>
          <Field label="书体">
            <input
              type="text"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className="input"
              placeholder="行书 / 楷书"
            />
          </Field>
        </div>
      )}

      {type === "photography" && (
        <div className="grid grid-cols-2 gap-4">
          <Field label="拍摄地点">
            <input
              type="text"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              className="input"
              placeholder="浙江 · 杭州"
            />
          </Field>
          <Field label="拍摄设备">
            <input
              type="text"
              value={form.camera}
              onChange={(e) => update("camera", e.target.value)}
              className="input"
              placeholder="iPhone 15 Pro"
            />
          </Field>
        </div>
      )}

      {type === "reflections" && (
        <Field label="分类">
          <input
            type="text"
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="input max-w-xs"
            placeholder="随笔 / 游记"
          />
        </Field>
      )}

      {/* 正文 (Markdown) */}
      <Field label="正文 (Markdown)" required>
        <textarea
          value={form.content}
          onChange={(e) => update("content", e.target.value)}
          required
          className="input font-mono"
          rows={16}
          placeholder="在此编写 Markdown 正文..."
        />
      </Field>

      {/* 提交按钮 */}
      <div className="flex items-center gap-4 pt-4 border-t border-ink-border dark:border-ink-dark-muted/20">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading
            ? "保存中..."
            : mode === "create"
              ? `创建${label}`
              : `更新${label}`}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-ink-muted hover:text-ink-accent transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  );
}

/* ===== 内部组件 ===== */

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink-text dark:text-ink-dark-text">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
