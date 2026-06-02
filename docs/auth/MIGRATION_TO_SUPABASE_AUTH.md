# Migration to Supabase Google OAuth - Complete

## What Was Done

I've successfully migrated your authentication system from Auth0 to Supabase Auth with Google OAuth. Here's what changed:

### ✅ Completed Changes

1. **Database Trigger Created** (`supabase/migrations/20250103000000_auto_add_legl_users.sql`)
   - Automatically adds @legl.com users to the "Legl" workspace when they sign up
   - Handles both new signups and email updates
   - Creates the workspace if it doesn't exist

2. **Updated `useAuth` Hook** (`src/hooks/useAuth.ts`)
   - Removed all Auth0 dependencies
   - Now uses `supabase.auth.signInWithOAuth({ provider: 'google' })` for Google sign-in
   - Simplified authentication flow - no more Auth0/Supabase dual system
   - Email domain restriction (@legl.com) still enforced

3. **Updated `LoginForm` Component** (`src/components/LoginForm.tsx`)
   - Removed Auth0 imports and checks
   - Google sign-in button now uses Supabase OAuth
   - Fixed linting issues

4. **Removed Auth0 Provider** (`src/main.tsx`)
   - Removed `Auth0Provider` wrapper
   - Simplified routing setup

5. **Updated Utility Functions** (`src/lib/utils/getCurrentUserId.ts`)
   - Removed Auth0-specific comments and logic
   - Now only handles Supabase users

6. **Created Setup Guide** (`docs/SUPABASE_GOOGLE_OAUTH_SETUP.md`)
   - Complete instructions for configuring Google OAuth in Supabase
   - Troubleshooting tips

## What You Need to Do Next

### 1. Configure Google OAuth in Supabase (Required)

Follow the steps in `docs/SUPABASE_GOOGLE_OAUTH_SETUP.md`:

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Create Google OAuth app in Google Cloud Console
4. Add redirect URIs:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Your production URL: `https://your-domain.netlify.app`
   - Local dev: `http://localhost:5173` (or your port)
5. Copy Client ID and Secret to Supabase

### 2. Run Database Migration (Required)

```bash
supabase db push
```

Or apply manually in Supabase Dashboard → SQL Editor:
- Run `supabase/migrations/20250103000000_auto_add_legl_users.sql`

### 3. Test Locally

```bash
npm run dev
```

1. Click "Sign in with Google"
2. Use a @legl.com Google account
3. Verify you're automatically added to the workspace

### 4. Optional: Remove Auth0 Dependencies

If you want to completely remove Auth0:

```bash
npm uninstall @auth0/auth0-react
```

You can also delete these files (they're no longer used):
- `src/lib/auth0.ts`
- `src/hooks/useAuth0Safe.ts`
- `supabase/functions/add-auth0-user/` (if not needed)
- `supabase/functions/auth0-crud/` (if not needed)

### 5. Deploy to Production

After testing locally:
1. Deploy to Netlify
2. Test Google sign-in in production
3. Verify workspace access works correctly

## How It Works Now

1. **User clicks "Sign in with Google"**
   → Redirects to Google for authentication

2. **Google authenticates and redirects back**
   → Supabase creates/updates user in `auth.users`

3. **Database trigger fires automatically**
   → Checks if email ends with `@legl.com`
   → Finds or creates "Legl" workspace
   → Adds user to `workspace_users` table

4. **User is authenticated**
   → Can access workspace immediately

## Benefits

✅ **Simpler**: One auth system instead of two  
✅ **Automatic**: Users added to workspace via database trigger  
✅ **Secure**: Email domain restriction enforced  
✅ **No Edge Functions needed**: Direct Supabase auth works with RLS  
✅ **Better UX**: Faster authentication flow  

## Notes

- The Auth0 migration (`20250101000000_support_auth0_users.sql`) is still in place but won't cause issues
- Existing Auth0 users will need to sign up again with Google
- All @legl.com users are automatically added to the "Legl" workspace
- Email/password signups still work and also get auto-added to workspace

## Support

If you encounter any issues:
1. Check `docs/SUPABASE_GOOGLE_OAUTH_SETUP.md` for troubleshooting
2. Verify Google OAuth is configured correctly in Supabase
3. Check Supabase logs for trigger errors
4. Ensure redirect URIs are correct

