# Check These Environment Variables in Netlify

Go to: https://app.netlify.com → Your Site → Site settings → Environment variables

You need these **3 variables** set:

## Required Environment Variables:

1. **`OPENAI_API_KEY`**
   - Your OpenAI API key (starts with `sk-...`)
   - Used by all AI functions

2. **`SUPABASE_URL`**
   - Your Supabase project URL
   - Example: `https://xxxxx.supabase.co`
   - Find it in: Supabase Dashboard → Settings → API

3. **`SUPABASE_SERVICE_KEY`**
   - Your Supabase service role key (NOT the anon key!)
   - Starts with: `eyJ...`
   - Find it in: Supabase Dashboard → Settings → API → Service Role Key
   - ⚠️ **IMPORTANT**: This is the SERVICE ROLE key, not the ANON key

---

## Why Functions Are Failing:

If any of these are missing, the background functions will fail to initialize and return empty responses (404/empty JSON).

The error "Unexpected end of JSON input" means the function is returning nothing, which happens when:
- The function crashes on initialization
- Environment variables are missing
- The function isn't deployed at all

---

## How to Check:

1. Go to Netlify Dashboard
2. Click your site
3. Go to: **Site settings** → **Environment variables**
4. Verify all 3 variables are listed
5. If any are missing, click **Add a variable** and add them

---

## After Adding Variables:

1. **Trigger a new deploy**: Deploys → Trigger deploy → Clear cache and deploy site
2. Wait 2-3 minutes
3. Test the imports again

---

## Alternative: Check Netlify Function Logs

While testing, check the function logs:
1. Go to: **Functions** tab in Netlify dashboard
2. Click on `diagram-to-journey-background` or `transcript-to-journey-background`
3. View the logs to see actual error messages

This will show you the exact error (e.g., "SUPABASE_URL is not defined")

