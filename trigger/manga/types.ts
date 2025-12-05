/**
 * Shared types for manga generation pipeline
 */

export type LayoutTemplateId = 
  | "dialogue-4panel"
  | "action-6panel"
  | "establishing-3panel"
  | "splash-single"
  | "mixed-5panel"
  | "grid-8panel";

export type StoryBeat = 
  | "introduction"
  | "rising-action"
  | "climax"
  | "resolution"
  | "transition";

export type ShotType = 
  | "wide"
  | "medium"
  | "close-up"
  | "extreme-close-up"
  | "establishing";

export type CameraAngle = 
  | "eye-level"
  | "high-angle"
  | "low-angle"
  | "birds-eye"
  | "worms-eye"
  | "dutch-angle";

export interface Character {
  name: string;
  description: string;
}

export interface Panel {
  panelNumber: number;
  sceneDescription: string;
  prompt: string;
  shotType: ShotType;
  cameraAngle: CameraAngle;
  characters: string[];
  dialogue: string;
  narration: string;
  soundEffects: string[];
  emotion: string;
  visualNotes: string;
}

export interface Page {
  pageNumber: number;
  layoutSuggestion: "grid-4" | "grid-6" | "action-spread" | "focus-panel";
  layoutTemplateId: LayoutTemplateId;
  storyBeat: StoryBeat;
  panels: Panel[];
}

export interface Script {
  title: string;
  characters: Character[];
  pages: Page[];
}

/**
 * Format script as readable text for LLM prompts
 */
export function formatScriptAsText(script: Script): string {
  let text = `MANGA SCRIPT: "${script.title}"\n\n`;
  
  text += `CHARACTERS:\n`;
  script.characters.forEach((char, idx) => {
    text += `${idx + 1}. ${char.name}: ${char.description}\n`;
  });
  
  text += `\n${"=".repeat(80)}\n\n`;
  
  script.pages.forEach((page) => {
    text += `PAGE ${page.pageNumber} (Layout: ${page.layoutSuggestion})\n`;
    text += `${"-".repeat(80)}\n\n`;
    
    page.panels.forEach((panel) => {
      text += `  Panel ${panel.panelNumber}:\n`;
      text += `    Scene: ${panel.sceneDescription}\n`;
      text += `    Shot: ${panel.shotType} / ${panel.cameraAngle}\n`;
      text += `    Characters: ${panel.characters.join(", ") || "None"}\n`;
      text += `    Emotion: ${panel.emotion}\n`;
      
      if (panel.dialogue) {
        text += `    Dialogue: "${panel.dialogue}"\n`;
      }
      
      if (panel.narration) {
        text += `    Narration: "${panel.narration}"\n`;
      }
      
      if (panel.soundEffects.length > 0) {
        text += `    SFX: ${panel.soundEffects.join(", ")}\n`;
      }
      
      if (panel.visualNotes) {
        text += `    Visual Notes: ${panel.visualNotes}\n`;
      }
      
      text += `\n`;
    });
    
    text += `\n`;
  });
  
  return text;
}
