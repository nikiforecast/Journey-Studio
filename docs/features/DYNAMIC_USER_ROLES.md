# Dynamic User Roles in AI Features

The transcript-to-journey AI feature now dynamically uses user roles from your database instead of hardcoded values.

## How It Works

### 1. **Database-Driven Roles**
- User roles are fetched from the `user_roles` table
- The AI receives the exact list of available roles in your workspace
- AI only uses roles that actually exist in your system

### 2. **Dynamic Prompt Generation**
```typescript
// Old approach (hardcoded):
const prompt = TRANSCRIPT_TO_JOURNEY_PROMPT

// New approach (dynamic):
const userRoleNames = userRoles.map(role => role.name)
const dynamicPrompt = generateTranscriptToJourneyPrompt(userRoleNames)
```

### 3. **AI Instructions**
The AI receives instructions like:
```
userRole: The EXACT role name performing this step. 
Available roles in this workspace: "End Client", "Fee Earner", "Admin", "MLRO", "Partner"

IMPORTANT: ONLY use roles from the list above.
```

## Benefits

1. **Workspace-Specific**: Each workspace can have different roles
2. **No Hardcoding**: Roles are always up-to-date with your database
3. **Better Matching**: AI matches transcript mentions to actual available roles
4. **Flexible**: Add/remove roles in your workspace and AI adapts automatically

## Example

### Your Workspace Has:
- End Client
- Fee Earner  
- MLRO
- Admin

### In Transcript:
```
"The lawyer reviews the documents..."
```

### AI Behavior:
- Sees "lawyer" in transcript
- Checks available roles: ["End Client", "Fee Earner", "MLRO", "Admin"]
- Matches "lawyer" → "Fee Earner" (closest match)
- Assigns node with `userRole: "Fee Earner"`

## Adding New Roles

1. **Go to User Role Manager** in your workspace
2. **Add a new role** (e.g., "Compliance Officer")
3. **Next time you import a transcript**, the AI will know about this role
4. No code changes needed!

## Fallback Behavior

If for some reason no user roles are found:
- System uses default fallback: "End Client", "Admin", "Developer"
- This ensures the feature always works, even with empty databases

## Technical Details

### Files Changed:
- `src/lib/prompts/transcript-to-journey-prompt.ts` - Now exports `generateTranscriptToJourneyPrompt(userRoleNames)`
- `src/lib/aiService.ts` - Updated `convertTranscriptToJourney()` signature
- `src/components/UserJourneyCreator.tsx` - Passes actual user roles to AI

### Function Signature:
```typescript
export const generateTranscriptToJourneyPrompt = (
  userRoleNames: string[]
): string
```

### Usage Example:
```typescript
const userRoles = await getUserRoles() // From database
const roleNames = userRoles.map(r => r.name)
const prompt = generateTranscriptToJourneyPrompt(roleNames)

const journey = await convertTranscriptToJourney(
  transcript,
  prompt,
  roleNames
)
```

## Backward Compatibility

The old `TRANSCRIPT_TO_JOURNEY_PROMPT` constant still exists for legacy code:
```typescript
// Legacy export (uses default roles)
export const TRANSCRIPT_TO_JOURNEY_PROMPT = generateTranscriptToJourneyPrompt([
  'End Client', 'Admin', 'Developer'
])
```

## Future Enhancements

Potential improvements:
- [ ] Add role descriptions to help AI understand role responsibilities
- [ ] Include role synonyms (e.g., "lawyer" = "Fee Earner", "solicitor" = "Fee Earner")
- [ ] Role hierarchy to help AI infer who performs certain actions
- [ ] Custom prompts per workspace with role-specific guidance

