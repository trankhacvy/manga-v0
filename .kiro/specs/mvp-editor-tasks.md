# MVP Editor Implementation Tasks

## Overview

Complete rewrite of the manga/comic editor with focus on core editing experience. The editor loads generated manga projects and provides an intuitive interface for editing panels, bubbles, and using AI to regenerate content.

**User Flow:** User navigates from preview page → `/editor/[projectId]` → Editor loads project data → User edits manga using canvas, AI chat, and libraries.

---

## Phase 1: Foundation & Canvas (Week 1)

### Task 1: Set Up Editor Layout Structure

**Priority:** CRITICAL  
**Status:** ⏳ Pending  
**Dependencies:** None

#### Subtasks:

- [x] 1.1: Create new editor layout component structure
  - Create `app/editor/[projectId]/editor-layout.tsx`
  - Define 3-column layout: Left sidebar (chat), Center canvas, Right sidebar (libraries)
  - Add top bar and bottom bar containers
  - Use CSS Grid or Flexbox for responsive layout
  - Set proper z-index layers for overlays
- [x] 1.2: Create top bar component
  - Create `components/editor/editor-top-bar.tsx`
  - Add project title (editable on click)
  - Add save indicator ("Saved" / "Saving...")
  - Add "Back to Preview" button
  - Add "Export" dropdown (PDF, PNG)
  - Add model selector dropdown (Flux Manga 1.1, Pony XL, SD3.5)
  - Wire up navigation and actions
- [x] 1.3: Create bottom bar component
  - Create `components/editor/editor-bottom-bar.tsx`
  - Add global prompt input field
  - Add Cmd+K shortcut to focus input
  - Add quick action buttons: Regenerate, Vary, Generate
  - Add generation progress bar
  - Style with fixed positioning at bottom

**Files to create:**

- `app/editor/[projectId]/editor-layout.tsx`
- `components/editor/editor-top-bar.tsx`
- `components/editor/editor-bottom-bar.tsx`

**Success Criteria:**

- Layout renders with 3 columns
- Top and bottom bars are fixed and visible
- No layout shifts or overflow issues
- Responsive on different screen sizes

---

### Task 2: Implement Data Loading and State Management

**Priority:** CRITICAL  
**Status:** ⏳ Pending  
**Dependencies:** Task 1

#### Subtasks:

- [x] 2.1: Create editor state store
  - Create `lib/store/editor-store.ts` using Zustand
  - Define state: project, pages, panels, characters, selectedPanelIds
  - Add actions: loadProject, updatePanel, selectPanel, etc.
  - Add loading and error states
- [x] 2.2: Create data loading hook
  - Create `lib/hooks/use-editor-data.ts`
  - Fetch project, pages, panels, characters from database
  - Handle loading states
  - Handle errors with retry logic
  - Update editor store with loaded data
- [x] 2.3: Implement auto-save functionality
  - Create `lib/hooks/use-auto-save.ts`
  - Debounce saves (2-3 seconds after last change)
  - Save panel positions, bubble edits, prompt changes
  - Update "Saved" indicator in top bar
  - Handle save errors gracefully

**Files to create:**

- `lib/store/editor-store.ts`
- `lib/hooks/use-editor-data.ts`
- `lib/hooks/use-auto-save.ts`

**Success Criteria:**

- Project data loads on editor mount
- Store updates correctly
- Auto-save triggers after edits
- Loading and error states display properly

---

### Task 3: Build Infinite Canvas Component

**Priority:** CRITICAL  
**Status:** ⏳ Pending  
**Dependencies:** Task 2

#### Subtasks:

- [x] 3.1: Create canvas container component
  - Create `components/editor/editor-canvas.tsx`
  - Use React-Konva for canvas rendering
  - Set up Stage and Layer components
  - Handle container sizing (fill available space)
  - Add canvas background (light gray or white)
