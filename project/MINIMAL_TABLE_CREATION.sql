-- 🎯 MINIMAL TABLE CREATION - Just the Essential Tables
-- This creates ONLY the missing tables that are causing your app errors

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- CREATE ONLY THE MISSING ESSENTIAL TABLES
-- ==============================================

-- 1. LIVE MATCH UPDATES TABLE (Critical for fixing RLS errors)
CREATE TABLE IF NOT EXISTS public.live_match_updates (
  match_id TEXT PRIMARY KEY,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('live', 'finished', 'upcoming')),
  minute TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. MATCH EVENTS TABLE (Critical for fixing ON CONFLICT errors)
CREATE TABLE IF NOT EXISTS public.match_events (
  id BIGSERIAL PRIMARY KEY,
  match_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('goal', 'cancelled', 'card', 'substitution', 'half_time', 'full_time')),
  team_type TEXT NOT NULL CHECK (team_type IN ('home', 'away')),
  player_name TEXT,
  minute TEXT NOT NULL,
  score TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  -- Add unique constraint for ON CONFLICT resolution
  UNIQUE (match_id, event_type, team_type, minute)
);

-- 3. CHAT MESSAGES TABLE (Critical for chat functionality)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- ENABLE RLS ON NEW TABLES
-- ==============================================

ALTER TABLE public.live_match_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- CREATE PUBLIC ACCESS POLICIES (FIXES RLS ERRORS)
-- ==============================================

-- Live Match Updates - PUBLIC ACCESS (fixes your RLS error)
DROP POLICY IF EXISTS "Anyone can access live match updates" ON public.live_match_updates;
CREATE POLICY "Anyone can access live match updates" ON public.live_match_updates
  FOR ALL USING (true) WITH CHECK (true);

-- Match Events - PUBLIC ACCESS (fixes your RLS error)
DROP POLICY IF EXISTS "Anyone can access match events" ON public.match_events;
CREATE POLICY "Anyone can access match events" ON public.match_events
  FOR ALL USING (true) WITH CHECK (true);

-- Chat Messages - PUBLIC ACCESS (for public match chat)
DROP POLICY IF EXISTS "Anyone can view chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can send chat messages" ON public.chat_messages;
CREATE POLICY "Anyone can view chat messages" ON public.chat_messages
  FOR SELECT USING (true);
CREATE POLICY "Anyone can send chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (true);

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================
SELECT 'Essential tables created successfully!' as result; 