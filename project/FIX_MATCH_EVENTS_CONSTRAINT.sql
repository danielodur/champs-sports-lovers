-- 🔧 FIX MATCH EVENTS CONSTRAINT ERROR
-- This fixes the "no unique or exclusion constraint matching the ON CONFLICT specification" error

-- First, let's check if the constraint exists and remove any problematic data
DO $$
BEGIN
    -- Remove duplicate entries that might prevent constraint creation
    DELETE FROM match_events a USING match_events b
    WHERE a.id < b.id
    AND a.match_id = b.match_id
    AND a.event_type = b.event_type
    AND a.team_type = b.team_type
    AND a.minute = b.minute;
    
    RAISE NOTICE 'Removed duplicate match events';
END $$;

-- Drop the constraint if it exists (with wrong name)
DO $$
BEGIN
    ALTER TABLE match_events DROP CONSTRAINT IF EXISTS match_events_match_id_event_type_team_type_minute_key;
    RAISE NOTICE 'Dropped old constraint if existed';
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'No old constraint to drop';
END $$;

-- Create the proper unique constraint
ALTER TABLE match_events 
ADD CONSTRAINT match_events_unique_event 
UNIQUE (match_id, event_type, team_type, minute);

-- Verify the constraint was created
SELECT 
    constraint_name,
    table_name,
    column_name
FROM information_schema.key_column_usage
WHERE table_name = 'match_events'
AND constraint_name = 'match_events_unique_event';

-- Success message
SELECT 'Match events constraint fixed successfully!' as result; 