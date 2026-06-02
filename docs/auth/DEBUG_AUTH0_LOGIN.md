# Debugging Auth0 Login - Step by Step Guide

## Current Problem
- User logs in with Google (Auth0)
- Edge function is called but user isn't added to workspace_users table
- User can't see workspace data

## Debugging Checklist

### Step 1: Verify Edge Function is Deployed ✅
- [ ] Go to Supabase Dashboard → Edge Functions
- [ ] See `add-auth0-user` in the list
- [ ] Status shows as "Active" or "Deployed"

### Step 2: Check Edge Function Logs
- [ ] Go to Edge Functions → `add-auth0-user` → Logs
- [ ] Look for these messages when you log in:
  - `🔵 Edge function invoked:` ← Function was called
  - `🔵 Environment check:` ← Check if hasServiceKey is true
  - `🔵 Creating Supabase admin client` ← Client created
  - `🔵 Parsing request body` ← Request received
  - `Checking for existing user:` ← Database query started
  - `Attempting to insert user:` ← Insert attempted
  - `Successfully inserted user:` ← Success!

**What to look for:**
- If you only see "shutdown" → Function is crashing before executing
- If you see "Missing environment variables" → Need to set SUPABASE_SERVICE_ROLE_KEY
- If you see errors → Note the error message

### Step 3: Test Edge Function Directly
- [ ] Go to Edge Functions → `add-auth0-user` → Test (or Invocations → New Invocation)
- [ ] Use this test payload:
```json
{
  "email": "niki.forecast@legl.com",
  "userId": "google-oauth2|109828514633491246015"
}
```
- [ ] Click "Invoke"
- [ ] Check the response and logs

### Step 4: Verify Database State
Run this SQL in Supabase SQL Editor:

```sql
-- Check if user exists in workspace_users
SELECT * FROM workspace_users 
WHERE user_email = 'niki.forecast@legl.com';

-- Check if Legl workspace exists
SELECT * FROM workspaces 
WHERE name = 'Legl'
ORDER BY created_at ASC;

-- Check the constraint was dropped
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'workspace_users' 
  AND constraint_name = 'user_id_or_pending_check';
-- Should return 0 rows (constraint is dropped)
```

### Step 5: Check Browser Console
When logging in, check browser console for:
- `🔵 useAuth: Adding Auth0 user to workspace via Edge Function`
- `✅ useAuth: Successfully added Auth0 user via Edge Function`
- Any error messages

### Step 6: Verify Environment Variables
- [ ] Edge Functions → `add-auth0-user` → Settings/Details
- [ ] Check if environment variables section exists
- [ ] Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

### Step 7: Manual Insert Test
If everything else fails, manually insert the user:

```sql
-- Get workspace ID first
SELECT id FROM workspaces WHERE name = 'Legl' ORDER BY created_at ASC LIMIT 1;

-- Then insert (replace WORKSPACE_ID with the ID from above)
INSERT INTO workspace_users (
  workspace_id,
  user_id,
  user_email,
  role,
  status
) VALUES (
  'WORKSPACE_ID_HERE',
  NULL,
  'niki.forecast@legl.com',
  'member',
  'active'
)
ON CONFLICT (workspace_id, user_email) 
DO UPDATE SET status = 'active', updated_at = now()
RETURNING *;
```








