# Supabase 迁移实施方案

## 1. 目标架构

```
┌─────────────────────────────────────────────────────┐
│  Next.js 前端                                       │
│                                                     │
│  /calligraphy, /photography, /reflections  ← 不变  │
│  /admin/*                  ← 新增：管理后台          │
│                                                     │
│  lib/content-supabase.ts   ← 新增：Supabase 数据层  │
│  lib/supabase.ts           ← 新增：客户端初始化      │
├─────────────────────────────────────────────────────┤
│  Supabase 后端                                      │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ Database │ │  Auth    │ │  Storage         │    │
│  │ 三张表    │ │ 管理员   │ │  图片分 bucket    │    │
│  └──────────┘ └──────────┘ └──────────────────┘    │
└─────────────────────────────────────────────────────┘
```

## 2. 依赖安装

```bash
npm install @supabase/supabase-js
```

不再需要额外依赖，`@supabase/supabase-js` 已内置类型支持和 Auth 客户端。

## 3. 环境变量

在项目根目录创建 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=https://<你的项目ID>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<你的 anon key>
SUPABASE_SERVICE_ROLE_KEY=<你的 service_role key>  # 仅服务端用
```

## 4. 数据库 Schema

### 4.1 书法表 (calligraphy)

```sql
CREATE TABLE calligraphy (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title      text NOT NULL,
  slug       text NOT NULL UNIQUE,        -- URL 友好的标识符
  date       date NOT NULL,
  description text,
  cover      text,                        -- Storage 图片 URL
  year       text,                        -- "2026"
  medium     text,                        -- "宣纸 · 兼毫"
  category   text,                        -- "行书" / "楷书" 等
  content    text NOT NULL,               -- MDX 正文
  published  boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 4.2 摄影表 (photography)

```sql
CREATE TABLE photography (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text NOT NULL,
  slug        text NOT NULL UNIQUE,
  date        date NOT NULL,
  description text,
  cover       text,                       -- Storage 图片 URL
  location    text,                       -- 拍摄地点
  camera      text,                       -- 拍摄设备
  content     text NOT NULL,              -- MDX 正文
  published   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
```

### 4.3 感悟表 (reflections)

```sql
CREATE TABLE reflections (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text NOT NULL,
  slug        text NOT NULL UNIQUE,
  date        date NOT NULL,
  description text,
  cover       text,
  category    text,                       -- "随笔" / "游记" 等
  content     text NOT NULL,
  published   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## 5. Supabase Storage

创建 3 个 bucket，用于存放封面图和正文中的图片：

| Bucket 名 | 用途 | 公开访问 |
|-----------|------|----------|
| `calligraphy` | 书法作品图片 | ✅ 是 |
| `photography` | 摄影作品图片 | ✅ 是 |
| `reflections` | 感悟文章图片 | ✅ 是 |

## 6. 权限策略 (RLS)

### 6.1 公开读 + 管理员写

每张表都需要开启 RLS，策略如下：

```sql
-- 所有人可读已发布的内容
CREATE POLICY "公开可读" ON calligraphy
  FOR SELECT USING (published = true);

-- 只有认证用户（管理员）可以增删改
CREATE POLICY "管理员可写入" ON calligraphy
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- photography 和 reflections 同样的策略
CREATE POLICY "公开可读" ON photography
  FOR SELECT USING (published = true);
CREATE POLICY "管理员可写入" ON photography
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "公开可读" ON reflections
  FOR SELECT USING (published = true);
CREATE POLICY "管理员可写入" ON reflections
  FOR ALL USING (auth.role() = 'authenticated');
```

### 6.2 Storage 策略

```sql
-- 公开可读
CREATE POLICY "公开可读" ON storage.objects
  FOR SELECT USING (bucket_id IN ('calligraphy', 'photography', 'reflections'));

-- 管理员可上传/删除
CREATE POLICY "管理员可上传" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND bucket_id IN ('calligraphy', 'photography', 'reflections')
  );
```

## 7. 代码改造，分 6 步

### Step 1 — 创建 `lib/supabase.ts`（Supabase 客户端）

```ts
// 客户端（浏览器中调用，权限受限）
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 服务端（API 路由中调用，service_role 绕过 RLS）
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### Step 2 — 创建 `lib/content-supabase.ts`（替代 `lib/content.ts`）

保持与现有 `ContentMeta` 接口兼容，将 `getContentList()` 和 `getContentData()` 改为从 Supabase 查询：

- `getContentList(type)` → `supabase.from(type).select('*').eq('published', true).order('date', { ascending: false })`
- `getContentData(type, slug)` → `supabase.from(type).select('*').eq('slug', slug).single()`

### Step 3 — 改造前端页面

