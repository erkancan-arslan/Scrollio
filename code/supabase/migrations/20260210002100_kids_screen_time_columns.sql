-- Add time window columns to kids_screen_time_rules (backend expects these)
ALTER TABLE public.kids_screen_time_rules
  ADD COLUMN IF NOT EXISTS allowed_start_time TEXT DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS allowed_end_time TEXT DEFAULT '20:00';
