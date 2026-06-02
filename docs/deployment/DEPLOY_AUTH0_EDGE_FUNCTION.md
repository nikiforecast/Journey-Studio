# Deploy Auth0 Edge Function

The `add-auth0-user` Edge Function needs to be deployed to Supabase for Auth0 users to be added to workspaces.

## Option 1: Deploy via Supabase CLI (Recommended)

If you have Supabase CLI installed:

```bash
# Make sure you're logged in
supabase login

# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy add-auth0-user
```

## Option 2: Deploy via Supabase Dashboard

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to **Edge Functions** in the sidebar
4. Click **Create a new function**
5. Name it: `add-auth0-user`
6. Copy the entire contents of `supabase/functions/add-auth0-user/index.ts`
7. Paste it into the function editor
8. Click **Deploy**

## Verify Deployment

After deploying, test it:

1. Log in with Google (Auth0)
2. Check browser console - you should see:
   - `✅ useAuth: Successfully added Auth0 user via Edge Function`
   - No CORS errors

## Troubleshooting

### CORS Error Still Appears
- Make sure the function is deployed (check Supabase Dashboard → Edge Functions)
- Verify the function name matches exactly: `add-auth0-user`
- Check Supabase function logs for errors

### Function Not Found
- Verify the function is deployed in Supabase Dashboard
- Check the function name is exactly `add-auth0-user` (case-sensitive)

### User Still Not Added to Workspace
- Check Supabase function logs
- Verify the migration `20250101000000_support_auth0_users.sql` has been run
- Check `workspace_users` table to see if user was added








