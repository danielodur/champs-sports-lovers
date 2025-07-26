-- =============================================
-- ENABLE REALTIME FOR ALL REMAINING TABLES
-- =============================================

-- Enable realtime for all tables that don't have it enabled yet
-- This will make your app fully real-time across all features

-- 1. PROFILES - Real-time profile updates
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- 2. FAVORITE_MATCHES - Real-time favorites syncing  
ALTER PUBLICATION supabase_realtime ADD TABLE favorite_matches;

-- 3. TEAM_LOGOS - Real-time logo updates
ALTER PUBLICATION supabase_realtime ADD TABLE team_logos;

-- 4. USER_FOLLOWS - Real-time social following updates
ALTER PUBLICATION supabase_realtime ADD TABLE user_follows;

-- 5. USER_INVITES - Real-time invite notifications
ALTER PUBLICATION supabase_realtime ADD TABLE user_invites;

-- 6. USER_ACHIEVEMENTS - Real-time achievement notifications
ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;

-- 7. USER_CHECK_INS - Real-time check-in updates
ALTER PUBLICATION supabase_realtime ADD TABLE user_check_ins;

-- 8. USER_SETTINGS - Real-time settings sync
ALTER PUBLICATION supabase_realtime ADD TABLE user_settings;

-- 9. BLOCKED_USERS - Real-time blocking updates
ALTER PUBLICATION supabase_realtime ADD TABLE blocked_users;

-- =============================================
-- VERIFICATION QUERY
-- =============================================
-- Check which tables now have realtime enabled
SELECT 
    schemaname,
    tablename,
    'REALTIME ENABLED' as status
FROM 
    pg_publication_tables 
WHERE 
    pubname = 'supabase_realtime'
    AND schemaname = 'public'
ORDER BY 
    tablename;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT 'All remaining tables now have realtime enabled!' as result;

-- =============================================
-- NEXT STEPS REMINDER:
-- =============================================
-- After running this SQL, you must also:
-- 1. Go to Supabase Dashboard → Database → Replication
-- 2. Find these tables and toggle Realtime to ON:
--    - profiles
--    - favorite_matches  
--    - team_logos
--    - user_follows
--    - user_invites
--    - user_achievements
--    - user_check_ins
--    - user_settings
--    - blocked_users
-- 
-- This will give you real-time updates for:
-- ✅ Profile changes across all users
-- ✅ Favorite matches syncing instantly
-- ✅ Team logo updates
-- ✅ Social following notifications
-- ✅ Invite status changes
-- ✅ Achievement unlocks
-- ✅ Daily check-in updates
-- ✅ Settings sync across devices
-- ✅ Blocking/unblocking updates
-- ============================================= 