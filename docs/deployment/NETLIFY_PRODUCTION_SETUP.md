# Setting Up Auth0 for Production on Netlify

This guide explains how to configure Auth0 for your production deployment on Netlify.

## Production Domain
Your production domain: **https://kyp-legl.netlify.app/**

## Step 1: Set Environment Variables in Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Select your site: **kyp-legl**
3. Navigate to **Site configuration** → **Environment variables** (or **Site settings** → **Environment variables**)
4. Click **Add a variable** and add each of the following:

### Required Variables:

| Variable Name | Value | Example |
|--------------|-------|---------|
| `VITE_AUTH0_DOMAIN` | Your Auth0 domain | `your-tenant.auth0.com` |
| `VITE_AUTH0_CLIENT_ID` | Your Auth0 Client ID | `abc123xyz...` |
| `VITE_AUTH0_AUDIENCE` | (Optional) Your Auth0 API audience | Leave empty if not using Auth0 API |

**Important Notes:**
- Use the **same Auth0 application** for both development and production
- The values should match what you use locally (from your `.env` file)
- Netlify will automatically use these variables during build time
- Variables prefixed with `VITE_` are exposed to your frontend code

## Step 2: Update Auth0 Application Settings

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Applications** → **Applications**
3. Select your application
4. Go to the **Settings** tab
5. Scroll down to the **URLs** section

### Update These Fields:

**Allowed Callback URLs:**
```
http://localhost:5173,http://localhost:3000,https://kyp-legl.netlify.app
```

**Allowed Logout URLs:**
```
http://localhost:5173,http://localhost:3000,https://kyp-legl.netlify.app
```

**Allowed Web Origins:**
```
http://localhost:5173,http://localhost:3000,https://kyp-legl.netlify.app
```

**Important:**
- Add each URL on a separate line OR comma-separated
- Include both development (`localhost`) and production (`kyp-legl.netlify.app`) URLs
- Make sure to use `https://` for production (not `http://`)
- No trailing slashes

6. Click **Save Changes**

## Step 3: Redeploy Your Site

After setting environment variables, you need to trigger a new deployment:

### Option A: Trigger via Git (Recommended)
1. Make a small change to your code (or just commit and push)
2. Netlify will automatically rebuild with the new environment variables

### Option B: Trigger Manual Deploy
1. In Netlify Dashboard, go to **Deploys**
2. Click **Trigger deploy** → **Deploy site**
3. This will rebuild with the environment variables

## Step 4: Verify It Works

1. Visit your production site: https://kyp-legl.netlify.app/
2. You should see the "Sign in with Google" button
3. Click it and verify:
   - You're redirected to Google login
   - After login, you're redirected back to your production site
   - The authentication works correctly

## Troubleshooting

### Issue: "Invalid redirect_uri" error
- **Solution**: Make sure `https://kyp-legl.netlify.app` is added to **Allowed Callback URLs** in Auth0
- Check that there are no typos (no trailing slash, correct protocol)

### Issue: Auth0 not working in production
- **Solution**: Verify environment variables are set correctly in Netlify
- Check that the variable names start with `VITE_`
- Make sure you've redeployed after adding the variables

### Issue: Environment variables not found
- **Solution**: Environment variables are only available at build time
- You must redeploy after adding/changing environment variables
- Check Netlify build logs to verify variables are being used

### Issue: Works locally but not in production
- **Solution**: 
  1. Verify production URL is in Auth0 callback URLs
  2. Check that environment variables match your local `.env` file
  3. Ensure you've redeployed after making changes

## Security Best Practices

1. **Never commit `.env` files** - They should be in `.gitignore`
2. **Use the same Auth0 application** for dev and production (or separate apps if preferred)
3. **Keep environment variables secure** - Don't share them publicly
4. **Use Netlify's environment variable management** - Don't hardcode secrets

## Additional Resources

- [Netlify Environment Variables Documentation](https://docs.netlify.com/environment-variables/overview/)
- [Auth0 React SDK Documentation](https://auth0.com/docs/libraries/auth0-react)
- [Netlify Deploy Documentation](https://docs.netlify.com/site-deploys/create-deploys/)

