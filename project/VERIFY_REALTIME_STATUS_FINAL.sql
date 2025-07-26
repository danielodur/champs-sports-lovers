-- =============================================
-- VERIFY REALTIME STATUS FOR ALL TABLES (FINAL FIX)
-- =============================================

-- Check which tables have realtime enabled
SELECT 
    t.table_name,
    CASE 
        WHEN p.tablename IS NOT NULL THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as realtime_status,
    t.table_schema as schema_name
FROM 
    information_schema.tables t
LEFT JOIN 
    pg_publication_tables p ON (p.tablename = t.table_name AND p.pubname = 'supabase_realtime')
WHERE 
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE 'sql_%'
ORDER BY 
    t.table_name;

-- =============================================
-- COUNT ENABLED VS DISABLED TABLES
-- =============================================
SELECT 
    'REALTIME SUMMARY' as category,
    COUNT(CASE WHEN p.tablename IS NOT NULL THEN 1 END) as enabled_tables,
    COUNT(CASE WHEN p.tablename IS NULL THEN 1 END) as disabled_tables,
    COUNT(*) as total_tables
FROM 
    information_schema.tables t
LEFT JOIN 
    pg_publication_tables p ON (p.tablename = t.table_name AND p.pubname = 'supabase_realtime')
WHERE 
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE 'sql_%';

-- =============================================
-- SHOW ONLY ENABLED TABLES
-- =============================================
SELECT 
    '🟢 REALTIME ENABLED TABLES' as title,
    tablename as table_name,
    schemaname as schema_name
FROM 
    pg_publication_tables 
WHERE 
    pubname = 'supabase_realtime'
    AND schemaname = 'public'
ORDER BY 
    tablename;

-- =============================================
-- SHOW TABLE ROW COUNTS (FIXED)
-- =============================================
SELECT 
    schemaname,
    relname as table_name,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM 
    pg_stat_user_tables 
WHERE 
    schemaname = 'public'
ORDER BY 
    relname;

-- =============================================
-- SIMPLE SUCCESS MESSAGE
-- =============================================
SELECT 'All verification queries completed successfully!' as result; 