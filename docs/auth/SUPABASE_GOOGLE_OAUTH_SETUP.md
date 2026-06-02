# Supabase Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication using Supabase Auth, which replaces the previous Auth0 setup.

## Overview

We've migrated from Auth0 to Supabase Auth with Google OAuth. This simplifies the authentication flow and automatically adds @legl.com users to the workspace via database triggers.

## Setup Steps

### 1. Configure Google OAuth in Supabase Dashboard

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list and click **Enable**
4. You'll need to create a Google OAuth application:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Go to **Credentials** → **Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - Add authorized redirect URIs:
     - `https://<your-project-ref>.supabase.co/auth/v1/callback`
     - For local development: `http://localhost:5173` (or your local port)
   - Copy the **Client ID** and **Client Secret**
5. Paste the Client ID and Client Secret into Supabase's Google provider settings
6. Click **Save**

### 2. Configure Redirect URLs

In Supabase Dashboard → **Authentication** → **URL Configuration**:
- Add your production URL: `https://your-domain.netlify.app`
- Add your local development URL: `http://localhost:5173` (or your Vite dev server port)

### 3. Run Database Migration

The migration `20250103000000_auto_add_legl_users.sql` creates a trigger that automatically adds @legl.com users to the "Legl" workspace when they sign up.

Run the migration:
```bash
supabase db push
```

Or apply it manually in Supabase Dashboard → SQL Editor.

### 4. Environment Variables

Make sure these are set in your Netlify environment variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

You can find these in Supabase Dashboard → **Settings** → **API**.

### 5. Remove Auth0 Dependencies (Optional)

If you want to completely remove Auth0 from your codebase:

1. Remove from `package.json`:
   ```bash
   npm uninstall @auth0/auth0-react
   ```

2. Delete Auth0-related files:
   - `src/lib/auth0.ts`
   - `src/hooks/useAuth0Safe.ts`
   - `supabase/functions/add-auth0-user/` (if not needed)
   - `supabase/functions/auth0-crud/` (if not needed)

3. Remove Auth0 environment variables from Netlify (if any)

## How It Works

1. **User clicks "Sign in with Google"**
   - The app calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
   - User is redirected to Google for authentication

2. **Google redirects back**
   - Supabase handles the OAuth callback
   - User is redirected back to your app
   - Supabase creates/updates the user in `auth.users`

3. **Database trigger fires**
   - The `auto_add_legl_user()` trigger checks if the email ends with `@legl.com`
   - If yes, it finds or creates the "Legl" workspace
   - It adds the user to `workspace_users` with role 'member' and status 'active'

4. **User is authenticated**
   - The `useAuth` hook detects the session change
   - User can now access the workspace

## Email Domain Restriction

The app restricts access to `@legl.com` email addresses:
- Users with other domains will be signed out automatically
- The database trigger only adds `@legl.com` users to the workspace
- Email/password signups also check the domain restriction

## Testing

1. **Local Development:**
   ```bash
   npm run dev
   ```
   - Click "Sign in with Google"
   - Use a @legl.com Google account
   - Verify you're added to the workspace automatically

2. **Production:**
   - Deploy to Netlify
   - Test Google sign-in flow
   - Verify workspace access

## Troubleshooting

### Google OAuth not working
- Check that redirect URIs are correctly configured in Google Cloud Console
- Verify Client ID and Secret are correct in Supabase
- Check browser console for errors

### Users not added to workspace
- Check Supabase logs for trigger errors
- Verify the trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
- Check that the "Legl" workspace exists

### Email domain restriction not working
- Verify the `isEmailAllowed` function in `useAuth.ts`
- Check that users are being signed out if they use non-@legl.com emails

## Migration from Auth0

If you're migrating from Auth0:
1. Existing Auth0 users will need to sign up again with Google
2. Their data will be preserved (linked by email)
3. The database trigger will add them to the workspace automatically

