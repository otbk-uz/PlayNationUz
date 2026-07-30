-- SQL Migration: Courses, User Progress, Quizzes, Certificates, and Reviews

-- 1. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'GameDev',
    level TEXT DEFAULT 'Boshlang\'ich', -- Boshlang'ich, O'rta, Pro
    cover_img TEXT NOT NULL,
    description TEXT DEFAULT '',
    what_you_will_learn TEXT[] DEFAULT '{}',
    total_lessons INTEGER DEFAULT 5,
    total_duration TEXT DEFAULT '2 soat',
    mentor_name TEXT DEFAULT 'Maroqli Mentor',
    mentor_avatar TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. User Course Progress Table
CREATE TABLE IF NOT EXISTS public.user_course_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    quiz_score INTEGER DEFAULT 5,
    quiz_passed BOOLEAN DEFAULT true,
    completed BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, course_id, lesson_id)
);

-- 3. Course Certificates Table
CREATE TABLE IF NOT EXISTS public.course_certificates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    certificate_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    course_title TEXT NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, course_id)
);

-- 4. Course Reviews Table
CREATE TABLE IF NOT EXISTS public.course_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow public read courses" ON public.courses;
CREATE POLICY "Allow public read courses" ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to read their own progress" ON public.user_course_progress;
DROP POLICY IF EXISTS "Allow users to insert/update their own progress" ON public.user_course_progress;
CREATE POLICY "Allow users to read their own progress" ON public.user_course_progress FOR SELECT USING (true);
CREATE POLICY "Allow users to insert/update their own progress" ON public.user_course_progress FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public read certificates" ON public.course_certificates;
DROP POLICY IF EXISTS "Allow users to insert certificates" ON public.course_certificates;
CREATE POLICY "Allow public read certificates" ON public.course_certificates FOR SELECT USING (true);
CREATE POLICY "Allow users to insert certificates" ON public.course_certificates FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow public read reviews" ON public.course_reviews;
DROP POLICY IF EXISTS "Allow authenticated users to write reviews" ON public.course_reviews;
CREATE POLICY "Allow public read reviews" ON public.course_reviews FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to write reviews" ON public.course_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
