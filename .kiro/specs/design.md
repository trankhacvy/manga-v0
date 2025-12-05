# Manga IDE Design Document

## Overview

The Manga IDE is an AI-first creative environment explicitly modeled after Cursor's revolutionary coding experience, adapted for sequential art creation. The system is designed around the principle "Never leave the canvas, never break context" with two distinct entry points: Quick Flow (rapid 2-10 minute comic generation for beginners) and Pro Flow (full IDE workspace for professional creators).

The architecture implements a persistent IDE layout with five core tabs (Story, Characters, Storyboard, Pages, Publish), a global prompt bar (Cmd+K), and a multi-step AI Composer (Cmd+L). Character consistency is achieved through a @handle system with automatic LoRA training and IP-Adapter integration, representing 2025-grade technology.

The system follows a Next.js App Router architecture with React-Konva for canvas manipulation, Zustand for state management, and integration with multiple AI services (Flux Manga 1.1, Pony XL, SD3.5) through serverless GPU providers.

## Architecture

### Design Principles

- **Simplicity First**: Monolithic Next.js app until 1000 DAU
- **Progressive Enhancement**: Start simple, add complexity as needed
- **User-Centric**: Optimize for time-to-first-comic (<5 minutes)
- **Cost-Effective**: <$500/month infrastructure budget

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          Frontend (Next.js App Router)                        │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                            Top Bar                                       │ │
│  │  Project Settings | Export | Publish | Model Selector | Credits: 42    │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌──────────┐  ┌────────────────────────────────────────┐  ┌─────────────┐ │
│  │  Left    │  │         Center Canvas                   │  │   Right     │ │
│  │ Sidebar  │  │      (React-Konva)                      │  │  Sidebar    │ │
│  │          │  │                                          │  │             │ │
│  │ Pages    │  │  Infinite Scroll / Paginated Mode       │  │  Layers     │ │
│  │ Script   │  │  - Panels with @handle refs             │  │  Properties │ │
│  │Characters│  │  - Speech bubbles (separate layer)      │  │  History    │ │
│  │ Assets   │  │  - Selection & manipulation             │  │  AI Chat    │ │
│  │References│  │  - 60fps interaction performance        │  │             │ │
│  │          │  │                                          │  │             │ │
│  └──────────┘  └────────────────────────────────────────┘  └─────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                          Bottom Bar                                      │ │
│  │  [Cmd+K] Global Prompt: "@Akira running, dramatic..."  | Generate |    │ │
│  │  Quick Actions: Vary | Inpaint | Upscale | Style-Lock | Progress: 67%  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │              Floating Composer (Cmd+L) - Multi-step AI                  │ │
│  │  "Make page 7 more intense, add rain, @Akira crying..."                │ │
│  │  [Show Diff] [Apply] [Cancel]                                           │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│                    ┌───────────────────────────┐                             │
│                    │   State Manager (Zustand) │                             │
│                    │  - Project/Page state     │                             │
│                    │  - Character bank         │                             │
│                    │  - Selection state        │                             │
│                    │  - Generation queue       │                             │
│                    └───────────┬───────────────┘                             │
└────────────────────────────────┼─────────────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   API Routes (Next.js)  │
                    │  - /api/quick-flow      │
                    │  - /api/characters      │
                    │  - /api/lora/train      │
                    │  - /api/panels/generate │
                    │  - /api/composer        │
                    │  - /api/export          │
                    └────────────┬────────────┘
                                 │
        ┏────────────────────────┼────────────────────────┓
        │                        │                        │
┌───────▼──────────┐  ┌──────────▼─────────┐  ┌─────────▼────────┐
│  AI Generation   │  │    LLM Services    │  │   Database       │
│  - Flux Manga    │  │  - GPT-4o          │  │  (Supabase)      │
│  - Pony XL       │  │  - Claude 3.5      │  │  - Projects      │
│  - SD3.5         │  │  - Script parsing  │  │  - Characters    │
│  - LoRA training │  │  - Composer        │  │  - Pages/Panels  │
│  - IP-Adapter    │  │  - Prompt enhance  │  │  - LoRA metadata │
│  (Fal.ai/Modal)  │  │                    │  │  - Version hist  │
└──────────────────┘  └────────────────────┘  └─────────┬────────┘
                                                         │
                                              ┌──────────▼────────┐
                                              │  Object Storage   │
                                              │  (Supabase/R2)    │
                                              │  - Panel images   │
                                              │  - Character refs │
                                              │  - LoRA weights   │
                                              │  - Thumbnails     │
                                              └───────────────────┘
```

### Scaling Strategy

**Phase 1 (0-1K users)**: Vercel + Supabase

- Single Next.js instance
- Supabase free tier
- Replicate/Fal.ai for AI

**Phase 2 (1K-10K users)**: Add caching

- Redis for sessions
- CDN for all assets
- Queue for generation

**Phase 3 (10K+ users)**: Microservices

- Separate generation service
- Multiple AI providers
- Kubernetes deployment

### Technology Stack

**Frontend:**

- Next.js 14/15 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Shadcn/UI components
- React-Konva (Canvas manipulation)
- Zustand (State management)

**Backend:**

- Next.js API Routes
- Vercel AI SDK (LLM integration)
- Fal.ai or Replicate (Image generation)

**Data Layer:**

- Supabase (PostgreSQL database)
- AWS S3 or Cloudflare R2 (Image storage)

**AI Services:**

- OpenAI GPT-4o or Claude 3.5 Sonnet (Script parsing, prompt generation)
- Flux.1 [dev] or SDXL Lightning (Image generation)
- IP-Adapter (Character consistency)
- ControlNet (Sketch-to-image)

## Components and Interfaces

### Frontend Components

#### 1. Root Layout Component (`app/editor/[projectId]/layout.tsx`)

The persistent IDE layout that never changes across workflows:

```typescript
interface EditorLayoutProps {
  children: React.ReactNode;
  params: { projectId: string };
}

