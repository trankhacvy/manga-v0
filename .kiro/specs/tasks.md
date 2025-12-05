# Implementation Tasks: New Quick-Start Flow

## Overview

Implementing a new user flow that generates 4 preview pages first, allowing users to review before generating all pages. This saves credits and improves user experience.

---

## Task 1: Database Schema Updates

**Status:** ⏳ Pending  
**Priority:** High (Must be done first)

### Subtasks:

- [x] 1.1: Add `generation_stage` enum field to `projects` table
  - Values: 'script', 'storyboard', 'characters', 'preview', 'complete'
- [x] 1.2: Add `preview_only` boolean field to `projects` table (default: false)
- [x] 1.3: Add `generation_progress` JSONB field to `projects` table
  - Structure: `{ script: 100, storyboard: 50, characters: 75, preview: 0 }`
- [x] 1.4: Add `total_pages` integer field to `projects` table
- [x] 1.5: Create and run migration script

**Files to modify:**

- `supabase/migrations/[timestamp]_add_generation_fields.sql`

---

## Task 2: Create Quick-Start Page

**Status:** ⏳ Pending  
**Priority:** High  
**Dependencies:** None

### Subtasks:

- [x] 2.1: Create `/app/quick-start/page.tsx`
- [x] 2.2: Convert HTML from `raws/quick-start.html` to React components
- [x] 2.3: Add form state management (story description, genre, art style, page count)
- [x] 2.4: Add character counter (0 / 3000 words)
- [x] 2.5: Add form validation
- [x] 2.6: Wire up "Generate Manga" button to API
- [x] 2.7: Add loading state during submission
- [x] 2.8: Add error handling and display

**Files to create:**

- `app/quick-start/page.tsx`

**Reference:**

- `raws/quick-start.html`

---

## Task 3: Create Progress Screen

**Status:** ⏳ Pending  
**Priority:** High  
**Dependencies:** Task 2, Task 4

### Subtasks:

- [x] 3.1: Create `/app/quick-start/progress/[projectId]/page.tsx`
- [x] 3.2: Convert HTML from `raws/progress.html` to React components
- [x] 3.3: Implement polling mechanism to fetch generation progress (every 2-3 seconds)
- [x] 3.4: Display real-time progress for:
  - Script generation (with preview text)
  - Character generation (with character images)
  - Storyboard generation (with panel descriptions)
  - Page preview generation (with loading spinners)
- [x] 3.5: Add progress bar with percentage
- [x] 3.6: Auto-redirect to preview page when generation completes
- [x] 3.7: Add error handling for failed generation
- [x] 3.8: Add "Cancel Generation" option (optional)

**Files to create:**

- `app/quick-start/progress/[projectId]/page.tsx`

**Reference:**

- `raws/progress.html`

---

## Task 4: Create API Route for Quick-Start Generation

**Status:** ⏳ Pending  
**Priority:** High  
**Dependencies:** Task 1

### Subtasks:

- [x] 4.1: Create `/app/api/quick-start/generate/route.ts`
- [x] 4.2: Accept input: story description, genre, art style, page count
- [x] 4.3: Generate script using AI (structured output)
- [x] 4.4: Create project record with `generation_stage: 'script'`
- [x] 4.5: Generate character cards with @handles
- [x] 4.6: Update `generation_stage` to 'characters'
- [x] 4.7: Generate storyboard/panel structure
- [x] 4.8: Update `generation_stage` to 'storyboard'
- [x] 4.9: Create only 4 preview pages (not all pages)
- [x] 4.10: Update `generation_stage` to 'preview'
- [x] 4.11: Return project ID for progress tracking
- [x] 4.12: Add comprehensive error handling
- [x] 4.13: Set `preview_only: true` on project

**Files to create:**

- `app/api/quick-start/generate/route.ts`

---

## Task 5: Create API Route for Progress Tracking

**Status:** ⏳ Pending  
**Priority:** High  
**Dependencies:** Task 1, Task 4

### Subtasks:

- [x] 5.1: Create `/app/api/quick-start/progress/[projectId]/route.ts`
- [x] 5.2: Fetch project with generation_stage and generation_progress
- [x] 5.3: Fetch characters, pages, and panels
- [x] 5.4: Calculate overall progress percentage
- [x] 5.5: Return structured progress data:
  - Current stage
  - Progress percentage per stage
  - Generated script text (if available)
  - Character images (if available)
  - Panel descriptions (if available)
  - Preview page images (if available)
