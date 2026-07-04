-- ============================================================
-- 墨韵博客 · 多图上传 & 画廊功能
-- 创建日期: 2026-07-04
-- 说明: 在 Supabase SQL Editor 中执行此文件
-- ============================================================

-- 0. 清理（如需重跑可取消注释）
-- DROP TABLE IF EXISTS images CASCADE;

-- ============================================================
-- 1. 图片表（多态关联三种内容类型）
-- ============================================================
CREATE TABLE images (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_type    text NOT NULL,          -- 'calligraphy' | 'photography' | 'reflections'
  post_slug    text NOT NULL,          -- 关联文章 slug
  url          text NOT NULL,          -- Supabase Storage 公开 URL
  alt_text     text DEFAULT '',        -- 图片描述（accessibility）
  caption      text DEFAULT '',        -- 图片说明（展示在灯箱中）
  sort_order   integer NOT NULL DEFAULT 0,  -- 排序（数字越小越靠前）
  created_at   timestamptz DEFAULT now()
);

-- ============================================================
-- 2. 索引
-- ============================================================
-- 按文章查询所有图片（最常用查询）
CREATE INDEX idx_images_post
  ON images(post_type, post_slug);

-- 按排序查询
CREATE INDEX idx_images_sort
  ON images(post_type, post_slug, sort_order);

-- ============================================================
-- 3. RLS 策略
-- ============================================================
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- 公开：可读取所有图片
CREATE POLICY "公开可读图片" ON images
  FOR SELECT USING (true);

-- 管理员：全部操作
CREATE POLICY "管理员可管理图片" ON images
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 4. 约束
-- ============================================================
-- post_type 只能是三种类型之一
ALTER TABLE images
  ADD CONSTRAINT valid_post_type CHECK (
    post_type IN ('calligraphy', 'photography', 'reflections')
  );

-- sort_order 为非负数
ALTER TABLE images
  ADD CONSTRAINT non_negative_sort_order CHECK (sort_order >= 0);

-- ============================================================
-- 完成！
-- ============================================================
