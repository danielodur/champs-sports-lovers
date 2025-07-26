-- ✅ CREATE LINEUP AND PLAYER TABLES FOR SPORTS APP

-- 1. Players table with comprehensive data
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  jersey_number INTEGER NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST')),
  nationality TEXT NOT NULL,
  age INTEGER CHECK (age >= 16 AND age <= 45),
  market_value TEXT DEFAULT '0M',
  rating DECIMAL(3,1) CHECK (rating >= 1.0 AND rating <= 10.0),
  photo_url TEXT,
  team_id UUID,
  is_starter BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Match lineups table
CREATE TABLE IF NOT EXISTS match_lineups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id TEXT NOT NULL,
  team_type TEXT NOT NULL CHECK (team_type IN ('home', 'away')),
  formation TEXT NOT NULL DEFAULT '4-2-3-1',
  team_value TEXT DEFAULT '0M',
  average_age DECIMAL(4,1) DEFAULT 25.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, team_type)
);

-- 3. Player events table (goals, cards, substitutions)
CREATE TABLE IF NOT EXISTS player_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('goal', 'yellow_card', 'red_card', 'substitution')),
  minute INTEGER CHECK (minute >= 0 AND minute <= 120),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Team managers table
CREATE TABLE IF NOT EXISTS team_managers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nationality TEXT NOT NULL,
  photo_url TEXT,
  team_id UUID,
  role TEXT DEFAULT 'Head Coach',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Match lineup players (junction table)
CREATE TABLE IF NOT EXISTS match_lineup_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lineup_id UUID REFERENCES match_lineups(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  position_x DECIMAL(5,2) DEFAULT 50.0, -- Position on field (percentage)
  position_y DECIMAL(5,2) DEFAULT 50.0, -- Position on field (percentage)
  is_substitute BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lineup_id, player_id)
);

-- ✅ CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
CREATE INDEX IF NOT EXISTS idx_match_lineups_match_id ON match_lineups(match_id);
CREATE INDEX IF NOT EXISTS idx_player_events_match_id ON player_events(match_id);
CREATE INDEX IF NOT EXISTS idx_player_events_player_id ON player_events(player_id);
CREATE INDEX IF NOT EXISTS idx_team_managers_team_id ON team_managers(team_id);

-- ✅ ENABLE ROW LEVEL SECURITY
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_lineup_players ENABLE ROW LEVEL SECURITY;

-- ✅ CREATE RLS POLICIES (Allow read access for all users)
CREATE POLICY "Enable read access for all users" ON players FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON match_lineups FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON player_events FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON team_managers FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON match_lineup_players FOR SELECT USING (true);

-- ✅ ENABLE REALTIME FOR ALL TABLES
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE match_lineups;
ALTER PUBLICATION supabase_realtime ADD TABLE player_events;
ALTER PUBLICATION supabase_realtime ADD TABLE team_managers;
ALTER PUBLICATION supabase_realtime ADD TABLE match_lineup_players;

-- ✅ INSERT SAMPLE DATA FOR TESTING

