# Project Drag and Drop Feature

## Overview

The Projects dashboard now supports drag and drop functionality that allows users to reorder project cards according to their preferences. The new order is automatically saved to the database and persists across sessions. This implementation uses the same drag and drop approach as the User Stories section for consistency and better usability.

## Features

- **Drag and Drop**: Users can drag project cards to reorder them
- **Visual Feedback**: Drag handles are always visible in the header, and cards show visual feedback during dragging
- **Persistent Storage**: Project order preferences are saved to the `user_project_preferences` table
- **User-Specific**: Each user has their own project ordering preferences
- **Automatic Initialization**: New users automatically get preferences initialized with the default project order
- **Consistent UX**: Same drag and drop behavior as User Stories section

## How It Works

### Frontend Implementation

The drag and drop functionality is implemented using the `@dnd-kit` library, matching the UserStoriesSection implementation:

- **DndContext**: Wraps the entire projects grid
- **SortableContext**: Manages the sortable items
- **useSortable**: Hook for individual sortable project cards
- **Drag Handle**: Grip icon positioned in the header, always visible
- **DragOverlay**: Provides visual feedback during dragging

### Backend Storage

Project preferences are stored in the `user_project_preferences` table:

```sql
CREATE TABLE IF NOT EXISTS user_project_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_id)
);
```

### Key Components

1. **ProjectManager.tsx**: Main component with drag and drop logic
2. **SortableProjectCard**: Individual project card with drag functionality
3. **userProjectPreferenceService.ts**: Service for managing preferences in the database

## User Experience

1. **Always Visible**: Drag handles (grip icons) are positioned on the left side of each project card
2. **Drag**: Click and drag the grip handle to reorder projects
3. **Drop**: Release to drop the project in its new position
4. **Save**: The new order is automatically saved to the database
5. **Feedback**: A "Saving new order..." message appears during the save operation
6. **Visual Feedback**: DragOverlay shows the dragged card during movement
7. **No Interference**: Drag handles are positioned away from Edit/Delete buttons

## Technical Details

### Dependencies

The feature uses the following packages (already installed):
- `@dnd-kit/core`: Core drag and drop functionality
- `@dnd-kit/sortable`: Sorting-specific functionality
- `@dnd-kit/utilities`: Utility functions for transforms and styles

### Configuration

- **Sensors**: Uses only `PointerSensor` with 8px activation distance (same as UserStoriesSection)
- **Collision Detection**: Uses `closestCorners` for better drop detection
- **Strategy**: Vertical list sorting strategy for grid layout

### State Management

- **Order Persistence**: User's custom order is maintained even if the `projects` prop changes
- **Preference Initialization**: Project preferences are loaded once and cached to prevent unnecessary reloads
- **Smart Refresh**: Preferences are only refreshed when projects are actually added/removed, not during reordering
- **Error Handling**: Maintains user order even if database operations fail

### Database Operations

- **Initialization**: `initializeProjectPreferences()` - Creates initial preferences for new users
- **Reordering**: `reorderProjects()` - Updates order positions for all projects
- **Cleanup**: `removeProjectPreference()` - Removes preferences when projects are deleted
- **Retrieval**: `getUserProjectPreferences()` - Gets user's current preferences

### Error Handling

- If reordering fails, the UI maintains the user's order (doesn't revert)
- Database errors are logged to the console with detailed debugging
- Fallback to original project order only if preferences can't be loaded initially
- Console logging provides visibility into reordering operations

## Security

- Row Level Security (RLS) is enabled on the `user_project_preferences` table
- Users can only access and modify their own preferences
- Foreign key constraints ensure data integrity

## Performance Considerations

- Drag and drop operations are optimized with minimal re-renders
- Database operations use upsert for efficient updates
- Indexes are in place for fast lookups by user_id and order_index
- DragOverlay provides smooth visual feedback without affecting performance

## Implementation Details

### Key Changes from Previous Version

1. **Drag Handle Position**: Moved from left side (hover-only) to header (always visible)
2. **Sensor Configuration**: Simplified to use only PointerSensor like UserStoriesSection
3. **Collision Detection**: Changed from `closestCenter` to `closestCorners`
4. **Visual Feedback**: Added DragOverlay for better user experience
5. **Drag Start Handling**: Added proper drag start event handling

### Drag Handle Design

The drag handle is now:
- Positioned on the left side of each project card (top-left corner)
- Always visible (no hover requirement)
- Styled with white background and shadow for better visibility
- Positioned away from Edit/Delete buttons to avoid interference
- Prevents click event propagation for better UX

### Debugging and Troubleshooting

The implementation includes comprehensive console logging to help debug issues:

- **Drag Start**: Logs when dragging begins
- **Reordering**: Logs old index, new index, and project IDs
- **Order Changes**: Logs the new order array with project names
- **Database Operations**: Logs successful saves and any errors
- **State Management**: Logs when preferences are refreshed

To debug drag and drop issues:
1. Open browser console
2. Perform drag and drop operations
3. Check console logs for detailed information
4. Look for any error messages or unexpected behavior

### Common Issues and Solutions

1. **Order Resets After Drag**: 
   - Check if `hasInitializedPreferences` flag is working correctly
   - Verify that `orderedProjects` state is not being overwritten
   - Check console logs for preference refresh operations

2. **Database Errors**:
   - Verify user authentication and permissions
   - Check network connectivity to Supabase
   - Review console logs for specific error messages

3. **Performance Issues**:
   - Ensure `orderedProjects` is not being recalculated unnecessarily
   - Check if stakeholder counts are being loaded efficiently
   - Monitor console for repeated preference loading

## Future Enhancements

Potential improvements could include:
- Drag and drop between different sections/views
- Bulk reordering operations
- Keyboard navigation support
- Touch gesture support for mobile devices
- Drag and drop for other entities (stakeholders, notes, etc.)
- Column-based organization (similar to User Stories)
