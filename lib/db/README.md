# Database Access Layer

This module provides type-safe database operations for pages and panels with support for layout templates and dual positioning systems (relative and absolute).

## Overview

The database layer handles:

- **Pages** - Page-level operations with layout template support
- **Panels** - Panel-level operations with dual positioning
- **Coordinate Systems** - Automatic conversion between relative (0-1) and absolute (pixels)
- **Layout Templates** - Integration with predefined layouts
- **Manual Editing** - Tracking and preserving user modifications

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Database Access Layer (lib/db)              │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │   pages.ts       │      │   panels.ts      │        │
│  │  - CRUD ops      │      │  - CRUD ops      │        │
│  │  - Layout mgmt   │      │  - Position mgmt │        │
│  │  - Duplication   │      │  - Lock/unlock   │        │
│  └──────────────────┘      └──────────────────┘        │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   Supabase Database                      │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │   pages table    │      │   panels table   │        │
│  └──────────────────┘      └──────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

## Pages Module (`lib/db/pages.ts`)

### Core Operations

#### `getPage(pageId: string): Promise<PageModel | null>`

Fetch a single page by ID.

```typescript
import { getPage } from "@/lib/db";

const page = await getPage("page-123");
if (page) {
  console.log(`Page ${page.page_number}: ${page.layout_template_id}`);
}
```

#### `getPagesForProject(projectId: string): Promise<PageModel[]>`

Fetch all pages for a project, ordered by page number.

```typescript
import { getPagesForProject } from "@/lib/db";

const pages = await getPagesForProject("project-456");
console.log(`Total pages: ${pages.length}`);
```

#### `getPageWithPanels(pageId: string): Promise<{page, panels} | null>`

Fetch a page with all its panels in one operation.

```typescript
import { getPageWithPanels } from "@/lib/db";

const result = await getPageWithPanels("page-123");
if (result) {
  const { page, panels } = result;
  console.log(`Page has ${panels.length} panels`);
}
```

### Layout Operations

#### `savePageWithLayout(page, layoutTemplateId?): Promise<PageModel>`

Create a new page with optional layout template.

```typescript
import { savePageWithLayout } from "@/lib/db";

const page = await savePageWithLayout(
  {
    project_id: "project-456",
    page_number: 1,
    width: 1200,
    height: 1800,
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
  },
  "dialogue-4panel"
);
```

#### `createPageWithLayout(projectId, pageNumber, layoutTemplateId, options?): Promise<{page, panels}>`

Create a complete page with panels from a layout template.

```typescript
import { createPageWithLayout } from "@/lib/db";

const { page, panels } = await createPageWithLayout(
  "project-456",
  1,
  "dialogue-4panel",
  {
    width: 1200,
    height: 1800,
    storyBeat: "introduction",
  }
);

console.log(`Created page with ${panels.length} panels`);
```

#### `updatePageLayout(pageId, layoutTemplateId): Promise<PageModel>`

Change the layout template of an existing page.

```typescript
import { updatePageLayout } from "@/lib/db";

const page = await updatePageLayout("page-123", "action-6panel");
console.log(`Updated to ${page.layout_template_id}`);
```

### Modification Operations

#### `updatePageMargins(pageId, margins): Promise<PageModel>`

Update page margins (safe area).

```typescript
import { updatePageMargins } from "@/lib/db";

const page = await updatePageMargins("page-123", {
  top: 30,
  right: 30,
  bottom: 30,
  left: 30,
});
```

#### `updatePageDimensions(pageId, width, height): Promise<PageModel>`

Update page dimensions.

```typescript
import { updatePageDimensions } from "@/lib/db";

const page = await updatePageDimensions("page-123", 1400, 2000);
```

#### `duplicatePage(pageId, newPageNumber?): Promise<{page, panels}>`

Duplicate a page with all its panels.

```typescript
import { duplicatePage } from "@/lib/db";

const { page, panels } = await duplicatePage("page-123", 2);
console.log(`Duplicated page as page ${page.page_number}`);
```

### Utility Operations

#### `deletePage(pageId): Promise<void>`

Delete a page and all its panels (CASCADE).

```typescript
import { deletePage } from "@/lib/db";

await deletePage("page-123");
```

#### `getPageCount(projectId): Promise<number>`

Get total page count for a project.

```typescript
import { getPageCount } from "@/lib/db";

const count = await getPageCount("project-456");
console.log(`Project has ${count} pages`);
```

