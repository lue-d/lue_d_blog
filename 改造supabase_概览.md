# Supabase 改造方案概览

## 目标

将博客从「本地 MDX 文件驱动」改为「Supabase 数据库驱动」，实现书法、摄影、感悟三类内容的在线增删改查。

## 6 个步骤

| 步骤 | 内容 | 预估时间 |
|------|------|---------|
| Step 1 | Supabase 建表 + RLS + Storage | 30 分钟 |
| Step 2 | `lib/supabase.ts` + `lib/content-supabase.ts` 数据层 | 30 分钟 |
| Step 3 | 改造前端 6 个页面（列表 + 详情） | 1 小时 |
| Step 4 | 管理后台 `/admin`（登录 + 3 套 CRUD） | 2-3 小时 |
| Step 5 | 数据迁移脚本 | 20 分钟 |
| Step 6 | 收尾：Header 入口、next.config、测试 | 30 分钟 |
| **合计** | | **约 5-6 小时** |

## 架构变化

```
改造前：content/*.mdx  →  fs.readFile  →  页面渲染
改造后：管理后台 UI  →  Supabase API  →  PostgreSQL  →  页面渲染
```

## 新增文件

- `lib/supabase.ts` — Supabase 客户端
- `lib/content-supabase.ts` — 数据库查询（替代 `lib/content.ts`）
- `app/admin/` — 管理后台全套页面
- `supabase/migrations/` — 建表 SQL
- `scripts/migrate-to-supabase.ts` — 旧数据迁移

## 数据库表

- `calligraphy` — 书法作品
- `photography` — 摄影作品
- `reflections` — 感悟文章

每张表含 title / slug / date / description / cover / content 等字段，以及 published 草稿开关。

## 关键设计

- ✅ 页面保持 SSR，不影响 SEO
- ✅ 原有 MDX 文件保留，随时可回退
- ✅ 用 `remark` + `remark-html` 实时渲染 markdown
- ✅ 管理员邮箱登录，RLS 权限控制

## 详细方案

请查看 [supabase.md](supabase.md)
