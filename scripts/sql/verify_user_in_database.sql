-- Verify user exists in workspace_users table
-- Run this in Supabase SQL Editor

-- 1. Check if you exist in workspace_users
SELECT 
  id,
  workspace_id,
  user_id,
  user_email,
  role,
  status,
  created_at,
  updated_at,
  full_name,
  team
FROM workspace_users
WHERE user_email = 'niki.forecast@legl.com';

-- Expected: Should return 1 row with your user info

-- 2. Check which workspace you're in
SELECT 
  wu.id as workspace_user_id,
  wu.user_email,
  wu.role,
  wu.status,
  w.name as workspace_name,
  w.id as workspace_id
FROM workspace_users wu
JOIN workspaces w ON wu.workspace_id = w.id
WHERE wu.user_email = 'niki.forecast@legl.com';

-- Expected: Should show you're in the "Legl" workspace

-- 3. Count total users in Legl workspace
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users
FROM workspace_users
WHERE workspace_id = 'c3550308-68a7-46e3-b7e5-745452ae2cd6';

-- Expected: Should show at least 1 active user (you)