-- Sample players for home team
INSERT INTO players (name, jersey_number, position, nationality, age, market_value, rating, photo_url, is_starter) VALUES
('Sanchez', 9, 'ST', 'ESP', 28, '45M', 7.8, 'https://ui-avatars.com/api/?name=Sanchez&background=4CAF50&color=fff&size=100', true),
('Martinez', 14, 'LW', 'ARG', 25, '35M', 6.9, 'https://ui-avatars.com/api/?name=Martinez&background=4CAF50&color=fff&size=100', true),
('Valdez', 19, 'CAM', 'COL', 26, '40M', 7.2, 'https://ui-avatars.com/api/?name=Valdez&background=4CAF50&color=fff&size=100', true),
('Phillips', 22, 'RW', 'ENG', 24, '38M', 7.5, 'https://ui-avatars.com/api/?name=Phillips&background=4CAF50&color=fff&size=100', true),
('Rodriguez', 21, 'CM', 'MEX', 27, '25M', 6.3, 'https://ui-avatars.com/api/?name=Rodriguez&background=4CAF50&color=fff&size=100', true),
('Silva', 13, 'CDM', 'BRA', 29, '30M', 6.6, 'https://ui-avatars.com/api/?name=Silva&background=4CAF50&color=fff&size=100', true),
('Johnson', 8, 'LB', 'USA', 26, '32M', 7.6, 'https://ui-avatars.com/api/?name=Johnson&background=4CAF50&color=fff&size=100', true),
('Carter', 31, 'CB', 'ENG', 30, '28M', 7.1, 'https://ui-avatars.com/api/?name=Carter&background=4CAF50&color=fff&size=100', true),
('Anderson', 6, 'CB', 'SWE', 28, '33M', 7.3, 'https://ui-avatars.com/api/?name=Anderson&background=4CAF50&color=fff&size=100', true),
('Taylor', 2, 'RB', 'SCO', 25, '27M', 7.0, 'https://ui-avatars.com/api/?name=Taylor&background=4CAF50&color=fff&size=100', true),
('González', 1, 'GK', 'ESP', 31, '20M', 7.2, 'https://ui-avatars.com/api/?name=González&background=4CAF50&color=fff&size=100', true);

-- Sample players for away team
INSERT INTO players (name, jersey_number, position, nationality, age, market_value, rating, photo_url, is_starter) VALUES
('García', 7, 'ST', 'ESP', 29, '42M', 6.6, 'https://ui-avatars.com/api/?name=García&background=FF4444&color=fff&size=100', true),
('López', 24, 'LW', 'MEX', 26, '36M', 6.8, 'https://ui-avatars.com/api/?name=López&background=FF4444&color=fff&size=100', true),
('Williams', 10, 'CAM', 'WAL', 27, '48M', 7.1, 'https://ui-avatars.com/api/?name=Williams&background=FF4444&color=fff&size=100', true),
('Martínez', 17, 'RW', 'ARG', 24, '34M', 6.5, 'https://ui-avatars.com/api/?name=Martínez&background=FF4444&color=fff&size=100', true),
('Fernández', 16, 'CM', 'ESP', 28, '29M', 6.3, 'https://ui-avatars.com/api/?name=Fernández&background=FF4444&color=fff&size=100', true),
('Pereira', 23, 'CDM', 'POR', 30, '31M', 6.8, 'https://ui-avatars.com/api/?name=Pereira&background=FF4444&color=fff&size=100', true),
('García', 4, 'LB', 'ESP', 27, '26M', 7.2, 'https://ui-avatars.com/api/?name=García&background=FF4444&color=fff&size=100', true),
('Torres', 26, 'CB', 'ESP', 32, '22M', 6.5, 'https://ui-avatars.com/api/?name=Torres&background=FF4444&color=fff&size=100', true),
('Ruiz', 29, 'CB', 'ESP', 29, '24M', 6.4, 'https://ui-avatars.com/api/?name=Ruiz&background=FF4444&color=fff&size=100', true),
('Morales', 18, 'RB', 'ESP', 25, '28M', 6.8, 'https://ui-avatars.com/api/?name=Morales&background=FF4444&color=fff&size=100', true),
('Herrera', 12, 'GK', 'MEX', 28, '18M', 6.6, 'https://ui-avatars.com/api/?name=Herrera&background=FF4444&color=fff&size=100', true);

-- Sample team managers
INSERT INTO team_managers (name, nationality, photo_url, role) VALUES
('Manager Home', 'ENG', 'https://ui-avatars.com/api/?name=Manager&background=4CAF50&color=fff&size=100', 'Head Coach'),
('Manager Away', 'ESP', 'https://ui-avatars.com/api/?name=AwayManager&background=FF4444&color=fff&size=100', 'Head Coach');

COMMIT; 