# How to Find Your Supabase Service Role Key

## Step 1: Go to Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project (the one with URL: `lkunizszvxeudaauceif.supabase.co`)

## Step 2: Navigate to API Settings

1. Click **Settings** (gear icon) in the left sidebar
2. Click **API** in the settings menu

## Step 3: Find the Service Role Key

You'll see two keys:

1. **anon/public key** - This is NOT what you need (starts with `eyJ...`)
2. **service_role key** - This is what you need (also starts with `eyJ...`)

⚠️ **IMPORTANT**: The service_role key has full access to your database and bypasses RLS. Keep it secret!

## Step 4: Set Environment Variables for Edge Function

Edge functions should automatically have access to:
- `SUPABASE_URL` (auto-set)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-set)

But if they're missing:

1. Go to **Edge Functions** → `add-auth0-user` → **Settings**
2. Look for **Environment Variables** section
3. Add:
   - `SUPABASE_URL` = Your project URL (e.g., `https://lkunizszvxeudaauceif.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` = The service_role key from Step 3

## Alternative: Check if Auto-Set

Edge functions should automatically have these variables. To verify:

1. Go to **Edge Functions** → `add-auth0-user` → **Logs**
2. Look for the environment check logs we added
3. If `hasServiceKey: false`, then you need to set it manually

## Security Note

- ✅ **OK**: Use service_role key in Edge Functions (server-side, secure)
- ❌ **NEVER**: Expose service_role key in client-side code or `.env` files that are committed to git








