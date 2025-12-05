# Auto-Save Hook Implementation

## Overview

The `useAutoSave` hook provides automatic saving functionality for the manga editor. It monitors changes to panels, pages, and characters in the editor store and automatically persists them to the database with debouncing.

## Features

### ✅ Debounced Saves

- Default debounce time: 2 seconds after last change
- Configurable via `debounceMs` option
- Prevents excessive database writes during rapid edits

### ✅ Comprehensive Change Detection

The hook automatically saves changes to:

- **Panel positions** (x, y coordinates)
- **Panel dimensions** (width, height)
- **Panel prompts** (text descriptions for AI generation)
- **Speech bubbles** (text, position, size, style)
- **Character handles** (characters assigned to panels)
- **Style locks** (style constraints for generation)
- **Page properties** (page number, dimensions, thumbnails)
- **Character properties** (name, handle, description, reference images)

### ✅ Error Handling

- Graceful error handling with error state
- Error callbacks for custom error handling
- Errors logged to console for debugging
- Save errors don't block future saves

### ✅ Performance Optimizations

- Parallel saves for multiple changes
- Debouncing prevents excessive saves
- Only saves changed properties (not entire objects)
- Efficient change detection using shallow comparison

### ✅ Status Indicators

The hook returns:

- `isSaving`: Boolean indicating if a save is in progress
- `lastSaved`: Date of last successful save
- `saveError`: Error message if save failed
- `forceSave`: Function to trigger immediate save

### ✅ Lifecycle Management

- Automatically saves pending changes on unmount
- Cleans up timers and subscriptions
- Can be enabled/disabled dynamically

## Integration

### Editor Layout

The auto-save hook is integrated into the main editor layout (`app/editor/[projectId]/editor-layout.tsx`):

```typescript
useAutoSave({
  enabled: !isLoading && !error,
  debounceMs: 2000,
  onSaveError: (error) => {
    console.error("Auto-save error:", error);
  },
});
```

### Top Bar

The editor top bar (`components/editor/editor-top-bar.tsx`) displays save status:

```typescript
const { isSaving, lastSaved, saveError } = useAutoSave({
  enabled: true,
  debounceMs: 2000,
});
```

The save indicator shows:

- "Saving..." with spinner when `isSaving` is true
- "Saved" with checkmark when `lastSaved` is set
- "Error saving" with alert icon when `saveError` is set

## Success Criteria

### ✅ Task 2.3 Requirements Met

1. **Create `lib/hooks/use-auto-save.ts`** ✅

   - Hook created with full TypeScript types
   - Comprehensive change detection
   - Debouncing implementation
   - Error handling

2. **Debounce saves (2-3 seconds after last change)** ✅

   - Default debounce: 2000ms (2 seconds)
   - Configurable via `debounceMs` option
   - Clears previous timeout on new changes

3. **Save panel positions, bubble edits, prompt changes** ✅

   - Monitors all panel properties (x, y, width, height, prompt, bubbles)
   - Detects changes via comparison with previous state
   - Queues changes and saves in batch

4. **Update "Saved" indicator in top bar** ✅

   - Top bar integrated with auto-save hook
   - Shows "Saving..." during save
   - Shows "Saved" with timestamp after success
   - Shows "Error saving" on failure

5. **Handle save errors gracefully** ✅
   - Try-catch blocks around all save operations
   - Error state exposed via `saveError`
   - Error callbacks for custom handling
   - Errors logged to console
   - Failed saves don't block future saves

## Usage Examples

See `lib/hooks/use-auto-save.example.ts` for detailed usage examples.

## Technical Details

### Change Detection Algorithm

1. Store previous state in ref (doesn't trigger re-renders)
2. On state change, compare with previous state
3. If changed, add to pending changes map
4. Schedule debounced save
5. On save, execute all pending changes in parallel
6. Update previous state after successful save

### Pending Changes Structure

```typescript
interface PendingChange {
  type: "panel" | "page" | "character";
  id: string;
  updates: Partial<Panel> | Partial<Page> | Partial<Character>;
}
```

Changes are stored in a Map with keys like `panel-{id}`, `page-{id}`, `character-{id}` to ensure only the latest change for each entity is saved.

### Database Integration

The hook uses the editor store's update methods:

- `updatePanel(panelId, updates)` - Updates panel in database
- `updatePage(pageId, updates)` - Updates page in database
- `updateCharacter(characterId, updates)` - Updates character in database

These methods handle:

- Optimistic updates (update UI immediately)
- Database persistence via Supabase
- Error handling and rollback on failure

## Testing

The implementation has been verified for:

- ✅ No TypeScript errors
- ✅ Proper integration with editor store
- ✅ Correct change detection logic
- ✅ Debouncing behavior
- ✅ Error handling
- ✅ Status indicator updates

## Future Enhancements

Potential improvements for future iterations:

- Conflict resolution for concurrent edits
- Offline support with sync queue
- Undo/redo integration
- Save history/versioning
- Bandwidth optimization (compress changes)
- Real-time collaboration support