- [x] 5.6: Add error handling

**Files to create:**

- `app/api/quick-start/progress/[projectId]/route.ts`

---

## Task 6: Create Preview Screen

**Status:** ⏳ Pending  
**Priority:** High  
**Dependencies:** Task 4, Task 5

### Subtasks:

- [x] 6.1: Create `/app/quick-start/preview/[projectId]/page.tsx`
- [x] 6.2: Convert HTML from `raws/preview.html` to React components
- [x] 6.3: Fetch project and 4 preview pages
- [x] 6.4: Display 4 preview pages in grid layout
- [x] 6.5: Add "Generate All Pages" button
  - Show credit cost estimation
  - Show estimated time
  - Wire up to generate-all API
- [x] 6.6: Add "Return to Editor" button
  - Navigate to `/editor/[projectId]`
- [x] 6.7: Add loading state for "Generate All Pages" action
- [x] 6.8: Add error handling

**Files to create:**

- `app/quick-start/preview/[projectId]/page.tsx`

**Reference:**

- `raws/preview.html` (code 4.html)

---

## Task 7: Create API Route for Generate All Pages

**Status:** ⏳ Pending  
**Priority:** High  
**Dependencies:** Task 4

### Subtasks:

- [x] 7.1: Create `/app/api/quick-start/generate-all/route.ts`
- [x] 7.2: Accept projectId as parameter
- [x] 7.3: Fetch project and verify it's in preview stage
- [x] 7.4: Calculate remaining pages to generate (total_pages - 4)
- [x] 7.5: Generate remaining pages asynchronously
- [x] 7.6: Update `preview_only: false`
- [x] 7.7: Update `generation_stage: 'complete'`
- [x] 7.8: Return success response
- [x] 7.9: Add error handling

**Files to create:**

- `app/api/quick-start/generate-all/route.ts`

---

## Task 8: Update Authentication Flow

**Status:** ⏳ Pending  
**Priority:** Medium  
**Dependencies:** Task 2

### Subtasks:

- [x] 8.1: Update `/app/page.tsx` to redirect authenticated users to `/quick-start`
- [x] 8.2: Update `middleware.ts` to redirect to `/quick-start` after login
- [x] 8.3: Test login flow redirects correctly

**Files to modify:**

- `app/page.tsx`
- `middleware.ts`

---

## Task 9: Remove Old Flow

**Status:** ⏳ Pending  
**Priority:** Low (Do after new flow works)  
**Dependencies:** All above tasks

### Subtasks:

- [x] 9.1: Delete `/app/landing/page.tsx`
- [x] 9.2: Delete `/app/create/page.tsx`
- [x] 9.3: Delete `/app/api/create/generate/route.ts`
- [x] 9.4: Delete related components:
  - `components/landing/*`
  - `components/onboarding/*`
  - `components/project/create-project-form.tsx`
- [x] 9.5: Clean up unused imports and types
- [x] 9.6: Update navigation links if any

**Files to delete:**

- `app/landing/page.tsx`
- `app/create/page.tsx`
- `app/api/create/generate/route.ts`
- `components/landing/` (entire folder)
- `components/onboarding/` (entire folder)
- `components/project/create-project-form.tsx`

---

## Task 10: Add Loading States and Error Handling

**Status:** ⏳ Pending  
**Priority:** Medium  
**Dependencies:** Tasks 2-7

### Subtasks:

- [x] 10.1: Add loading spinners to all async operations
- [x] 10.2: Add error toast notifications
- [x] 10.3: Add retry mechanisms for failed API calls
- [x] 10.4: Add user-friendly error messages
- [x] 10.5: Add validation error messages
- [x] 10.6: Test all error scenarios

**Files to modify:**

- All pages created in Tasks 2, 3, 6

---

## Recommended Implementation Order:

1. **Task 1** - Database Schema Updates (Foundation)
2. **Task 4** - API Route for Generation (Core logic)
3. **Task 5** - API Route for Progress (Needed for progress screen)
4. **Task 2** - Quick-Start Page (Entry point)
5. **Task 3** - Progress Screen (Shows generation)
6. **Task 7** - API Route for Generate All (Needed for preview)
7. **Task 6** - Preview Screen (Shows results)
8. **Task 8** - Update Auth Flow (Connect everything)
9. **Task 10** - Loading States & Error Handling (Polish)
10. **Task 9** - Remove Old Flow (Cleanup)

