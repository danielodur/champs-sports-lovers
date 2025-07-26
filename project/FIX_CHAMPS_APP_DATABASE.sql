-- 🏆 CHAMPS SPORTS APP - DATABASE FIX
-- Run this in your CORRECT "champs sports app" Supabase project

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- 1. LIVE MATCH UPDATES TABLE (Fixes your sync error)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.live_match_updates (
  match_id TEXT PRIMARY KEY,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('live', 'finished', 'upcoming')),
  minute TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================
-- 2. MATCH EVENTS TABLE (Fixes frequency chart)
-- ==============================================
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
  -- CRITICAL: Add unique constraint for ON CONFLICT
  UNIQUE (match_id, event_type, team_type, minute)
);

-- ==============================================
-- 3. CHAT MESSAGES TABLE (Fixes chat functionality)
-- ==============================================
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
-- 4. ENABLE RLS AND CREATE PUBLIC POLICIES
-- ==============================================

-- Enable RLS
ALTER TABLE public.live_match_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create PUBLIC ACCESS policies (fixes RLS errors)
CREATE POLICY "Anyone can access live match updates" ON public.live_match_updates
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can access match events" ON public.match_events
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view chat messages" ON public.chat_messages
  FOR SELECT USING (true);
CREATE POLICY "Anyone can send chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (true);

-- ==============================================
-- 5. ENABLE REALTIME
-- ==============================================

-- Enable realtime for all tables
ALTER publication supabase_realtime ADD TABLE public.live_match_updates;
ALTER publication supabase_realtime ADD TABLE public.match_events;
ALTER publication supabase_realtime ADD TABLE public.chat_messages;

-- ==============================================
-- 6. CREATE PERFORMANCE INDEXES
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_live_match_updates_status ON public.live_match_updates(status);
CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON public.match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_created_at ON public.match_events(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_match_id ON public.chat_messages(match_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================
SELECT 'Champs Sports App database fixed successfully!' as result; 