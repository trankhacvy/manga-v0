/**
 * Example usage of the useAutoSave hook
 * 
 * This file demonstrates how to use the auto-save hook in the editor
 * Note: This is a TypeScript example file, not meant to be compiled
 */

import type { useAutoSave } from './use-auto-save';

// Example 1: Basic usage with default options
// 
// const { isSaving, lastSaved, saveError } = useAutoSave();
// 
// Display in UI:
// - {isSaving && <span>Saving...</span>}
// - {lastSaved && <span>Last saved: {lastSaved.toLocaleTimeString()}</span>}
// - {saveError && <span>Error: {saveError}</span>}

// Example 2: Custom debounce time and callbacks
//
// const { isSaving, forceSave } = useAutoSave({
//   enabled: true,
//   debounceMs: 3000, // Wait 3 seconds after last change
//   onSaveStart: () => {
//     console.log('Starting save...');
//   },
//   onSaveSuccess: () => {
//     console.log('Save successful!');
//     // Could show a toast notification here
//   },
//   onSaveError: (error) => {
//     console.error('Save failed:', error);
//     // Could show an error toast here
//   },
// });
//
// const handleManualSave = async () => {
//   // Force an immediate save (bypasses debouncing)
//   await forceSave();
// };

// Example 3: Conditional auto-save
//
// const { isSaving } = useAutoSave({
//   enabled: !isReadOnly, // Only enable auto-save when not in read-only mode
//   debounceMs: 2000,
// });

/**
 * How auto-save works:
 * 
 * 1. The hook monitors changes to panels, pages, and characters in the editor store
 * 2. When a change is detected, it queues the change for saving
 * 3. After the debounce period (default 2 seconds), all queued changes are saved
 * 4. Changes are saved in parallel for better performance
 * 5. The hook provides status indicators (isSaving, lastSaved, saveError)
 * 6. On unmount, any pending changes are immediately saved
 * 
 * What gets auto-saved:
 * - Panel positions (x, y)
 * - Panel dimensions (width, height)
 * - Panel prompts
 * - Speech bubbles (text, position, size, style)
 * - Character handles assigned to panels
 * - Style locks
 * - Page properties (page number, dimensions, thumbnail)
 * - Character properties (name, handle, description, images)
 * 
 * What doesn't trigger auto-save:
 * - Newly created items (they're already saved when created)
 * - Selection changes (these are UI-only state)
 * - Canvas zoom/pan (these are UI-only state)
 */

export {};