- [x] 3.2: Implement pan and zoom controls
  - Add mouse wheel zoom (zoom toward cursor)
  - Add Space + Drag for panning
  - Clamp zoom between 0.1x and 3x
  - Store zoom and pan offset in canvas store
  - Add smooth transitions
- [x] 3.3: Add zoom controls UI
  - Create `components/editor/canvas-controls.tsx`
  - Add zoom in/out buttons
  - Add zoom percentage display
  - Add "Fit to View" button
  - Add "Reset Zoom" button (100%)
  - Position in bottom-right of canvas
- [x] 3.4: Implement viewport centering
  - Calculate bounding box of all panels
  - Center viewport on content on initial load
  - Implement "Fit to View" to show all panels
  - Handle empty canvas (no panels)

**Files to create:**

- `components/editor/editor-canvas.tsx`
- `components/editor/canvas-controls.tsx`
- `lib/store/canvas-store.ts`

**Success Criteria:**

- Canvas renders without errors
- Pan and zoom work smoothly
- Zoom controls are functional
- Canvas centers on content on load
- 60fps performance during interactions

---

### Task 4: Render Panels on Canvas

**Priority:** CRITICAL  
**Status:** ⏳ Pending  
**Dependencies:** Task 3

#### Subtasks:

- [x] 4.1: Create panel component
  - Create `components/editor/panel-card.tsx`
  - Use Konva Group for panel container
  - Render panel image using Konva Image
  - Show panel border (1px gray)
  - Handle panel coordinates (x, y, width, height)
- [x] 4.2: Implement panel image loading
  - Load images from panel.imageUrl
  - Show loading placeholder (gray rectangle with spinner)
  - Show error state (red border with retry icon)
  - Handle CORS with crossOrigin="anonymous"
  - Add retry mechanism (3 attempts with exponential backoff)
- [x] 4.3: Add panel selection visual feedback
  - Show blue border (3px) when panel is selected
  - Show resize handles on corners when selected
  - Dim non-selected panels slightly (optional)
  - Update visual state based on selectedPanelIds from store
- [x] 4.4: Implement panel click selection
  - Click panel to select (single selection)
  - Shift + Click to add to selection (multi-select)
  - Click empty canvas to clear selection
  - Update selectedPanelIds in store

**Files to create:**

- `components/editor/panel-card.tsx`

**Success Criteria:**

- All panels render at correct positions
- Panel images load and display
- Loading and error states work
- Selection visual feedback is clear
- Click selection works correctly

---

## Phase 2: Core Editing (Week 2)

### Task 5: Implement Panel Manipulation

**Priority:** HIGH  
**Status:** ⏳ Pending  
**Dependencies:** Task 4

#### Subtasks:

- [x] 5.1: Implement panel dragging
  - Enable drag on selected panels
  - Drag all selected panels together
  - Show ghost/preview while dragging
  - Update panel positions in store on drag end
  - Save to database after drag
- [x] 5.2: Implement panel resizing
  - Show 4 corner resize handles on selected panel
  - Drag handles to resize panel
  - Maintain minimum size (100x100px)
  - Update panel dimensions in store
  - Save to database after resize
- [x] 5.3: Add keyboard nudging
  - Arrow keys move selected panels 1px
  - Shift + Arrow keys move 10px
  - Works with multi-select
  - Update positions in store and database
- [x] 5.4: Implement panel deletion
  - Delete key removes selected panels
  - Show confirmation dialog if multiple panels
  - Remove from database
  - Update store and re-render canvas

**Files to modify:**

- `components/editor/panel-card.tsx`
- `lib/store/editor-store.ts`

**Success Criteria:**

- Panels can be dragged smoothly
- Resize handles work from all corners
- Keyboard nudging is responsive
- Deletion works with confirmation
- All changes persist to database

---

### Task 6: Build Speech Bubble Editor

**Priority:** HIGH  
**Status:** ⏳ Pending  
**Dependencies:** Task 4

#### Subtasks:

- [x] 6.1: Create bubble component
  - Create `components/editor/bubble-editor.tsx`
  - Render bubbles using Konva Group
  - Show bubble shape (rounded rectangle, cloud, spiky)
  - Render text inside bubble
  - Position relative to parent panel
