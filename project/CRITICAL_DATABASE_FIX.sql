-- 🚨 CRITICAL: Run this in your Supabase SQL Editor to fix the chat authentication issue
-- This changes BOTH match_id AND user_id columns from uuid to text

-- Fix match_id column (for numeric match IDs like "1368057")
ALTER TABLE chat_messages ALTER COLUMN match_id TYPE text;

-- Fix user_id column (for custom user IDs like "user_User_8010_1752154633775")
ALTER TABLE chat_messages ALTER COLUMN user_id TYPE text;

-- WHY THIS IS NEEDED:
-- 1. Your app uses numeric match IDs like "1368057" but database expected UUID format
-- 2. The authentication system creates custom user IDs like "user_User_8010_1752154633775" 
-- 3. Both columns need to accept text instead of UUID format

-- HOW TO RUN:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor  
-- 3. Copy and paste BOTH commands above
-- 4. Click "Run"
-- 5. Test the chat functionality

-- VERIFICATION (optional - run this to confirm the changes worked):
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'chat_messages' AND column_name IN ('match_id', 'user_id'); 