// Layout structure (persistent):
// - Top Bar (60px fixed) - Project settings, export, model selector, credits
// - Left Sidebar (280px resizable) - Pages, Script, Characters, Assets, References
// - Center Canvas (flexible) - Main workspace with tabs
// - Right Sidebar (320px resizable) - Layers, Properties, History, AI Chat
// - Bottom Bar (80px fixed) - Global prompt (Cmd+K), quick actions, progress
// - Floating Composer (Cmd+L) - Modal overlay for multi-step operations
```

#### 1a. Top Bar Component (`components/editor/top-bar.tsx`)

```typescript
interface TopBarProps {
  projectId: string;
  credits: number;
  currentModel: ModelType;
  onModelChange: (model: ModelType) => void;
}

type ModelType = "flux-manga-1.1" | "pony-xl" | "sd3.5" | "custom-lora";
```

#### 1b. Bottom Bar Component (`components/editor/bottom-bar.tsx`)

The global prompt bar (Cursor-style Cmd+K):

```typescript
interface BottomBarProps {
  projectId: string;
  selectedPanelIds: string[];
  onGenerate: (prompt: string) => Promise<void>;
  generationProgress?: number;
}

// Features:
// - Cmd+K to focus
// - @handle autocomplete
// - @ref-image autocomplete
// - Quick action buttons (Vary, Inpaint, Upscale, Style-Lock)
// - Real-time progress bar
```

#### 2. Left Sidebar Component (`components/sidebar/explorer.tsx`)

Multi-section navigator with collapsible sections:

```typescript
interface LeftSidebarProps {
  projectId: string;
  activeSection: "pages" | "script" | "characters" | "assets" | "references";
  onSectionChange: (section: string) => void;
}

interface PageNode {
  id: string;
  pageNumber: number;
  thumbnail: string;
  panelCount: number;
}

interface CharacterNode {
  id: string;
  name: string;
  handle: string; // e.g., "@Akira"
  thumbnail: string;
  hasLora: boolean;
}

// Sections:
// - Pages: Thumbnail grid with drag-to-reorder
// - Script: Outline view of scenes
// - Characters: Character cards with @handles
// - Assets: Uploaded references, backgrounds
// - References: Pinned moodboards, style refs
```

#### 2a. Character Card Component (`components/character/character-card.tsx`)

Draggable character card with @handle:

```typescript
interface CharacterCardProps {
  character: Character;
  onDragStart: (character: Character) => void;
  onClick: () => void; // Open full character sheet
}

interface Character {
  id: string;
  name: string;
  handle: string; // "@Akira"
  description: string;
  turnaround: {
    front: string;
    side: string;
    back: string;
    threequarter: string;
  };
  expressions: Expression[];
  outfits: Outfit[];
  loraId?: string; // Reference to trained LoRA
  voicePreset?: string;
}

interface Expression {
  id: string;
  name: string; // "happy", "angry", "crying"
  imageUrl: string;
}

interface Outfit {
  id: string;
  name: string;
  imageUrl: string;
}
```

#### 3. Center Canvas Component (`components/canvas/manga-canvas.tsx`)

The infinite workspace with React-Konva, supporting both paginated and scroll modes:

```typescript
interface CanvasProps {
  projectId: string;
  mode: "paginated" | "webtoon-vertical" | "webtoon-horizontal";
  pages: Page[];
  selectedPanelIds: string[];
  onPanelSelect: (panelIds: string[]) => void;
  onPanelUpdate: (panelId: string, updates: Partial<Panel>) => void;
  onCharacterDrop: (character: Character, position: { x: number; y: number }) => void;
}

interface Page {
  id: string;
  pageNumber: number;
  panels: Panel[];
  width: number;
  height: number;
}

interface Panel {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl?: string;
  prompt: string;
  characterHandles: string[]; // ["@Akira", "@Luna"]
  styleLocksstring[]; // ["dramatic-lighting", "rain"]
  bubbles: SpeechBubble[];
  sketchUrl?: string; // For ControlNet
  maskRegion?: MaskRegion; // For inpainting
  versionHistory: PanelVersion[];
}

interface SpeechBubble {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  type: "standard" | "shout" | "whisper" | "thought" | "sfx";
  fontFamily?: string;
  fontSize?: number;
}

interface MaskRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  maskDataUrl: string; // Base64 mask image
}

interface PanelVersion {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: Date;
  isCurrent: boolean;
}
```

Key features:

- Multi-select with Shift+Click or drag-to-select
- Drag and drop panels with snap-to-grid
- Resize panels with handles (triggers outpainting)
- Character drop zones (drag from Characters tab)
- Keyboard shortcuts (Cmd+K, Cmd+L, arrow keys)
- Layer management (panels, images, bubbles, masks)
- Viewport-based virtualization for performance

#### 4. Right Sidebar Component (`components/sidebar/right-sidebar.tsx`)

Contextual panels that change based on selection:

```typescript
interface RightSidebarProps {
  projectId: string;
  activePanel: "layers" | "properties" | "history" | "chat";
  selectedPanelIds: string[];
}

// Sub-components:
// - Layers Panel: Shows all panels and bubbles with visibility toggles
// - Properties Panel: Edit selected panel properties (size, prompt, style locks)
// - History Panel: Version timeline for selected panel
// - AI Chat Panel: Conversational interface for complex edits
```

#### 4a. AI Chat Component (`components/chat/ai-chat.tsx`)

Conversational interface in right sidebar:

```typescript
interface AIChatProps {
  projectId: string;
  selectedPanelIds: string[];
  context: {
    characters: Character[];
    currentPage: Page;
    projectStyle: StyleType;
  };
  onCommand: (command: string) => Promise<void>;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  attachments?: {
    type: "panel" | "character" | "reference";
    id: string;
    thumbnail: string;
  }[];
}