- [x] 6.2: Implement bubble text editing
  - Double-click bubble to edit text
  - Show HTML textarea overlay at bubble position
  - Handle zoom level in positioning
  - Save on Enter, cancel on Escape
  - Update bubble text in store and database
- [x] 6.3: Add bubble manipulation
  - Drag to reposition bubble within panel
  - Show 4 corner resize handles when selected
  - Resize bubble by dragging handles
  - Maintain minimum size (50x30px)
  - Keep bubble within panel bounds
- [x] 6.4: Implement add/delete bubble
  - Add "Add Bubble" button to bottom bar
  - Click to place new bubble on selected panel
  - Default size (150x80px) and center position
  - Delete key removes selected bubble
  - Update database on add/delete

**Files to create:**

- `components/editor/bubble-editor.tsx`

**Files to modify:**

- `components/editor/panel-card.tsx`
- `components/editor/editor-bottom-bar.tsx`

**Success Criteria:**

- Bubbles render correctly on panels
- Double-click editing works smoothly
- Drag and resize work
- Add/delete functionality works
- Changes persist to database

---

### Task 7: Integrate AI Chat Panel

**Priority:** HIGH  
**Status:** ✅ Complete  
**Dependencies:** Task 2, Task 4

#### Subtasks:

- [x] 7.1: Create AI chat panel component
  - Create `components/editor/editor-chat-panel.tsx`
  - Add chat message list (scrollable)
  - Add message input at bottom
  - Style as left sidebar panel
  - Show user and AI messages with different styles
- [x] 7.2: Implement chat message sending
  - Send button and Enter key to submit
  - Add message to chat history
  - Show loading indicator while AI responds
  - Display AI response when received
  - Handle errors with retry option
- [x] 7.3: Add context awareness
  - Include selected panel IDs in chat context
  - Include project characters in context
  - Include current page in context
  - Show context pills above input (e.g., "Panel 3 selected")
- [x] 7.4: Create AI chat API route
  - Create `app/api/editor/chat/route.ts`
  - Accept message, projectId, selectedPanelIds, context
  - Use LLM to understand user intent
  - Return AI response with suggested actions
  - Handle errors gracefully
- [x] 7.5: Implement AI action execution
  - Parse AI response for actions (regenerate, edit, add character)
  - Show action buttons in AI message
  - Execute actions when user clicks
  - Update canvas and store
  - Show success/error feedback

**Files to create:**

- `components/editor/editor-chat-panel.tsx`
- `app/api/editor/chat/route.ts`

**Success Criteria:**

- Chat panel displays in left sidebar
- Messages send and receive correctly
- Context awareness works
- AI understands editing commands
- Actions execute and update canvas

---

### Task 8: Build Quick Actions Bar

**Priority:** HIGH  
**Status:** ✅ Complete  
**Dependencies:** Task 4

#### Subtasks:

- [x] 8.1: Implement global prompt input
  - Add prompt input to bottom bar
  - Cmd+K shortcut to focus input
  - @handle autocomplete for characters
  - Show character suggestions dropdown
  - Pre-fill with selected panel context
- [x] 8.2: Create regenerate action
  - "Regenerate" button in bottom bar
  - Enabled only when panel(s) selected
  - Use prompt from input or panel's existing prompt
  - Call generation API
  - Show progress in panel
  - Update panel image when complete
- [x] 8.3: Create vary action
  - "Vary" button creates variation of selected panel
  - Keep same prompt but add variation seed
  - Generate new version
  - Show as new panel or replace existing
  - User can choose which to keep
- [x] 8.4: Create generate new panel action
  - "Generate" button creates new panel
  - Use prompt from input
  - Place new panel on canvas (next to selected or at end)
  - Show loading state
  - Add to database when complete
- [x] 8.5: Add generation progress indicator
  - Show progress bar in bottom bar
  - Display percentage and estimated time
  - Show which panel is generating
  - Allow cancellation (optional)

