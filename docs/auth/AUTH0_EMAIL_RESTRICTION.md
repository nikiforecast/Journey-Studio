# Restricting Login to @legl.com Email Addresses

This guide shows how to restrict Auth0 login to only allow users with `@legl.com` email addresses.

## Method 1: Auth0 Actions (Recommended)

Auth0 Actions allow you to add custom logic during the authentication flow. We'll create an Action that checks the email domain.

### Step 1: Create a Login Action

1. Go to your [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Actions** → **Flows** in the sidebar
3. Click on **Login** flow
4. Click **+** to add a new Action
5. Click **Build Custom** (or use the "+" button)
6. Name it "Restrict to Legl Domain" or similar
7. Select **Login / Post Login** trigger
8. Click **Create**

### Step 2: Add the Code

Replace the default code with this:

```javascript
/**
* Handler that will be called during the execution of a PostLogin flow.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
exports.onExecutePostLogin = async (event, api) => {
  // Get the user's email
  const email = event.user.email || event.user.user_metadata?.email;
  
  // Check if email exists and ends with @legl.com
  if (!email || !email.endsWith('@legl.com')) {
    // Block the login
    api.access.deny('Access restricted to @legl.com email addresses only.');
    return;
  }
  
  // Allow the login to proceed
  // Optionally, you can add the user to a specific organization or role here
};
```

### Step 3: Deploy and Apply

1. Click **Deploy** to save the Action
2. Drag the Action from the right panel into the Login flow (between "Start" and "Complete")
3. Click **Apply** to save the flow

### Step 4: Test

1. Try logging in with a non-@legl.com email - it should be blocked
2. Try logging in with an @legl.com email - it should work

## Method 2: Application-Level Check (Fallback)

As a secondary check, you can also verify the email domain in your application code. This provides an extra layer of security and works even if Auth0 Actions aren't configured.

See the updated `useAuth.ts` hook which includes this check.

## Method 3: Google Workspace Restriction

If all your users are in a Google Workspace (formerly G Suite), you can restrict the Google connection to only allow users from your organization:

1. In Auth0 Dashboard, go to **Authentication** → **Social** → **Google**
2. Under **Advanced Settings**, you can configure domain restrictions
3. However, this requires Google Workspace setup

## Troubleshooting

- **Action not blocking users**: Make sure the Action is deployed and added to the Login flow
- **Legitimate users blocked**: Check that the email check logic is correct (case-insensitive, etc.)
- **Testing**: Use Auth0's test mode or try logging in with different email addresses

