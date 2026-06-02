# Deploy Image Import Timeout Fix

## What Changed
1. **Optimized prompt**: Reduced from 22KB → 5.6KB (75% smaller)
2. **Increased function timeout**: 10s → 26s (maximum)
3. **Fixed image compression**: Now skips already-optimized images
4. **Better error handling**: Improved timeout error messages

## Expected Processing Times After Deploy
- Simple diagrams: 10-20 seconds
- Complex diagrams: 20-40 seconds
- Very complex diagrams: 40-60 seconds (may still timeout)

## Deployment Steps

### 1. Verify Local Changes
```bash
# Check that optimized prompt exists
ls -lh src/lib/prompts/diagram-to-journey-prompt-optimized.ts

# Should show: ~5.6K file size
```

### 2. Commit and Push Changes
```bash
git add .
git commit -m "fix: optimize image-to-diagram prompt and fix timeout issues"
git push origin main
```

### 3. Verify Netlify Environment Variables
**Go to Netlify Dashboard → Your Site → Environment Variables**

Required variable:
- **`OPENAI_API_KEY`**: Your OpenAI API key
  - Must start with `sk-proj-` or `sk-`
  - Same key used for transcript import

### 4. Wait for Deploy
- Netlify will auto-deploy from your main branch
- Wait 2-3 minutes for build to complete
- Check deploy logs for any errors

### 5. Verify Function Configuration
**Check Netlify Functions Settings:**

The `netlify.toml` should have:
```toml
[functions."diagram-to-journey"]
  timeout = 26
```

This is already in your code. Netlify will apply it automatically.

## Testing After Deploy

1. Go to your production site
2. Open User Journey Creator
3. Click "Import from Image"
4. Test with a small diagram (should take 10-20s)
5. Check browser console - should see:
   ```
   Original image size: XXXKB
   Image already optimized: XXXKB (or compressed: XXX → XXX)
   ```

## Troubleshooting

### Still Getting 504 Timeout?

**Check 1: Is the optimized prompt deployed?**
```bash
# In Netlify deploy logs, look for:
# "Building function: diagram-to-journey"
# Should use diagram-to-journey-prompt-optimized.ts
```

**Check 2: Is OPENAI_API_KEY set?**
- Go to Netlify → Environment Variables
- Click "Reveal values"
- Verify key starts with `sk-`

**Check 3: Is the function timeout applied?**
- Netlify dashboard → Functions → diagram-to-journey
- Should show "Timeout: 26 seconds"

**Check 4: OpenAI API limits**
- Very complex diagrams may genuinely take > 26 seconds
- OpenAI's Vision API can be slow during peak times
- Try during off-peak hours (early morning EST)

### If Still Failing After All Checks

**Option 1: Simplify the prompt further**
We can remove examples to make it even faster.

**Option 2: Break diagram into sections**
Import one section at a time (top half, bottom half).

**Option 3: Use transcript import instead**
Describe the diagram in text format.

## What You DON'T Need to Configure

❌ No special Netlify function settings
❌ No custom domains for functions
❌ No additional API keys
❌ No webhooks or background functions

## Expected Console Output (Success)

```
Original image size: 165KB
Image already optimized: 165KB (800x400px)
[Server processing for 15-30s]
Successfully imported journey with X nodes, Y regions, and Z connections!
```

## Files Changed in This Fix

1. `src/lib/prompts/diagram-to-journey-prompt-optimized.ts` (NEW - smaller prompt)
2. `src/lib/services/aiImageAnalysisService.ts` (uses optimized prompt + better compression)
3. `netlify.toml` (timeout increased to 26s)
4. `netlify/functions/diagram-to-journey.js` (detail: auto instead of high)
5. `src/components/ImportJourneyImageModal.tsx` (better user feedback)

## Contact Support If...

- Deploy succeeds but still getting 504
- OPENAI_API_KEY is confirmed correct
- Simple diagrams (5-10 nodes) still timeout
- Error message says "API key not configured"

This would indicate an issue with Netlify's environment variable access or OpenAI API.

