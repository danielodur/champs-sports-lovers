-- Migration: Setup Backend API Tables and Cron Jobs
-- This migration creates tables for caching API data and sets up automatic sync

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for caching sports matches
CREATE TABLE IF NOT EXISTS cached_matches (
  id BIGSERIAL PRIMARY KEY,
  match_id TEXT UNIQUE NOT NULL,
  sport TEXT NOT NULL,
  league TEXT,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('live', 'finished', 'upcoming')),
  match_time TEXT,
  start_time TIMESTAMPTZ,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for caching news articles
CREATE TABLE IF NOT EXISTS cached_news (
  id BIGSERIAL PRIMARY KEY,
  article_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  url TEXT,
  image_url TEXT,
  source TEXT,
  category TEXT,
  published_at TIMESTAMPTZ,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for tracking API call schedules
CREATE TABLE IF NOT EXISTS api_sync_logs (
  id BIGSERIAL PRIMARY KEY,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'running')),
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_cached_matches_sport_status ON cached_matches(sport, status);
CREATE INDEX IF NOT EXISTS idx_cached_matches_start_time ON cached_matches(start_time);
CREATE INDEX IF NOT EXISTS idx_cached_matches_match_id ON cached_matches(match_id);
CREATE INDEX IF NOT EXISTS idx_cached_news_category ON cached_news(category);
CREATE INDEX IF NOT EXISTS idx_cached_news_published_at ON cached_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_cached_news_article_id ON cached_news(article_id);
CREATE INDEX IF NOT EXISTS idx_api_sync_logs_sync_type ON api_sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_api_sync_logs_started_at ON api_sync_logs(started_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_cached_matches_updated_at BEFORE UPDATE ON cached_matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cached_news_updated_at BEFORE UPDATE ON cached_news
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: Cron jobs need to be set up manually in Supabase Dashboard
-- Go to Database → Cron Jobs and add:
-- 1. Sync live matches every 5 minutes
-- 2. Sync fixtures every 15 minutes  
-- 3. Sync finished matches every 30 minutes
-- 4. Sync news every 15 minutes

-- Example cron job SQL (run these in Supabase SQL Editor after migration):
-- SELECT cron.schedule(
--   'sync-live-matches',
--   '*/5 * * * *', -- Every 5 minutes
--   $$SELECT net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-all-data',
--     headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb
--   )$$
-- );

COMMENT ON TABLE cached_matches IS 'Cached sports match data from external APIs';
COMMENT ON TABLE cached_news IS 'Cached news articles from external APIs';
COMMENT ON TABLE api_sync_logs IS 'Logs of automatic API sync operations';

