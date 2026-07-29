-- Storage game_files bucket hajmi va RLS siyosatlarini to'liq sozlash
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('game_files', 'game_files', true, 10737418240)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 10737418240;

-- RLS siyosatlari
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access for Game Files') THEN
    CREATE POLICY "Public Access for Game Files" ON storage.objects FOR SELECT USING (bucket_id = 'game_files');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Upload Access for Game Files') THEN
    CREATE POLICY "Authenticated Upload Access for Game Files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'game_files' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Update Access for Game Files') THEN
    CREATE POLICY "Authenticated Update Access for Game Files" ON storage.objects FOR UPDATE USING (bucket_id = 'game_files' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated Delete Access for Game Files') THEN
    CREATE POLICY "Authenticated Delete Access for Game Files" ON storage.objects FOR DELETE USING (bucket_id = 'game_files' AND auth.role() = 'authenticated');
  END IF;
END $$;
