# User Signup Debugging Guide

This guide explains how to debug user signup issues using the comprehensive logging we've added.

## What's Been Added

### 1. Database Trigger Debugging
The `auto_add_legl_user()` trigger function now logs every step of the signup process with `RAISE NOTICE` statements. All logs are prefixed with `SIGNUP_DEBUG:` for easy filtering.

### 2. Client-Side Debugging
The `useAuth` hook now logs detailed information about the signup process in the browser console, also prefixed with `🔵 SIGNUP_DEBUG:`.

## How to View Debug Logs

### Database Logs (Server-Side)

1. **Go to Supabase Dashboard**
   - Navigate to: `https://supabase.com/dashboard/project/[your-project-id]`

2. **Access Postgres Logs**
   - Go to **Logs** → **Postgres Logs** in the sidebar
   - Or use: **Database** → **Logs** → **Postgres Logs**

3. **Filter for Signup Debugging**
   - In the search/filter box, enter: `SIGNUP_DEBUG`
   - This will show all signup-related logs

4. **What to Look For**
   - `SIGNUP_DEBUG: Trigger fired` - Confirms trigger is running
   - `SIGNUP_DEBUG: Email matches @legl.com pattern` - Email validation passed
   - `SIGNUP_DEBUG: Found existing Legl workspace` - Workspace lookup
   - `SIGNUP_DEBUG: Attempting to insert into workspace_users` - About to insert
   - `SIGNUP_DEBUG: Successfully inserted/updated` - Insert succeeded
   - `SIGNUP_DEBUG: ERROR` - Any errors will be logged here

### Browser Console Logs (Client-Side)

1. **Open Browser Developer Tools**
   - Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Go to the **Console** tab

2. **Filter for Debug Messages**
   - Use the console filter and search for: `SIGNUP_DEBUG`
   - Or look for messages starting with `🔵 SIGNUP_DEBUG:`

3. **What to Look For**
   - `SIGNUP_DEBUG: signInWithGoogle called` - User clicked sign in
   - `SIGNUP_DEBUG: OAuth redirect initiated` - Redirect started
   - `SIGNUP_DEBUG: Auth state changed: SIGNED_IN` - User signed in
   - `SIGNUP_DEBUG: User found in workspace_users` - ✅ Success!
   - `SIGNUP_DEBUG: ⚠️ User NOT found in workspace_users` - ❌ Problem!

## Common Issues and What to Check

### Issue: User Created But Not in workspace_users

**Check Database Logs:**
1. Look for `SIGNUP_DEBUG: ERROR inserting into workspace_users`
2. Check the error message - it will show:
   - SQL error code
   - Detailed error message
   - The values being inserted

**Common Causes:**
- **RLS Policy Blocking**: Check if RLS policies allow the trigger to insert
- **Missing Workspace**: Check if "Legl" workspace exists
- **Constraint Violation**: Check unique constraints on workspace_users

**Fix:**
- If RLS is blocking, ensure the trigger function has `SECURITY DEFINER`
- If workspace missing, check logs for workspace creation errors
- If constraint violation, check for duplicate entries

### Issue: Trigger Not Firing

**Check Database Logs:**
- If you see NO `SIGNUP_DEBUG` messages, the trigger might not be active

**Verify Trigger Exists:**
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

**Verify Function Exists:**
```sql
SELECT proname FROM pg_proc WHERE proname = 'auto_add_legl_user';
```

### Issue: Email Not Matching Pattern

**Check Database Logs:**
- Look for: `SIGNUP_DEBUG: Email % does not match @legl.com pattern`
- This means the email validation is failing

**Verify:**
- Check the actual email in the log
- Ensure it ends with `@legl.com` (case-insensitive)

## Testing the Debugging

1. **Apply the Migration**
   ```bash
   npx supabase db push
   ```
   Or run it manually in Supabase SQL Editor

2. **Try Signing Up**
   - Use a test @legl.com email
   - Watch both browser console and database logs

3. **Check Both Logs**
   - Browser console should show client-side flow
   - Database logs should show trigger execution

## Next Steps

If you find an error in the logs:

1. **Copy the exact error message** from the logs
2. **Note which step failed** (workspace lookup, insert, etc.)
3. **Check the values** being inserted (user_id, email, workspace_id)
4. **Verify RLS policies** on workspace_users table
5. **Check if workspace exists** and is accessible

The logs will tell you exactly where the signup process is failing!

