-- =============================================
-- ENABLE REALTIME FOR MISSING TABLES ONLY
-- =============================================

-- Enable realtime for the 2 remaining tables that need it
ALTER PUBLICATION supabase_realtime ADD TABLE user_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Verification query
SELECT 'Realtime enabled for user_messages and notifications!' as result;

-- =============================================
-- NEXT STEPS REMINDER:
-- =============================================
-- After running this SQL, you must also:
-- 1. Go to Supabase Dashboard → Database → Replication
-- 2. Find these tables and toggle Realtime to ON:
--    - user_messages
--    - notifications
-- ============================================= 