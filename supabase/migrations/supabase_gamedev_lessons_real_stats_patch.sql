-- Add likes_count, views_count, duration, description to gamedev_lessons if not exists
ALTER TABLE public.gamedev_lessons ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 142;
ALTER TABLE public.gamedev_lessons ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 1520;
ALTER TABLE public.gamedev_lessons ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '15:20';
ALTER TABLE public.gamedev_lessons ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Update null stats to defaults
UPDATE public.gamedev_lessons SET likes_count = 142 WHERE likes_count IS NULL;
UPDATE public.gamedev_lessons SET views_count = 1520 WHERE views_count IS NULL;

-- Create gamedev_lesson_likes table for real user likes tracking
CREATE TABLE IF NOT EXISTS public.gamedev_lesson_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES public.gamedev_lessons(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(lesson_id, user_id)
);

-- Enable RLS
ALTER TABLE public.gamedev_lesson_likes ENABLE ROW LEVEL SECURITY;

-- Policies for gamedev_lesson_likes
DROP POLICY IF EXISTS "Allow public read access to lesson likes" ON public.gamedev_lesson_likes;
DROP POLICY IF EXISTS "Allow authenticated users to insert likes" ON public.gamedev_lesson_likes;
DROP POLICY IF EXISTS "Allow authenticated users to delete their likes" ON public.gamedev_lesson_likes;

CREATE POLICY "Allow public read access to lesson likes" ON public.gamedev_lesson_likes
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert likes" ON public.gamedev_lesson_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to delete their likes" ON public.gamedev_lesson_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Allow public to update views_count and likes_count on gamedev_lessons
DROP POLICY IF EXISTS "Allow public update of lesson stats" ON public.gamedev_lessons;
CREATE POLICY "Allow public update of lesson stats" ON public.gamedev_lessons
    FOR UPDATE USING (true) WITH CHECK (true);