---

## Notes:

- Each task should be completed and tested before moving to the next
- API routes should be tested with tools like Postman/Thunder Client
- UI components should match the reference HTML designs
- All async operations need proper error handling
- Progress tracking should update in real-time (polling every 2-3 seconds)

---

# Implementation Tasks: Canvas Editor

## Overview

Implementing a professional infinite canvas editor for manga/comic creation with proper rendering, pan/zoom, selection, manipulation, and performance optimizations. The canvas must properly display panels loaded from the database and provide intuitive editing tools.

---

## Task 11: Fix Canvas Rendering and Data Display

**Status:** ✅ COMPLETE  
**Priority:** CRITICAL (Must be done first)  
**Dependencies:** None

### Problem:

When the editor loads, panels from the database are not rendering correctly on the canvas. The layout is broken and panels may not be visible or positioned properly.

### Subtasks:

- [x] 11.1: Debug panel data loading in `use-project-restoration.ts`
  - Verify panels are loaded from database correctly
  - Check panel coordinates (x, y, width, height) are valid
  - Ensure imageUrl is properly set
  - Add console logging for debugging
- [x] 11.2: Fix canvas coordinate system in `manga-canvas.tsx`
  - Verify Stage dimensions match container
  - Check if canvasOffset is initialized correctly
  - Ensure zoom level starts at 1.0
  - Fix any coordinate transformation issues
- [x] 11.3: Fix panel positioning in `panel.tsx`
  - Verify Group x/y props use correct panel coordinates
  - Check if panels are within visible viewport
  - Ensure panel dimensions are rendered correctly
  - Fix image loading and display
- [x] 11.4: Add canvas viewport centering
  - Calculate center position for initial view
  - Center on first panel or page origin
  - Add "Fit to View" functionality
- [x] 11.5: Fix panel image loading
  - Add proper error handling for failed image loads
  - Show loading placeholder while image loads
  - Handle CORS issues with crossOrigin
  - Add retry mechanism for failed loads
- [x] 11.6: Add visual debugging tools
  - Show panel bounding boxes
  - Display panel coordinates on hover
  - Add canvas origin indicator (0,0 marker)
  - Show viewport boundaries
- [x] 11.7: Fix canvas background and page rendering
  - Properly render page backgrounds in paginated mode
  - Fix page separator positioning
  - Ensure white page background is visible
  - Add drop shadow for pages

**Files modified:**

- `components/canvas/manga-canvas.tsx` ✅
- `components/canvas/panel.tsx` ✅
- `lib/hooks/use-project-restoration.ts` ✅
- `app/editor/[projectId]/editor-client.tsx` ✅

**Success Criteria:** ✅ ALL MET

- ✅ Panels load and display correctly when editor opens
- ✅ Panel images are visible and properly sized
- ✅ Panels are positioned according to database coordinates
- ✅ Canvas is centered on content
- ✅ No console errors related to rendering
- ✅ Debug tools available for troubleshooting
- ✅ Loading and error states for images
- ✅ Automatic retry for failed image loads

**Implementation Notes:**

See `CANVAS_FIXES_SUMMARY.md` for detailed implementation documentation.

**Key Features Added:**

- Comprehensive debug logging throughout data loading
- Debug panel (toggle with 'D' key) showing canvas state and all panels
- Fit to View function to center and zoom to all content
- Canvas origin indicator (red/green axes at 0,0)
- Image loading states (gray placeholder)
- Image error states (red indicator)
- Automatic retry for failed images (3 attempts with exponential backoff)
- Removed fixed canvas container size for true infinite canvas
- Proper page background rendering with shadows

---

## Task 12: Implement Pan and Zoom Controls

**Status:** ⏳ Pending  
**Priority:** CRITICAL  
**Dependencies:** Task 11

### Subtasks:

- [ ] 12.1: Implement mouse wheel zoom
  - Zoom in/out with mouse wheel
  - Zoom toward cursor position (not center)
  - Clamp zoom between 0.1x and 3x
  - Smooth zoom transitions