- **列表页**（`/calligraphy`, `/photography`, `/reflections`）：
  从 `"use server"` 文件读取 → 改为 **Client Component** 用 `useEffect` + `supabase` 获取，或改为 **async Server Component** 用 `supabaseAdmin` 获取（推荐后者，SSR 友好）

- **详情页**（`/[type]/[slug]`）：
  同理改为从 Supabase 获取

### Step 4 — 创建管理后台 `/admin`

```
app/admin/
├── layout.tsx          ← 管理后台布局（含登录检查）
├── page.tsx            ← 仪表盘
├── login/
│   └── page.tsx        ← 登录页（邮箱 + 密码）
├── calligraphy/
│   ├── page.tsx        ← 书法列表（含删除按钮）
│   ├── new/
│   │   └── page.tsx    ← 新增书法
│   └── [id]/
│       └── edit/
│           └── page.tsx ← 编辑书法
├── photography/        ← 同上结构
└── reflections/        ← 同上结构
```

管理后台核心功能：
- **登录/登出**：Supabase Auth 邮箱密码登录
- **列表页**：显示所有条目（含未发布的），提供「编辑」「删除」「新增」按钮
- **表单页**：标题、日期、描述、封面图上传、分类、正文（textarea / 简易编辑器）
- **图片上传**：用 Supabase Storage API 上传，返回公开 URL 存入数据库

### Step 5 — 数据迁移脚本

创建 `scripts/migrate-to-supabase.ts`：
1. 读取 `content/` 下所有 `.mdx` 文件
2. 将 `public/images/*` 下的图片上传到 Supabase Storage
3. 将解析后的数据批量插入 Supabase

### Step 6 — 管理后台入口

在 Header 中加一个低调的管理入口（如 `墨韵` 标题旁边的 🔒 图标），只有登录后可见。

## 8. 改造要点与风险

| 要点 | 说明 |
|------|------|
| **MDX → HTML** | 前端不再用 `@next/mdx` 处理 `.mdx` 文件，改为在 `lib/content-supabase.ts` 中用 `remark` + `remark-html` 实时转换数据库中的 markdown 文本 |
| **图片 Next.js Image** | 封面图 URL 来自 Supabase Storage，需在 `next.config.ts` 中添加 `images.remotePatterns` |
| **SEO** | 详情页改为客户端获取数据会影响 SEO。推荐用 async Server Component + `supabaseAdmin`（service_role key 只在服务端用）保持 SSR |
| **slug 唯一性** | 数据库中 slug 必须唯一，新建/编辑时需校验 |
| **草稿功能** | `published = false` 的记录只在管理后台可见，前端不展示 |
| **免费配额** | 1GB Storage + 500MB 数据库 + 5GB 带宽，摄影爱好者需注意图片体积 |

## 9. 目录结构变化一览

```
blog/
├── .env.local                    ← 新增：Supabase 环境变量
├── package.json                  ← 改动：新增 @supabase/supabase-js
├── next.config.ts                ← 改动：添加 images.remotePatterns
├── lib/
│   ├── content.ts                ← 保留作为备选，不再使用
│   ├── content-supabase.ts       ← 新增：Supabase 数据层
│   └── supabase.ts               ← 新增：Supabase 客户端
├── app/
│   ├── admin/                    ← 新增：管理后台
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/page.tsx
│   │   ├── calligraphy/
│   │   ├── photography/
│   │   └── reflections/
│   ├── calligraphy/
│   │   ├── page.tsx              ← 改动：数据源切换
│   │   └── [slug]/page.tsx       ← 改动：数据源切换
│   ├── photography/
│   │   ├── page.tsx              ← 改动：数据源切换
│   │   └── [slug]/page.tsx       ← 改动：数据源切换
│   └── reflections/
│       ├── page.tsx              ← 改动：数据源切换
│       └── [slug]/page.tsx       ← 改动：数据源切换
├── components/
│   └── Header.tsx                ← 改动：添加管理后台入口
├── content/                      ← 保留：作为历史数据
├── scripts/
│   └── migrate-to-supabase.ts    ← 新增：迁移脚本
└── public/images/                ← 保留：历史图片
```

## 10. 工作量估算

| 步骤 | 内容 | 预估时间 |
|------|------|---------|
| Step 1-2 | Supabase 项目创建 + 建表 + RLS + Storage | 30 分钟 |
| Step 3-4 | `lib/supabase.ts` + `lib/content-supabase.ts` | 30 分钟 |
| Step 5 | 改造前端 6 个页面（列表 + 详情） | 1 小时 |
| Step 6 | 管理后台（登录 + 3 套 CRUD） | 2-3 小时 |
| Step 7 | 数据迁移脚本 + 执行 | 20 分钟 |
| Step 8 | 测试 + 修复问题 | 30 分钟 |
| **合计** | | **约 5-6 小时** |
