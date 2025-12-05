/**
 * Manga Generation Pipeline
 * 
 * Enhanced flow with parallelization and quality improvements:
 * 
 * PHASE 1: FOUNDATION (Parallel)
 * - analyzeStory: Story analysis with dramatic core
 * - extractRoughCharacters: Quick character extraction from prompt
 * - generateStyleAnchor: Visual style establishment
 * 
 * PHASE 2: SCRIPT + CHARACTERS
 * - generateScript: Full script generation
 * - enhanceScriptDrama: Drama doctor pass
 * - extractCharacters: Detailed character extraction with consistency
 * - generateCharacters: Database record creation
 * - generateCharacterImages: Character design sheets
 * 
 * PHASE 3: PANEL GENERATION
 * - generateStoryboard: Layout planning
 * - generatePageImages: Batched panel generation with style anchor
 * - scorePanelQuality: Quality assessment (optional)
 * 
 * PHASE 4: ASSEMBLY
 * - generateSmartBubbles: Intelligent bubble positioning
 */

// Main orchestrator
export { generateManga } from "./generateManga";

// Phase 1: Foundation
export { analyzeStory } from "./analyzeStory";
export { extractRoughCharacters } from "./extractRoughCharacters";
export { generateStyleAnchor } from "./generateStyleAnchor";

// Phase 2: Script + Characters
export { generateScript } from "./generateScript";
export { enhanceScriptDrama } from "./enhanceScriptDrama";
export { extractCharacters } from "./extractCharacters";
export { generateCharacters } from "./generateCharacters";
export { generateCharacterImages } from "./generateCharacterImages";

// Phase 3: Panel Generation
export { generateStoryboard } from "./generateStoryboard";
export { generatePageImages } from "./generatePageImages";
export { scorePanelQuality, adjustPromptFromIssues } from "./scorePanelQuality";

// Phase 4: Assembly
export { generateSmartBubbles } from "./generateSmartBubbles";

// Export types
export type { Script, Character, Panel, Page } from "./types";
export { formatScriptAsText } from "./types";

// Export analysis types
export type { StoryAnalysis, DramaticCore } from "./analyzeStory";
export type { ExtractedCharacter, VisualAnchors } from "./extractCharacters";
export type { RoughCharacter } from "./extractRoughCharacters";
export type { StyleAnchorData } from "./generateStyleAnchor";
export type { PanelQualityScore } from "./scorePanelQuality";
