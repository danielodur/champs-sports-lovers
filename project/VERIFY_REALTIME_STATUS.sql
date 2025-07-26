-- =============================================
-- VERIFY REALTIME STATUS FOR ALL TABLES
-- =============================================

-- Check which tables have realtime enabled
SELECT 
    t.table_name,
    CASE 
        WHEN p.tablename IS NOT NULL THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as realtime_status,
    t.table_rows,
    t.table_comment
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
    '🔴 REALTIME ENABLED TABLES' as title,
    tablename as table_name,
    schemaname as schema_name
FROM 
    pg_publication_tables 
WHERE 
    pubname = 'supabase_realtime'
    AND schemaname = 'public'
ORDER BY 
    tablename; 