**Files to modify:**

- `components/editor/editor-bottom-bar.tsx`

**Files to create:**

- `app/api/editor/panels/regenerate/route.ts`
- `app/api/editor/panels/generate/route.ts`

**Success Criteria:**

- Prompt input works with Cmd+K
- @handle autocomplete functions
- Regenerate updates selected panel
- Vary creates variation
- Generate creates new panel
- Progress indicator shows status

---

## Phase 3: Libraries & Navigation (Week 3)

### Task 9: Build Character Library

**Priority:** HIGH  
**Status:** ⏳ Pending  
**Dependencies:** Task 2

#### Subtasks:

- [x] 9.1: Create character library component
  - Create `components/editor/character-library.tsx`
  - Display grid of character cards
  - Show character thumbnail, name, and @handle
  - Style as right sidebar section
  - Make cards draggable
- [x] 9.2: Implement character card display
  - Create `components/editor/character-card.tsx`
  - Show character image (front view)
  - Show name and @handle
  - Show "In Panel" indicator if character in selected panel
  - Click to view character details (modal)
- [x] 9.3: Add drag-to-canvas functionality
  - Enable drag on character cards
  - Show drag preview
  - Drop on panel to add character @handle
  - Update panel's characterHandles array
  - Save to database
- [x] 9.4: Create character details modal
  - Show full character sheet
  - Display turnaround views
  - Display expressions library
  - Show @handle and description
  - Close button and Escape key to close

**Files to create:**

- `components/editor/character-library.tsx`
- `components/editor/character-card.tsx`
- `components/editor/character-details-modal.tsx`

**Success Criteria:**

- Character library displays all project characters
- Cards show correct information
- Drag-to-canvas adds character to panel
- Details modal shows full character info
- Changes persist to database

---

### Task 10: Build Page Navigator

**Priority:** MEDIUM  
**Status:** ✅ Complete  
**Dependencies:** Task 2, Task 4

#### Subtasks:

- [x] 10.1: Create page navigator component
  - Create `components/editor/page-navigator.tsx`
  - Display vertical list of page thumbnails
  - Show page numbers
  - Highlight current page
  - Style as left sidebar section (below chat)
- [x] 10.2: Implement page thumbnail generation
  - Generate thumbnail from page panels
  - Use canvas to composite panel images
  - Cache thumbnails
  - Update when panels change
  - Show loading state while generating
- [x] 10.3: Add page navigation
  - Click thumbnail to jump to page
  - Scroll canvas to show page
  - Update current page indicator
  - Smooth scroll animation
- [x] 10.4: Add page management actions
  - "Add Page" button at bottom
  - Delete page button (with confirmation)
  - Reorder pages (drag to reorder)
  - Update database on changes

**Files to create:**

- `components/editor/page-navigator.tsx`
- `lib/utils/thumbnail-generator.ts`

**Success Criteria:**

- Page navigator shows all pages
- Thumbnails display correctly
- Click to jump works
- Add/delete/reorder pages work
- Changes persist to database

---

### Task 11: Build Layout Templates Selector

**Priority:** MEDIUM  
**Status:** ✅ Complete  
**Dependencies:** Task 4

#### Subtasks:

- [x] 11.1: Create layout templates component
  - Create `components/editor/layout-templates.tsx`
  - Display grid of layout template thumbnails
  - Show template names (4-koma, Standard Grid, Action Spread, Webtoon)
  - Style as right sidebar section
  - Highlight selected template
- [x] 11.2: Define layout templates
  - Create `lib/constants/layout-templates.ts` (already exists as `lib/layout-templates.ts`)
  - Define 6-8 common manga layouts (6 layouts defined)
  - Each template has panel positions and sizes
  - Include preview thumbnail for each
- [x] 11.3: Implement template application
  - Click template to apply to current page
  - Show confirmation if page has existing panels
  - Create new panels based on template
  - Position panels according to template
  - Save to database
