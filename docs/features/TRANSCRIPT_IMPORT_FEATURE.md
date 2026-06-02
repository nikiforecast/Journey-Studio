# Transcript to User Journey Import Feature

This feature allows you to convert phone call transcripts into user journey diagrams using AI (OpenAI GPT-4).

## Features

- **AI-Powered Analysis**: Automatically extracts steps, roles, and flow from transcripts
- **Smart Role Mapping**: Detects user roles and maps them to your existing roles
- **Platform Detection**: Identifies third-party services and platforms mentioned
- **Grid-Snapped Layout**: All positions are automatically snapped to an 8x8 grid
- **Editable Prompt**: Customize how the AI interprets transcripts

## Setup

### 1. Environment Variables

#### Local Development
1. Create a `.env` file in the project root (if you haven't already)
2. Add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-proj-your-actual-api-key-here
   ```
3. Get your API key from: https://platform.openai.com/api-keys
4. Restart your development server

#### Production (Netlify)
1. Go to your Netlify dashboard
2. Navigate to your site → **Site settings** → **Environment variables**
3. Click **Add a variable**
4. Set:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Your actual OpenAI API key
   - **Scopes**: Production, Deploy Previews, Branch Deploys
5. Save and trigger a new deploy

### 2. Test Your Setup Locally

To verify your OpenAI API key is working locally:

```bash
# The function endpoint for local testing
# Start your dev server first (npm run dev)

# Then in another terminal:
curl -X POST http://localhost:8888/.netlify/functions/transcript-to-journey \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "The client called about their property purchase. They need to verify their identity and provide proof of funds.",
    "prompt": "Convert this to a user journey."
  }'
```

If successful, you'll receive a JSON response with `nodes` and `edges`.

## How to Use

### In the User Journey Creator:

1. Click **"Import Transcript"** button (with sparkle icon)
2. Paste your phone call transcript into the text area
3. Click **"Import"**
4. Wait for the AI to analyze (typically 5-15 seconds)
5. Your journey will be automatically created with:
   - Nodes positioned on the grid
   - User roles assigned
   - Platforms/variants detected
   - Edge labels for branching logic

### Example Transcript:

```
The client called to discuss onboarding for their new property purchase. 
The lawyer explained they would first need to complete ID verification through 
our CMS system. The client asked about uploading bank statements. The lawyer 
mentioned they could use Amicus for that, which supports open banking. If the 
funds look unusual, the case would be escalated to the MLRO for review. 
Otherwise, they proceed directly to the risk assessment step.
```

This would generate a journey with:
- Start node: "Client calls about onboarding"
- Process nodes for ID verification, document upload
- Decision node for fund review
- Branch nodes for MLRO escalation vs. direct proceed
- Convergent node for risk assessment
- Platform variants: CMS, Third party (Amicus)
- User roles: End Client, Lawyer, Admin

## Customizing the AI Prompt

The AI uses a detailed prompt to convert transcripts. You can edit this prompt:

**File**: `src/lib/prompts/transcript-to-journey-prompt.ts`

Edit the `TRANSCRIPT_TO_JOURNEY_PROMPT` constant to:
- Change how roles are detected
- Adjust layout rules
- Add custom instructions for your domain
- Modify the JSON structure

After editing, restart your dev server for changes to take effect.

## Architecture

```
User → Import Transcript Button
  ↓
User Journey Creator Component
  ↓
convertTranscriptToJourney() in aiService.ts
  ↓
Netlify Function: /.netlify/functions/transcript-to-journey
  ↓
OpenAI API (GPT-4 Turbo)
  ↓
Returns JSON with nodes and edges
  ↓
Component creates React Flow nodes
  ↓
Journey rendered on canvas
```

## Key Files

| File | Purpose |
|------|---------|
| `src/components/UserJourneyCreator.tsx` | UI button, modal, import handler |
| `src/lib/aiService.ts` | `convertTranscriptToJourney()` function |
| `src/lib/prompts/transcript-to-journey-prompt.ts` | **Editable AI prompt** |
| `netlify/functions/transcript-to-journey.ts` | Serverless function (handles OpenAI API securely) |

## Troubleshooting

### "OpenAI API key not configured"
- Ensure `OPENAI_API_KEY` is in your `.env` file (local) or Netlify env vars (production)
- Restart your dev server after adding the key
- For Netlify, trigger a new deploy after adding the env var

### "Failed to convert transcript"
- Check your OpenAI API key is valid and has credits
- Verify the transcript is not empty
- Check browser console for detailed error messages
- Try a simpler transcript first

### "AI did not return valid journey data"
- The AI might have struggled with the transcript format
- Try rephrasing or adding more context
- Check the prompt in `transcript-to-journey-prompt.ts` for guidance
- Look at the network tab to see the raw AI response

### User roles not mapping correctly
- Make sure you have user roles created in your system first
- The AI tries to match role names (case-insensitive)
- Check the console for warnings about unmapped roles
- Edit the prompt to add your specific role names

## Costs

- Uses OpenAI GPT-4 Turbo Preview (`gpt-4-turbo-preview`)
- Approximate cost: $0.01 - $0.05 per transcript (depending on length)
- 4000 max tokens output
- Temperature: 0.3 (more deterministic)

## Future Enhancements

- [ ] Support for multiple transcript formats (Teams, Zoom, etc.)
- [ ] Batch import multiple transcripts
- [ ] Custom prompt templates per project
- [ ] Preview AI-generated journey before importing
- [ ] Fine-tune model on your specific domain
- [ ] Support for other AI providers (Anthropic, etc.)

