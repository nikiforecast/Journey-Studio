# Auth0 CRUD Operations Setup

## Problem
Auth0 users can't perform CREATE/UPDATE/DELETE operations because they don't have Supabase JWT tokens, so RLS blocks all mutations.

## Solution
Created Edge Functions that use the service role key to bypass RLS for Auth0 users.

## Edge Functions Created

### 1. `get-workspace-data` (READ operations)
- Fetches all workspace data: projects, stakeholders, notes, user journeys, user roles, user permissions, etc.
- Already deployed and working

### 2. `auth0-crud` (CREATE/UPDATE/DELETE operations)
- Generic CRUD Edge Function for Auth0 users
- Supports: insert, update, delete operations
- Verifies user has workspace access before allowing operations

## How to Use

### For READ operations:
The `get-workspace-data` function is already integrated in `WorkspaceDataFetcher.tsx`.

### For CREATE/UPDATE/DELETE operations:
Service functions need to be updated to detect Auth0 users and use the Edge Function.

Example:
```typescript
// In a service function (e.g., projectService.ts)
const isAuth0User = user?.id?.startsWith('google-oauth2|')

if (isAuth0User && supabase) {
  // Use Edge Function
  const { data, error } = await supabase.functions.invoke('auth0-crud', {
    body: {
      table: 'projects',
      operation: 'insert',
      data: { name: 'New Project', workspace_id: workspaceId },
      userEmail: user.email,
      workspaceId: workspaceId
    }
  })
} else {
  // Use normal Supabase query
  const { data, error } = await supabase.from('projects').insert(...)
}
```

## Next Steps

1. **Deploy `auth0-crud` Edge Function:**
   - Go to Supabase Dashboard → Edge Functions
   - Create new function: `auth0-crud`
   - Copy code from `supabase/functions/auth0-crud/index.ts`
   - Deploy

2. **Update service functions** to use Edge Function for Auth0 users:
   - `projectService.ts` - createProject, updateProject, deleteProject
   - `stakeholderService.ts` - createStakeholder, updateStakeholder, deleteStakeholder
   - `userJourneyService.ts` - createUserJourney, updateUserJourney
   - `userRoleService.ts` - createUserRole, updateCustomUserRole, deleteUserRole
   - `userPermissionService.ts` - createUserPermission, updateUserPermission, deleteUserPermission
   - And other service files...

3. **Update `getUserJourneys`** to use Edge Function for Auth0 users

## Testing

After deploying:
1. Log in with Google (Auth0)
2. Try creating a project
3. Try editing a project
4. Try viewing user journeys
5. Check browser console for errors








