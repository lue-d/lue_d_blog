"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

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
}: {
  type: ContentType;
  initialData?: Partial<FormData> & { id?: string };
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM, ...initialData });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initialData?.cover || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleTitleChange = useCallback(
    (title: string) => {
      update("title", title);
      // 新建模式下自动生成 slug
      if (mode === "create") {
        const slug = title
          .replace(/[^\w一-鿿]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
          .toLowerCase();
        update("slug", slug);
      }
    },
    [mode]
  );

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const uploadCover = async (): Promise<string | null> => {
    if (!coverFile) return form.cover || null;

    const ext = coverFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `covers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(type)
      .upload(filePath, coverFile);

    if (uploadError) {
      throw new Error(`图片上传失败: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(type)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 上传封面图
      let coverUrl = form.cover;
      if (coverFile) {
        coverUrl = (await uploadCover()) || "";
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
        const { error: insertError } = await supabase
          .from(type)
          .insert(payload);
        if (insertError) throw new Error(insertError.message);
      } else {
        const { error: updateError } = await supabase
          .from(type)
          .update(payload)
          .eq("id", initialData?.id);
        if (updateError) throw new Error(updateError.message);
      }

      router.push(`/admin/${type}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
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
        </div>
      </Field>

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
