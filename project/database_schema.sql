-- ==============================================
-- CHAMPS SPORTS APP DATABASE SCHEMA
-- ==============================================

-- Enable RLS (Row Level Security) by default
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- 1. USER PROFILES TABLE
-- ==============================================
-- Extends Supabase auth.users with additional profile data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  location TEXT,
  bio TEXT,
  champs_username TEXT UNIQUE,
  real_name TEXT,
  quote TEXT,
  profile_picture TEXT,
  champs_id TEXT UNIQUE DEFAULT ('CHAMP' || SUBSTR(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8)),
  level INTEGER DEFAULT 1,
  total_points INTEGER DEFAULT 0,
  app_coins INTEGER DEFAULT 0,
  check_in_streak INTEGER DEFAULT 0,
  last_check_in DATE,
  is_vip BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. USER SETTINGS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language TEXT DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  goal_notifications BOOLEAN DEFAULT TRUE,
  match_reminders BOOLEAN DEFAULT TRUE,
  vibration_enabled BOOLEAN DEFAULT TRUE,
  sound_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ==============================================
-- 3. FAVORITE MATCHES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.favorite_matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  league TEXT,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_team_logo TEXT,
  away_team_logo TEXT,
  match_status TEXT CHECK (match_status IN ('live', 'finished', 'upcoming')),
  start_time TIMESTAMP WITH TIME ZONE,
  score TEXT,
  half_time_score TEXT,
  viewers TEXT,
  has_video BOOLEAN DEFAULT FALSE,
  date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- ==============================================
-- 4. USER FOLLOWS/SOCIAL TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ==============================================
-- 5. USER INVITES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.user_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inviter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_name TEXT NOT NULL,
  invitee_phone TEXT,
  invitee_email TEXT,
  invite_method TEXT CHECK (invite_method IN ('sms', 'email', 'link', 'whatsapp')),
  invite_status TEXT DEFAULT 'pending' CHECK (invite_status IN ('pending', 'downloaded', 'registered', 'active')),
  invite_code TEXT UNIQUE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  registered_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ==============================================
-- 6. USER MESSAGES TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.user_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  content TEXT NOT NULL,
  image_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- ==============================================
-- 7. CHECK-INS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.user_check_ins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  points_earned INTEGER DEFAULT 10,
  streak_day INTEGER DEFAULT 1,
  bonus_earned TEXT, -- JSON string for bonus rewards
  app_coins_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, check_in_date)
);

-- ==============================================
-- 8. USER NOTIFICATIONS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT CHECK (notification_type IN ('goal', 'match', 'social', 'system', 'achievement')),
  data JSONB, -- Store additional notification data
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- ==============================================
-- 9. USER ACHIEVEMENTS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  points_awarded INTEGER DEFAULT 0,
  coins_awarded INTEGER DEFAULT 0,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_type, achievement_name)
);

-- ==============================================
-- 10. BLOCKED USERS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- ==============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- PROFILES RLS POLICIES
-- ==============================================
-- Users can view all public profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ==============================================
-- USER SETTINGS RLS POLICIES
-- ==============================================
-- Users can only see and modify their own settings
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ==============================================
-- FAVORITE MATCHES RLS POLICIES
-- ==============================================
-- Users can only see and modify their own favorites
CREATE POLICY "Users can view own favorites" ON public.favorite_matches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON public.favorite_matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON public.favorite_matches
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================
-- USER FOLLOWS RLS POLICIES
-- ==============================================
-- Users can view follows they're involved in
CREATE POLICY "Users can view relevant follows" ON public.user_follows
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Users can follow others
CREATE POLICY "Users can follow others" ON public.user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow" ON public.user_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- ==============================================
-- USER INVITES RLS POLICIES
-- ==============================================
-- Users can view their own invites
CREATE POLICY "Users can view own invites" ON public.user_invites
  FOR SELECT USING (auth.uid() = inviter_id);

-- Users can create invites
CREATE POLICY "Users can create invites" ON public.user_invites
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

-- Users can update their invites
CREATE POLICY "Users can update own invites" ON public.user_invites
  FOR UPDATE USING (auth.uid() = inviter_id);

-- ==============================================
-- MESSAGES RLS POLICIES
-- ==============================================
-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages" ON public.user_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can send messages
CREATE POLICY "Users can send messages" ON public.user_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Users can update messages they received (mark as read)
CREATE POLICY "Users can update received messages" ON public.user_messages
  FOR UPDATE USING (auth.uid() = recipient_id);

-- ==============================================
-- CHECK-INS RLS POLICIES
-- ==============================================
-- Users can view and manage their own check-ins
CREATE POLICY "Users can view own check-ins" ON public.user_check_ins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins" ON public.user_check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==============================================
-- NOTIFICATIONS RLS POLICIES
-- ==============================================
-- Users can view and manage their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ==============================================
-- FUNCTIONS AND TRIGGERS
-- ==============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, phone)
  VALUES (
    new.id, 
    COALESCE(new.user_metadata->>'username', 'user_' || SUBSTR(new.id::TEXT, 1, 8)),
    new.email,
    new.phone
  );
  
  -- Create default user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_champs_username ON public.profiles(champs_username);
CREATE INDEX IF NOT EXISTS idx_profiles_champs_id ON public.profiles(champs_id);

-- Favorite matches indexes
CREATE INDEX IF NOT EXISTS idx_favorite_matches_user_id ON public.favorite_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_matches_match_id ON public.favorite_matches(match_id);
CREATE INDEX IF NOT EXISTS idx_favorite_matches_sport ON public.favorite_matches(sport);

-- User follows indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.user_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.user_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.user_messages(created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Check-ins indexes
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON public.user_check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON public.user_check_ins(check_in_date DESC);

-- ==============================================
-- 11. MATCH EVENTS TABLE (Real-time)
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for match_events (public read, authenticated write)
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view match events" ON public.match_events
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create match events" ON public.match_events
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Indexes for match_events
CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON public.match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_created_at ON public.match_events(created_at);
CREATE INDEX IF NOT EXISTS idx_match_events_event_type ON public.match_events(event_type);

-- ==============================================
-- 12. LIVE MATCH UPDATES TABLE (Real-time)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.live_match_updates (
  match_id TEXT PRIMARY KEY,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('live', 'finished', 'upcoming')),
  minute TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for live_match_updates (public read, authenticated write)
ALTER TABLE public.live_match_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live match updates" ON public.live_match_updates
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can update live matches" ON public.live_match_updates
FOR ALL WITH CHECK (auth.role() = 'authenticated');

-- Indexes for live_match_updates
CREATE INDEX IF NOT EXISTS idx_live_match_updates_status ON public.live_match_updates(status);
CREATE INDEX IF NOT EXISTS idx_live_match_updates_last_updated ON public.live_match_updates(last_updated);

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================
-- If you see this comment, the schema was created successfully!
-- Real-time features are now enabled for live match updates and events. 