-- 🔴 ENABLE REALTIME FOR LIVE FEATURES
-- This enables real-time subscriptions for live match data and chat

-- ⚠️ IMPORTANT: After running this SQL, you must also enable Realtime in Supabase Dashboard
-- Go to: Database → Replication → Toggle ON for each table listed below

-- ==============================================
-- ENABLE REALTIME ON CRITICAL TABLES
-- ==============================================

-- 1. Enable Realtime for Live Match Updates
-- This allows real-time syncing of scores, status, and match time
ALTER publication supabase_realtime ADD TABLE public.live_match_updates;

-- 2. Enable Realtime for Match Events  
-- This allows real-time event updates for the frequency chart
ALTER publication supabase_realtime ADD TABLE public.match_events;

-- 3. Enable Realtime for Chat Messages
-- This allows real-time chat functionality
ALTER publication supabase_realtime ADD TABLE public.chat_messages;

-- 4. Enable Realtime for Notifications (optional but recommended)
-- This allows real-time notification updates
ALTER publication supabase_realtime ADD TABLE public.notifications;

-- ==============================================
-- VERIFICATION QUERY
-- ==============================================
-- Run this to verify which tables have Realtime enabled
SELECT 
    schemaname,
    tablename
FROM 
    pg_publication_tables 
WHERE 
    pubname = 'supabase_realtime'
    AND schemaname = 'public'
ORDER BY 
    tablename;

-- ==============================================
-- SUCCESS MESSAGE
-- ==============================================
SELECT 'Realtime enabled for all critical tables!' as result;

-- ==============================================
-- NEXT STEPS (MANUAL)
-- ==============================================
-- After running this SQL, you MUST also:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to: Database → Replication  
-- 3. Find these tables and toggle Realtime to ON:
--    - live_match_updates
--    - match_events
--    - chat_messages
--    - notifications
-- 4. Click "Save" after enabling each table 