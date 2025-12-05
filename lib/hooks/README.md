# Editor Hooks

This directory contains React hooks for the manga editor.

## Available Hooks

### `useEditorData`

Loads and manages editor data for a project, including project metadata, pages, panels, and characters.

**Features:**

- Automatic data loading on mount
- Loading state management
- Error handling with retry logic
- Exponential backoff for retries
- Manual retry capability

**Usage:**

```typescript
import { useEditorData } from "@/lib/hooks/use-editor-data";

function EditorComponent({ projectId }: { projectId: string }) {
  const { isLoading, error, retry, isRetrying, retryCount } = useEditorData({
    projectId,
    autoRetry: true, // Enable automatic retries (default: true)
    maxRetries: 3, // Maximum retry attempts (default: 3)
    retryDelay: 2000, // Base delay between retries in ms (default: 2000)
  });

  if (isLoading) return <div>Loading...</div>;
  if (error)
    return (
      <div>
        Error: {error} <button onClick={retry}>Retry</button>
      </div>
    );

  return <div>Editor loaded!</div>;
}
```

**Options:**

| Option       | Type      | Default  | Description                                               |
| ------------ | --------- | -------- | --------------------------------------------------------- |
| `projectId`  | `string`  | required | The ID of the project to load                             |
| `autoRetry`  | `boolean` | `true`   | Enable automatic retry on failure                         |
| `maxRetries` | `number`  | `3`      | Maximum number of retry attempts                          |
| `retryDelay` | `number`  | `2000`   | Base delay between retries (ms), uses exponential backoff |

**Return Value:**

| Property     | Type                  | Description                               |
| ------------ | --------------------- | ----------------------------------------- |
| `isLoading`  | `boolean`             | True while initial data is loading        |
| `error`      | `string \| null`      | Error message if loading failed           |
| `retry`      | `() => Promise<void>` | Function to manually retry loading        |
| `isRetrying` | `boolean`             | True while automatic retry is in progress |
| `retryCount` | `number`              | Number of retry attempts made             |

**Data Access:**

The hook loads data into the `useEditorStore`. Access the loaded data using:

```typescript
import { useEditorStore } from "@/lib/store/editor-store";

const project = useEditorStore((state) => state.project);
const pages = useEditorStore((state) => state.pages);
const panels = useEditorStore((state) => state.panels);
const characters = useEditorStore((state) => state.characters);
```

**Retry Behavior:**

- Uses exponential backoff: delay × 2^(retryCount - 1)
- Example with `retryDelay: 2000`:
  - 1st retry: 2 seconds
  - 2nd retry: 4 seconds
  - 3rd retry: 8 seconds

**Error Handling:**

The hook automatically handles errors from:

- Project not found
- Database connection issues
- Missing or corrupted data
- Network failures

See `use-editor-data.example.ts` for more usage examples.

### `useAutoSave`

Automatically saves project and canvas state with debouncing.

**Usage:**

```typescript
import { useAutoSave } from "@/lib/hooks/use-auto-save";

function Editor() {
  const { lastSaved, isSaving, error, forceSave } = useAutoSave({
    interval: 10000, // Auto-save every 10 seconds
    debounceDelay: 1000, // Wait 1 second after last change
    enabled: true, // Enable auto-save
  });

  return (
    <div>
      {isSaving && <span>Saving...</span>}
      {lastSaved && <span>Last saved: {lastSaved.toLocaleTimeString()}</span>}
      {error && <span>Error: {error}</span>}
      <button onClick={forceSave}>Save Now</button>
    </div>
  );
}
```

## Implementation Notes

### Data Loading Flow

1. Hook mounts and calls `loadProject(projectId)` from editor store
2. Store fetches data from Supabase in parallel:
   - Project metadata
   - Pages (ordered by page_number)
   - Panels (for all pages)
   - Characters
3. Store transforms database rows to typed models
4. Store updates state with loaded data
5. Hook returns loading/error states

### Error Recovery

The `useEditorData` hook implements robust error recovery:

1. **Automatic Retry**: On failure, automatically retries up to `maxRetries` times
2. **Exponential Backoff**: Increases delay between retries to avoid overwhelming the server
3. **Manual Retry**: Users can manually trigger a retry via the `retry()` function
4. **Error Messages**: Provides clear error messages for debugging

### Performance Considerations

- Data is loaded once on mount and cached in the store
- Subsequent renders use cached data from the store
- Only re-fetches if `projectId` changes
- Uses Zustand for efficient state updates

### Testing

To test the hook:

1. **Success Case**: Provide a valid `projectId`
2. **Error Case**: Provide an invalid `projectId` or disconnect network
3. **Retry Case**: Trigger an error and verify automatic retry
4. **Manual Retry**: Click retry button after error

## Future Enhancements

- [ ] Real-time updates via Supabase subscriptions
- [ ] Optimistic updates for better UX
- [ ] Partial data loading (load pages on demand)
- [ ] Background refresh
- [ ] Offline support with local caching