- [x] 11.4: Add custom layout option
  - "Custom" template option (users can manually position panels)
  - Allows free-form panel placement
  - No automatic positioning

**Files to create:**

- `components/editor/layout-templates.tsx`
- `lib/constants/layout-templates.ts`

**Success Criteria:**

- Template selector displays all layouts
- Click to apply creates panels
- Confirmation works for existing panels
- Panels position correctly
- Changes persist to database

---

### Task 12: Build Bubble Styles Selector

**Priority:** MEDIUM  
**Status:** ✅ Complete  
**Dependencies:** Task 6

#### Subtasks:

- [x] 12.1: Create bubble styles component
  - Create `components/editor/bubble-styles.tsx`
  - Display grid of bubble type options
  - Show visual preview of each type
  - Types: Standard, Shout, Whisper, Thought, Narration
  - Style as right sidebar section
- [x] 12.2: Implement bubble type selection
  - Click bubble type to apply to selected bubble
  - Update bubble.type in store
  - Re-render bubble with new style
  - Save to database
- [x] 12.3: Add bubble style rendering
  - Standard: rounded rectangle
  - Shout: spiky edges
  - Whisper: dashed border
  - Thought: cloud shape
  - Narration: rectangular box
  - Update bubble-editor.tsx to render different styles

**Files to create:**

- `components/editor/bubble-styles.tsx`

**Files to modify:**

- `components/editor/bubble-editor.tsx`

**Success Criteria:**

- Bubble styles selector displays all types
- Click to apply changes bubble style
- Different bubble types render correctly
- Changes persist to database

---

## Phase 4: Polish & Integration (Week 4)

### Task 13: Build Panel Inspector

**Priority:** MEDIUM  
**Status:** ✅ Complete  
**Dependencies:** Task 4

#### Subtasks:

- [x] 13.1: Create panel inspector component
  - Create `components/editor/panel-inspector.tsx`
  - Display details of selected panel
  - Show in right sidebar (below character library)
  - Hide when no panel selected
- [x] 13.2: Display panel information
  - Show panel prompt (editable textarea)
  - Show character @handles (chips with remove button)
  - Show style locks (chips with remove button)
  - Show image dimensions
  - Show generation timestamp
- [x] 13.3: Implement panel editing
  - Edit prompt directly in inspector
  - Add/remove character @handles
  - Add/remove style locks
  - Save changes to database
  - Update canvas when changes saved
- [x] 13.4: Add character @handle selector
  - Dropdown to add character to panel
  - Shows all project characters
  - Click to add @handle to panel
  - Update panel's characterHandles array

**Files to create:**

- `components/editor/panel-inspector.tsx`

**Success Criteria:**

- Inspector shows selected panel details
- All fields are editable
- Changes save to database
- Canvas updates when changes saved

---

### Task 14: Implement Keyboard Shortcuts

**Priority:** MEDIUM  
**Status:** ✅ Complete  
**Dependencies:** Task 4, Task 5, Task 6

#### Subtasks:

- [x] 14.1: Create keyboard shortcuts hook
  - Create `lib/hooks/use-keyboard-shortcuts.ts`
  - Listen for keyboard events globally
  - Handle modifier keys (Cmd/Ctrl, Shift, Alt)
  - Prevent conflicts with browser shortcuts
  - Context-aware (different shortcuts in different modes)
- [x] 14.2: Implement canvas shortcuts
  - Space: Enter pan mode (change cursor)
  - Cmd/Ctrl + K: Focus global prompt input
  - Escape: Clear selection
  - Delete/Backspace: Delete selected panels/bubbles
- [x] 14.3: Implement editing shortcuts
  - Cmd/Ctrl + C: Copy selected panels
  - Cmd/Ctrl + V: Paste panels
  - Cmd/Ctrl + D: Duplicate selected panels
  - Arrow keys: Nudge selected panels 1px
  - Shift + Arrow: Nudge 10px
