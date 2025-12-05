# Manga Generation Pipeline - Quick Reference

## Enhanced Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INPUT                                        │
│  Story prompt + Genre + Style + Page count                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: FOUNDATION (Parallel)                            ~15-20 seconds   │
├─────────────────────────────────────────────────────────────────────────────┤
│   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐     │
│   │  Story Analysis  │    │ Rough Character  │    │  Style Anchor    │     │
│   │  + Dramatic Core │    │  Extraction      │    │  Generation      │     │
│   └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘     │
│            │                       │                       │               │
│   [Conflict, Stakes,      [Quick character       [1 reference image       │
│    Emotional Arc,          profiles from          establishing the        │
│    Key Moments]            original prompt]       art style]              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: SCRIPT + CHARACTER DESIGN                        ~25-30 seconds   │
├─────────────────────────────────────────────────────────────────────────────┤
│   ┌─────────────────────────────┐    ┌─────────────────────────────┐       │
│   │      Script Generation      │    │   Character Extraction      │       │
│   │  (uses story analysis +     │    │   (with consistency         │       │
│   │   dramatic core)            │    │    strings)                 │       │
│   └──────────────┬──────────────┘    └──────────────┬──────────────┘       │
│                  │                                  │                       │
│                  ▼                                  ▼                       │
│   ┌─────────────────────────┐       ┌─────────────────────────┐            │
│   │  Drama Enhancement      │       │  Character Sheet Gen    │            │
│   │  (optional)             │       │  (turnaround sheets)    │            │
│   └─────────────────────────┘       └─────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: PANEL GENERATION (Batched Parallel)              ~60-90 seconds   │
├─────────────────────────────────────────────────────────────────────────────┤
│   ┌─────────────────────────────────────────────────────────────────┐      │
│   │  Storyboard Generation (layout planning)                        │      │
│   └─────────────────────────────────────────────────────────────────┘      │
│                                    │                                        │
│                                    ▼                                        │
│   Page 1 ──► [Panel 1] [Panel 2] [Panel 3] [Panel 4]                       │
│   Page 2 ──► [Panel 1] [Panel 2] [Panel 3] [Panel 4]                       │
│   Page 3 ──► [Panel 1] [Panel 2] [Panel 3] [Panel 4]                       │
│      ...        (panels generated in batches of 8)                          │
│                                                                             │
│   Features:                                                                 │
│   - Uses style anchor for visual consistency                               │
│   - Uses consistency strings for character recognition                     │
│   - Compressed prompts for 5000-char limit                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 4: ASSEMBLY                                         ~10-15 seconds   │
├─────────────────────────────────────────────────────────────────────────────┤
│   ┌──────────────────┐    ┌──────────────────┐                              │
│   │  Smart Bubble    │───►│  Final Assembly  │                              │
│   │  Positioning     │    │                  │                              │
│   │  (batched)       │    │                  │                              │
│   └──────────────────┘    └──────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  OUTPUT: Complete manga ready for viewing/editing                           │
│  Total time: ~2-3 minutes for 4 pages                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Enhancements

### 1. Dramatic Core (Story Analysis)

- **Central Conflict**: What opposing forces drive the story
- **Stakes**: What protagonist loses if they fail
- **Emotional Arc**: Start → End feeling
- **The Turn**: The climax moment

### 2. Consistency System (Characters)

- **Consistency String**: Max 100 chars, used in every panel prompt
- **Visual Anchors**: Silhouette, face anchor, clothing anchor, primary tone
- **Example**: "tall spiky-haired teen, scar over left eye, red scarf"

### 3. Style Anchor

- Hero image establishing visual style
- Used as reference for all subsequent panels
- Ensures visual cohesion across manga

### 4. Prompt Compression

- Budget allocation: scene (40%), characters (30%), style (20%), technical (10%)
- Smart truncation preserving meaning
- Respects 5000-char limit

### 5. Batched Generation

- Panels generated in batches of 8
- Parallel processing within batches
- Progress streaming to UI

## Task Files

| Task                        | File                         | Purpose                        |
| --------------------------- | ---------------------------- | ------------------------------ |
| `generate-manga`            | `generateManga.ts`           | Main orchestrator              |
| `analyze-story`             | `analyzeStory.ts`            | Story analysis + dramatic core |
| `extract-rough-characters`  | `extractRoughCharacters.ts`  | Quick character extraction     |
| `generate-style-anchor`     | `generateStyleAnchor.ts`     | Visual style establishment     |
| `generate-script`           | `generateScript.ts`          | Full script generation         |
| `enhance-script-drama`      | `enhanceScriptDrama.ts`      | Drama doctor pass              |
| `extract-characters`        | `extractCharacters.ts`       | Detailed character extraction  |
| `generate-characters`       | `generateCharacters.ts`      | Database record creation       |
| `generate-character-images` | `generateCharacterImages.ts` | Character design sheets        |
| `generate-storyboard`       | `generateStoryboard.ts`      | Layout planning                |
| `generate-page-images`      | `generatePageImages.ts`      | Batched panel generation       |
| `score-panel-quality`       | `scorePanelQuality.ts`       | Quality assessment             |
| `generate-smart-bubbles`    | `generateSmartBubbles.ts`    | Bubble positioning             |

## Database Fields (New)

### Projects Table

- `style_anchor_url`: URL of style anchor image
- `style_anchor_data`: Style metadata (description, prompt suffix)
- `dramatic_core`: Dramatic story elements

### Characters Table

- `consistency_string`: Condensed visual description (max 100 chars)
- `visual_anchors`: Structured visual anchors (JSON)

### Panels Table

- `quality_score`: AI-assessed quality (1-10)
- `generation_attempts`: Number of generation attempts
- `quality_details`: Detailed quality breakdown (JSON)

## Configuration Options

```typescript
generateManga.triggerAndWait({
  projectId: "...",
  storyDescription: "...",
  genre: "shounen",
  artStyle: "manga",
  pageCount: 4,
  // New options:
  enableDramaEnhancement: true, // Enable drama doctor pass
  enableStyleAnchor: true, // Enable style anchor generation
  enableParallelPhase1: true, // Enable parallel Phase 1
});
```
