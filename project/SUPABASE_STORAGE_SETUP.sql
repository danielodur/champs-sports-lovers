-- =============================================
-- SUPABASE STORAGE SETUP FOR TEAM LOGOS
-- =============================================

-- 1. Create the team-logos storage bucket (if not exists)
-- This should be done in Supabase Dashboard > Storage > Create Bucket
-- Bucket name: team-logos
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/png, image/jpeg, image/svg+xml

-- 2. Create team_logos table for better logo management
CREATE TABLE IF NOT EXISTS team_logos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_id VARCHAR(50) NOT NULL UNIQUE,
    logo_url TEXT NOT NULL,
    fallback_url TEXT,
    league VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    aliases TEXT[], -- Array of alternative team names
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_logos_team_name ON team_logos(team_name);
CREATE INDEX IF NOT EXISTS idx_team_logos_team_id ON team_logos(team_id);
CREATE INDEX IF NOT EXISTS idx_team_logos_league ON team_logos(league);
CREATE INDEX IF NOT EXISTS idx_team_logos_country ON team_logos(country);

-- 4. Enable RLS (Row Level Security)
ALTER TABLE team_logos ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for public read access
CREATE POLICY "Public read access for team logos" ON team_logos
    FOR SELECT USING (true);

-- 6. Create policies for authenticated insert/update (optional)
CREATE POLICY "Authenticated users can insert team logos" ON team_logos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update team logos" ON team_logos
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_logos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for updated_at
CREATE TRIGGER update_team_logos_updated_at
    BEFORE UPDATE ON team_logos
    FOR EACH ROW
    EXECUTE FUNCTION update_team_logos_updated_at();

-- 9. Insert sample team logos data
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

-- 10. Create function to search teams by name or alias
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

-- 11. Enable pg_trgm extension for text similarity
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 12. Create GIN index for better text search performance
CREATE INDEX IF NOT EXISTS idx_team_logos_name_trgm ON team_logos USING gin(team_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_team_logos_aliases_trgm ON team_logos USING gin(aliases gin_trgm_ops);

-- =============================================
-- STORAGE BUCKET POLICIES (Run in Supabase Dashboard)
-- =============================================

-- Storage bucket policy for public read access
-- This should be created in Supabase Dashboard > Storage > team-logos bucket > Policies

-- Policy Name: "Public read access for team logos"
-- Policy: 
-- (bucket_id = 'team-logos')

-- =============================================
-- FOLDER STRUCTURE TO CREATE IN STORAGE
-- =============================================

-- Create these folders in Supabase Storage > team-logos bucket:
-- /premier-league/
-- /la-liga/
-- /bundesliga/
-- /serie-a/
-- /ligue-1/
-- /eredivisie/
-- /primeira-liga/
-- /brazilian/
-- /international/
-- /other/

-- =============================================
-- SAMPLE LOGO UPLOAD SCRIPT (Optional)
-- =============================================

-- You can upload logos using the Supabase client or dashboard
-- File naming convention: team-name.png (lowercase, hyphens instead of spaces)
-- Examples:
-- - manchester-united.png
-- - real-madrid.png
-- - bayern-munich.png
-- - paris-saint-germain.png

COMMIT;
