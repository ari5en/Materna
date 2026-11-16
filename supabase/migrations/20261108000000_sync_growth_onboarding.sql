-- Materna: growth history, wake-state persistence, onboarding flag, and RLS gaps
-- Run this in your Supabase SQL Editor AFTER 20261101000000_postpartum_schema.sql.
-- Safe to re-run (idempotent).

-- 1. Profiles: onboarding flag + persisted wake time -------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarded BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_wake_at TIMESTAMPTZ;

-- Neutral defaults instead of the demo persona (Sarah & Leo)
ALTER TABLE public.profiles
  ALTER COLUMN full_name SET DEFAULT 'Mama',
  ALTER COLUMN baby_name SET DEFAULT 'Baby',
  ALTER COLUMN completed_milestones SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN favorite_tracks SET DEFAULT ARRAY[]::TEXT[];

-- New-user trigger: use the Google/profile name when available, no demo defaults
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, baby_name, baby_birth_date)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1), ''),
      'Mama'
    ),
    COALESCE(NEW.raw_user_meta_data->>'baby_name', 'Baby'),
    COALESCE((NEW.raw_user_meta_data->>'baby_birth_date')::DATE, CURRENT_DATE)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Growth measurements history ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.growth_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  measured_on DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_lbs NUMERIC(5,2) CHECK (weight_lbs IS NULL OR (weight_lbs > 0 AND weight_lbs < 60)),
  length_in NUMERIC(5,1) CHECK (length_in IS NULL OR (length_in > 0 AND length_in < 50)),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop legacy head circumference columns if they exist
ALTER TABLE public.profiles DROP COLUMN IF EXISTS baby_head_in;
ALTER TABLE public.growth_measurements DROP COLUMN IF EXISTS head_in;

ALTER TABLE public.growth_measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own growth measurements" ON public.growth_measurements;
CREATE POLICY "Users can manage their own growth measurements"
  ON public.growth_measurements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_growth_user_date
  ON public.growth_measurements(user_id, measured_on DESC, created_at DESC);

-- 3. Missing RLS policies -----------------------------------------------------
DROP POLICY IF EXISTS "Users can update their own baby logs" ON public.baby_logs;
CREATE POLICY "Users can update their own baby logs"
  ON public.baby_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own mood logs" ON public.maternal_mood_logs;
CREATE POLICY "Users can delete their own mood logs"
  ON public.maternal_mood_logs FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Optional cleanup of old demo data on YOUR existing test account ----------
-- Uncomment and replace the email if you want to reset the demo defaults
-- (Sarah/Leo, pre-ticked milestones) on an account created before this migration:
--
-- UPDATE public.profiles
--   SET completed_milestones = ARRAY[]::TEXT[],
--       favorite_tracks = ARRAY[]::TEXT[],
--       onboarded = FALSE
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'you@example.com');

