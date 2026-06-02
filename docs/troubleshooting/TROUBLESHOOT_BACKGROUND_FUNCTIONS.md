# Troubleshooting Background Functions

## Error: "Unexpected end of JSON input"

This error means the background function is returning an empty response. Here's how to debug:

---

## Step 1: Check Netlify Function Logs

1. Go to **Netlify Dashboard** → Your Site → **Functions**
2. Click on **`diagram-to-journey-background`**
3. Check if it appears in the list
   - ✅ If YES: Click it and check logs
   - ❌ If NO: Function didn't deploy (see Step 2)

4. **In the logs, look for:**
   - `[diagram-to-journey-background] Function invoked` ← Should appear when you try to import
   - Any error messages

---

## Step 2: Verify Function Deployment

### Check Function Files:
```bash
ls -la netlify/functions/
```

**Should see:**
- `diagram-to-journey.js` ✅
- `diagram-to-journey-background.js` ✅
- `transcript-to-journey.js` ✅
- `transcript-to-journey-background.js` ✅

### Redeploy if Missing:
```bash
git add netlify/functions/
git commit -m "fix: update background functions to use CommonJS"
git push origin main
```

Wait 2-3 minutes for deploy to complete.

---

## Step 3: Verify Environment Variables

Go to **Netlify → Site settings → Environment variables**

**Required variables:**
1. ✅ `OPENAI_API_KEY` - Your OpenAI API key
2. ✅ `SUPABASE_URL` - Your Supabase project URL
3. ✅ `SUPABASE_SERVICE_KEY` - Your Supabase service role key (**NOT anon key**)

**How to check:**
- Click "Reveal values" to see them
- If any are missing, add them
- After adding, **redeploy** (Netlify → Deploys → Trigger deploy)

---

## Step 4: Verify Database Table Exists

1. Go to **Supabase Dashboard** → Your Project → **Database** → **Tables**
2. Look for **`ai_processing_jobs`** table
   - ✅ If YES: Check RLS policies (Step 5)
   - ❌ If NO: Run migration (see below)

### Run Migration:
1. Go to Supabase Dashboard → **SQL Editor**
2. Click **"New Query"**
3. Paste contents from: `supabase/migrations/20251021000000_add_ai_processing_jobs.sql`
4. Click **"Run"**

---

## Step 5: Check RLS Policies

In Supabase Dashboard → **Authentication** → **Policies** → Filter by `ai_processing_jobs`:

**Should see 2 policies:**
1. ✅ "Users can view their own AI processing jobs" (SELECT)
2. ✅ "Users can create AI processing jobs" (INSERT)

If missing, re-run the migration from Step 4.

---

## Step 6: Test Function Directly

Use this curl command to test the background function:

```bash
# Replace YOUR_USER_ID with your actual Supabase user ID
curl -X POST https://YOUR_SITE.netlify.app/.netlify/functions/diagram-to-journey-background \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "prompt": "test",
    "base64Image": "data:image/png;base64,test"
  }'
```

**Expected response:**
```json
{
  "jobId": "some-uuid",
  "status": "processing",
  "message": "Processing started. Poll for results."
}
```

**If you get an error**, it will tell you what's wrong:
- `"Supabase not configured"` → Missing environment variables (Step 3)
- `"User ID is required"` → Check userId in request
- `500 error` → Check Netlify function logs

---

## Step 7: Check Your User ID

The background function needs your Supabase user ID. Verify you're logged in:

1. Open browser console (F12)
2. Run this JavaScript:
```javascript
// Check if user is authenticated
import { supabase } from './src/lib/supabase'
const { data: { user } } = await supabase.auth.getUser()
console.log('User ID:', user?.id)
```

If `user` is null → You're not logged in!

---

## Common Issues & Fixes

### Issue 1: Function Returns Empty Response

**Cause:** Function file not deployed or wrong syntax

**Fix:**
1. Check function uses `exports.handler = async function()` (CommonJS)
2. NOT `export async function handler()` (ES modules)
3. Redeploy after fixing

### Issue 2: "Supabase not configured"

**Cause:** Missing `SUPABASE_URL` or `SUPABASE_SERVICE_KEY`

**Fix:**
1. Add both variables in Netlify
2. **Important:** Use `SUPABASE_SERVICE_KEY` (service_role), NOT `SUPABASE_ANON_KEY`
3. Redeploy

### Issue 3: Table `ai_processing_jobs` Doesn't Exist

**Cause:** Migration not run

**Fix:**
1. Run migration SQL (Step 4)
2. Verify table exists
3. Test again

### Issue 4: RLS Policy Error

**Cause:** User can't insert into `ai_processing_jobs` table

**Fix:**
1. Check RLS policies exist (Step 5)
2. Verify user is authenticated
3. Ensure `user_id` matches authenticated user

---

## Quick Deployment Checklist

Before testing, ensure:
- ✅ Background function files exist in `netlify/functions/`
- ✅ Files use CommonJS syntax (`exports.handler`, `require()`)
- ✅ Code is committed and pushed to git
- ✅ Netlify deployed successfully (check Netlify deploys page)
- ✅ All 3 environment variables are set
- ✅ Database table exists
- ✅ RLS policies are created
- ✅ User is logged in

---

## Still Not Working?

### Enable Debug Mode:

Deploy these changes, then check Netlify function logs:

```bash
git add .
git commit -m "debug: add logging to background functions"
git push origin main
```

Try importing an image and immediately check:
**Netlify → Functions → diagram-to-journey-background → Real-time logs**

Look for:
- `[diagram-to-journey-background] Function invoked` ← Function was called
- `[diagram-to-journey-background] Parsed request` ← Request was valid
- `[diagram-to-journey-background] Supabase configured: true` ← Env vars are set
- Any error messages

---

## Alternative: Use Non-Background Version

If background functions are too complex, you can use the optimized regular function (26s timeout):

**In `ImportJourneyImageModal.tsx`, change:**
```typescript
// FROM:
import { analyzeJourneyImageWithBackground } from ...
const result = await analyzeJourneyImageWithBackground(...)

// TO:
import { analyzeJourneyImage } from ...
const result = await analyzeJourneyImage(...)
```

**Trade-off:**
- ✅ Simpler (no database, no polling)
- ✅ Works immediately
- ❌ 26-second timeout limit (may still timeout for complex diagrams)

---

## Contact Info

If still stuck after trying all steps:
1. Check Netlify function logs (most important!)
2. Check browser console for errors
3. Verify all environment variables are set
4. Confirm database table exists

The logs will tell you exactly what's wrong! 🔍

