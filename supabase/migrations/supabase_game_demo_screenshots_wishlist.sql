-- 1. developed_games jadvaliga demo_url va screenshots ustunlarini qo'shish
ALTER TABLE public.developed_games ADD COLUMN IF NOT EXISTS demo_url TEXT NULL;
ALTER TABLE public.developed_games ADD COLUMN IF NOT EXISTS screenshots TEXT[] NULL;

-- 2. game_wishlist ("Xohlayman") jadvalini yaratish
CREATE TABLE IF NOT EXISTS public.game_wishlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES public.developed_games(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, game_id)
);

-- RLS yoqish
ALTER TABLE public.game_wishlist ENABLE ROW LEVEL SECURITY;

-- Policy: Har kim o'z wishlist'ini ko'ra oladi
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'game_wishlist' AND policyname = 'Users can view their own wishlist'
    ) THEN
        CREATE POLICY "Users can view their own wishlist"
            ON public.game_wishlist FOR SELECT
            USING ( auth.uid() = user_id );
    END IF;
END $$;

-- Policy: Har kim o'z wishlist'iga o'yin qo'sha oladi
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'game_wishlist' AND policyname = 'Users can add to their own wishlist'
    ) THEN
        CREATE POLICY "Users can add to their own wishlist"
            ON public.game_wishlist FOR INSERT
            WITH CHECK ( auth.uid() = user_id );
    END IF;
END $$;

-- Policy: Har kim o'z wishlist'idan o'yin o'chira oladi
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'game_wishlist' AND policyname = 'Users can remove from their own wishlist'
    ) THEN
        CREATE POLICY "Users can remove from their own wishlist"
            ON public.game_wishlist FOR DELETE
            USING ( auth.uid() = user_id );
    END IF;
END $$;
