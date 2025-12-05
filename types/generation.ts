// Generation flow types for the new detailed pipeline

export interface StoryAnalysis {
  mainTheme: string;
  setting: {
    time: string;
    location: string;
    atmosphere: string;
  };
  tonalShifts: Array<{
    page: number;
    tone: string;
  }>;
  keyScenes: Array<{
    description: string;
    importance: "high" | "medium" | "low";
    suggestedPanels: number;
  }>;
  pacing: {
    opening: "slow" | "medium" | "fast";
    middle: string;
    climax: string;
    resolution: string;
  };
}

export interface EnhancedCharacter {
  name: string;
  description: string;
  role?: "protagonist" | "antagonist" | "supporting";
  age?: string;
  gender?: string;
  personality?: string;
  appearance?: {
    hairColor: string;
    hairStyle: string;
    eyeColor: string;
    height: string;
    build: string;
    distinctiveFeatures: string;
  };
  outfit?: {
    main: string;
    alternative?: string;
  };
}

export interface EnhancedPanel {
  panelNumber: number;
  sceneDescription: string;
  prompt: string;
  shotType: "wide" | "medium" | "close-up" | "extreme-close-up" | "establishing";
  cameraAngle: "eye-level" | "high-angle" | "low-angle" | "birds-eye" | "worms-eye" | "dutch-angle";
  characters: string[];
  dialogue: string;
  narration: string;
  soundEffects: string[];
  emotion: string;
  visualNotes: string;
}

export interface EnhancedPage {
  pageNumber: number;
  layoutSuggestion: "grid-4" | "grid-6" | "action-spread" | "focus-panel";
  panels: EnhancedPanel[];
}

export interface BubblePosition {
  text: string;
  type: "thought" | "speech" | "shout" | "whisper";
  speaker: string; // @handle
  position: {
    x: number; // percentage from left
    y: number; // percentage from top
    width: number; // percentage
    height: number; // percentage
  };
  tailDirection: "bottom-left" | "bottom-right" | "top-left" | "top-right" | "left" | "right";
}

export type GenerationStage =
  | "analyzing"
  | "script"
  | "characters"
  | "designs"
  | "layouts"
  | "panels"
  | "dialogue"
  | "finalizing"
  | "complete";

export interface GenerationProgress {
  stage: GenerationStage;
  progress: number; // 0-100
  message: string;
  timestamp: string;
  estimatedTimeRemaining?: number;
  data?: {
    analysis?: {
      theme: string;
      setting: string;
    };
    script?: {
      title: string;
      characterCount: number;
      pageCount: number;
    };
    characters?: Array<{
      id: string;
      name: string;
      imageUrl?: string;
    }>;
    designs?: {
      completed: number;
      total: number;
    };
    layouts?: {
      pageCount: number;
    };
    panels?: {
      completed: number;
      total: number;
    };
  };
}
