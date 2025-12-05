# Keyboard Shortcuts Hook

## Overview

The `use-keyboard-shortcuts.ts` hook provides comprehensive keyboard shortcut functionality for the manga editor. It consolidates all keyboard interactions into a single, maintainable hook.

## Features

### Canvas Controls

- **Cmd/Ctrl + K**: Focus global prompt input
- **Escape**: Clear selection and blur inputs
- **?**: Show keyboard shortcuts help modal

### Panel Editing

- **Delete/Backspace**: Delete selected panels (with confirmation)
- **Arrow Keys**: Nudge selected panels by 1px
- **Shift + Arrow Keys**: Nudge selected panels by 10px

### Copy/Paste Operations

- **Cmd/Ctrl + C**: Copy selected panels to clipboard
- **Cmd/Ctrl + V**: Paste panels from clipboard
- **Cmd/Ctrl + D**: Duplicate selected panels

## Usage

```typescript
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";

function EditorLayout() {
  useKeyboardShortcuts({
    onDeleteRequested: () => {
      // Handle panel deletion with confirmation
    },
    onFocusPrompt: () => {
      // Focus the prompt input field
    },
    onShowShortcuts: () => {
      // Show the shortcuts help modal
    },
    onShowToast: (message, type) => {
      // Show toast notification
    },
  });
}
```

## Implementation Details

### Input Detection

The hook automatically detects when the user is typing in an input field and prevents shortcuts from triggering in those contexts. This prevents conflicts like accidentally deleting panels while typing.

### Platform Awareness

The hook detects the user's platform (Mac vs Windows/Linux) and uses the appropriate modifier key:

- Mac: `metaKey` (Cmd)
- Windows/Linux: `ctrlKey` (Ctrl)

### Clipboard Store Integration

Copy/paste operations are handled through the `clipboard-store.ts` Zustand store, which:

- Stores copied panel data in memory
- Generates new IDs for pasted panels
- Offsets pasted panels by 20px to make them visible
- Persists changes to the database

### Toast Notifications

All copy/paste/duplicate operations show toast notifications to provide user feedback:

- Success: "Copied X panel(s)", "Panels pasted", "Duplicated X panel(s)"
- Error: "Failed to paste panels", "Failed to duplicate panels"

## Related Files

- `lib/store/clipboard-store.ts` - Clipboard state management
- `components/help/shortcuts-modal.tsx` - Keyboard shortcuts help modal
- `lib/hooks/use-editor-shortcuts.ts` - Legacy hook (can be deprecated)
- `hooks/use-keyboard-shortcuts.ts` - Legacy hook (can be deprecated)

## Future Enhancements

- Undo/Redo functionality (Cmd+Z, Cmd+Shift+Z)
- Multi-select with Cmd+Click
- Select all (Cmd+A)
- Deselect all (Cmd+Shift+A)
