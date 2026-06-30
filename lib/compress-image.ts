/**
 * 浏览器端图片压缩（Canvas API）
 *
 * 在管理后台上传封面图之前，自动缩放 + 转换格式，
 * 避免原图过大导致页面加载缓慢。
 *
 * 策略：
 *   - 最长边限制 2000px（详情页最大展示 ~1200px，留有 retina 余量）
 *   - 输出 WebP（比 JPEG/PNG 小 30-50%）
 *   - 质量 0.8（视觉无损，体积大幅减小）
 *   - 原图 ≤ 500KB 且尺寸不超标 → 跳过压缩
 */

export interface CompressOptions {
  /** 最长边上限 (px)，默认 2000 */
  maxWidth?: number;
  /** 输出质量 0-1，默认 0.8 */
  quality?: number;
  /** 输出格式，默认 webp */
  format?: "image/webp" | "image/jpeg";
  /** 原图小于此字节数且尺寸不超标时跳过压缩，默认 500KB */
  skipIfBelow?: number;
}

export interface CompressResult {
  /** 压缩后的 Blob（可直接上传） */
  blob: Blob;
  /** 压缩后文件名（扩展名已更新） */
  fileName: string;
  /** 原图大小 (bytes) */
  originalSize: number;
  /** 压缩后大小 (bytes) */
  compressedSize: number;
  /** 是否实际执行了压缩 */
  compressed: boolean;
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 2000,
  quality: 0.8,
  format: "image/webp",
  skipIfBelow: 500 * 1024, // 500KB
};

/**
 * 压缩图片文件。如果原图已经足够小，直接返回原图。
 *
 * @example
 * const result = await compressImage(file);
 * // result.blob → 压缩后的 Blob
 * // result.compressedSize → 压缩后字节数
 * // console.log(`${(result.originalSize/1024).toFixed(0)}KB → ${(result.compressedSize/1024).toFixed(0)}KB`)
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 非图片文件不处理
  if (!file.type.startsWith("image/")) {
    return {
      blob: file,
      fileName: file.name,
      originalSize: file.size,
      compressedSize: file.size,
      compressed: false,
    };
  }

  // SVG / GIF 不压缩（Canvas 无法很好地处理它们）
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return {
      blob: file,
      fileName: file.name,
      originalSize: file.size,
      compressedSize: file.size,
      compressed: false,
    };
  }

  // 解码图片获取原始尺寸
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // 解码失败，返回原图
    return {
      blob: file,
      fileName: file.name,
      originalSize: file.size,
      compressedSize: file.size,
      compressed: false,
    };
  }

  const { width, height } = bitmap;

  // 计算缩放后的尺寸
  let newWidth = width;
  let newHeight = height;
  if (width > opts.maxWidth || height > opts.maxWidth) {
    if (width >= height) {
      newWidth = opts.maxWidth;
      newHeight = Math.round((height / width) * opts.maxWidth);
    } else {
      newHeight = opts.maxWidth;
      newWidth = Math.round((width / height) * opts.maxWidth);
    }
  }

  // 尺寸未超标且原图 < skipIfBelow → 跳过
  if (newWidth === width && file.size <= opts.skipIfBelow) {
    bitmap.close();
    return {
      blob: file,
      fileName: file.name,
      originalSize: file.size,
      compressedSize: file.size,
      compressed: false,
    };
  }

  // 绘制到 Canvas
  const canvas = document.createElement("canvas");
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return {
      blob: file,
      fileName: file.name,
      originalSize: file.size,
      compressedSize: file.size,
      compressed: false,
    };
  }

  ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
  bitmap.close();

  // 导出为 Blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas toBlob 失败"));
      },
      opts.format,
      opts.quality
    );
  });

  // 更新文件名扩展名
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const newExt = opts.format === "image/webp" ? "webp" : "jpg";
  const fileName = `${baseName}.${newExt}`;

  return {
    blob,
    fileName,
    originalSize: file.size,
    compressedSize: blob.size,
    compressed: true,
  };
}

/** 格式化字节数为可读字符串 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