- [ ] 12.2: Implement Space + Drag panning
  - Detect spacebar press to enter pan mode
  - Change cursor to grab/grabbing
  - Pan canvas by dragging
  - Prevent panel selection while panning
- [ ] 12.3: Implement trackpad gestures
  - Pinch-to-zoom on trackpad
  - Two-finger pan on trackpad
  - Smooth gesture handling
- [ ] 12.4: Add zoom controls UI
  - Zoom in/out buttons
  - Zoom percentage display
  - Reset zoom button (fit to view)
  - Keyboard shortcuts (Cmd/Ctrl + +/-)
- [ ] 12.5: Implement pan boundaries
  - Prevent panning too far from content
  - Add elastic bounce at boundaries
  - Or allow infinite panning (configurable)
- [ ] 12.6: Add zoom level presets
  - 25%, 50%, 100%, 150%, 200%
  - Fit to width
  - Fit to page
  - Fit selection
- [ ] 12.7: Persist zoom and pan state
  - Save to localStorage on change
  - Restore on page load
  - Per-project persistence

**Files to modify:**

- `components/canvas/manga-canvas.tsx`
- `components/canvas/canvas-toolbar.tsx`
- `lib/store/canvas-store.ts`

**Success Criteria:**

- Smooth zoom with mouse wheel toward cursor
- Space + drag pans the canvas
- Trackpad gestures work smoothly
- Zoom controls are accessible and functional
- State persists across page reloads

---

## Task 13: Improve Panel Selection System

**Status:** ⏳ Pending  
**Priority:** HIGH  
**Dependencies:** Task 11

### Subtasks:

- [ ] 13.1: Fix single panel selection
  - Click to select panel
  - Show selection border (blue, 3px)
  - Clear selection when clicking canvas
  - Update selection state correctly
- [ ] 13.2: Implement multi-select
  - Shift + Click to add/remove from selection
  - Cmd/Ctrl + Click for toggle
  - Show selection count indicator
- [ ] 13.3: Implement drag-to-select rectangle
  - Click and drag on empty canvas
  - Show selection rectangle (blue, dashed)
  - Select all panels intersecting rectangle
  - Clear previous selection (unless Shift held)
- [ ] 13.4: Add keyboard selection shortcuts
  - Cmd/Ctrl + A to select all
  - Escape to clear selection
  - Tab to cycle through panels
- [ ] 13.5: Add selection visual feedback
  - Selected panels have blue border
  - Show resize handles on selected panels
  - Dim non-selected panels (optional)
  - Show selection bounding box for multi-select
- [ ] 13.6: Fix selection state management
  - Ensure selectedPanelIds updates correctly
  - Sync with canvas-store
  - Handle edge cases (deleted panels, etc.)

**Files to modify:**

- `components/canvas/manga-canvas.tsx`
- `components/canvas/panel.tsx`
- `lib/store/canvas-store.ts`

**Success Criteria:**

- Single click selects panel
- Shift+click adds to selection
- Drag-to-select works smoothly
- Keyboard shortcuts work
- Visual feedback is clear

---

## Task 14: Enhance Panel Manipulation

**Status:** ⏳ Pending  
**Priority:** HIGH  
**Dependencies:** Task 11, Task 13

### Subtasks:

- [ ] 14.1: Improve panel dragging
  - Drag selected panels together
  - Show ghost/preview while dragging
  - Snap to grid (if enabled)
  - Update database on drag end
- [ ] 14.2: Add alignment guides
  - Show guides when panel aligns with others
  - Snap to alignment (edges, centers)
  - Configurable snap distance (5-10px)
  - Visual guide lines (red/blue)
- [ ] 14.3: Improve panel resizing
  - Resize from all 4 corners
  - Resize from edges (8 handles total)
  - Maintain aspect ratio (Shift key)
  - Show dimensions while resizing
- [ ] 14.4: Add keyboard nudging
  - Arrow keys move 1px
  - Shift + Arrow keys move 10px
  - Works with multi-select
  - Update database after nudge
- [ ] 14.5: Implement panel duplication
  - Cmd/Ctrl + D to duplicate
  - Offset duplicate by 20px
  - Copy all properties (prompt, bubbles, etc.)
  - Works with multi-select
- [ ] 14.6: Add panel deletion
  - Delete key to remove selected panels
  - Confirmation dialog (optional)
  - Update database
  - Undo support

**Files to modify:**

