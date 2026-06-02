# Folder Navigation Implementation - Remaining Work

## ✅ Completed
1. Database migration for nested folders (`20250111000004_add_nested_folders.sql`)
2. Updated `UserJourneyFolder` interface with `parent_folder_id`
3. Added service functions: `moveFolderToParent`, `countJourneysInFolder`
4. Added state variables for navigation: `currentFolderId`, `folderPath`, `draggedItem`, etc.
5. Created `TableItem` type for combined folders + journeys
6. Implemented filter logic for current folder level
7. Added drag-and-drop handler functions
8. Added folder navigation functions

## 🔄 In Progress / Remaining Work

### 1. Update Table Columns (CRITICAL)
The `columns` array needs to be completely replaced to work with `TableItem` instead of `UserJourneyWithProject`.

**Key changes needed:**
- Change type from `Column<UserJourneyWithProject>[]` to `Column<TableItem>[]`
- Each column's `render` function needs to check `item.type` and render differently for folders vs journeys
- Name column should show folder icon for folders, journey icon for journeys
- Status column should show "Folder" for folders, actual status for journeys
- Nodes column should show journey count for folders
- Actions column needs conditional delete handler (folders use `handleDeleteFolderClick`, journeys use `handleDeleteClick`)

### 2. Add Breadcrumb Navigation UI
Add before the filters section:

```tsx
{/* Breadcrumb Navigation */}
{!searchTerm && (
  <div className="mb-4 flex items-center gap-2 text-sm">
    <button
      onClick={handleNavigateToRoot}
      className={`hover:text-blue-600 transition-colors ${
        currentFolderId === null ? 'font-medium text-blue-600' : 'text-gray-600'
      }`}
    >
      All Journeys
    </button>
    {folderPath.map((folder, index) => (
      <React.Fragment key={folder.id}>
        <span className="text-gray-400">/</span>
        <button
          onClick={() => handleNavigateToFolder(folder.id)}
          className={`hover:text-blue-600 transition-colors ${
            index === folderPath.length - 1 
              ? 'font-medium text-blue-600' 
              : 'text-gray-600'
          }`}
        >
          {convertEmojis(folder.name)}
        </button>
      </React.Fragment>
    ))}
  </div>
)}
```

### 3. Update DataTable Usage
Replace the current DataTable component usage:

```tsx
<DataTable
  data={filteredTableItems}
  getItemId={(item) => item.type === 'folder' ? `folder-${item.data.id}` : item.data.id}
  columns={columns}
  sortableFields={['name', 'created_at', 'updated_at']}
  onRowClick={(item) => {
    if (item.type === 'folder') {
      handleFolderClick(item.data.id)
    } else {
      navigate(`/user-journey/${item.data.short_id}`)
    }
  }}
  selectable={true}
  selectedItems={selectedJourneys}
  onSelectionChange={setSelectedJourneys}
  showSelectionBar={false}
/>
```

### 4. Add Row Drag Handlers
Each table row needs drag handlers. This requires either:
- Modifying DataTable to support drag props, OR
- Creating a custom table wrapper

### 5. Add Folder Delete Modal
Add before closing `</div>`:

```tsx
{/* Delete Folder Confirmation Modal */}
<Modal
  isOpen={showDeleteFolderConfirm}
  onClose={() => setShowDeleteFolderConfirm(false)}
  title="Delete Folder"
  size="md"
  footerContent={
    <div className="flex items-center justify-end gap-3">
      <Button
        variant="ghost"
        onClick={() => setShowDeleteFolderConfirm(false)}
      >
        Cancel
      </Button>
      <Button
        variant="danger"
        onClick={handleDeleteFolderConfirm}
      >
        Delete Folder & Contents
      </Button>
    </div>
  }
>
  <div className="p-6">
    <p className="text-gray-700 mb-4">
      Are you sure you want to delete "<strong>{folderToDelete && convertEmojis(folderToDelete.name)}</strong>"?
    </p>
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-sm text-red-800 font-medium mb-2">
        ⚠️ Warning: This action cannot be undone
      </p>
      <p className="text-sm text-red-700">
        This will permanently delete:
      </p>
      <ul className="text-sm text-red-700 list-disc list-inside mt-2">
        <li>The folder "{folderToDelete && convertEmojis(folderToDelete.name)}"</li>
        <li>All {folderToDelete && folderJourneyCounts[folderToDelete.id] || 0} user journey(s) inside it</li>
        <li>Any subfolders and their contents</li>
      </ul>
    </div>
  </div>
</Modal>
```

### 6. Remove Folder Filter Dropdown
The folder filter dropdown should be removed since navigation replaces it. Users navigate by clicking folders instead.

## Testing Checklist
- [ ] Apply database migrations
- [ ] Folders appear in table at root level
- [ ] Clicking folder navigates into it
- [ ] Breadcrumbs show current path
- [ ] Drag journey onto folder moves it
- [ ] Drag folder onto folder nests it
- [ ] Delete folder shows warning with journey count
- [ ] Delete folder cascades to all journeys inside
- [ ] Search shows all matching items regardless of folder

## Next Steps
1. Complete the table columns refactor (most critical)
2. Add breadcrumb navigation UI
3. Update DataTable usage
4. Add folder delete modal
5. Test all functionality

