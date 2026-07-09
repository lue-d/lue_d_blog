"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const DRAFT_PREFIX = "form_draft:";

function buildKey(type: string, mode: "create" | "edit", id?: string): string {
  if (mode === "edit" && id) return `${DRAFT_PREFIX}${type}:edit:${id}`;
  return `${DRAFT_PREFIX}${type}:new`;
}

interface UseFormDraftOptions<T> {
  type: string;
  mode: "create" | "edit";
  id?: string;
  initialData: T;
}

/**
 * 表单草稿自动保存 & 刷新恢复
 *
 * - 每次 formData 变化自动写入 sessionStorage（500ms 防抖）
 * - 页面加载时检测未保存草稿，返回 shouldRestore + restoreForm
 * - 提交成功后调用 clearDraft() 清除
 */
export function useFormDraft<T>({
  type,
  mode,
  id,
  initialData,
}: UseFormDraftOptions<T>) {
  const storageKey = buildKey(type, mode, id);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [draftRestored, setDraftRestored] = useState(false);

  // 挂载时检查是否有草稿
  const savedDraft = useRef<T | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as T;
        // 简单校验：至少 title 不为空才认为有效草稿
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
          savedDraft.current = parsed;
        }
      }
    } catch {
      // JSON 解析失败，忽略
    }
  }, [storageKey]);

  // 自动保存草稿（防抖 500ms）
  const save = useCallback(
    (data: T) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(data));
        } catch {
          // sessionStorage 满了，忽略
        }
      }, 500);
    },
    [storageKey]
  );

  // 清理 timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 清除草稿
  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);

  // 恢复草稿
  const getDraft = useCallback((): T | null => {
    if (savedDraft.current && !draftRestored) {
      setDraftRestored(true);
      return savedDraft.current;
    }
    return null;
  }, [draftRestored]);

  // 浏览器刷新/关闭前警告
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      // 检查 sessionStorage 是否有当前表单的草稿
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        e.preventDefault();
        // Chrome 需要设置 returnValue
        e.returnValue = "您填写的内容尚未保存，确定要离开吗？";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [storageKey]);

  return { save, clearDraft, getDraft, draftRestored };
}
