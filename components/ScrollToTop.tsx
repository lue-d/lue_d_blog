"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * 路由切换时自动滚动到页面顶部
 * 解决静态导出模式下 scroll restoration 失效的问题
 */
export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