- `components/canvas/panel.tsx`
- `components/canvas/manga-canvas.tsx`
- `lib/store/canvas-store.ts`
- `lib/grid-utils.ts`

**Success Criteria:**

- Panels drag smoothly with snap-to-grid
- Alignment guides appear and work
- Resize handles work from all corners
- Keyboard nudging is responsive
- Duplication and deletion work correctly

---

## Task 15: Implement Speech Bubble Editor

**Status:** ⏳ Pending  
**Priority:** HIGH  
**Dependencies:** Task 11

### Subtasks:

- [ ] 15.1: Fix inline bubble editing
  - Double-click to edit text
  - Show textarea overlay at correct position
  - Handle zoom level in positioning
  - Save on Enter, cancel on Escape
- [ ] 15.2: Add bubble resize handles
  - Show 4 corner handles when selected
  - Resize bubble by dragging handles
  - Maintain minimum size (50x30px)
  - Update database on resize end
- [ ] 15.3: Implement bubble toolbar
  - Add "Add Bubble" button to toolbar
  - Click to place new bubble on panel
  - Default size and position
  - Auto-focus text for editing
- [ ] 15.4: Add bubble type selector
  - Dropdown for bubble types
  - Types: standard, shout, whisper, thought, narration
  - Visual preview of each type
  - Apply style changes immediately
- [ ] 15.5: Implement bubble deletion
  - Delete key when bubble selected
  - Backspace also works
  - Confirmation for non-empty bubbles
  - Update database
- [ ] 15.6: Add bubble text formatting
  - Font size selector
  - Bold/italic toggles
  - Text alignment (left/center/right)
  - Font family selector (manga fonts)
- [ ] 15.7: Improve bubble positioning
  - Drag to reposition
  - Snap to panel edges
  - Keep within panel bounds
  - Show position guides

**Files to modify:**

- `components/canvas/speech-bubble.tsx`
- `components/canvas/manga-canvas.tsx`
- `components/canvas/canvas-toolbar.tsx`
- `lib/store/canvas-store.ts`

**Success Criteria:**

- Double-click editing works smoothly
- Bubbles can be resized with handles
- Add bubble button creates new bubbles
- Bubble types can be changed
- Text formatting options work
- Bubbles stay within panel bounds

---

## Task 16: Add Context Menu System

**Status:** ⏳ Pending  
**Priority:** MEDIUM  
**Dependencies:** Task 13, Task 14

### Subtasks:

- [ ] 16.1: Create context menu component
  - Right-click menu component
  - Position at cursor location
  - Close on click outside
  - Keyboard navigation (arrow keys)
- [ ] 16.2: Add panel context menu
  - Right-click on panel shows menu
  - Options: Regenerate, Duplicate, Delete, Bring to Front, Send to Back
  - Disable options based on state
  - Execute actions on click
- [ ] 16.3: Add canvas context menu
  - Right-click on empty canvas
  - Options: Add Panel, Paste, Select All, Fit to View
  - Show at cursor position
- [ ] 16.4: Add bubble context menu
  - Right-click on bubble
  - Options: Edit Text, Change Type, Duplicate, Delete
  - Nested submenu for bubble types
- [ ] 16.5: Add multi-select context menu
  - Right-click with multiple panels selected
  - Options: Align, Distribute, Group, Delete All
  - Batch operations

**Files to create:**

- `components/canvas/context-menu.tsx`

**Files to modify:**

- `components/canvas/manga-canvas.tsx`
- `components/canvas/panel.tsx`
- `components/canvas/speech-bubble.tsx`

**Success Criteria:**

- Right-click shows appropriate menu
- Menu items execute correct actions
- Menu closes properly
- Keyboard navigation works
- Multi-select menu shows batch options

---

## Task 17: Implement Undo/Redo System

**Status:** ⏳ Pending  
**Priority:** MEDIUM  
**Dependencies:** Task 14

### Subtasks:

- [ ] 17.1: Create history store
  - Zustand store for undo/redo
  - Stack-based history (max 50 actions)
  - Action types: move, resize, delete, create, edit
- [ ] 17.2: Track panel operations
  - Record panel moves
  - Record panel resizes
  - Record panel deletions
  - Record panel creations
- [ ] 17.3: Track bubble operations
  - Record bubble text edits
  - Record bubble moves
  - Record bubble resizes
  - Record bubble deletions
