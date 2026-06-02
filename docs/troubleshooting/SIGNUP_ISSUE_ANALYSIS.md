# Signup Issue Analysis: Why It Suddenly Stopped Working

## Most Likely Cause

The signup issue was likely introduced when the **debugging migration** (`20250205000001_add_signup_debugging.sql`) was applied. This migration added a verification query that contains an ambiguous column reference:

```sql
-- This line in the verification query is ambiguous:
WHERE workspace_id = legl_workspace_id 
  AND (user_id = NEW.id OR user_email = user_email);
```

The problem: `user_email = user_email` is ambiguous because:
- `user_email` is a **variable** declared in the function
- `user_email` is also a **column name** in the `workspace_users` table
- PostgreSQL can't determine which one you mean

## Why It "Suddenly" Stopped Working

Even though you didn't make changes, one of these likely happened:

1. **Migration was applied**: The debugging migration (`20250205000001`) was applied, which overwrote the working function with a version that has the bug
2. **Supabase migration sync**: If you ran `supabase db push` or migrations were synced, the newer migration overwrote the old one
3. **Function was recreated**: Something triggered a `CREATE OR REPLACE FUNCTION`, which replaced the working version

## Migration Timeline

Looking at your migrations:

1. **20250103000000** - Original function (worked fine, no verification query)
2. **20250111000001** - Added full_name support (still worked)
3. **20250113000001** - Ensured trigger is active (still worked)
4. **20250205000001** - ⚠️ **Added debugging with ambiguous reference** (introduced bug)
5. **20250205000002** - ✅ **Fixed ambiguous reference** (fix exists but may not be applied)

## How to Verify

Run the diagnostic script:
```sql
-- Run diagnose_signup_issue.sql in Supabase SQL Editor
```

This will tell you:
- Whether the function uses `v_user_email` (fixed) or `user_email` (buggy)
- Whether the ambiguous reference exists
- Whether the trigger is enabled
- What migrations have been applied

## The Fix

The fix is simple: rename the variable from `user_email` to `v_user_email` throughout the function. This makes it clear when we're referring to the variable vs. the column.

**Apply the fix:**
1. Run `fix_signup_trigger.sql` in Supabase SQL Editor (fastest)
2. Or run `npx supabase db push` to apply migration `20250205000002`

## Prevention

To prevent this in the future:

1. **Always test migrations** before applying to production
2. **Use distinct variable names** - prefix with `v_` or `p_` to avoid conflicts with column names
3. **Use table aliases** in queries to be explicit about column references
4. **Run validation scripts** after applying migrations

## Other Possible Causes (Less Likely)

If the fix doesn't work, check:

1. **RLS Policies**: Ensure `SECURITY DEFINER` allows the function to bypass RLS
2. **Trigger Status**: Verify the trigger is enabled (`tgenabled = 'O'`)
3. **Workspace Exists**: Check that the "Legl" workspace exists
4. **Table Constraints**: Verify `workspace_users` table structure hasn't changed
5. **Supabase Updates**: Check if Supabase made any breaking changes

## Quick Test

After applying the fix, test with:
```sql
-- Run test_signup_trigger.sql
-- This simulates a signup without needing a real user
```