// Features:
// - Context-aware suggestions
// - @handle autocomplete
// - Attach panels/characters to messages
// - Show generation results inline
```

#### 5. Floating Composer Component (`components/composer/ai-composer.tsx`)

Multi-step AI reasoning interface (Cmd+L), modeled after Cursor Composer:

```typescript
interface ComposerProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  context: {
    selectedPanelIds: string[];
    currentPage: Page;
    characters: Character[];
  };
}

interface ComposerStep {
  id: string;
  type: "understanding" | "planning" | "generating" | "review";
  content: string;
  status: "pending" | "in-progress" | "complete";
}

interface ComposerResult {
  changes: PanelChange[];
  diff: {
    before: string[]; // Panel image URLs
    after: string[]; // Generated image URLs
  };
}

interface PanelChange {
  panelId: string;
  type: "regenerate" | "edit-prompt" | "add-element" | "style-change";
  parameters: Record<string, any>;
}

// Features:
// - Multi-step reasoning display
// - Before/after diff view
// - Accept/reject changes
// - Batch operations on multiple panels
// - Complex commands like "Make page 7 more intense, add rain, @Akira crying"
```

#### 6. Quick Flow Component (`components/quick-flow/quick-flow-wizard.tsx`)

Rapid comic generation for beginners:

```typescript
interface QuickFlowProps {
  onComplete: (projectId: string) => void;
  onConvertToPro: (quickFlowData: QuickFlowResult) => void;
}

interface QuickFlowResult {
  premise: string;
  genre: string;
  tone: string;
  mainCharacter: string;
  pageCount: number;
  generatedPages: Page[];
}

// Flow:
// 1. User enters premise
// 2. AI asks 3 clarifying questions
// 3. Generate entire comic (layout + art + dialogue + SFX)
// 4. Display with hover actions (Vary, Make more dramatic)
// 5. Option to "Turn this into Pro Project"
```

#### 7. Pro Flow Tab System (`components/tabs/`)

Five tabs for professional workflow:

```typescript
// Tab 1: Story Tab (components/tabs/story-tab.tsx)
interface StoryTabProps {
  projectId: string;
  script: string;
  onScriptChange: (script: string) => void;
  onExpandToStoryboard: (selectedLines: string) => void;
}

// Features:
// - Screenplay editor with syntax highlighting
// - Inline AI (Cmd+K on selected text)
// - "Expand this scene into panels" button
// - Auto-save

// Tab 2: Characters Tab (components/tabs/characters-tab.tsx)
interface CharactersTabProps {
  projectId: string;
  characters: Character[];
  onCharacterCreate: (data: CharacterCreateData) => void;
  onLoRATrain: (characterId: string, images: File[]) => void;
}

interface CharacterCreateData {
  name: string;
  description?: string;
  referenceImage?: File;
  trainingImages?: File[]; // 12-20 images for LoRA
}

// Features:
// - Character card grid
// - Create from description, photo, or training set
// - Expression slider (real-time morph)
// - Outfit wardrobe
// - Drag to canvas

// Tab 3: Storyboard Tab (components/tabs/storyboard-tab.tsx)
interface StoryboardTabProps {
  projectId: string;
  thumbnails: Thumbnail[];
  onPromoteToHiFi: (thumbnailIds: string[]) => void;
}

interface Thumbnail {
  id: string;
  prompt: string;
  imageUrl: string;
  composition: "wide" | "tall" | "square";
  sketchDataUrl?: string;
}

// Features:
// - Grid or freeform canvas
// - Panel template library
// - Sketch with Apple Pencil/mouse
// - "@Akira angry, low angle" → thumbnail
// - "Smart Layout" suggestions
// - "Promote to Hi-Fi" batch operation

// Tab 4: Pages Tab (components/tabs/pages-tab.tsx)
// This is the main canvas (already defined above)

// Tab 5: Publish Tab (components/tabs/publish-tab.tsx)
interface PublishTabProps {
  projectId: string;
  pages: Page[];
  onExport: (format: ExportFormat) => Promise<string>; // Returns download URL
}

type ExportFormat =
  | "pdf-print"
  | "webtoon-png"
  | "tapas"
  | "kindle"
  | "animated-webp";

// Features:
// - Format selector with previews
// - Export settings (DPI, dimensions)
// - One-click export
// - Direct platform upload (future)
```

### State Management

Using Zustand with multiple stores for separation of concerns:

```typescript
// Main Project Store (lib/store/project-store.ts)
interface ProjectStore {
  // Project state
  currentProject: Project | null;
  currentMode: "quick-flow" | "pro-flow";
  activeTab: "story" | "characters" | "storyboard" | "pages" | "publish";

  // Actions
  setCurrentProject: (project: Project) => void;
  setMode: (mode: "quick-flow" | "pro-flow") => void;
  setActiveTab: (tab: string) => void;
  updateProjectSettings: (settings: Partial<ProjectSettings>) => void;
}

interface ProjectSettings {
  style: StyleType;
  defaultModel: ModelType;
  canvasMode: "paginated" | "webtoon-vertical" | "webtoon-horizontal";
}

// Canvas Store (lib/store/canvas-store.ts)
interface CanvasStore {
  // Page state
  pages: Page[];
  currentPageId: string | null;

  // Selection state
  selectedPanelIds: string[];
  selectedBubbleIds: string[];

  // UI state
  isGenerating: boolean;
  generationQueue: GenerationJob[];
  generationProgress: Record<string, number>; // panelId -> progress

  // Actions
  setCurrentPage: (pageId: string) => void;
  selectPanels: (panelIds: string[]) => void;
  togglePanelSelection: (panelId: string) => void;
  updatePanel: (panelId: string, updates: Partial<Panel>) => void;
  addSpeechBubble: (panelId: string, bubble: SpeechBubble) => void;
  updateBubble: (bubbleId: string, updates: Partial<SpeechBubble>) => void;
  queueGeneration: (job: GenerationJob) => void;
  updateGenerationProgress: (panelId: string, progress: number) => void;
}