- [ ] 17.4: Implement undo functionality
  - Cmd/Ctrl + Z to undo
  - Revert last action
  - Update canvas state
  - Update database
- [ ] 17.5: Implement redo functionality
  - Cmd/Ctrl + Shift + Z to redo
  - Reapply undone action
  - Update canvas state
  - Update database
- [ ] 17.6: Add history UI indicator
  - Show undo/redo buttons in toolbar
  - Disable when no history
  - Show action description on hover
  - History panel (optional)

**Files to create:**

- `lib/store/history-store.ts`

**Files to modify:**

- `lib/store/canvas-store.ts`
- `components/canvas/canvas-toolbar.tsx`
- `hooks/use-keyboard-shortcuts.ts`

**Success Criteria:**

- Undo reverts last action
- Redo reapplies undone action
- Keyboard shortcuts work
- History is limited to 50 actions
- UI buttons reflect history state

---

## Task 18: Implement Copy/Paste System

**Status:** ⏳ Pending  
**Priority:** MEDIUM  
**Dependencies:** Task 13

### Subtasks:

- [ ] 18.1: Implement copy functionality
  - Cmd/Ctrl + C to copy selected panels
  - Store panel data in clipboard store
  - Include all properties (position, size, prompt, bubbles)
  - Show "Copied" feedback
- [ ] 18.2: Implement paste functionality
  - Cmd/Ctrl + V to paste
  - Paste at cursor position or offset from original
  - Generate new IDs for pasted panels
  - Insert into database
- [ ] 18.3: Implement cut functionality
  - Cmd/Ctrl + X to cut
  - Copy to clipboard and delete originals
  - Show "Cut" feedback
- [ ] 18.4: Add duplicate shortcut
  - Cmd/Ctrl + D to duplicate
  - Offset by 20px from original
  - Works with multi-select
- [ ] 18.5: Handle clipboard state
  - Store in Zustand store (not system clipboard)
  - Clear on project change
  - Show paste option in context menu

**Files to create:**

- `lib/store/clipboard-store.ts`

**Files to modify:**

- `components/canvas/manga-canvas.tsx`
- `hooks/use-keyboard-shortcuts.ts`
- `lib/store/canvas-store.ts`

**Success Criteria:**

- Copy/paste works with keyboard shortcuts
- Pasted panels have new IDs
- Cut removes originals
- Duplicate offsets correctly
- Multi-select copy/paste works

---

## Task 19: Add Alignment and Distribution Tools

**Status:** ⏳ Pending  
**Priority:** MEDIUM  
**Dependencies:** Task 13, Task 14

### Subtasks:

- [ ] 19.1: Create alignment toolbar
  - Toolbar section for alignment tools
  - Icons for each alignment option
  - Enable only when 2+ panels selected
- [ ] 19.2: Implement horizontal alignment
  - Align left edges
  - Align horizontal centers
  - Align right edges
  - Update all selected panels
- [ ] 19.3: Implement vertical alignment
  - Align top edges
  - Align vertical centers
  - Align bottom edges
  - Update all selected panels
- [ ] 19.4: Implement horizontal distribution
  - Distribute evenly by left edges
  - Distribute evenly by centers
  - Distribute evenly by right edges
  - Requires 3+ panels
- [ ] 19.5: Implement vertical distribution
  - Distribute evenly by top edges
  - Distribute evenly by centers
  - Distribute evenly by bottom edges
  - Requires 3+ panels
- [ ] 19.6: Add alignment preview
  - Show preview before applying
  - Highlight affected panels
  - Undo support

**Files to create:**

- `components/canvas/alignment-toolbar.tsx`
- `lib/canvas-alignment.ts`

**Files to modify:**

- `components/canvas/canvas-toolbar.tsx`
- `lib/store/canvas-store.ts`

**Success Criteria:**

- Alignment tools appear when 2+ panels selected
- All alignment options work correctly
- Distribution requires 3+ panels
- Changes are saved to database
- Undo/redo works with alignment

---

## Task 20: Implement Canvas Performance Optimizations

**Status:** ⏳ Pending  
**Priority:** HIGH  
**Dependencies:** Task 11

### Subtasks:

- [ ] 20.1: Implement viewport culling
  - Calculate visible viewport bounds
  - Only render panels within viewport
  - Add buffer zone (200px) around viewport
  - Update on pan/zoom
