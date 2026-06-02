# Step-by-Step Debugging Guide

Let's debug this systematically. Follow these steps in order:

## Step 1: Check What's Actually Happening

### A. Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Clear the console
4. Log in with Google
5. Look for these messages and copy ALL of them:
   - `🔵 useAuth: Adding Auth0 user to workspace via Edge Function`
   - `🔵 useAuth: Calling edge function with:`
   - `🔵 useAuth: Edge function response:`
   - Any error messages (❌)

### B. Check Edge Function Logs
1. Go to Supabase Dashboard → Edge Functions → `add-auth0-user` → Logs
2. Filter to "Last hour" or "Last 15 minutes"
3. Look for:
   - `🔵 Edge function invoked:` ← Function was called
   - `🔵 Environment check:` ← Check the values
   - Any error messages
4. Copy ALL log messages from the last login attempt

### C. Check Database
Run this SQL in Supabase SQL Editor:

```sql
-- 1. Check if user exists
SELECT * FROM workspace_users 
WHERE user_email = 'niki.forecast@legl.com';

-- 2. Check if workspace exists
SELECT id, name, created_by, created_at 
FROM workspaces 
WHERE name = 'Legl'
ORDER BY created_at ASC;

-- 3. Check constraint status
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'workspace_users' 
  AND constraint_name = 'user_id_or_pending_check';
```

## Step 2: Test Edge Function Directly

1. Go to Supabase Dashboard → Edge Functions → `add-auth0-user`
2. Click **"Test"** button (or go to Invocations → New Invocation)
3. Use this payload:
```json
{
  "email": "niki.forecast@legl.com",
  "userId": "google-oauth2|109828514633491246015"
}
```
4. Click **"Invoke"**
5. Check:
   - Response (should show success with user data)
   - Logs (should show all our console.log messages)

## Step 3: Verify Environment Variables

1. Go to Edge Functions → `add-auth0-user` → **Settings** (or **Details**)
2. Look for **"Environment Variables"** or **"Secrets"** section
3. Check if these exist:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

If they don't exist:
- Click **"Add variable"** or **"Add secret"**
- Add `SUPABASE_URL` = `https://lkunizszvxeudaauceif.supabase.co`
- Add `SUPABASE_SERVICE_ROLE_KEY` = (get from Settings → API → service_role key)

## Step 4: Check Function Code

1. Go to Edge Functions → `add-auth0-user` → **Code**
2. Verify the code matches `supabase/functions/add-auth0-user/index.ts`
3. Make sure it has all the console.log statements we added
4. If not, copy the entire file and redeploy

## Step 5: Manual Database Check

If the function isn't working, manually verify the database:

```sql
-- Get workspace ID
SELECT id FROM workspaces WHERE name = 'Legl' ORDER BY created_at ASC LIMIT 1;

-- Then check if user can be inserted (replace WORKSPACE_ID)
INSERT INTO workspace_users (
  workspace_id,
  user_id,
  user_email,
  role,
  status
) VALUES (
  'c3550308-68a7-46e3-b7e5-745452ae2cd6',  -- Replace with actual workspace ID
  NULL,
  'niki.forecast@legl.com',
  'member',
  'active'
)
ON CONFLICT (workspace_id, user_email) 
DO UPDATE SET status = 'active', updated_at = now()
RETURNING *;
```

## What to Share

Please share:
1. **Browser console output** (all messages when logging in)
2. **Edge function logs** (from Supabase Dashboard)
3. **SQL query results** (from Step 1C)
4. **Test invocation result** (from Step 2)
5. **Environment variables status** (from Step 3)

This will help us identify exactly where it's failing!