interface GenerationJob {
  id: string;
  panelId: string;
  prompt: string;
  characterHandles: string[];
  styleLocks: string[];
  controlNetImage?: string;
  maskRegion?: MaskRegion;
  priority: number;
  status: "queued" | "generating" | "complete" | "failed";
}

// Canvas Store (lib/store/canvas-store.ts) - Actual Implementation
interface CanvasState {
  // Selection state
  selectedPanelIds: string[]; // Multi-select support
  selectedBubbleId: string | null;

  // Bubble editing state
  editingBubbleId: string | null;
  editingPanelId: string | null;
  editingText: string;

  // Panel state
  panels: Panel[];
  isDragging: boolean;
  isResizing: boolean;

  // Mask tool state
  isMaskToolActive: boolean;
  maskMode: "rectangle" | "brush";
  currentMaskRegion: MaskRegion | null;

  // Generation state
  isGenerating: boolean;
  generationProgress: number;
  generatingPanelId: string | null;
  generationError: string | null;

  // UI state
  zoom: number;
  canvasOffset: { x: number; y: number };

  // Actions
  selectPanel: (panelId: string | null) => void;
  selectPanels: (panelIds: string[]) => void;
  togglePanelSelection: (panelId: string) => void;
  clearSelection: () => void;
  updatePanel: (panelId: string, updates: Partial<Panel>) => Promise<void>;
  deletePanel: (panelId: string) => Promise<void>;
  addSpeechBubble: (panelId: string, bubble: Omit<SpeechBubble, "id">) => void;
  updateSpeechBubble: (
    panelId: string,
    bubbleId: string,
    updates: Partial<SpeechBubble>
  ) => void;
  deleteSpeechBubble: (panelId: string, bubbleId: string) => void;
  setGenerating: (isGenerating: boolean, panelId?: string) => void;
  setGenerationProgress: (progress: number) => void;
  setGenerationError: (error: string | null) => void;
  setZoom: (zoom: number) => void;
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  resetCanvas: () => void;
  setMaskToolActive: (isActive: boolean) => void;
  setSketchForPanel: (panelId: string, sketchUrl: string) => void;
  removeSketchFromPanel: (panelId: string) => void;
  setControlNetStrength: (panelId: string, strength: number) => void;
  saveCanvasState: () => void;
  restoreCanvasState: (pageId: string) => void;
}

interface MaskRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### API Routes

#### 1. Quick-Start Generation API (`app/api/quick-start/generate/route.ts`)

```typescript
// POST /api/quick-start/generate
interface QuickStartGenerateRequest {
  storyDescription: string;
  genre?: string;
  artStyle: StyleType;
  pageCount: number; // 4-16
}

interface QuickStartGenerateResponse {
  success: boolean;
  projectId: string;
  runId: string; // Trigger.dev run ID for streaming
  accessToken: string; // Public token for accessing run stream
  message: string;
}

// The API creates an empty project record and triggers generateManga task
// Images and content generate asynchronously via Trigger.dev
// Frontend polls /api/generation/status/[jobId] for progress
```

#### 2. Project Management (`app/api/projects/route.ts`)

```typescript
// POST /api/projects - Create empty project
interface CreateProjectRequest {
  title: string;
  style: StyleType;
}

interface CreateProjectResponse {
  projectId: string;
}

// GET /api/projects/[id] - Get project details with all pages, panels, characters
interface GetProjectResponse {
  project: Project;
  pages: Page[];
  characters: Character[];
  script: ProjectScript;
}

// PUT /api/projects/[id] - Update project title/style
// DELETE /api/projects/[id] - Delete project
```

#### 3. Character Management (`app/api/characters/`)

```typescript
// POST /api/characters/generate
interface GenerateCharacterRequest {
  projectId: string;
  name: string;
  method: "description" | "reference-image" | "training-set";
  description?: string;
  referenceImage?: File;
  trainingImages?: File[]; // 12-20 images
}

interface GenerateCharacterResponse {
  characterId: string;
  handle: string; // "@Akira"
  turnaround: {
    front: string;
    side: string;
    back: string;
    threequarter: string;
  };
  expressions: Expression[];
  jobId?: string; // For LoRA training status
}

// POST /api/characters/lora/train
interface TrainLoRARequest {
  characterId: string;
  trainingImages: File[]; // 12-20 images
  triggerWord: string; // e.g., "akira_char"
}

interface TrainLoRAResponse {
  jobId: string;
  estimatedTime: number; // ~180 seconds
}

// GET /api/characters/lora/status/[jobId]
interface LoRAStatusResponse {
  status: "queued" | "training" | "complete" | "failed";
  progress: number; // 0-100
  loraId?: string;
  downloadUrl?: string; // Safetensors file
}

// PUT /api/characters/[id] - Update character (add expressions, outfits)
// DELETE /api/characters/[id] - Delete character
```

#### 4. Script Management (`app/api/projects/[projectId]/script/route.ts`)

```typescript
// GET /api/projects/[projectId]/script
interface GetScriptResponse {
  script: ProjectScript;
}

// PUT /api/projects/[projectId]/script
interface UpdateScriptRequest {
  content: string;
}

interface UpdateScriptResponse {
  script: ProjectScript;
}
```

#### 5. Panel Management (`app/api/projects/[projectId]/panels/route.ts`)

```typescript
// POST /api/projects/[projectId]/panels - Create/update panel
interface UpdatePanelRequest {
  panelId: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  characterHandles?: string[];
  styleLocks?: string[];
  bubbles?: SpeechBubble[];
}

interface UpdatePanelResponse {
  panel: Panel;
}

// POST /api/projects/[projectId]/panels/[panelId]/regenerate
interface RegeneratePanelRequest {
  characterHandles: string[];
  styleLocks: string[];
  // Prompt is reconstructed from context
}

interface RegeneratePanelResponse {
  panelId: string;
  // Image updates via real-time subscription
}

// GET /api/projects/[projectId]/panels/[panelId]/versions
interface GetPanelVersionsResponse {
  versions: PanelVersion[];
}

// POST /api/projects/[projectId]/panels/[panelId]/restore
interface RestorePanelVersionRequest {
  versionId: string;
}

interface RestorePanelVersionResponse {
  panel: Panel;
}
```