- [ ] 20.2: Optimize image loading
  - Lazy load images as they enter viewport
  - Unload images when far from viewport
  - Use lower resolution for zoomed out view
  - Implement image cache
- [ ] 20.3: Debounce expensive operations
  - Debounce drag updates (16ms for 60fps)
  - Debounce resize updates
  - Debounce database saves (500ms)
  - Use requestAnimationFrame for smooth updates
- [ ] 20.4: Optimize Konva rendering
  - Use Konva.FastLayer for static content
  - Disable shadows when zoomed out
  - Reduce stroke width when zoomed out
  - Cache complex shapes
- [ ] 20.5: Add performance monitoring
  - FPS counter (dev mode)
  - Render time tracking
  - Memory usage monitoring
  - Console warnings for slow operations
- [ ] 20.6: Optimize selection rendering
  - Use single selection layer
  - Batch selection updates
  - Optimize selection rectangle drawing
- [ ] 20.7: Implement progressive loading
  - Load panels in batches
  - Show loading skeleton for pending panels
  - Prioritize visible panels
  - Background load off-screen panels

**Files to modify:**

- `components/canvas/manga-canvas.tsx`
- `components/canvas/panel.tsx`
- `lib/canvas-utils.ts` (create)

**Success Criteria:**

- Canvas maintains 60fps during interactions
- Only visible panels are rendered
- Images load progressively
- No lag with 30+ panels
- Memory usage stays reasonable

---

## Task 21: Add Mini-Map Navigator

**Status:** ⏳ Pending  
**Priority:** LOW  
**Dependencies:** Task 11, Task 12

### Subtasks:

- [ ] 21.1: Create mini-map component
  - Small canvas in corner (200x150px)
  - Shows entire project overview
  - Draggable/resizable
  - Toggle visibility
- [ ] 21.2: Render mini-map content
  - Show all panels as rectangles
  - Show current viewport as overlay
  - Update in real-time
  - Use simplified rendering
- [ ] 21.3: Implement mini-map interaction
  - Click to jump to location
  - Drag viewport rectangle to pan
  - Scroll to zoom
- [ ] 21.4: Add mini-map controls
  - Toggle button in toolbar
  - Resize handle
  - Position presets (corners)
  - Opacity slider

**Files to create:**

- `components/canvas/mini-map.tsx`

**Files to modify:**

- `components/canvas/manga-canvas.tsx`
- `components/canvas/canvas-toolbar.tsx`

**Success Criteria:**

- Mini-map shows project overview
- Viewport rectangle is visible
- Click to jump works
- Drag viewport to pan works
- Performance is good (no lag)

---

## Task 22: Implement Keyboard Shortcuts System

**Status:** ⏳ Pending  
**Priority:** MEDIUM  
**Dependencies:** Task 13, Task 14, Task 17, Task 18

### Subtasks:

- [ ] 22.1: Create keyboard shortcuts hook
  - Centralized keyboard event handler
  - Support for modifier keys (Cmd/Ctrl, Shift, Alt)
  - Prevent conflicts with browser shortcuts
  - Context-aware shortcuts
- [ ] 22.2: Implement canvas shortcuts
  - Space: Pan mode
  - Cmd/Ctrl + +/-: Zoom in/out
  - Cmd/Ctrl + 0: Reset zoom
  - Cmd/Ctrl + A: Select all
  - Escape: Clear selection
  - Delete/Backspace: Delete selected
- [ ] 22.3: Implement editing shortcuts
  - Cmd/Ctrl + C: Copy
  - Cmd/Ctrl + V: Paste
  - Cmd/Ctrl + X: Cut
  - Cmd/Ctrl + D: Duplicate
  - Cmd/Ctrl + Z: Undo
  - Cmd/Ctrl + Shift + Z: Redo
- [ ] 22.4: Implement navigation shortcuts
  - Arrow keys: Nudge selected panels
  - Shift + Arrow: Nudge 10px
  - Tab: Cycle through panels
  - Shift + Tab: Cycle backwards
- [ ] 22.5: Create shortcuts help modal
  - Press ? to show shortcuts
  - Categorized list
  - Searchable
  - Platform-specific (Mac/Windows)
- [ ] 22.6: Add visual shortcut hints
  - Show shortcuts in tooltips
  - Show shortcuts in context menus
  - Highlight active shortcuts