---

## Panels Module (`lib/db/panels.ts`)

### Core Operations

#### `getPanelsForPage(pageId: string): Promise<PanelModel[]>`

Fetch all panels for a page, ordered by panel_index.

```typescript
import { getPanelsForPage } from "@/lib/db";

const panels = await getPanelsForPage("page-123");
panels.forEach((panel) => {
  console.log(`Panel ${panel.panel_index}: ${panel.width}x${panel.height}`);
});
```

#### `getPanel(panelId: string): Promise<PanelModel | null>`

Fetch a single panel by ID.

```typescript
import { getPanel } from "@/lib/db";

const panel = await getPanel("panel-789");
if (panel) {
  console.log(`Panel at (${panel.x}, ${panel.y})`);
}
```

### Position Operations

#### `savePanelWithLayout(panel, pageWidth, pageHeight, safeAreaOffset?): Promise<PanelModel>`

Save a panel with automatic coordinate conversion.

```typescript
import { savePanelWithLayout } from "@/lib/db";

// Save with relative positions
const panel1 = await savePanelWithLayout(
  {
    page_id: "page-123",
    panel_index: 0,
    relative_x: 0,
    relative_y: 0,
    relative_width: 0.5,
    relative_height: 0.5,
    z_index: 1,
    panel_type: "standard",
    border_style: "solid",
    border_width: 2,
  },
  1200,
  1800
);

// Save with absolute positions (will calculate relative)
const panel2 = await savePanelWithLayout(
  {
    page_id: "page-123",
    panel_index: 1,
    x: 600,
    y: 0,
    width: 600,
    height: 900,
    z_index: 1,
    panel_type: "standard",
    border_style: "solid",
    border_width: 2,
  },
  1200,
  1800
);
```

#### `updatePanelPosition(panelId, position, pageWidth?, pageHeight?): Promise<PanelModel>`

Update panel position (for manual editing).

```typescript
import { updatePanelPosition } from "@/lib/db";

// Update with absolute positions
const panel = await updatePanelPosition(
  "panel-789",
  { x: 100, y: 100, width: 500, height: 800 },
  1200,
  1800
);

// Panel is marked as manually edited
console.log(panel.is_manually_edited); // true
```

### Content Operations

#### `updatePanelContent(panelId, content): Promise<PanelModel>`

Update panel content (image, prompt, characters, etc.).

```typescript
import { updatePanelContent } from "@/lib/db";

const panel = await updatePanelContent("panel-789", {
  image_url: "https://example.com/image.png",
  prompt: "A dramatic scene",
  character_handles: ["@hero", "@villain"],
  style_locks: ["dramatic-lighting"],
});
```

#### `updatePanelBubbles(panelId, bubbles): Promise<PanelModel>`

Update speech bubbles for a panel.

```typescript
import { updatePanelBubbles } from "@/lib/db";

const panel = await updatePanelBubbles("panel-789", [
  {
    id: "bubble-1",
    x: 50,
    y: 50,
    width: 150,
    height: 80,
    text: "Hello!",
    type: "standard",
  },
]);
```

### Bulk Operations

#### `createPanelsForPage(pageId, panels, pageWidth, pageHeight): Promise<PanelModel[]>`

Bulk create panels for a page.

```typescript
import { createPanelsForPage } from "@/lib/db";

const panels = await createPanelsForPage(
  "page-123",
  [
    {
      panel_index: 0,
      relative_x: 0,
      relative_y: 0,
      relative_width: 0.5,
      relative_height: 0.5,
      z_index: 1,
      panel_type: "standard",
      border_style: "solid",
      border_width: 2,
      bubbles: [],
    },
    // ... more panels
  ],
  1200,
  1800
);
```

### Lock Operations

#### `togglePanelLock(panelId, locked): Promise<PanelModel>`

Lock or unlock a panel to prevent AI modifications.

```typescript
import { togglePanelLock } from "@/lib/db";

// Lock panel
const lockedPanel = await togglePanelLock("panel-789", true);

// Unlock panel
const unlockedPanel = await togglePanelLock("panel-789", false);
```

#### `getPanelsForRegeneration(pageId): Promise<PanelModel[]>`

Get panels that can be regenerated (not locked, not manually edited).

```typescript
import { getPanelsForRegeneration } from "@/lib/db";

const panels = await getPanelsForRegeneration("page-123");
console.log(`${panels.length} panels can be regenerated`);
```

