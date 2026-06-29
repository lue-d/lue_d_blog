"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const ADMIN_NAV = [
  { href: "/admin", label: "仪表盘" },
  { href: "/admin/calligraphy", label: "书法" },
  { href: "/admin/photography", label: "摄影" },
  { href: "/admin/reflections", label: "感悟" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  // 登录页不需要检查（trailingSlash 下 pathname 以 / 结尾）
  const isLoginPage = pathname === "/admin/login" || pathname === "/admin/login/";

  useEffect(() => {
    if (isLoginPage) {
      setChecking(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/admin/login");
      } else {
        setAuthenticated(true);
      }
      setChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isLoginPage) {
        router.replace("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [isLoginPage, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  // 登录页直接渲染
  if (isLoginPage) {
    return <>{children}</>;
  }

  // 检查中
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-paper dark:bg-ink-dark-bg">
        <p className="text-ink-muted text-sm">检查登录状态...</p>
      </div>
    );
  }

  // 未认证
  if (!authenticated) {
    return null;
  }

  // 已认证
  return (
    <div className="min-h-screen bg-ink-paper dark:bg-ink-dark-bg">
      {/* 顶栏 */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-black/40 backdrop-blur-sm border-b border-ink-border dark:border-ink-dark-muted/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-8">
            <Link
              href="/admin"
              className="text-base font-bold font-[family-name:var(--font-serif)] tracking-wider"
            >
              管理后台
            </Link>
            <nav className="flex items-center gap-6">
              {ADMIN_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm transition-colors ${
                    (item.href === "/admin"
                      ? pathname === "/admin" || pathname === "/admin/"
                      : pathname.startsWith(item.href))
                      ? "text-ink-accent font-medium"
                      : "text-ink-muted hover:text-ink-accent"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs text-ink-muted hover:text-ink-accent transition-colors"
              target="_blank"
            >
              查看前台 →
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs text-ink-muted hover:text-red-500 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* 内容区 */}
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
