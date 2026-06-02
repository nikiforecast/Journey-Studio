# Auth0 + Supabase Integration Guide

## Problem

Auth0 and Supabase are separate authentication systems. When users authenticate with Auth0:
- They don't have a Supabase `auth.uid()`
- Supabase RLS policies that check `auth.uid()` block all queries
- Users can't access their workspace data

## Solution

We use a two-part approach:

### 1. Edge Function for Adding Users

The `add-auth0-user` Edge Function uses Supabase's service role key to bypass RLS and add Auth0 users to the `workspace_users` table.

**Location:** `supabase/functions/add-auth0-user/index.ts`

**How it works:**
- Called automatically when Auth0 users log in
- Uses service role key (bypasses RLS)
- Adds user to "Legl" workspace with `user_id = null` (since they're not in Supabase auth)

### 2. Modified RLS Policies

The migration `20250101000000_support_auth0_users.sql`:
- Allows `user_id` to be NULL in `workspace_users` (for Auth0 users)
- Updates RLS policies to allow authenticated access
- Note: This is less secure but necessary for Auth0 integration

## Deployment Steps

### 1. Deploy the Edge Function

```bash
# From your project root
supabase functions deploy add-auth0-user
```

Or if using Supabase Dashboard:
1. Go to Edge Functions
2. Create new function: `add-auth0-user`
3. Copy the code from `supabase/functions/add-auth0-user/index.ts`

### 2. Run the Migration

```bash
supabase db push
```

Or apply manually in Supabase Dashboard:
1. Go to SQL Editor
2. Run the migration file: `supabase/migrations/20250101000000_support_auth0_users.sql`

### 3. Verify Environment Variables

Make sure these are set in your Supabase project:
- `SUPABASE_URL` (automatically set)
- `SUPABASE_SERVICE_ROLE_KEY` (automatically set for Edge Functions)

## How It Works

1. User logs in with Auth0 (Google)
2. `useAuth` hook detects Auth0 user
3. Calls Edge Function `add-auth0-user` with email and userId
4. Edge Function adds user to `workspace_users` table with `user_id = null`
5. User can now query workspaces (RLS allows authenticated access)

## Security Considerations

**Current Approach (Less Secure):**
- RLS policies allow all authenticated users to see workspaces
- Application logic filters by `workspace_users` membership
- Works but relies on application-level security

**Better Approach (Future):**
- Use Edge Functions for all data access
- Edge Functions use service role and check `workspace_users` membership
- More secure but requires more code changes

## Troubleshooting

### Issue: Users still can't see workspaces
- Check if Edge Function is deployed
- Check browser console for errors
- Verify user was added to `workspace_users` table
- Check RLS policies are updated

### Issue: Can't save data
- RLS policies on other tables (projects, notes, etc.) still check `auth.uid()`
- Need to update those policies too, or use Edge Functions

### Issue: Edge Function not working
- Check Supabase logs
- Verify service role key is set
- Check function is deployed correctly

## Next Steps

1. Update RLS policies on other tables (projects, notes, etc.) to support Auth0
2. Or migrate all data access to Edge Functions
3. Consider using Supabase Auth instead of Auth0 for better integration

