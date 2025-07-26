-- =============================================
-- FIX RLS POLICIES FOR LIVE MATCH UPDATES
-- =============================================

-- Fix live_match_updates table policies
DROP POLICY IF EXISTS "System can insert/update live match updates" ON live_match_updates;
DROP POLICY IF EXISTS "System can update live matches" ON live_match_updates;
DROP POLICY IF EXISTS "Authenticated users can update live matches" ON live_match_updates;

-- Create more permissive policies for live_match_updates
CREATE POLICY "Allow all operations on live_match_updates" ON live_match_updates
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Fix match_events table policies
DROP POLICY IF EXISTS "System can insert match events" ON match_events;
DROP POLICY IF EXISTS "Authenticated users can create match events" ON match_events;

-- Create more permissive policies for match_events
CREATE POLICY "Allow all operations on match_events" ON match_events
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Fix chat_messages table policies (ensure it works for all users)
DROP POLICY IF EXISTS "Allow chat for logged-in users" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can insert chat messages" ON chat_messages;

-- Create more permissive policies for chat_messages
CREATE POLICY "Allow all operations on chat_messages" ON chat_messages
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Verification query
SELECT 'RLS policies fixed successfully!' as result;

-- =============================================
-- VERIFY POLICIES
-- =============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('live_match_updates', 'match_events', 'chat_messages')
ORDER BY tablename, policyname; 