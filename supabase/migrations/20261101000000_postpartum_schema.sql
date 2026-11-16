-- Materna Postpartum-Only Database Schema (Full Dynamic Schema)
-- Run this in your Supabase SQL Editor

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'Sarah',
  baby_name TEXT DEFAULT 'Leo',
  baby_birth_date DATE NOT NULL DEFAULT (CURRENT_DATE - INTERVAL '44 days')::DATE,
  primary_focus TEXT[] DEFAULT ARRAY['Wake Windows & Sleep', 'Nursing & Milk Supply']::TEXT[],
  completed_milestones TEXT[] DEFAULT ARRAY['m-1', 'm-2']::TEXT[],
  favorite_tracks TEXT[] DEFAULT ARRAY['t-1']::TEXT[],
  nap_target INTEGER DEFAULT 4,
  baby_weight_lbs NUMERIC(4,1),
  baby_length_in NUMERIC(4,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if upgrading an existing profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS primary_focus TEXT[] DEFAULT ARRAY['Wake Windows & Sleep', 'Nursing & Milk Supply']::TEXT[],
  ADD COLUMN IF NOT EXISTS completed_milestones TEXT[] DEFAULT ARRAY['m-1', 'm-2']::TEXT[],
  ADD COLUMN IF NOT EXISTS favorite_tracks TEXT[] DEFAULT ARRAY['t-1']::TEXT[],
  ADD COLUMN IF NOT EXISTS nap_target INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS baby_weight_lbs NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS baby_length_in NUMERIC(4,1);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Automatic trigger to create a profile row when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, baby_name, baby_birth_date)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Sarah'),
    COALESCE(NEW.raw_user_meta_data->>'baby_name', 'Leo'),
    COALESCE((NEW.raw_user_meta_data->>'baby_birth_date')::DATE, (CURRENT_DATE - INTERVAL '44 days')::DATE)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Baby Logs Table
CREATE TABLE IF NOT EXISTS public.baby_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL CHECK (log_type IN ('feed', 'diaper', 'sleep')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for baby_logs
ALTER TABLE public.baby_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own baby logs" ON public.baby_logs;
CREATE POLICY "Users can view their own baby logs"
  ON public.baby_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own baby logs" ON public.baby_logs;
CREATE POLICY "Users can insert their own baby logs"
  ON public.baby_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own baby logs" ON public.baby_logs;
CREATE POLICY "Users can delete their own baby logs"
  ON public.baby_logs FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Maternal Mood Logs Table
CREATE TABLE IF NOT EXISTS public.maternal_mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for maternal_mood_logs
ALTER TABLE public.maternal_mood_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own mood logs" ON public.maternal_mood_logs;
CREATE POLICY "Users can view their own mood logs"
  ON public.maternal_mood_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own mood logs" ON public.maternal_mood_logs;
CREATE POLICY "Users can insert their own mood logs"
  ON public.maternal_mood_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own mood logs" ON public.maternal_mood_logs;
CREATE POLICY "Users can update their own mood logs"
  ON public.maternal_mood_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Daily Maternal Recovery & Hydration Logs Table
CREATE TABLE IF NOT EXISTS public.maternal_recovery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  water_glasses INTEGER NOT NULL DEFAULT 0 CHECK (water_glasses BETWEEN 0 AND 15),
  completed_exercises TEXT[] DEFAULT ARRAY[]::TEXT[],
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, logged_date)
);

ALTER TABLE public.maternal_recovery_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own recovery logs" ON public.maternal_recovery_logs;
CREATE POLICY "Users can manage their own recovery logs"
  ON public.maternal_recovery_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_baby_logs_user_timestamp ON public.baby_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_maternal_mood_user_date ON public.maternal_mood_logs(user_id, logged_date DESC);
CREATE INDEX IF NOT EXISTS idx_maternal_recovery_user_date ON public.maternal_recovery_logs(user_id, logged_date DESC);