#### 6. Character Management (`app/api/projects/[projectId]/characters/route.ts`)

```typescript
// POST /api/projects/[projectId]/characters - Create character
interface CreateCharacterRequest {
  name: string;
  handle: string; // '@Akira'
  description?: string;
  referenceImage?: File;
}

interface CreateCharacterResponse {
  character: Character;
  // Character generation happens async via Trigger.dev
}

// GET /api/projects/[projectId]/characters - List all characters
interface ListCharactersResponse {
  characters: Character[];
}

// PUT /api/projects/[projectId]/characters/[characterId] - Update character
// DELETE /api/projects/[projectId]/characters/[characterId] - Delete character
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Project Creation Precedes Generation

_For any_ project creation request, a project record SHALL exist in the database before any image generation begins.
**Validates: Requirements 13.1**

### Property 2: Character Limit Enforcement

_For any_ project, the system SHALL prevent creation of more than 10 characters per project.
**Validates: Requirements 5.1, 16.10**

### Property 3: Page Limit Enforcement

_For any_ project, the system SHALL prevent creation of more than 30 pages per project.
**Validates: Requirements 13.9, 16.9**

### Property 4: @Handle Persistence

_For any_ character created with an @handle, that @handle SHALL remain permanently associated with the character throughout the project lifetime.
**Validates: Requirements 5.6**

### Property 5: Character Consistency with @Handle

_For any_ panel generated with a character @handle in the prompt, the character's trained LoRA and IP-Adapter references SHALL be automatically applied to maintain >90% visual consistency.
**Validates: Requirements 5.7, 11.2**

### Property 6: Panel Generation Performance

_For any_ panel generation request, the generated image SHALL be delivered within 8 seconds.
**Validates: Requirements 2.5, 11.6, 16.6**

### Property 7: Guided Creation Completion Time

_For any_ guided creation flow from form submission to editable project, the entire process SHALL complete within 5 minutes.
**Validates: Requirements 2.8**

### Property 8: Canvas Mode Support

_For any_ project, the canvas SHALL support both paginated (manga) and infinite scroll (webtoon) modes without data loss or corruption.
**Validates: Requirements 3.2, 7.1, 12.1**

### Property 9: Real-Time Image Population

_For any_ panel with a pending image generation, when the image completes generation, it SHALL appear in the canvas in real-time without requiring a page refresh.
**Validates: Requirements 2.5, 14.4**

### Property 10: Asynchronous Generation with Immediate Editor Access

_For any_ project with pending image generations, the full editor interface SHALL be immediately accessible, allowing text editing, layout adjustments, and character card management.
**Validates: Requirements 2.6, 14.1, 14.5**

### Property 11: Auto-Save Persistence

_For any_ changes made during an editing session, the system SHALL persist those changes to the database within 10 seconds of the change being made.
**Validates: Requirements 13.6**

### Property 12: Project Data Restoration

_For any_ project that is reopened, all pages, panels, character cards, and editing state SHALL be restored to their last saved state.
**Validates: Requirements 13.5**

### Property 13: Page Structure Serialization

_For any_ page, the complete page structure including panel coordinates, prompts, character @handles, and speech bubble data SHALL be serializable to and deserializable from JSON format without data loss.
**Validates: Requirements 13.4**

### Property 14: Export Format Support

_For any_ project export request, the system SHALL support PDF, Webtoon PNG, Tapas, Webtoon, Kindle, and EPUB formats with appropriate specifications for each format.
**Validates: Requirements 8.2, 8.3, 8.4, 8.6**

### Property 15: Export Performance

_For any_ project with up to 20 pages, the export operation SHALL complete and provide a download link within 30 seconds.
**Validates: Requirements 8.7, 16.7**

### Property 16: Outpainting on Panel Resize

_For any_ panel that is resized to be larger than its original dimensions, the system SHALL use outpainting to generate the missing image regions.
**Validates: Requirements 12.4**

### Property 17: Speech Bubble Layer Separation

_For any_ speech bubble, it SHALL be rendered as a separate layer above the panel image, allowing text editing without requiring image regeneration.
**Validates: Requirements 12.5**

### Property 18: Keyboard Shortcut Functionality

_For any_ keyboard shortcut (Cmd+K for quick actions, Cmd+L for Composer), the corresponding UI element or mode SHALL activate when the shortcut is pressed.
**Validates: Requirements 12.7**

### Property 19: Canvas Interaction Performance

_For any_ canvas interaction (pan, zoom, selection), the system SHALL maintain 60 frames per second rendering performance.
**Validates: Requirements 12.8, 16.5**

### Property 20: Page Load Performance

_For any_ page load request, the page SHALL fully load and be interactive within 2 seconds.
**Validates: Requirements 16.4**

### Property 21: Storage Limit Enforcement

_For any_ user, the system SHALL enforce a 10GB storage limit for projects and assets.
**Validates: Requirements 13.3, 16.2**

### Property 22: Free Tier Generation Limit

_For any_ user on the Free tier, the system SHALL limit generations to 50 per day.
**Validates: Requirements 15.3**

### Property 23: Pro Feature Access Control

_For any_ user on the Free tier attempting to use a Pro-only feature, the system SHALL display a feature-specific upgrade prompt.
**Validates: Requirements 15.6**

### Property 24: Style Application Consistency

_For any_ panel generation, the project's selected visual style (Manga, Manhwa, Western Comic, Noir, Chibi, Realistic) SHALL be applied to all generated images.
**Validates: Requirements 11.4**

### Property 25: ControlNet Sketch Integration

_For any_ panel with an uploaded sketch, the system SHALL use ControlNet Scribble to maintain the composition specified in the sketch.
**Validates: Requirements 11.3**

### Property 26: Parallel Panel Generation

_For any_ batch of panels queued for generation, the system SHALL generate multiple panels in parallel to meet the <8 second per panel performance target.
**Validates: Requirements 11.7**

### Property 27: Content Moderation

_For any_ generation request, the system SHALL implement content moderation to prevent NSFW content generation.
**Validates: Requirements 11.8**

### Property 28: Browser-Based Deployment

_For any_ user, the system SHALL be accessible via a web browser without requiring native application installation.
**Validates: Requirements 16.11**

### Property 29: Guided Creation Character Generation

_For any_ project created via Guided Creation, the system SHALL automatically generate character cards with @handles based on the main character description.
**Validates: Requirements 5.10**

### Property 30: Context-Aware Prompt Pre-filling

_For any_ selected panel, the prompt bar SHALL be pre-filled with the character @handles, scene description, and style locks relevant to that panel.
**Validates: Requirements 7.3**

## Data Models

### Database Schema (Supabase/PostgreSQL)

```sql
-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  genre TEXT,
  synopsis TEXT,
  style TEXT NOT NULL, -- 'shonen' | 'shojo' | 'webtoon' | 'american' | etc.
  generation_stage TEXT DEFAULT 'script', -- 'script' | 'characters' | 'storyboard' | 'preview' | 'complete'
  preview_only BOOLEAN DEFAULT true, -- true for quick-start preview, false for full project
  total_pages INTEGER,
  generation_progress JSONB DEFAULT '{"script": 0, "characters": 0, "storyboard": 0, "preview": 0}',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Characters table
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  handle TEXT NOT NULL, -- '@Akira'
  description TEXT,
  reference_images JSONB, -- {front, side, expressions: []}
  turnaround JSONB, -- {front, side, back, threequarter}
  expressions JSONB DEFAULT '[]', -- [{id, name, imageUrl}]
  prompt_triggers TEXT[], -- Trigger words for LoRA
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, handle)
);

