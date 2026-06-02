# User Journey Copy/Paste and Edge Highlighting Feature

## Overview
This document describes the implementation of three new features for the User Journey Creator:

1. **Highlight connecting edges when multiple nodes are selected**
2. **Copy nodes with Command+C (or Ctrl+C)**
3. **Paste nodes with Command+V (or Ctrl+V)**

## Features Implemented

### 1. Edge Highlighting for Multiple Selected Nodes

When multiple nodes are selected (using Shift+Click), the edges that connect these selected nodes are automatically highlighted in green, making it easy to see the relationships between selected nodes.

**Implementation Details:**
- Tracks selected nodes using a `useEffect` hook that monitors node selection state
- Updates edge data with a `highlighted` property when edges connect two selected nodes
- Edges are styled with:
  - Green color (#10b981) for the edge path
  - Green background for edge labels (bg-green-50)
  - Green border for edge labels (border-green-500)
- Highlighting is cleared when less than 2 nodes are selected

**Visual Indicators:**
- Highlighted edges: Green (#10b981)
- Highlighted edge labels: Green background with green border
- Normal edges: Gray (#b1b1b7)

### 2. Copy Selected Nodes (Command+C / Ctrl+C)

Users can now copy selected nodes to their clipboard by pressing Command+C (Mac) or Ctrl+C (Windows/Linux).

**Implementation Details:**
- Copies both nodes and their connecting edges
- Stores data in two places:
  1. System clipboard as JSON (for cross-journey copying)
  2. Component state (as fallback if clipboard access fails)
- Only copies edges that connect the selected nodes
- Prevents copying when typing in input fields or textareas

**Copied Data Format:**
```json
{
  "nodes": [...],
  "edges": [...]
}
```

### 3. Paste Nodes (Command+V / Ctrl+V)

Users can paste previously copied nodes by pressing Command+V (Mac) or Ctrl+V (Windows/Linux).

**Implementation Details:**
- Reads from clipboard first, falls back to component state if clipboard read fails
- Generates new unique IDs for pasted nodes and edges
- Offsets pasted nodes by 50px (x and y) to make them visible
- Updates edge connections to use new node IDs
- Automatically selects pasted nodes
- Deselects previously selected nodes
- Works across different user journeys (cross-journey copy/paste)

**Paste Behavior:**
- New nodes appear 50px to the right and 50px down from original position
- All pasted nodes are automatically selected
- Previous selection is cleared
- Edges between pasted nodes are preserved

## Usage

### Selecting Multiple Nodes
1. Hold **Shift** key
2. Click on multiple nodes to select them
3. Connecting edges will be highlighted in green

### Copying Nodes
1. Select one or more nodes
2. Press **Command+C** (Mac) or **Ctrl+C** (Windows/Linux)
3. Console will show: "Copied X node(s) and Y edge(s) to clipboard"

### Pasting Nodes
1. After copying nodes (from same or different journey)
2. Press **Command+V** (Mac) or **Ctrl+V** (Windows/Linux)
3. New nodes appear offset by 50px and are automatically selected
4. Console will show: "Pasted X node(s) and Y edge(s)"

### Copy/Paste Across Journeys
1. Open one journey and copy nodes
2. Navigate to a different journey
3. Paste the nodes - they will appear with the same data but new IDs
4. All node properties are preserved:
   - Labels
   - Types (start, process, end)
   - User roles
   - Bullet points
   - Platform variants
   - Third party names
   - Custom properties

## Technical Details

### Files Modified

1. **`src/components/UserJourneyCreator.tsx`**
   - Added state for copied nodes and edges
   - Added `useEffect` to track node selection and highlight edges
   - Added `copySelectedNodes` function
   - Added `pasteNodes` function
   - Added keyboard event handlers for Command+C and Command+V

2. **`src/components/DesignSystem/components/CustomEdge.tsx`**
   - Added `highlighted` property to `CustomEdgeData` interface
   - Updated edge styling to show green color when highlighted
   - Updated label styling to show green background/border when highlighted

### State Management

```typescript
// Stores copied nodes and edges for fallback
const [copiedNodes, setCopiedNodes] = useState<Node[]>([])
const [copiedEdges, setCopiedEdges] = useState<Edge[]>([])
```

### Keyboard Event Handling

The implementation prevents copy/paste shortcuts from triggering when the user is typing in input fields or textareas:

```typescript
const target = event.target as HTMLElement
if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
  return // Don't trigger copy/paste
}
```

## Browser Compatibility

The feature uses the modern Clipboard API (`navigator.clipboard`):
- **Supported**: Chrome 63+, Firefox 53+, Safari 13.1+, Edge 79+
- **Fallback**: Component state storage if clipboard access fails
- **HTTPS Required**: Clipboard API requires secure context (HTTPS)

## Future Enhancements

Potential improvements for future versions:
1. Visual feedback (toast notification) when copying/pasting
2. Copy/paste with keyboard position offset based on viewport center
3. Support for cutting nodes (Command+X)
4. Copy formatting options (copy with/without edges)
5. Batch operations (copy multiple selections)
6. Undo/redo for paste operations (already has undo for drag)

## Testing Checklist

- [x] Select multiple nodes with Shift+Click
- [x] Verify edges between selected nodes are highlighted in green
- [x] Copy single node with Command+C
- [x] Copy multiple nodes with Command+C
- [x] Paste nodes with Command+V
- [x] Verify pasted nodes appear offset by 50px
- [x] Verify pasted nodes are selected
- [x] Verify edge connections are preserved
- [x] Test cross-journey copy/paste
- [x] Verify no interference with text input fields
- [x] Test on Mac (Command key) and Windows/Linux (Ctrl key)

## Known Limitations

1. **Clipboard Permission**: Some browsers may require user permission to access the clipboard
2. **HTTPS Only**: Clipboard API requires secure context (HTTPS or localhost)
3. **Cross-Browser**: Fallback to component state if clipboard access fails
4. **No Undo for Paste**: Paste operation doesn't integrate with the existing undo history (could be added in future)

