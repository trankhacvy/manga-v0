# Type System Documentation

## Overview

This directory contains the type definitions for the manga/comic creation tool. The types are organized into three main files:

- `database.types.ts` - Auto-generated from Supabase schema
- `models.ts` - Application models that extend database types
- `index.ts` - General application types and enums

## Type Hierarchy

```
database.types.ts (Supabase generated)
    ↓
models.ts (Application models with typed JSONB)
    ↓
Your application code
```

## Usage Examples

### Querying Data

```typescript
import { supabase } from "@/lib/supabase";
import { toProjectModel, type ProjectModel } from "@/types/models";

// Query returns ProjectRow from database
const { data, error } = await supabase
  .from("projects")
  .select("*")
  .eq("user_id", userId);

// Convert to typed model
const projects: ProjectModel[] = data?.map(toProjectModel) ?? [];

// Now you have full type safety on JSONB fields
projects.forEach((project) => {
  console.log(project.generation_progress?.script); // ✅ Type-safe
  console.log(project.metadata?.customField); // ✅ Type-safe
});
```

### Creating Records

```typescript
import { supabase } from "@/lib/supabase";
import type { CreateProject } from "@/types/models";

const newProject: CreateProject = {
  user_id: userId,
  title: "My Manga",
  genre: "shonen",
  style: "manga-classic",
  art_style: "manga-classic",
  target_page_count: 24,
  generation_progress: {
    script: 0,
    characters: 0,
    storyboard: 0,
    preview: 0,
  },
};

const { data, error } = await supabase
  .from("projects")
  .insert(newProject)
  .select()
  .single();
```

### Updating Records

```typescript
import { supabase } from "@/lib/supabase";
import type { UpdateProject } from "@/types/models";

const updates: UpdateProject = {
  title: "Updated Title",
  generation_progress: {
    script: 100,
    characters: 50,
    storyboard: 0,
    preview: 0,
  },
};

const { data, error } = await supabase
  .from("projects")
  .update(updates)
  .eq("id", projectId);
```

### Working with Characters

```typescript
import {
  toCharacterModel,
  type CharacterModel,
  type CreateCharacter,
} from "@/types/models";

// Create a character
const newCharacter: CreateCharacter = {
  project_id: projectId,
  name: "Akira",
  handle: "@akira",
  description: "The protagonist",
  aliases: ["hero", "protagonist"],
  turnaround: {
    front: "url-to-front-image",
    side: "url-to-side-image",
  },
  expressions: [
    { id: "1", name: "happy", imageUrl: "url" },
    { id: "2", name: "sad", imageUrl: "url" },
  ],
};

const { data } = await supabase
  .from("characters")
  .insert(newCharacter)
  .select()
  .single();

const character: CharacterModel = toCharacterModel(data);
```

### Working with Panels

```typescript
import {
  toPanelModel,
  type PanelModel,
  type CreatePanel,
} from "@/types/models";

// Create a panel
const newPanel: CreatePanel = {
  page_id: pageId,
  panel_index: 0,
  x: 0,
  y: 0,
  width: 400,
  height: 600,
  prompt: "A dramatic scene",
  character_ids: [characterId1, characterId2],
  character_handles: ["@akira", "@luna"],
  character_positions: {
    [characterId1]: { x: 100, y: 200, width: 150, height: 300 },
    [characterId2]: { x: 250, y: 200, width: 150, height: 300 },
  },
  bubbles: [
    {
      id: "1",
      x: 50,
      y: 50,
      width: 100,
      height: 50,
      text: "Hello!",
      type: "speech",
    },
  ],
};

const { data } = await supabase
  .from("panels")
  .insert(newPanel)
  .select()
  .single();

const panel: PanelModel = toPanelModel(data);
```

## Key Fields in Enhanced Schema

### Projects

- `story_input` - User's story input for generation
- `art_style` - Art style (manga-classic, manhwa, etc.)
- `target_page_count` - Target number of pages
- `metadata` - Additional project metadata (JSONB)

### Characters

- `aliases` - Alternative names/references
- `reference_image` - Primary reference image URL
- `ip_adapter_embedding` - IP adapter embedding for consistency
- `outfits` - Available outfits (JSONB)

### Pages

- `layout_type` - Layout type (grid-4, grid-6, etc.)
- `width` / `height` - Page dimensions (now INTEGER)

### Panels

- `thumbnail_url` - Thumbnail version of panel image
- `character_ids` - Array of character UUIDs
- `character_positions` - Bounding boxes for characters (JSONB)

## Type Guards

Use type guards to safely check types at runtime:

```typescript
import { isProjectModel, isCharacterModel, isPanelModel } from "@/types/models";

if (isProjectModel(data)) {
  // TypeScript knows data is ProjectModel
  console.log(data.title);
}
```

## Regenerating Database Types

When you update your Supabase schema, regenerate the types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

Then update `models.ts` if needed to reflect any schema changes.
