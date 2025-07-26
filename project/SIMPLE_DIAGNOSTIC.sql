-- Copy and paste this ENTIRE block (not just the filename)

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