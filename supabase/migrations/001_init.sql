-- ============================================================
-- 墨韵博客 · Supabase 初始化迁移
-- 创建日期: 2026-06-27
-- 说明: 在 Supabase SQL Editor 中执行此文件
-- ============================================================

-- 0. 清理（如需重跑可取消注释）
-- DROP TABLE IF EXISTS calligraphy CASCADE;
-- DROP TABLE IF EXISTS photography CASCADE;
-- DROP TABLE IF EXISTS reflections CASCADE;

-- ============================================================
-- 1. 书法表
-- ============================================================
CREATE TABLE calligraphy (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text NOT NULL,
  slug        text NOT NULL UNIQUE,
  date        date NOT NULL,
  description text DEFAULT '',
  cover       text,
  year        text,                     -- "2026"
  medium      text,                     -- "宣纸 · 兼毫"
  category    text,                     -- "行书" / "楷书"
  content     text NOT NULL DEFAULT '', -- MDX 正文
  published   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ============================================================
-- 2. 摄影表
-- ============================================================
CREATE TABLE photography (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text NOT NULL,
  slug        text NOT NULL UNIQUE,
  date        date NOT NULL,
  description text DEFAULT '',
  cover       text,
  location    text,                     -- 拍摄地点
  camera      text,                     -- 拍摄设备
  content     text NOT NULL DEFAULT '',
  published   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ============================================================
-- 3. 感悟表
-- ============================================================
CREATE TABLE reflections (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text NOT NULL,
  slug        text NOT NULL UNIQUE,
  date        date NOT NULL,
  description text DEFAULT '',
  cover       text,
  category    text,                     -- "随笔" / "游记"
  content     text NOT NULL DEFAULT '',
  published   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ============================================================
-- 4. updated_at 自动更新触发器
-- ============================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_calligraphy_modtime
  BEFORE UPDATE ON calligraphy
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_photography_modtime
  BEFORE UPDATE ON photography
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_reflections_modtime
  BEFORE UPDATE ON reflections
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- 5. RLS 策略 — 公开可读，认证用户可写
-- ============================================================

-- 开启 RLS
ALTER TABLE calligraphy ENABLE ROW LEVEL SECURITY;
ALTER TABLE photography ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- calligraphy 策略
CREATE POLICY "公开可读" ON calligraphy
  FOR SELECT USING (published = true);

CREATE POLICY "管理员可写入" ON calligraphy
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- photography 策略
CREATE POLICY "公开可读" ON photography
  FOR SELECT USING (published = true);

CREATE POLICY "管理员可写入" ON photography
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- reflections 策略
CREATE POLICY "公开可读" ON reflections
  FOR SELECT USING (published = true);

CREATE POLICY "管理员可写入" ON reflections
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 6. Storage Bucket 创建
--    注意：这部分需要在 Supabase Dashboard → Storage 中手动创建，
--    或者通过 Supabase API 创建。SQL 无法直接创建 bucket。
--    以下是 RLS 策略，在创建 bucket 后执行。
-- ============================================================

-- 手动操作步骤:
--   1. 进入 Supabase Dashboard → Storage
--   2. 创建 3 个 public bucket:
--      - calligraphy （存放书法图片）
--      - photography （存放摄影图片）
--      - reflections （存放感悟配图）
--   3. 每个 bucket 勾选 "Public bucket"
--   4. 然后回到 SQL Editor 执行下面的 Storage 策略

-- Storage 公开可读策略
CREATE POLICY "公开可读_书法" ON storage.objects
  FOR SELECT USING (bucket_id = 'calligraphy');

CREATE POLICY "公开可读_摄影" ON storage.objects
  FOR SELECT USING (bucket_id = 'photography');

CREATE POLICY "公开可读_感悟" ON storage.objects
  FOR SELECT USING (bucket_id = 'reflections');

-- Storage 管理员上传策略
CREATE POLICY "管理员可上传_书法" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND bucket_id = 'calligraphy'
  );

CREATE POLICY "管理员可上传_摄影" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND bucket_id = 'photography'
  );

CREATE POLICY "管理员可上传_感悟" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND bucket_id = 'reflections'
  );

-- Storage 管理员更新/删除策略
CREATE POLICY "管理员可更新_书法" ON storage.objects
  FOR UPDATE USING (auth.role() = 'authenticated' AND bucket_id = 'calligraphy');

CREATE POLICY "管理员可更新_摄影" ON storage.objects
  FOR UPDATE USING (auth.role() = 'authenticated' AND bucket_id = 'photography');

CREATE POLICY "管理员可更新_感悟" ON storage.objects
  FOR UPDATE USING (auth.role() = 'authenticated' AND bucket_id = 'reflections');

CREATE POLICY "管理员可删除_书法" ON storage.objects
  FOR DELETE USING (auth.role() = 'authenticated' AND bucket_id = 'calligraphy');

CREATE POLICY "管理员可删除_摄影" ON storage.objects
  FOR DELETE USING (auth.role() = 'authenticated' AND bucket_id = 'photography');

CREATE POLICY "管理员可删除_感悟" ON storage.objects
  FOR DELETE USING (auth.role() = 'authenticated' AND bucket_id = 'reflections');

-- ============================================================
-- 7. 索引（查询优化）
-- ============================================================
CREATE INDEX idx_calligraphy_slug ON calligraphy(slug);
CREATE INDEX idx_calligraphy_date ON calligraphy(date DESC);
CREATE INDEX idx_photography_slug ON photography(slug);
CREATE INDEX idx_photography_date ON photography(date DESC);
CREATE INDEX idx_reflections_slug ON reflections(slug);
CREATE INDEX idx_reflections_date ON reflections(date DESC);

-- ============================================================
-- 完成！
-- 接下来去 Supabase Dashboard:
--   1. Authentication → 创建管理员用户（邮箱 + 密码）
--   2. Storage → 创建 3 个 bucket（calligraphy / photography / reflections）
-- ============================================================
