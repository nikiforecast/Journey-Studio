# Check Your Netlify Plan & Timeout Settings

## The Mystery
- ✅ Transcript used to work at **1 minute** processing time
- ❌ Now timing out at **40 seconds**
- ❌ Image import timing out at **30 seconds**

This suggests your Netlify configuration changed or isn't being applied correctly.

## Netlify Function Timeout Limits by Plan

| Plan | Default Timeout | Max Timeout | Background Functions |
|------|----------------|-------------|---------------------|
| **Free** | 10s | 26s | ❌ No |
| **Pro** | 10s | 26s | ❌ No |
| **Enterprise** | 10s | 60s+ | ✅ Yes (15 min) |

**Key Question:** If transcript worked at 1 minute before, you likely have **Enterprise** plan.

---

## Step 1: Check Your Netlify Plan

### Via Netlify Dashboard:
1. Go to **Netlify Dashboard**
2. Click on your site
3. Go to **Site settings** → **General** → **Site information**
4. Look for **"Team plan"** or **"Site plan"**

**What plan do you have?**
- ⭐ Free
- ⭐ Pro ($19/mo)
- ⭐ Enterprise (custom pricing)

---

## Step 2: Check Current Function Timeout Settings

### Via Netlify UI:
1. Go to **Netlify Dashboard**
2. Your site → **Functions**
3. Click on `transcript-to-journey`
4. Check **"Function timeout"** setting

**What does it say?**
- If it says **10 seconds** → Config not applied
- If it says **26 seconds** → Free/Pro limit
- If it says **60+ seconds** → Enterprise plan

---

## Step 3: Why Did Transcript Stop Working?

### Possible Reasons:

**A. Plan Downgrade**
- Were you on a trial or did plan change?
- Enterprise → Pro would reduce timeout from 60s → 26s

**B. Config Not Applied**
- `netlify.toml` might not have correct syntax
- Need to redeploy for changes to take effect

**C. Netlify Changed Something**
- Recent Netlify platform updates
- API changes

**D. Prompt Got Longer**
- Did you modify the transcript prompt recently?
- Longer prompts = longer processing time

---

## Step 4: Fixes Based on Your Plan

### If You're on **Free or Pro Plan** (26s max):

**Option 1: Use Background Functions**
This is the ONLY way to get 15 minutes timeout on Pro plan.

I can implement this - it requires:
- Renaming functions to `-background.js`
- Adding polling system
- Database for job tracking
- ~30-45 minutes to implement

**Option 2: Optimize Prompts More**
- Further reduce prompt size
- Remove examples
- May not be enough for complex diagrams

### If You're on **Enterprise Plan** (60s+ possible):

**Option 1: Fix netlify.toml and Redeploy**
I just updated the syntax. Deploy and it should work:
```bash
git add netlify.toml
git commit -m "fix: correct netlify.toml timeout syntax"
git push origin main
```

**Option 2: Set Timeout in Netlify UI**
1. Netlify Dashboard → Your site → Site configuration
2. Look for "Functions" settings
3. Set default timeout to 60 seconds
4. Save and redeploy

**Option 3: Contact Netlify Support**
If Enterprise plan should support 60s+ but it's not working:
- Create support ticket
- Reference: "Function timeout config not being applied"
- Include: netlify.toml file

---

## Step 5: Quick Test

After making changes, test with:

### Transcript Import (should take ~60s):
```
User: "Customer logs in, adds item to cart, checks out, receives confirmation"
Expected: Should complete in 30-60 seconds
```

### Image Import (should take ~20-40s with optimized prompt):
```
Small diagram: 5-10 nodes
Expected: Should complete in 20-40 seconds
```

---

## What I Changed Just Now

**Updated `netlify.toml` syntax:**
```toml
# OLD (might not work):
[functions."diagram-to-journey"]
  timeout = 26

# NEW (correct syntax):
[[functions]]
  path = "diagram-to-journey"
  timeout = 60
```

**Deploy this change:**
```bash
git add netlify.toml
git commit -m "fix: use correct netlify function timeout syntax"
git push origin main
```

---

## Next Steps

1. **Check your Netlify plan** (Step 1 above)
2. **Deploy the netlify.toml fix** (git push)
3. **Test transcript import** (should work now)
4. **If still timing out:**
   - Check Netlify UI timeout settings
   - Or implement Background Functions

---

## If You Need Background Functions

Let me know and I'll implement the full system:
- ✅ Works on any plan (Free/Pro/Enterprise)
- ✅ 15-minute timeout
- ✅ Proper polling UI
- ⏱️ ~30-45 min to implement

Just say: **"Implement background functions"** and I'll do it.

