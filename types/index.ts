// Core type definitions for Manga IDE

// Enums and type aliases
export type StyleType =
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

export type LayoutTemplateType =
  | "4-koma"
  | "action-spread"
  | "standard-grid"
  | "custom";

export type BubbleType = "standard" | "shout" | "whisper" | "thought";

// Re-export layout types
export type {
  LayoutTemplate,
  PanelTemplate,
  PanelMargins,
  BubbleTemplate,
  PageMargins,
  AbsolutePosition,
  RelativePosition,
  SafeArea,
  RenderedPanel,
  RenderedBubble,
  RenderedPage,
  GridType,
  PanelType,
  LayoutTag,
} from './layouts';

// Re-export database models
export type {
  ProjectModel,
  CharacterModel,
  PageModel,
  PanelModel,
  SpeechBubbleModel,
  // GenerationHistoryModel,
} from "./models";

export type CanvasMode = "paginated" | "webtoon-vertical";

// export interface Project {
//   id: string;
//   userId: string;
//   title: string;
//   genre: string;
//   synopsis: string;
//   style: StyleType;
//   canvasMode?: CanvasMode;
//   createdAt: Date;
//   updatedAt: Date;
// }

export interface Character {
  id: string;
  projectId: string;
  name: string;
  handle: string; // e.g., "@Akira"
  description: string;
  referenceImages: {
    front: string;
    side: string;
    expressions: string[];
  };
  turnaround: {
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
  promptTriggers: string[];
  createdAt: Date;
}

export interface Page {
  id: string;
  projectId: string;
  pageNumber: number;
  width: number
  height: number
  layoutTemplateId?: string; // ID of the applied layout template
  // layoutData: {
  //   template: LayoutTemplate;
  //   panels: Panel[];
  // };
  createdAt: Date;
  updatedAt: Date;
}

export interface Panel {
  id: string; //
  pageId: string; //
  panelIndex: number; // 
  x: number; //
  y: number; //
  width: number; // 
  height: number; //
  imageUrl?: string; //
  prompt: string; //
  characterRefs: string[]; // Legacy field
  characterHandles?: string[]; // New @handle references (e.g., ["@Akira", "@Luna"])
  styleLocks?: string[]; // Style elements to preserve (e.g., ["dramatic-lighting", "rain"])
  bubbles: SpeechBubble[];
  sketchUrl?: string; // ControlNet sketch reference
  controlNetStrength?: number; // Sketch adherence strength (0-1)
  // maskRegion?: {
  //   x: number;
  //   y: number;
  //   width: number;
  //   height: number;
  //   maskDataUrl?: string;
  // };
  generationParams?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SpeechBubble {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  type: BubbleType;
}

export interface GenerationHistory {
  id: string;
  panelId: string;
  imageUrl: string;
  prompt: string;
  characterHandles: string[];
  styleLocks: string[];
  parameters: Record<string, any>;
  createdAt: Date;
}

export type ReferenceType =
  | "background"
  | "style"
  | "character-ref"
  | "moodboard";

export interface Reference {
  id: string;
  projectId: string;
  name: string;
  type: ReferenceType;
  imageUrl: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
