-- =============================================
-- SUPABASE TABLES SETUP FOR CHAMPS SPORTS APP
-- =============================================

-- This script creates ALL the tables needed for your sports app
-- Run this in your Supabase SQL Editor

-- =============================================
-- 1. PROFILES TABLE (Main user data)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    champs_username VARCHAR(50) UNIQUE,
    real_name VARCHAR(100),
    quote TEXT,
    profile_picture TEXT,
    champs_id VARCHAR(20) UNIQUE,
    level INTEGER DEFAULT 1,
    total_points INTEGER DEFAULT 0,
    app_coins INTEGER DEFAULT 0,
    is_vip BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. CHAT_MESSAGES TABLE (Match chat) - REALTIME
-- =============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL,
    level INTEGER DEFAULT 1,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. FAVORITE_MATCHES TABLE (User favorites)
-- =============================================
CREATE TABLE IF NOT EXISTS favorite_matches (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    match_id VARCHAR(50) NOT NULL,
    sport VARCHAR(20) NOT NULL,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    league VARCHAR(50) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'upcoming',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. LIVE_MATCH_UPDATES TABLE (Real-time scores) - REALTIME
-- =============================================
CREATE TABLE IF NOT EXISTS live_match_updates (
    match_id VARCHAR(50) PRIMARY KEY,
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'upcoming',
    minute VARCHAR(10) DEFAULT '0',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. MATCH_EVENTS TABLE (Goals, cards, etc.) - REALTIME
-- =============================================
CREATE TABLE IF NOT EXISTS match_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(20) NOT NULL, -- goal, yellow_card, red_card, corner, etc.
    team VARCHAR(10) NOT NULL, -- home or away
    player_name VARCHAR(100),
    minute INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. USER_FOLLOWS TABLE (Social follows)
-- =============================================
CREATE TABLE IF NOT EXISTS user_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- =============================================
-- 7. USER_MESSAGES TABLE (Direct messages)
-- =============================================
CREATE TABLE IF NOT EXISTS user_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    message_type VARCHAR(20) DEFAULT 'text',
    content TEXT NOT NULL,
    image_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- 8. NOTIFICATIONS TABLE (App notifications)
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- 9. USER_INVITES TABLE (Friend invitations)
-- =============================================
CREATE TABLE IF NOT EXISTS user_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inviter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    invitee_name VARCHAR(100) NOT NULL,
    invitee_phone VARCHAR(20),
    invitee_email VARCHAR(100),
    invite_method VARCHAR(20) DEFAULT 'link',
    invite_status VARCHAR(20) DEFAULT 'pending',
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    registered_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- =============================================
-- 10. TEAM_LOGOS TABLE (Team logo management)
-- =============================================
CREATE TABLE IF NOT EXISTS team_logos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_id VARCHAR(50) NOT NULL UNIQUE,
    logo_url TEXT NOT NULL,
    fallback_url TEXT,
    league VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    aliases TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_champs_username ON profiles(champs_username);
CREATE INDEX IF NOT EXISTS idx_profiles_champs_id ON profiles(champs_id);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_match_id ON chat_messages(match_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Favorite matches indexes
CREATE INDEX IF NOT EXISTS idx_favorite_matches_user_id ON favorite_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_matches_match_id ON favorite_matches(match_id);
CREATE INDEX IF NOT EXISTS idx_favorite_matches_status ON favorite_matches(status);

-- Live match updates indexes
CREATE INDEX IF NOT EXISTS idx_live_match_updates_status ON live_match_updates(status);
CREATE INDEX IF NOT EXISTS idx_live_match_updates_last_updated ON live_match_updates(last_updated DESC);

-- Match events indexes
CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_created_at ON match_events(created_at DESC);

-- User follows indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);

-- User messages indexes
CREATE INDEX IF NOT EXISTS idx_user_messages_sender_id ON user_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_recipient_id ON user_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_created_at ON user_messages(created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- User invites indexes
CREATE INDEX IF NOT EXISTS idx_user_invites_inviter_id ON user_invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_user_invites_invite_code ON user_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_user_invites_invite_status ON user_invites(invite_status);

-- Team logos indexes
CREATE INDEX IF NOT EXISTS idx_team_logos_team_name ON team_logos(team_name);
CREATE INDEX IF NOT EXISTS idx_team_logos_team_id ON team_logos(team_id);
CREATE INDEX IF NOT EXISTS idx_team_logos_league ON team_logos(league);

-- =============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_match_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_logos ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREATE RLS POLICIES
-- =============================================

-- Profiles policies
CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Chat messages policies
CREATE POLICY "Anyone can read chat messages" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert chat messages" ON chat_messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Favorite matches policies
CREATE POLICY "Users can read own favorites" ON favorite_matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON favorite_matches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own favorites" ON favorite_matches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON favorite_matches FOR DELETE USING (auth.uid() = user_id);

-- Live match updates policies
CREATE POLICY "Anyone can read live match updates" ON live_match_updates FOR SELECT USING (true);
CREATE POLICY "System can insert/update live match updates" ON live_match_updates FOR ALL USING (true);

-- Match events policies
CREATE POLICY "Anyone can read match events" ON match_events FOR SELECT USING (true);
CREATE POLICY "System can insert match events" ON match_events FOR INSERT WITH CHECK (true);

-- User follows policies
CREATE POLICY "Users can read follows" ON user_follows FOR SELECT USING (true);
CREATE POLICY "Users can manage own follows" ON user_follows FOR ALL USING (auth.uid() = follower_id);

-- User messages policies
CREATE POLICY "Users can read own messages" ON user_messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = recipient_id
);
CREATE POLICY "Users can send messages" ON user_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON user_messages FOR UPDATE USING (auth.uid() = recipient_id);

-- Notifications policies
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- User invites policies
CREATE POLICY "Users can read own invites" ON user_invites FOR SELECT USING (auth.uid() = inviter_id);
CREATE POLICY "Users can create invites" ON user_invites FOR INSERT WITH CHECK (auth.uid() = inviter_id);
CREATE POLICY "Users can update own invites" ON user_invites FOR UPDATE USING (auth.uid() = inviter_id);

-- Team logos policies
CREATE POLICY "Anyone can read team logos" ON team_logos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert team logos" ON team_logos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update team logos" ON team_logos FOR UPDATE USING (auth.role() = 'authenticated');

-- =============================================
-- CREATE HELPER FUNCTIONS
-- =============================================

-- Function to get user conversations
CREATE OR REPLACE FUNCTION get_user_conversations(current_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    username VARCHAR(50),
    full_name VARCHAR(100),
    avatar_url TEXT,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT,
    is_last_message_from_me BOOLEAN
) AS $$
BEGIN
    -- This would be implemented for message conversations
    -- For now, return empty result
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to search team logos
CREATE OR REPLACE FUNCTION search_team_logo(search_term TEXT)
RETURNS TABLE (
    team_name VARCHAR(100),
    team_id VARCHAR(50),
    logo_url TEXT,
    fallback_url TEXT,
    league VARCHAR(50),
    country VARCHAR(50),
    match_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tl.team_name,
        tl.team_id,
        tl.logo_url,
        tl.fallback_url,
        tl.league,
        tl.country,
        CASE 
            WHEN LOWER(tl.team_name) = LOWER(search_term) THEN 1.0
            WHEN LOWER(tl.team_name) LIKE LOWER('%' || search_term || '%') THEN 0.8
            WHEN search_term = ANY(tl.aliases) THEN 0.9
            WHEN LOWER(search_term) = ANY(SELECT LOWER(unnest(tl.aliases))) THEN 0.9
            ELSE similarity(LOWER(tl.team_name), LOWER(search_term))
        END as match_score
    FROM team_logos tl
    WHERE 
        LOWER(tl.team_name) LIKE LOWER('%' || search_term || '%')
        OR search_term = ANY(tl.aliases)
        OR LOWER(search_term) = ANY(SELECT LOWER(unnest(tl.aliases)))
        OR similarity(LOWER(tl.team_name), LOWER(search_term)) > 0.3
    ORDER BY match_score DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- =============================================

-- Profiles trigger
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Favorite matches trigger
CREATE TRIGGER update_favorite_matches_updated_at
    BEFORE UPDATE ON favorite_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Team logos trigger
CREATE TRIGGER update_team_logos_updated_at
    BEFORE UPDATE ON team_logos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ENABLE REALTIME FOR SPECIFIC TABLES
-- =============================================

-- Enable realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE live_match_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE match_events;
ALTER PUBLICATION supabase_realtime ADD TABLE user_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- =============================================
-- INSERT SAMPLE DATA (OPTIONAL)
-- =============================================

-- Insert sample team logos
INSERT INTO team_logos (team_name, team_id, logo_url, fallback_url, league, country, aliases) VALUES
    ('Manchester United', 'manchester-united', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/premier-league/manchester-united.png', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/premier-league/man-utd-alt.png', 'Premier League', 'England', ARRAY['Man United', 'MUFC', 'United', 'Man Utd']),
    ('Arsenal', 'arsenal', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/premier-league/arsenal.png', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/premier-league/arsenal-alt.png', 'Premier League', 'England', ARRAY['Gunners', 'AFC', 'Arsenal FC']),
    ('Chelsea', 'chelsea', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/premier-league/chelsea.png', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/premier-league/chelsea-alt.png', 'Premier League', 'England', ARRAY['Blues', 'CFC', 'Chelsea FC']),
    ('Liverpool', 'liverpool', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/premier-league/liverpool.png', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/premier-league/liverpool-alt.png', 'Premier League', 'England', ARRAY['Reds', 'LFC', 'Liverpool FC']),
    ('Manchester City', 'manchester-city', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/premier-league/manchester-city.png', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/premier-league/man-city-alt.png', 'Premier League', 'England', ARRAY['Man City', 'MCFC', 'City', 'Manchester City FC']),
    ('Real Madrid', 'real-madrid', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/la-liga/real-madrid.png', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/la-liga/real-madrid-alt.png', 'La Liga', 'Spain', ARRAY['Madrid', 'Los Blancos', 'Real Madrid CF']),
    ('Barcelona', 'barcelona', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/la-liga/barcelona.png', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/la-liga/barcelona-alt.png', 'La Liga', 'Spain', ARRAY['Barça', 'Barca', 'FCB', 'FC Barcelona']),
    ('Bayern Munich', 'bayern-munich', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/bundesliga/bayern-munich.png', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/bundesliga/bayern-alt.png', 'Bundesliga', 'Germany', ARRAY['FC Bayern', 'Bayern', 'FCB', 'FC Bayern Munich']),
    ('Juventus', 'juventus', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/serie-a/juventus.png', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/serie-a/juventus-alt.png', 'Serie A', 'Italy', ARRAY['Juve', 'The Old Lady', 'Juventus FC']),
    ('Paris Saint-Germain', 'paris-saint-germain', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/ligue-1/paris-saint-germain.png', 'https://mfjxwtlqmvdujxpwnrvf.supabase.co/storage/v1/object/public/team-logos/ligue-1/psg-alt.png', 'Ligue 1', 'France', ARRAY['PSG', 'Paris SG', 'Paris'])
ON CONFLICT (team_id) DO UPDATE SET
    team_name = EXCLUDED.team_name,
    logo_url = EXCLUDED.logo_url,
    fallback_url = EXCLUDED.fallback_url,
    league = EXCLUDED.league,
    country = EXCLUDED.country,
    aliases = EXCLUDED.aliases,
    updated_at = NOW();

-- =============================================
-- FINAL COMMIT
-- =============================================
COMMIT;

-- =============================================
-- SUMMARY OF WHAT THIS SCRIPT DOES:
-- =============================================
-- 
-- ✅ Creates 10 essential tables for your sports app
-- ✅ Sets up proper indexes for performance
-- ✅ Enables Row Level Security (RLS) for data protection
-- ✅ Creates security policies for each table
-- ✅ Creates helper functions for common operations
-- ✅ Sets up triggers for automatic timestamp updates
-- ✅ Enables realtime for 5 key tables
-- ✅ Inserts sample team logos data
-- 
-- TABLES THAT NEED REALTIME ENABLED:
-- 1. chat_messages (for match chat)
-- 2. live_match_updates (for live scores)
-- 3. match_events (for goals, cards, etc.)
-- 4. user_messages (for direct messages)
-- 5. notifications (for app notifications)
-- 
-- ============================================= 