-- Pages table
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  width FLOAT NOT NULL DEFAULT 1200,
  height FLOAT NOT NULL DEFAULT 1800,
  layout_data JSONB, -- {template, panels}
  thumbnail_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, page_number)
);

-- Panels table
CREATE TABLE panels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  panel_index INTEGER NOT NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  width FLOAT NOT NULL,
  height FLOAT NOT NULL,
  image_url TEXT, -- NULL while generating
  prompt TEXT,
  character_refs TEXT[], -- Legacy UUID references (deprecated)
  character_handles TEXT[], -- ['@Akira', '@Luna']
  style_locks TEXT[], -- ['dramatic-lighting', 'rain']
  bubbles JSONB DEFAULT '[]', -- [{id, x, y, width, height, text, type}]
  sketch_url TEXT, -- ControlNet sketch reference
  controlnet_strength FLOAT, -- Sketch adherence (0-1)
  generation_params JSONB, -- Generation metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Panel versions (for version history)
CREATE TABLE panel_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  panel_id UUID NOT NULL REFERENCES panels(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Project scripts (one per project)
CREATE TABLE project_scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_generation_stage ON projects(generation_stage);
CREATE INDEX idx_characters_project_id ON characters(project_id);
CREATE INDEX idx_characters_handle ON characters(project_id, handle);
CREATE INDEX idx_pages_project_id ON pages(project_id);
CREATE INDEX idx_panels_page_id ON panels(page_id);
CREATE INDEX idx_panel_versions_panel_id ON panel_versions(panel_id);
```

### TypeScript Types

```typescript
type StyleType =
  | "shonen"
  | "shojo"
  | "chibi"
  | "webtoon"
  | "american"
  | "noir"
  | "ghibli"
  | "cyberpunk"
  | "seinen"
  | "marvel"
  | "manga-classic"
  | "anime-cel";

type LayoutTemplate = "4-koma" | "action-spread" | "standard-grid" | "custom";

type BubbleType = "standard" | "shout" | "whisper" | "thought";

// Project with generation tracking
interface Project {
  id: string;
  userId: string;
  title: string;
  genre?: string;
  synopsis: string;
  style: StyleType;
  generationStage?:
    | "script"
    | "characters"
    | "storyboard"
    | "preview"
    | "complete";
  previewOnly?: boolean; // true for quick-start preview
  totalPages?: number;
  generationProgress?: {
    script: number;
    characters: number;
    storyboard: number;
    preview: number;
  };
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Character with @handle system and LoRA support
interface Character {
  id: string;
  projectId: string;
  name: string;
  handle: string; // '@Akira'
  description?: string;
  referenceImages?: {
    front: string;
    side: string;
    expressions: string[];
  };
  turnaround?: {
    front?: string;
    side?: string;
    back?: string;
    threequarter?: string;
  };
  expressions: Array<{
    id: string;
    name: string;
    imageUrl: string;
  }>;
  promptTriggers: string[]; // Trigger words for LoRA
  createdAt: Date;
  updatedAt?: Date;
}

interface Expression {
  id: string;
  name: string; // 'happy', 'angry', 'crying'
  imageUrl: string;
}

// Page with layout data
interface Page {
  id: string;
  projectId: string;
  pageNumber: number;
  width: number;
  height: number;
  layoutData?: {
    template: LayoutTemplate;
    panels: Panel[];
  };
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Individual panel/frame with ControlNet and generation params
interface Panel {
  id: string;
  pageId: string;
  panelIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl?: string; // NULL while generating
  prompt: string;
  characterRefs?: string[]; // Legacy UUID references (deprecated)
  characterHandles?: string[]; // ['@Akira', '@Luna']
  styleLocks?: string[]; // ['dramatic-lighting', 'rain']
  bubbles: SpeechBubble[];
  sketchUrl?: string; // ControlNet sketch reference
  controlNetStrength?: number; // Sketch adherence (0-1)
  maskRegion?: {
    x: number;
    y: number;
    width: number;
    height: number;
    maskDataUrl?: string;
  };
  generationParams?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Speech bubble/text overlay
interface SpeechBubble {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  type: BubbleType;
}

// Version history for panels
interface PanelVersion {
  id: string;
  panelId: string;
  imageUrl: string;
  createdAt: Date;
}

// Project script/screenplay
interface ProjectScript {
  id: string;
  projectId: string;
  content: string;
  updatedAt: Date;
}

// Generation history for panels
interface GenerationHistory {
  id: string;
  panelId: string;
  imageUrl: string;
  prompt: string;
  characterHandles: string[];
  styleLocks: string[];
  parameters: Record<string, any>;
  createdAt: Date;
}
```

## AI Services Integration

### Trigger.dev Job Orchestration

All async AI operations (script generation, character generation, image generation) are delegated to Trigger.dev for reliable, scalable processing with real-time progress streaming.

#### Main Generation Job (`trigger/manga/generateManga.ts`)

```typescript
// Triggered when user calls POST /api/quick-start/generate
interface GenerateMangaPayload {
  projectId: string;
  storyDescription: string;
  genre?: string;
  artStyle: StyleType;
  pageCount: number; // 4-16
}

// Job steps (sequential with parallel image generation):
// 1. generateScript: Parse story → Generate detailed screenplay
// 2. generateCharacters: Extract characters from script → Create character cards with @handles
// 3. generateStoryboard: Create low-fidelity thumbnails (preview pages only)
// 4. generateCharacterImages: Generate character turnarounds and expressions (parallel)
// 5. generatePageImages: Generate high-res panel images for preview pages (parallel)
// 6. Update project with all generated content
// 7. Emit real-time progress updates via progressStream

// Progress stages:
// - "script": Script generation (0-20%)
// - "characters": Character generation (20-40%)
// - "storyboard": Storyboard generation (40-60%)
// - "preview": Preview image generation (60-100%)
// - "complete": All done
```

### Image Generation Service (`lib/ai/image-generation.ts`)

Abstraction layer for AI image providers (Fal.ai, Replicate, etc.):

```typescript
interface ImageGenerationService {
  generatePanelImage(request: PanelImageRequest): Promise<string>; // Returns image URL
  generateCharacterTurnaround(
    request: CharacterTurnaroundRequest
  ): Promise<CharacterTurnaroundResult>;
}

interface PanelImageRequest {
  prompt: string;
  width: number;
  height: number;
  height: number;
  style: StyleType;
  characterHandles: string[]; // For future LoRA support
  styleLocks: string[];
}

interface PanelImageResult {
  imageUrl: string;
  creditsUsed: number;
}

interface CharacterTurnaroundRequest {
  name: string;
  description: string;
  style: StyleType;
}

interface CharacterTurnaroundResult {
  turnaround: {
    front: string;
    side: string;
    back: string;
    threequarter: string;
  };
  expressions: Array<{ name: string; imageUrl: string }>;
}
```

### LLM Service (`lib/ai/llm-service.ts`)

Abstraction for script parsing and content generation:

```typescript
interface LLMService {
  generateScript(
    premise: string,
    genre: string,
    tone: string,
    pageCount: number
  ): Promise<string>;
  extractCharacters(script: string): Promise<CharacterExtraction[]>;
  generatePanelPrompts(
    script: string,
    characters: Character[],
    style: StyleType
  ): Promise<PanelPrompt[]>;
}

interface CharacterExtraction {
  name: string;
  description: string;
  role: string; // 'protagonist', 'antagonist', 'supporting'
}

interface PanelPrompt {
  panelIndex: number;
  prompt: string;
  characterHandles: string[];
  styleLocks: string[];
}

// Implementation using OpenAI GPT-4o
class OpenAILLMService implements LLMService {
  async generateScript(
    premise: string,
    genre: string,
    tone: string,
    pageCount: number
  ): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: SCRIPT_GENERATION_PROMPT,
        },
        {
          role: "user",
          content: `Premise: ${premise}\nGenre: ${genre}\nTone: ${tone}\nPages: ${pageCount}`,
        },
      ],
    });

    return completion.choices[0].message.content || "";
  }

  async extractCharacters(script: string): Promise<CharacterExtraction[]> {
    const completion = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: CHARACTER_EXTRACTION_PROMPT,
        },
        {
          role: "user",
          content: script,
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content || "[]");
  }

  // ... other methods
}

