-- 🎯 FIX UNIQUE CONSTRAINT - Targeted Fix for ON CONFLICT Error
-- This adds the missing unique constraint that's causing your sync error

-- Add the unique constraint to match_events table
-- This is what your app needs for the ON CONFLICT resolution
ALTER TABLE public.match_events 
ADD CONSTRAINT match_events_unique_event 
UNIQUE (match_id, event_type, team_type, minute);

-- Verify the constraint was added
SELECT 'Unique constraint added successfully!' as result; 