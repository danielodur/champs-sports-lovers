-- Fix for Chat Database: Change match_id from uuid to text
-- This allows numeric match IDs like "1368057" instead of requiring UUID format

-- Step 1: Change match_id column type from uuid to text
ALTER TABLE chat_messages ALTER COLUMN match_id TYPE text;

-- Step 2: Verify the change worked
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_messages' AND column_name = 'match_id'; 