- [x] 14.4: Create shortcuts help modal
  - Create `components/help/shortcuts-modal.tsx`
  - Press ? to show modal
  - Display all shortcuts in categorized list
  - Platform-specific (show Cmd on Mac, Ctrl on Windows)
  - Close with Escape or click outside

**Files created:**

- `lib/hooks/use-keyboard-shortcuts.ts` - Consolidated keyboard shortcuts hook
- `lib/store/clipboard-store.ts` - Clipboard store for copy/paste operations
- `components/help/shortcuts-modal.tsx` - Already existed, updated with new shortcuts

**Success Criteria:**

- ✅ All keyboard shortcuts work
- ✅ No conflicts with browser shortcuts
- ✅ Help modal shows all shortcuts
- ✅ Shortcuts are platform-aware
- ✅ Copy/paste/duplicate functionality implemented
- ✅ Toast notifications for user feedback

---

### Task 15: Add Loading and Error States

**Priority:** MEDIUM  
**Status:** ✅ Complete  
**Dependencies:** All previous tasks

#### Subtasks:

- [x] 15.1: Create loading states
  - Show skeleton loader while project loads
  - Show spinner in panels while images load
  - Show progress bar during generation
  - Show loading overlay for long operations
  - Disable interactions during loading
- [x] 15.2: Create error states
  - Show error message if project fails to load
  - Show error indicator on panels with failed images
  - Show error toast for failed operations
  - Add retry buttons for failed operations
  - Log errors to console for debugging
- [x] 15.3: Create toast notification system
  - Integrated Sonner for toast notifications
  - Show success toasts (green)
  - Show error toasts (red)
  - Show info toasts (blue)
  - Auto-dismiss after 3-5 seconds
  - Stack multiple toasts
- [x] 15.4: Add empty states
  - Show empty state when no panels on page
  - Show empty state when no characters in project
  - Show empty state when no pages in project
  - Include helpful text and action buttons

**Files created:**

- `components/ui/loading-overlay.tsx` - Loading overlay for long operations
- `components/editor/empty-states.tsx` - Empty state components

**Files modified:**

- `app/editor/[projectId]/editor-layout.tsx` - Integrated Sonner toasts, replaced custom toast system
- `components/editor/panel-card.tsx` - Added toast notifications for image load errors
- `lib/hooks/use-editor-data.ts` - Added toast notifications for data load errors

**Success Criteria:**

- ✅ Loading states display during async operations
- ✅ Error states show helpful messages with retry buttons
- ✅ Toast notifications work correctly using Sonner
- ✅ Empty states guide users to take action

---

### Task 16: Implement Real-time Generation Updates

**Priority:** HIGH  
**Status:** ⏳ Pending  
**Dependencies:** Task 4, Task 8

#### Subtasks:

- [ ] 16.1: Set up real-time subscription
  - Use Supabase Realtime or polling
  - Subscribe to panel updates for current project
  - Listen for image_url changes
  - Update store when changes detected
- [ ] 16.2: Handle generation progress
  - Show progress indicator on generating panel
  - Display percentage and estimated time
  - Update in real-time as generation progresses
  - Show completion animation
- [ ] 16.3: Update canvas on completion
  - Load new image when generation completes
  - Fade in new image smoothly
  - Remove loading indicator
  - Show success toast
- [ ] 16.4: Handle generation failures
  - Show error state on panel
  - Display error message
  - Add retry button
  - Log error details

**Files to modify:**

- `lib/hooks/use-editor-data.ts`
- `components/editor/panel-card.tsx`

**Files to create:**

- `lib/hooks/use-realtime-updates.ts`

**Success Criteria:**

- Canvas updates automatically when generation completes
- No page refresh needed
- Progress shows in real-time
- Errors handled gracefully

---

### Task 17: Add Export Functionality

**Priority:** MEDIUM  
**Status:** ⏳ Pending  
**Dependencies:** Task 1, Task 4

#### Subtasks:

