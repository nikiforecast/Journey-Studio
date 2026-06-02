# Auth0 User Tracking Fix

## Problem
Auth0 users (who log in with Google) couldn't be tracked when creating/editing records because:
- `created_by`/`updated_by` fields were `uuid` with foreign key to `auth.users`
- Auth0 users don't exist in Supabase's `auth.users` table
- The code used `supabase.auth.getUser()` which returns `null` for Auth0 users

## Solution

### 1. Database Migration (`20250102000000_support_auth0_user_tracking.sql`)
- Changed `created_by`/`updated_by` from `uuid` (FK) to `text`
- Now stores:
  - **Supabase users**: UUID string (e.g., `"550e8400-e29b-41d4-a716-446655440000"`)
  - **Auth0 users**: Auth0 user ID string (e.g., `"google-oauth2|109828514633491246015"`)
- Updated RLS policies to allow authenticated users to manage user journeys

### 2. Updated Service Functions
- `createUserJourney()`: Now accepts optional `userId` parameter
- `updateUserJourney()`: Now accepts optional `userId` parameter  
- `getUserJourneys()`: Now accepts optional `userId` parameter for filtering drafts

### 3. Updated Components
- `UserJourneyCreator`: Uses `useAuth()` hook and passes `user.id` to service functions
- `UserJourneysManager`: Uses `useAuth()` hook and passes `user.id` when duplicating journeys

### 4. Utility Function (`src/lib/utils/getCurrentUserId.ts`)
Created helper functions for getting user IDs (for future use):
- `getCurrentUserIdSync()`: For React components
- `getCurrentUserId()`: For async service functions
- `getUserIdFromUser()`: Extract ID from user object

## How It Works

1. **Auth0 users** log in → `useAuth()` hook converts Auth0 user to compatible format
2. User ID is stored as **text** (Auth0 ID: `"google-oauth2|123456"`)
3. When creating/updating records, the user ID is passed from `useAuth()` hook
4. Database stores the text ID, allowing tracking for both user types

## Deployment Steps

1. **Run the migration**:
   ```sql
   -- Apply migration: 20250102000000_support_auth0_user_tracking.sql
   ```

2. **Deploy code changes**:
   - The updated service functions and components are ready
   - No additional configuration needed

3. **Test**:
   - Log in with Google (Auth0)
   - Create a user journey
   - Verify `created_by` field is populated with Auth0 user ID
   - Check that you can see who created/updated journeys

## Notes

- **Backwards compatible**: Existing Supabase users continue to work (UUIDs stored as text)
- **Fallback**: If `userId` is not passed, functions try `supabase.auth.getUser()` for backwards compatibility
- **Other tables**: Similar changes may be needed for `examples`, `user_stories`, `tasks` tables that have `created_by`/`assigned_to_user_id` fields

## Future Work

Consider updating these tables similarly:
- `examples.created_by`
- `user_stories.assigned_to_user_id`
- `tasks.assigned_to_user_id`
- Comment tables (`example_comments`, `design_comments`, etc.)