const SCRIPT_GENERATION_PROMPT = `
You are an expert manga/comic writer. Generate a detailed screenplay for a manga/comic based on the given premise, genre, and tone.

Format as a screenplay with:
- Scene descriptions
- Character dialogue
- Narrative captions
- Sound effects (in manga style)

Make it engaging and visual, suitable for manga adaptation.
`;

const CHARACTER_EXTRACTION_PROMPT = `
Extract all main characters from this manga script. For each character, provide:
- Name
- Brief description (appearance, personality)
- Role (protagonist, antagonist, supporting)

Return as JSON array.
`;
```

## Error Handling

### Frontend Error Handling

1. **Network Errors**: Display toast notifications with retry options
2. **Generation Failures**: Show error state in panel with "Retry" button
3. **Canvas Errors**: Error boundaries with fallback to static view
4. **State Corruption**: Error boundaries around major components

```typescript
// Error boundary for canvas
class CanvasErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError("Canvas Error", { error, errorInfo });
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="canvas-error-fallback">
          <p>Canvas failed to load. Showing static view.</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Backend Error Handling

1. **Trigger.dev Failures**: Automatic retry with exponential backoff
2. **AI Service Failures**: Fallback to alternative providers
3. **Invalid Prompts**: Content moderation before API calls
4. **Storage Failures**: Automatic failover between Supabase Storage and R2
5. **Database Errors**: Retry with jitter for concurrent operations

