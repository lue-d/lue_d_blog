"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

/**
 * 管理后台入口 — 仅登录后可见
 * 在 Header 中作为低调的 🔒 图标出现
 */
export default function AdminLink() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!loggedIn) return null;

  return (
    <Link
      href="/admin"
      className="text-xs text-ink-muted hover:text-ink-accent transition-colors ml-2"
      title="管理后台"
    >
      🔒
    </Link>
  );
}