- [ ] 17.1: Create export API route
  - Create `app/api/editor/export/route.ts`
  - Accept projectId and format (PDF, PNG)
  - Generate export file
  - Return download URL
  - Handle errors
- [ ] 17.2: Implement PDF export
  - Use library like jsPDF or PDFKit
  - Composite all pages into single PDF
  - Include panels and bubbles
  - Set proper page dimensions
  - Add metadata (title, author)
- [ ] 17.3: Implement PNG export
  - Export each page as separate PNG
  - High resolution (300dpi)
  - Include panels and bubbles
  - Zip multiple pages
  - Return zip file
- [ ] 17.4: Add export UI
  - Export dropdown in top bar
  - Show format options (PDF, PNG)
  - Show loading state during export
  - Download file when ready
  - Show success toast

**Files to create:**

- `app/api/editor/export/route.ts`
- `lib/utils/export-pdf.ts`
- `lib/utils/export-png.ts`

**Success Criteria:**

- PDF export generates correctly
- PNG export creates high-res images
- Download works in browser
- Loading states display
- Errors handled gracefully

---

### Task 18: Implement Copy/Paste Panels

**Priority:** LOW  
**Status:** ✅ Complete  
**Dependencies:** Task 5

#### Subtasks:

- [x] 18.1: Create clipboard store
  - Create `lib/store/clipboard-store.ts`
  - Store copied panel data
  - Include all properties (position, size, prompt, bubbles)
  - Clear on project change
- [x] 18.2: Implement copy functionality
  - Cmd/Ctrl + C to copy selected panels
  - Store panel data in clipboard store
  - Show "Copied" toast
  - Support multi-select copy
- [x] 18.3: Implement paste functionality
  - Cmd/Ctrl + V to paste
  - Paste at cursor position or offset from original
  - Generate new IDs for pasted panels
  - Insert into database
  - Show "Pasted" toast
- [x] 18.4: Implement duplicate shortcut
  - Cmd/Ctrl + D to duplicate selected panels
  - Offset by 20px from original
  - Works with multi-select
  - Insert into database

**Files created:**

- `lib/store/clipboard-store.ts` - Clipboard store with copy/paste/duplicate functionality

**Files modified:**

- `lib/hooks/use-keyboard-shortcuts.ts` - Integrated copy/paste/duplicate keyboard shortcuts

**Success Criteria:**

- ✅ Copy/paste works with keyboard shortcuts
- ✅ Pasted panels have new IDs
- ✅ Duplicate offsets correctly
- ✅ Multi-select copy/paste works
- ✅ Toast notifications for user feedback

---

### Task 19: Add Undo/Redo System

**Priority:** LOW  
**Status:** ✅ Complete  
**Dependencies:** Task 5, Task 6

#### Subtasks:

- [x] 19.1: Create history store
  - Create `lib/store/history-store.ts`
  - Stack-based history (max 50 actions)
  - Action types: move, resize, delete, create, edit
  - Store before and after states
- [x] 19.2: Track panel operations
  - Record panel moves
  - Record panel resizes
  - Record panel deletions
  - Record panel creations
  - Record prompt edits
- [x] 19.3: Track bubble operations
  - Record bubble text edits
  - Record bubble moves
  - Record bubble resizes
  - Record bubble deletions
  - Record bubble creations
- [x] 19.4: Implement undo functionality
  - Cmd/Ctrl + Z to undo
  - Revert last action
  - Update canvas state
  - Update database
  - Show "Undone" toast
- [x] 19.5: Implement redo functionality
  - Cmd/Ctrl + Shift + Z to redo
  - Reapply undone action
  - Update canvas state
  - Update database
  - Show "Redone" toast

**Files created:**

- `lib/store/history-store.ts` - Complete history tracking system with undo/redo
- `lib/hooks/use-panel-operations.ts` - Helper hook for panel operations with automatic history tracking

**Files modified:**

- `lib/hooks/use-keyboard-shortcuts.ts` - Added Cmd/Ctrl+Z for undo and Cmd/Ctrl+Shift+Z for redo
- `components/help/shortcuts-modal.tsx` - Added undo/redo shortcuts to help modal

