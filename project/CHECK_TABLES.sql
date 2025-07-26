-- 🔍 CHECK WHAT TABLES AND CONSTRAINTS EXIST
-- Run this to see what's currently in your database

-- Check which tables exist
SELECT 
    table_name,
    table_schema
FROM 
    information_schema.tables 
WHERE 
    table_schema = 'public' 
    AND table_name IN ('live_match_updates', 'match_events', 'chat_messages')
ORDER BY 
    table_name;

-- Check constraints on match_events table
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM 
    pg_constraint 
WHERE 
    conrelid = 'public.match_events'::regclass;

-- Check if match_events table has the unique constraint we need
SELECT 
    EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'match_events_unique_event' 
        AND conrelid = 'public.match_events'::regclass
    ) as has_unique_constraint; 