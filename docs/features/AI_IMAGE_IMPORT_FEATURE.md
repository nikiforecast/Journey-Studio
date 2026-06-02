# AI Image Import Feature for User Journeys

## Overview

The AI Image Import feature allows users to upload an image (PNG/JPG) of a user journey diagram and have it automatically converted into a structured, editable user journey in the User Journey Creator.

This feature uses OpenAI's Vision API (GPT-4o model) to analyze the image and extract:
- **Nodes**: Each step in the journey with descriptions, user roles, platforms, and bullet points
- **Edges**: Connections between nodes with optional labels
- **Metadata**: Journey name and description
- **Spatial Layout**: Intelligent positioning based on the visual arrangement

## How It Works

### 1. User Flow

1. User clicks "Import from Image" button in the User Journey Creator
2. Upload modal opens requesting an OpenAI API key (stored locally)
3. User uploads a PNG or JPEG image of their journey diagram
4. AI analyzes the image and extracts the journey structure
5. Converted journey loads into the React Flow canvas
6. User can edit, save, or export the imported journey

### 2. Technical Architecture

```
Image Upload → Base64 Encoding → OpenAI Vision API → JSON Response → Parser → React Flow Nodes/Edges
```

#### Components Created

**1. `aiImageAnalysisService.ts`**
- Core service for AI image analysis
- Handles OpenAI API communication
- Parses and validates AI responses
- Converts to internal journey format

**2. `ImportJourneyImageModal.tsx`**
- UI component for image upload
- API key management (stored in localStorage)
- Image preview
- Progress and error handling
- User-friendly instructions

**3. Integration in `UserJourneyCreator.tsx`**
- New "Import from Image" button
- Handler to convert analyzed journey to React Flow format
- Automatic user role matching
- Platform normalization

### 3. AI Prompt Engineering

The AI is instructed to:
- Identify all nodes (boxes/shapes) in the diagram
- Determine node types (start, process, end)
- Extract text labels and descriptions
- Find user roles (Client, Admin, Developer, etc.)
- Detect platforms (CMS, Legl, End client, Back end)
- Map connections (arrows/lines) between nodes
- Estimate spatial positions for layout
- Extract any bullet points or sub-items
- Identify journey metadata (name, description)

### 4. Data Flow

```typescript
// AI Analysis Output
interface AnalyzedJourney {
  nodes: JourneyNode[]
  edges: JourneyEdge[]
  name?: string
  description?: string
}

// Converted to React Flow Format
{
  nodes: Node[],        // React Flow nodes with data
  edges: Edge[],        // React Flow edges with labels
  metadata: {...}       // Journey name/description
}
```

## Setup Instructions

### Prerequisites

1. **OpenAI API Key**
   - Get one from: https://platform.openai.com/api-keys
   - Requires GPT-4o model access
   - API key is stored locally in browser (localStorage)

### Installation

No additional installation needed - feature is built into the User Journey Creator.

### Configuration

**API Key Storage:**
- First-time users will be prompted to enter their OpenAI API key
- Key is stored in `localStorage` under `openai_api_key`
- Can be updated anytime via "Update API Key" link in the modal

**Cost Considerations:**
- Each image analysis uses OpenAI Vision API
- Typical cost: ~$0.01-0.05 per image (depending on size/complexity)
- User's API key is charged directly
- No server-side costs for the application

## Usage Guidelines

### Best Practices for Image Quality

**DO:**
- ✅ Use clear, high-resolution images (PNG or JPEG)
- ✅ Ensure text in nodes is readable
- ✅ Make sure arrows/connections are visible
- ✅ Include role labels (e.g., "Client", "Admin")
- ✅ Label platforms if applicable (CMS, Legl, etc.)
- ✅ Keep diagrams relatively simple (5-20 nodes ideal)

**DON'T:**
- ❌ Upload blurry or low-resolution images
- ❌ Use overly complex diagrams (>30 nodes)
- ❌ Include multiple journeys in one image
- ❌ Use handwritten or hard-to-read text
- ❌ Upload images larger than 20MB

### Supported Diagram Types

Works best with:
- Linear/sequential flow diagrams
- Left-to-right or top-to-bottom layouts
- Standard flowchart symbols
- Wireframe mockups with user flows
- Whiteboard sketches (if clear)

### After Import

Once imported, you can:
- Edit node descriptions and properties
- Add or remove bullet points
- Adjust user roles and platforms
- Reposition nodes on the canvas
- Add, modify, or delete connections
- Save the journey to the database

## API Integration Details

### OpenAI API Call

```typescript
POST https://api.openai.com/v1/chat/completions
Content-Type: application/json
Authorization: Bearer {API_KEY}

{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "{prompt}" },
        { "type": "image_url", "image_url": "data:image/jpeg;base64,{base64}" }
      ]
    }
  ],
  "max_tokens": 4096,
  "temperature": 0.1
}
```

### Response Format

The AI returns a JSON object:

```json
{
  "name": "Journey Name",
  "description": "Journey description",
  "nodes": [
    {
      "id": "node-1",
      "label": "Node description",
      "type": "start",
      "userRole": "Client",
      "platform": "End client",
      "bulletPoints": ["item 1", "item 2"],
      "position": {"x": 100, "y": 100}
    }
  ],
  "edges": [
    {
      "id": "edge-1-2",
      "source": "node-1",
      "target": "node-2",
      "label": "Next step"
    }
  ]
}
```

## Error Handling

### Common Errors

1. **"Please enter your OpenAI API key"**
   - Solution: Enter valid OpenAI API key in the modal

2. **"Please select a PNG or JPEG image"**
   - Solution: Only upload .png or .jpg/.jpeg files

3. **"File size must be less than 20MB"**
   - Solution: Compress or reduce image size

4. **"OpenAI API error: ..."**
   - Solution: Check API key validity and account credits

5. **"Could not parse AI response as JSON"**
   - Solution: Try with a clearer image or simpler diagram

### Debugging

Enable console logging:
```javascript
// In aiImageAnalysisService.ts
console.log('AI Response:', content)

// In ImportJourneyImageModal.tsx
console.log('Analysis result:', result)
```

## Limitations

1. **Accuracy**: AI interpretation may not be 100% accurate - always review imported journeys
2. **Complex Diagrams**: Very complex diagrams with 30+ nodes may not import correctly
3. **Handwriting**: Handwritten text may not be recognized accurately
4. **Non-Standard Layouts**: Unusual diagram styles may confuse the AI
5. **API Costs**: Each import incurs OpenAI API costs
6. **Rate Limits**: Subject to OpenAI API rate limits

## Future Enhancements

Potential improvements:
- [ ] Support for PDF files (multi-page)
- [ ] Batch import of multiple diagrams
- [ ] Custom prompt templates
- [ ] Confidence scores for extracted data
- [ ] Alternative AI providers (Claude, Gemini)
- [ ] Offline mode with local AI models
- [ ] Import from screenshot URLs
- [ ] Auto-correction suggestions
- [ ] Import history and versioning

## Security & Privacy

- **API Keys**: Stored only in browser's localStorage, never sent to our servers
- **Images**: Sent directly to OpenAI, not stored on our servers
- **Data**: OpenAI may use data per their policies (check OpenAI's data usage policy)
- **Recommendation**: Use anonymized/sample diagrams for testing

## Support

For issues or questions:
1. Check console for error messages
2. Verify API key is valid
3. Try with a simpler/clearer image
4. Review OpenAI API status: https://status.openai.com/

## Credits

- Built using OpenAI's GPT-4o Vision API
- React Flow for diagram rendering
- Lucide React for icons