```typescript
// Trigger.dev job error handling
export const generateMangaJob = task({
  id: "generate-manga",
  run: async (payload: GenerateMangaPayload, { ctx }) => {
    try {
      // Step 1: Generate script
      const script = await generateScript(payload);

      // Step 2: Extract characters
      const characters = await extractCharacters(script);

      // Step 3: Generate images
      const panels = await generatePanelImages(
        script,
        characters,
        payload.style
      );

      // Update project
      await updateProject(payload.projectId, { script, characters, panels });
    } catch (error) {
      // Trigger.dev automatically retries on failure
      throw error;
    }
  },
});
```

## Testing Strategy

### Unit Tests

- **State Management**: Test Zustand store actions and state transitions
- **Utilities**: Test prompt building, coordinate calculations
- **LLM Response Parsing**: Test script parsing and character extraction

### Integration Tests

- **Project Generation**: Test end-to-end comic generation from premise
- **Character Generation**: Test character card creation
- **Panel Management**: Test panel CRUD operations
- **Storage**: Test image upload and retrieval

### End-to-End Tests

- **Generation Flow**: Landing → Create form → Generate comic → Editor
- **Editing Flow**: Open project → Edit script → Update panels → Save
- **Version History**: Generate panel → Regenerate → Restore previous version

### Testing Tools

- **Vitest**: Unit and integration tests
- **React Testing Library**: Component tests
- **Playwright**: E2E tests

## Performance Considerations

### Image Optimization

1. **Lazy Loading**: Load panel images only when within viewport
2. **CDN**: Cloudflare CDN for image delivery with caching
3. **Format**: WebP with JPEG fallback
4. **Responsive Images**: Generate multiple sizes for different viewports

### Canvas Performance

1. **Virtualization**: Render only visible panels
2. **Debouncing**: Debounce drag/resize operations
3. **Caching**: Cache Konva shapes

### Database Performance

1. **Indexing**: Indexes on user_id, project_id, page_id
2. **Query Optimization**: Fetch only needed fields
3. **Pagination**: Limit 50 items per page

## Security Considerations

1. **Authentication**: Supabase Auth with JWT tokens
2. **Authorization**: Row-Level Security (RLS) policies on all tables
3. **Input Validation**: Zod schemas for all API inputs
4. **Rate Limiting**: 100 requests/minute per user
5. **Content Moderation**: OpenAI Moderation API for prompts
6. **API Key Protection**: Environment variables, never exposed to client
7. **CORS**: Strict origin whitelist
8. **SQL Injection**: Parameterized queries only
9. **XSS Prevention**: Sanitize user-generated content, CSP headers
10. **Image Upload**: Validate file types, limit size to 10MB

## Deployment Architecture

### Vercel Deployment

- **Frontend**: Next.js app on Vercel with Edge Runtime
- **API Routes**: Serverless functions for CRUD operations
- **Real-time Updates**: WebSocket or polling for generation progress

### External Services

- **Database**: Supabase (managed PostgreSQL with RLS)
- **Storage**: Supabase Storage for images
- **Async Jobs**: Trigger.dev for reliable job orchestration
- **AI Generation**: Fal.ai for image generation
- **LLM**: OpenAI GPT-4o for script/character generation
- **CDN**: Cloudflare for image delivery
- **Auth**: Supabase Auth (Google, Apple, Discord, Email)

### Infrastructure Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                    │
│  ┌──────────────┐  ┌──────────────┐                      │
│  │   Next.js    │  │  API Routes  │                      │
│  │   Frontend   │  │  (Serverless)│                      │
│  └──────────────┘  └──────────────┘                      │
└────────────────────┬─────────────────────────────────────┘
                     │
        ┏────────────┼────────────┓
        │            │            │
┌───────▼──────┐ ┌───▼────┐ ┌────▼──────┐
│   Supabase   │ │Trigger │ │  Fal.ai   │
│  - Postgres  │ │  .dev  │ │  - Image  │
│  - Storage   │ │ - Jobs │ │Generation │
│  - Auth      │ └────────┘ └───────────┘
└──────────────┘
        │
┌───────▼──────────┐
│   Cloudflare     │
│   CDN (Images)   │
└──────────────────┘
```

### Environment Variables

```bash
# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI Services
OPENAI_API_KEY=sk-...
FAL_API_KEY=...

# Trigger.dev
TRIGGER_API_KEY=...
TRIGGER_API_URL=https://api.trigger.dev

# App
NEXT_PUBLIC_APP_URL=https://manga-ide.com
NEXTAUTH_SECRET=...
```

## Cost Analysis

### Monthly Costs (1000 MAU)

```
Vercel Pro:        $20
Supabase:          $25
Replicate (AI):    $200 (8000 images @ $0.025)
Cloudflare R2:     $15
Domain:            $2
Total:             $262/month
```

### Cost Optimization

- Cache generated images aggressively
- Batch API calls where possible
- Use smaller models for drafts
- Implement credit system early

## Future Enhancements (2026 Roadmap)

### Q1 2026

1. **Collaborative Editing**: Real-time collaboration using Supabase Realtime, multiple cursors, conflict resolution
2. **Mobile Companion App**: iOS/Android app for voice commands, sketch upload, read-only view
3. **Advanced Export**: Animated WebP with ken-burns, direct upload to Webtoon/Tapas/Kindle

### Q2 2026

4. **Voice Mode**: Full voice-to-panel workflow, voice acting generation for characters
5. **Marketplace**: Share and sell character LoRAs, style presets, panel templates
6. **Team Workspaces**: Multi-user projects with role-based permissions

### Q3 2026

7. **Video Export**: Convert comics to animated videos with panel transitions, voice acting, music
8. **3D Character Models**: Generate 3D models from character sheets for consistent 3D panels
9. **AI Director Mode**: AI suggests panel compositions, camera angles, pacing

### Q4 2026

10. **Print-on-Demand**: Direct integration with print services (Blurb, Lulu, Amazon KDP)
11. **Translation**: Auto-translate comics to 20+ languages with cultural adaptation
12. **Version Control**: Git-like branching, merging, pull requests for comic projects