**Success Criteria:**

- ✅ Undo reverts last action
- ✅ Redo reapplies undone action
- ✅ Keyboard shortcuts work (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
- ✅ History limited to 50 actions
- ✅ Changes persist to database
- ✅ Supports panel operations (move, resize, delete, create, edit)
- ✅ Supports bubble operations (edit, move, resize, delete, create)

---

## Testing & Quality Assurance

### Task 20: Testing and Bug Fixes

**Priority:** HIGH  
**Status:** ⏳ Pending  
**Dependencies:** All previous tasks

#### Subtasks:

- [ ] 20.1: Test data loading
  - Test with projects of different sizes (1-30 pages)
  - Test with missing data (no characters, no panels)
  - Test with corrupted data
  - Test loading performance
- [ ] 20.2: Test canvas interactions
  - Test pan and zoom on different devices
  - Test with 30+ panels (performance)
  - Test selection (single, multi, drag-to-select)
  - Test drag and resize
  - Verify 60fps performance
- [ ] 20.3: Test AI integration
  - Test chat with various commands
  - Test regenerate with different prompts
  - Test generation progress updates
  - Test error handling
- [ ] 20.4: Test keyboard shortcuts
  - Test all shortcuts on Mac and Windows
  - Verify no conflicts with browser shortcuts
  - Test in different contexts (canvas, chat, inspector)
- [ ] 20.5: Test auto-save
  - Verify saves trigger after edits
  - Test save indicator updates
  - Test with rapid edits (debouncing)
  - Test error handling
- [ ] 20.6: Test responsive design
  - Test on different screen sizes
  - Test on tablet and mobile (if supported)
  - Verify layout doesn't break
  - Test touch interactions
- [ ] 20.7: Fix identified bugs
  - Create bug list from testing
  - Prioritize critical bugs
  - Fix bugs systematically
  - Re-test after fixes

**Success Criteria:**

- All features work as expected
- No critical bugs
- Performance meets requirements (60fps, <2s load)
- Works on different browsers and devices

---

## Implementation Order Summary

### Week 1: Foundation & Canvas

1. Task 1: Editor Layout Structure
2. Task 2: Data Loading & State Management
3. Task 3: Infinite Canvas Component
4. Task 4: Render Panels on Canvas

### Week 2: Core Editing

5. Task 5: Panel Manipulation
6. Task 6: Speech Bubble Editor
7. Task 7: AI Chat Panel
8. Task 8: Quick Actions Bar

### Week 3: Libraries & Navigation

9. Task 9: Character Library
10. Task 10: Page Navigator
11. Task 11: Layout Templates Selector
12. Task 12: Bubble Styles Selector

### Week 4: Polish & Integration

13. Task 13: Panel Inspector
14. Task 14: Keyboard Shortcuts
15. Task 15: Loading & Error States
16. Task 16: Real-time Generation Updates
17. Task 17: Export Functionality
18. Task 18: Copy/Paste Panels (Optional)
19. Task 19: Undo/Redo System (Optional)
20. Task 20: Testing & Bug Fixes

---

## Success Metrics

- **Performance:** Canvas maintains 60fps during interactions
- **Load Time:** Editor loads in <2 seconds
- **Reliability:** Auto-save works 100% of the time
- **Usability:** Users can edit manga without reading documentation
- **AI Integration:** 90% of AI commands execute successfully
- **Data Integrity:** No data loss during editing sessions

---

## Notes

- Focus on core editing experience first (Tasks 1-8)
- Libraries and navigation enhance but aren't critical (Tasks 9-12)
- Polish features can be added incrementally (Tasks 13-19)
- Test thoroughly with real project data
- Prioritize performance and reliability over features
- Get user feedback early and iterate
- Document all keyboard shortcuts
- Add error boundaries for crash prevention
- Log errors for debugging
- Consider accessibility (keyboard navigation, screen readers)
