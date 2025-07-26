-- =============================================
-- CREATE ONLY THE MISSING TEAM_LOGOS TABLE
-- =============================================

-- 10. TEAM_LOGOS TABLE (Team logo management)
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_logos_team_name ON team_logos(team_name);
CREATE INDEX IF NOT EXISTS idx_team_logos_team_id ON team_logos(team_id);
CREATE INDEX IF NOT EXISTS idx_team_logos_league ON team_logos(league);

-- Enable RLS
ALTER TABLE team_logos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read team logos" ON team_logos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert team logos" ON team_logos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update team logos" ON team_logos FOR UPDATE USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_logos_updated_at
    BEFORE UPDATE ON team_logos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

SELECT 'Team logos table created successfully!' as result; 