"use client";

import { useState, useEffect, useCallback } from "react";

type ToastType = "success" | "error";

interface Toast {
  id: number;
  type: ToastType;
  text: string;
}

let nextId = 0;
const listeners = new Set<(toasts: Toast[]) => void>();
let currentToasts: Toast[] = [];

function notify() {
  for (const fn of listeners) fn([...currentToasts]);
}

/** 程序化触发 toast（不依赖组件） */
export function showToast(type: ToastType, text: string) {
  const toast: Toast = { id: ++nextId, type, text };
  currentToasts = [...currentToasts, toast];
  notify();
  // 3 秒后自动消失
  setTimeout(() => {
    currentToasts = currentToasts.filter((t) => t.id !== toast.id);
    notify();
  }, 3000);
}

/**
 * Toast 跨页面传递：在跳转前存入 sessionStorage，
 * 目标页面挂载时调用 consumeStashedToast() 取出并展示
 */
const STASH_KEY = "toast_stash";

export function stashToast(type: ToastType, text: string) {
  try {
    sessionStorage.setItem(STASH_KEY, JSON.stringify({ type, text }));
  } catch {
    // ignore
  }
}

export function consumeStashedToast() {
  try {
    const raw = sessionStorage.getItem(STASH_KEY);
    if (raw) {
      sessionStorage.removeItem(STASH_KEY);
      const { type, text } = JSON.parse(raw);
      showToast(type, text);
    }
  } catch {
    // ignore
  }
}

/** Toast 容器组件，放在 layout 中 */
export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    currentToasts = currentToasts.filter((t) => t.id !== id);
    notify();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-2 animate-slide-in transition-all duration-300 ${
            t.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <span>{t.type === "success" ? "✅" : "❌"}</span>
          <span>{t.text}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="ml-2 opacity-70 hover:opacity-100"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