### Utility Operations

#### `deletePanel(panelId): Promise<void>`

Delete a panel.

```typescript
import { deletePanel } from "@/lib/db";

await deletePanel("panel-789");
```

---

## Coordinate Systems

The database layer handles two coordinate systems:

### Relative Positioning (0-1 scale)

- Stored in: `relative_x`, `relative_y`, `relative_width`, `relative_height`
- Used for: Layout templates, responsive rendering
- Range: 0.0 to 1.0

### Absolute Positioning (pixels)

- Stored in: `x`, `y`, `width`, `height`
- Used for: Direct rendering, manual editing
- Range: 0 to page dimensions

### Automatic Conversion

The database layer automatically converts between coordinate systems:

```typescript
// Save with relative → stores both
await savePanelWithLayout(
  {
    relative_x: 0.5,
    relative_y: 0,
    relative_width: 0.5,
    relative_height: 0.5,
  },
  1200,
  1800
);
// Stores: relative_x=0.5, x=600 (calculated)

// Save with absolute → stores both
await savePanelWithLayout(
  {
    x: 600,
    y: 0,
    width: 600,
    height: 900,
  },
  1200,
  1800
);
// Stores: x=600, relative_x=0.5 (calculated)
```

---

## Error Handling

All functions throw errors with descriptive messages:

```typescript
try {
  const page = await getPage("invalid-id");
} catch (error) {
  console.error("Failed to fetch page:", error.message);
}
```

Common error scenarios:

- Database connection failures
- Invalid IDs (returns null for get operations)
- Invalid layout template IDs
- Missing required fields
- Constraint violations

---

## Best Practices

### 1. Use Type-Safe Operations

```typescript
import type { PageModel, PanelModel } from "@/types/models";
import { getPageWithPanels } from "@/lib/db";

const result = await getPageWithPanels(pageId);
if (result) {
  const { page, panels }: { page: PageModel; panels: PanelModel[] } = result;
}
```

### 2. Handle Null Returns

```typescript
const page = await getPage(pageId);
if (!page) {
  console.error("Page not found");
  return;
}
```

### 3. Use Bulk Operations

```typescript
// Good: Bulk create
const panels = await createPanelsForPage(pageId, panelsData, width, height);

// Avoid: Individual creates in loop
for (const panelData of panelsData) {
  await savePanelWithLayout(panelData, width, height); // Slow!
}
```

### 4. Preserve Manual Edits

```typescript
// Check before regenerating
const panels = await getPanelsForRegeneration(pageId);
// Only regenerate unlocked, non-manually-edited panels
```

### 5. Use Transactions for Related Operations

```typescript
// When creating page with panels, use createPageWithLayout
const { page, panels } = await createPageWithLayout(
  projectId,
  pageNumber,
  layoutTemplateId
);
// Ensures page and panels are created together
```

---

## Integration Examples

### Create a Complete Page

```typescript
import { createPageWithLayout } from "@/lib/db";

const { page, panels } = await createPageWithLayout(
  "project-456",
  1,
  "dialogue-4panel",
  {
    width: 1200,
    height: 1800,
    storyBeat: "introduction",
  }
);

console.log(`Created page ${page.page_number} with ${panels.length} panels`);
```

### Update Panel After Generation

```typescript
import { updatePanelContent } from "@/lib/db";

const panel = await updatePanelContent(panelId, {
  image_url: generatedImageUrl,
  prompt: generationPrompt,
  character_handles: ["@hero"],
  generation_params: { model: "flux", steps: 30 },
});
```

### Manual Editing Workflow

```typescript
import { updatePanelPosition, togglePanelLock } from "@/lib/db";

// User drags panel to new position
const panel = await updatePanelPosition(
  panelId,
  { x: newX, y: newY, width: newWidth, height: newHeight },
  pageWidth,
  pageHeight
);

// Lock panel to prevent AI modifications
await togglePanelLock(panelId, true);
```

---

## Performance Considerations

- Use `getPageWithPanels()` instead of separate calls
- Use bulk operations (`createPanelsForPage`) for multiple panels
- Leverage database indexes on `page_id`, `panel_index`
- Cache frequently accessed pages in application layer

---

## Future Enhancements

- [ ] Batch update operations
- [ ] Optimistic updates with rollback
- [ ] Real-time subscriptions
- [ ] Caching layer
- [ ] Pagination for large projects
