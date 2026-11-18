-- Migration: add baby_sleeping_since to profiles for automatic nap tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS baby_sleeping_since TIMESTAMPTZ;