**Files to modify:**

- `hooks/use-keyboard-shortcuts.ts`
- `components/help/shortcuts-modal.tsx`
- `components/canvas/manga-canvas.tsx`

**Success Criteria:**

- All keyboard shortcuts work
- No conflicts with browser shortcuts
- Help modal shows all shortcuts
- Shortcuts are platform-aware
- Visual hints are helpful

---

## Task 23: Add Layer Management UI

**Status:** ⏳ Pending  
**Priority:** LOW  
**Dependencies:** Task 11

### Subtasks:

- [ ] 23.1: Create layers panel in right sidebar
  - List all panels and bubbles
  - Show thumbnails
  - Show layer names
  - Collapsible sections
- [ ] 23.2: Implement layer reordering
  - Drag to reorder layers
  - Update z-index in database
  - Visual feedback during drag
- [ ] 23.3: Add layer visibility toggles
  - Eye icon to show/hide
  - Hide panel from canvas
  - Don't delete from database
- [ ] 23.4: Add layer locking
  - Lock icon to prevent editing
  - Locked panels can't be moved/resized
  - Visual indicator on canvas
- [ ] 23.5: Implement layer actions
  - Right-click menu on layer
  - Duplicate, delete, rename
  - Bring to front, send to back

**Files to create:**

- `components/canvas/layers-panel.tsx`

**Files to modify:**

- `components/editor/editor-sidebar-right.tsx`
- `lib/store/canvas-store.ts`

**Success Criteria:**

- Layers panel shows all panels
- Drag to reorder works
- Visibility toggle works
- Lock prevents editing
- Layer actions work correctly

---

## Recommended Implementation Order:

### Phase 1: Critical Fixes (Week 1)

1. **Task 11** - Fix Canvas Rendering (MUST DO FIRST)
2. **Task 12** - Pan and Zoom Controls
3. **Task 13** - Panel Selection System
4. **Task 20** - Performance Optimizations

### Phase 2: Core Editing (Week 2)

5. **Task 14** - Panel Manipulation
6. **Task 15** - Speech Bubble Editor
7. **Task 22** - Keyboard Shortcuts
8. **Task 16** - Context Menu System

### Phase 3: Advanced Features (Week 3)

9. **Task 17** - Undo/Redo System
10. **Task 18** - Copy/Paste System
11. **Task 19** - Alignment Tools

### Phase 4: Polish (Week 4)

12. **Task 21** - Mini-Map Navigator
13. **Task 23** - Layer Management UI

---

## Testing Checklist:

### Canvas Rendering

- [ ] Panels load and display correctly
- [ ] Images load without errors
- [ ] Canvas is centered on content
- [ ] No console errors

### Pan and Zoom

- [ ] Mouse wheel zoom works
- [ ] Space + drag pans
- [ ] Trackpad gestures work
- [ ] Zoom controls work
- [ ] State persists

### Selection

- [ ] Single click selects
- [ ] Multi-select works
- [ ] Drag-to-select works
- [ ] Keyboard shortcuts work
- [ ] Visual feedback is clear

### Manipulation

- [ ] Drag panels works
- [ ] Resize panels works
- [ ] Keyboard nudging works
- [ ] Snap-to-grid works
- [ ] Alignment guides appear

### Speech Bubbles

- [ ] Double-click editing works
- [ ] Resize handles work
- [ ] Add bubble works
- [ ] Delete bubble works
- [ ] Bubble types work

### Performance

- [ ] 60fps during interactions
- [ ] No lag with 30+ panels
- [ ] Images load progressively
- [ ] Memory usage reasonable

### Keyboard Shortcuts

- [ ] All shortcuts work
- [ ] No browser conflicts
- [ ] Help modal shows shortcuts
- [ ] Platform-aware

---

## Notes:

- **Task 11 is CRITICAL** - Nothing else will work properly until rendering is fixed
- Focus on 60fps performance throughout
- Test with real project data (30+ panels)
- Use React DevTools Profiler to identify bottlenecks
- Consider using Web Workers for heavy computations
- Implement error boundaries for canvas crashes
- Add comprehensive logging for debugging
- Test on different screen sizes and resolutions
- Ensure accessibility (keyboard navigation, screen readers)
- Document all keyboard shortcuts
