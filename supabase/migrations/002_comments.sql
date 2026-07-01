-- ============================================================
-- 墨韵博客 · 留言功能迁移
-- 创建日期: 2026-07-01
-- 说明: 在 Supabase SQL Editor 中执行此文件
-- ============================================================

-- 0. 清理旧表（如果存在）
DROP TABLE IF EXISTS comments CASCADE;

-- ============================================================
-- 1. 留言表
-- ============================================================
CREATE TABLE comments (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_type    text NOT NULL,          -- 'calligraphy' | 'photography' | 'reflections'
  post_slug    text NOT NULL,          -- 关联文章 slug
  post_title   text NOT NULL DEFAULT '',-- 冗余文章标题（防止文章被删后无法识别）
  author_name  text NOT NULL,          -- 留言者昵称
  author_email text NOT NULL,          -- 留言者邮箱（仅后台可见）
  content      text NOT NULL,          -- 留言正文
  published    boolean DEFAULT false,  -- false = 待审核，true = 已通过
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- ============================================================
-- 2. 索引
-- ============================================================
CREATE INDEX idx_comments_post
  ON comments(post_type, post_slug);

CREATE INDEX idx_comments_published
  ON comments(published);

CREATE INDEX idx_comments_created_at
  ON comments(created_at DESC);

-- ============================================================
-- 3. 内容长度约束
-- ============================================================
ALTER TABLE comments
  ADD CONSTRAINT content_max_length CHECK (char_length(content) <= 2000);

ALTER TABLE comments
  ADD CONSTRAINT author_name_max_length CHECK (char_length(author_name) <= 50);

ALTER TABLE comments
  ADD CONSTRAINT author_email_max_length CHECK (char_length(author_email) <= 200);

-- ============================================================
-- 4. updated_at 触发器（复用已有函数）
-- ============================================================
CREATE TRIGGER update_comments_modtime
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================
-- 5. RLS 策略
-- ============================================================
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 公开：只能看到已审核通过的留言
CREATE POLICY "公开可读已通过留言" ON comments
  FOR SELECT USING (published = true);

-- 公开：可提交留言（RLS 强制 published = false）
CREATE POLICY "公开可提交留言" ON comments
  FOR INSERT WITH CHECK (
    auth.role() = 'anon' AND published = false
  );

-- 管理员：全部操作（通过 Supabase 认证的 session）
CREATE POLICY "管理员可管理留言" ON comments
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 完成！
-- ============================================================
