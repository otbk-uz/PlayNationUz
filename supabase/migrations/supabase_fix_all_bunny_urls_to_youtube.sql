-- Supabase SQL Patch: Barcha bunny:// URL larini ishlaydigan YouTube URL ga o'tkazish
UPDATE public.gamedev_lessons
SET video_url = 'https://www.youtube.com/watch?v=gB1F9G0JHD8'
WHERE video_url LIKE 'bunny://%';
