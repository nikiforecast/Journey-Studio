# RLS Policy Troubleshooting Guide

## Overview

If you're experiencing 403 Forbidden or RLS policy violation errors with the `user_project_preferences` table, this guide will help you fix them.

## Common Error Messages

### 1. 403 Forbidden
```
POST https://your-project.supabase.co/rest/v1/user_project_preferences 403 (Forbidden)
```

### 2. RLS Policy Violation
```
new row violates row-level security policy for table "user_project_preferences"
```

## Quick Fix

### Step 1: Run the RLS Fix Script

1. **Open your Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste the RLS fix script:**
   ```sql
   -- Copy the contents of: supabase/fix_rls_policies.sql
   ```

4. **Run the query**
   - Click "Run" button

### Step 2: Verify the Fix

After running the script, you should see:
- ✅ New policies created
- ✅ RLS enabled
- ✅ No more permission errors

## What the Fix Script Does

The script will:

1. **Drop existing problematic policies**
2. **Enable Row Level Security (RLS)**
3. **Create proper policies for all operations:**
   - SELECT: Users can read their own preferences
   - INSERT: Users can insert their own preferences
   - UPDATE: Users can update their own preferences
   - DELETE: Users can delete their own preferences

## Manual Policy Creation (Alternative)

If you prefer to create policies manually:

```sql
-- Enable RLS
ALTER TABLE user_project_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read their own project preferences"
  ON user_project_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project preferences"
  ON user_project_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project preferences"
  ON user_project_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project preferences"
  ON user_project_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

## Troubleshooting Steps

### 1. Check RLS Status

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'user_project_preferences';
```

**Expected result:** `rowsecurity` should be `true`

### 2. Check Existing Policies

```sql
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_project_preferences';
```

**Expected result:** Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)

### 3. Check Authentication

```sql
SELECT auth.uid() as current_user_id;
```

**Expected result:** Should return your user ID (not null)

### 4. Test Table Access

```sql
-- This should work without errors
SELECT COUNT(*) FROM user_project_preferences;
```

## Common Issues and Solutions

### Issue: "No policies exist"
**Solution:** Run the RLS fix script

### Issue: "Policy exists but still getting errors"
**Solution:** Check if the policy conditions are correct:
```sql
-- Policy should use: auth.uid() = user_id
-- Not: auth.uid() = ANY(user_ids) or other conditions
```

### Issue: "RLS is disabled"
**Solution:** Enable RLS:
```sql
ALTER TABLE user_project_preferences ENABLE ROW LEVEL SECURITY;
```

### Issue: "User not authenticated"
**Solution:** Check your Supabase client configuration and ensure you're signed in

## Testing the Fix

After applying the fix:

1. **Refresh your application**
2. **Navigate to Projects dashboard**
3. **Check browser console** - should see success messages
4. **Try drag and drop** - should work without errors

## Console Messages to Look For

### Success Messages:
- `🔍 Attempting to fetch user project preferences for user: [user-id]`
- `✅ Table exists and is accessible`
- `✅ Successfully fetched preferences: X records`

### Error Messages (should be gone):
- `🚫 RLS policy violation`
- `🚫 Permission denied (403 Forbidden)`

## Still Having Issues?

If you're still experiencing problems:

1. **Check the Supabase logs** in your dashboard
2. **Verify your authentication** is working
3. **Ensure the table structure** is correct
4. **Run the diagnostic script:** `supabase/diagnose_user_project_preferences.sql`

## Support

For additional help:
1. Check the main documentation: `README_DATABASE_SETUP.md`
2. Review the drag and drop feature docs: `docs/DRAG_AND_DROP_FEATURE.md`
3. Check browser console for specific error messages

