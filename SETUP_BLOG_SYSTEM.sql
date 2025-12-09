-- =====================================================
-- Blog Management System Setup
-- =====================================================
-- Run this in Supabase SQL Editor to create the blog system
-- =====================================================

-- 1. Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cover_image TEXT,
    read_time TEXT DEFAULT '5 min read',
    published BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);

-- 3. Create blog_categories table
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Insert default categories
INSERT INTO blog_categories (name, slug, description) VALUES
    ('AI & Gaming', 'ai-gaming', 'Articles about AI in gaming'),
    ('Tutorial', 'tutorial', 'Step-by-step guides and tutorials'),
    ('Featured', 'featured', 'Featured content and highlights'),
    ('Community', 'community', 'Community stories and spotlights'),
    ('Tips & Tricks', 'tips-tricks', 'Helpful tips and tricks'),
    ('Industry Insights', 'industry-insights', 'Gaming industry analysis')
ON CONFLICT (slug) DO NOTHING;

-- 5. Enable RLS on blog_posts
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can insert blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can update blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Admins can delete blog posts" ON blog_posts;

-- 7. Create RLS policies for blog_posts
-- Anyone can view published posts
CREATE POLICY "Anyone can view published blog posts"
ON blog_posts FOR SELECT
USING (published = true);

-- Authenticated users can insert (will be restricted to admins in app)
CREATE POLICY "Authenticated users can insert blog posts"
ON blog_posts FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can update their own posts or admins can update any
CREATE POLICY "Users can update their own blog posts"
ON blog_posts FOR UPDATE
TO authenticated
USING (auth.uid() = author_id OR auth.uid() IN (
    SELECT id FROM auth.users WHERE email = 'admin@oplus.ai'
))
WITH CHECK (auth.uid() = author_id OR auth.uid() IN (
    SELECT id FROM auth.users WHERE email = 'admin@oplus.ai'
));

-- Authenticated users can delete their own posts or admins can delete any
CREATE POLICY "Users can delete their own blog posts"
ON blog_posts FOR DELETE
TO authenticated
USING (auth.uid() = author_id OR auth.uid() IN (
    SELECT id FROM auth.users WHERE email = 'admin@oplus.ai'
));

-- 8. Enable RLS on blog_categories
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for blog_categories
CREATE POLICY "Anyone can view blog categories"
ON blog_categories FOR SELECT
USING (true);

CREATE POLICY "Admins can manage blog categories"
ON blog_categories FOR ALL
TO authenticated
USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE email = 'admin@oplus.ai'
))
WITH CHECK (auth.uid() IN (
    SELECT id FROM auth.users WHERE email = 'admin@oplus.ai'
));

-- 10. Grant permissions
GRANT ALL ON blog_posts TO authenticated;
GRANT ALL ON blog_categories TO authenticated;
GRANT SELECT ON blog_posts TO anon;
GRANT SELECT ON blog_categories TO anon;

-- 11. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger for updated_at
DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_post_updated_at();

-- 13. Create function to set published_at when publishing
CREATE OR REPLACE FUNCTION set_blog_post_published_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.published = true AND OLD.published = false THEN
        NEW.published_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Create trigger for published_at
DROP TRIGGER IF EXISTS blog_posts_published_at ON blog_posts;
CREATE TRIGGER blog_posts_published_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION set_blog_post_published_at();

-- 15. Verification
SELECT 
    'Blog posts table' as component,
    'EXISTS' as status,
    COUNT(*) as record_count
FROM blog_posts
UNION ALL
SELECT 
    'Blog categories' as component,
    'EXISTS' as status,
    COUNT(*) as record_count
FROM blog_categories
UNION ALL
SELECT 
    'RLS Policies on blog_posts' as component,
    'ENABLED' as status,
    COUNT(*) as policy_count
FROM pg_policies WHERE tablename = 'blog_posts';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Blog management system setup complete!';
    RAISE NOTICE 'Admins can now:';
    RAISE NOTICE '  - Create, edit, and delete blog posts';
    RAISE NOTICE '  - Publish/unpublish posts';
    RAISE NOTICE '  - Manage categories';
    RAISE NOTICE '  - Upload cover images';
    RAISE NOTICE '  - Track views and likes';
END $$;

COMMIT;
