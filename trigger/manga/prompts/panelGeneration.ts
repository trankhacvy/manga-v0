/**
 * Panel Generation Prompts
 * Used to generate individual manga panel images
 * Enhanced with Character Reference Indexing for better consistency
 */

// ============================================
// COMPRESSED PANEL PROMPT (NEW)
// Optimized for 5000-char limit
// ============================================
export const PANEL_GENERATION_PROMPT_COMPRESSED = `Manga panel, {artStyle} style, B&W.

SCENE: {sceneDescription}
SHOT: {shotType}, {cameraAngle}
MOOD: {emotion}

CHARACTERS:
{characterBlock}

{visualNotes}

Technical: Clean lineart, manga screentones, {shotType} composition, professional quality.`;

// ============================================
// FULL PANEL PROMPT (for when we have space)
// ============================================
export const PANEL_GENERATION_PROMPT = `Professional manga panel illustration.

**Scene Description:**
{sceneDescription}

**Characters in Scene:**
{characterDescriptions}

**Shot Type:** {shotType}
**Camera Angle:** {cameraAngle}
**Emotion/Mood:** {emotion}

**Visual Notes:**
{visualNotes}

**Art Style:** {artStyle} manga panel art

**Technical Requirements:**
- Black and white manga illustration
- Clean line art with professional inking
- Manga-style screentones for shading
- Dynamic composition following {shotType} framing
- {cameraAngle} perspective
- Clear visual hierarchy and focal point
- Leave appropriate space for speech bubbles
- Panel borders and gutters appropriate for manga layout

**Character Rendering:**
{characterRenderingInstructions}

**Composition Guidelines:**
- Follow rule of thirds
- Create clear visual flow
- Establish depth with foreground/background
- Use manga visual language (speedlines, impact frames, etc.)
- Appropriate level of detail for {shotType}

**Style Specifications:**
- {artStyle} aesthetic
- Professional manga illustration quality
- Clear, readable composition
- Appropriate tone for {emotion} mood
- Genre-appropriate visual treatment

This panel is part of a manga page sequence. Ensure it reads clearly and maintains visual consistency with the story.`;

export const PANEL_GENERATION_NEGATIVE_PROMPT = [
  'color',
  'colored',
  'realistic photo',
  '3d render',
  'speech bubbles',
  'text',
  'dialogue',
  'watermark',
  'low quality',
  'blurry',
  'messy',
  'unclear composition',
  'crowded',
  'confusing layout',
];

// ============================================
// CHARACTER BLOCK BUILDER (NEW)
// Uses indexed references with consistency strings
// ============================================

interface CharacterForPanel {
  name: string;
  handle: string;
  consistencyString: string;
  description?: string;
  imageDescription?: string;
  position?: string;
  action?: string;
  expression?: string;
}

/**
 * Build a compact character reference block using indexed references
 * Each character gets ~100 chars max (their consistency string)
 */
export function buildCharacterBlock(characters: CharacterForPanel[]): string {
  if (characters.length === 0) {
    return 'No characters in this panel.';
  }
  
  return characters.map((char, idx) => 
    `[CHAR_${idx + 1}] ${char.handle}: ${char.consistencyString}`
  ).join('\n');
}

/**
 * Build character descriptions (full version for when we have space)
 */
export function buildCharacterDescriptions(characters: Array<{
  name: string;
  handle: string;
  description: string;
  imageDescription?: string;
}>): string {
  if (characters.length === 0) {
    return 'No characters in this panel.';
  }
  
  return characters.map((char, idx) => {
    const imageInfo = char.imageDescription 
      ? `\n  Reference: ${char.imageDescription}`
      : '';
    return `${idx + 1}. ${char.handle} (${char.name}): ${char.description}${imageInfo}`;
  }).join('\n\n');
}

/**
 * Build character rendering instructions
 */
export function buildCharacterRenderingInstructions(characters: Array<{
  name: string;
  handle: string;
  position?: string;
  action?: string;
  expression?: string;
}>): string {
  if (characters.length === 0) {
    return 'No characters to render in this panel.';
  }
  
  return characters.map((char, idx) => {
    const parts = [`${idx + 1}. Render ${char.handle} (${char.name})`];
    
    if (char.position) parts.push(`positioned ${char.position}`);
    if (char.action) parts.push(`${char.action}`);
    if (char.expression) parts.push(`with ${char.expression} expression`);
    
    return parts.join(' ');
  }).join('\n');
}

/**
 * Build reference header for character images
 * Maps image indices to character handles
 */
export function buildReferenceHeader(characters: CharacterForPanel[]): string {
  if (characters.length === 0) return '';
  
  return characters.map((char, idx) => 
    `REF_${idx + 1}: See attached image ${idx + 1} for ${char.handle} appearance`
  ).join('. ');
}

// ============================================
// PROMPT BUDGET SYSTEM (NEW)
// Allocates character budget based on importance
// ============================================

interface PromptBudget {
  scene: number;      // 40% - what's happening
  characters: number; // 30% - who's in it
  style: number;      // 20% - how it looks
  technical: number;  // 10% - composition/shot type
}

/**
 * Build a compressed prompt that fits within token limits
 * Uses hierarchical compression based on importance
 */
export function buildCompressedPanelPrompt(params: {
  sceneDescription: string;
  characters: CharacterForPanel[];
  shotType: string;
  cameraAngle: string;
  emotion: string;
  visualNotes: string;
  artStyle: string;
  maxLength?: number;
}): string {
  const maxLength = params.maxLength || 4900;
  
  const budget: PromptBudget = {
    scene: Math.floor(maxLength * 0.4),
    characters: Math.floor(maxLength * 0.3),
    style: Math.floor(maxLength * 0.2),
    technical: Math.floor(maxLength * 0.1),
  };
  
  // Build each section within budget
  const sceneSection = compressText(params.sceneDescription, budget.scene);
  const characterBlock = buildCharacterBlock(params.characters);
  const characterSection = compressText(characterBlock, budget.characters);
  const visualNotesSection = params.visualNotes ? `NOTES: ${compressText(params.visualNotes, 100)}` : '';
  
  const prompt = PANEL_GENERATION_PROMPT_COMPRESSED
    .replace('{artStyle}', params.artStyle)
    .replace('{sceneDescription}', sceneSection)
    .replace('{shotType}', params.shotType)
    .replace('{cameraAngle}', params.cameraAngle)
    .replace('{emotion}', params.emotion)
    .replace('{characterBlock}', characterSection)
    .replace('{visualNotes}', visualNotesSection);
  
  return prompt;
}

/**
 * Compress text to fit within character limit
 * Removes filler words and extracts key information
 */
function compressText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  
  // Remove filler words
  const fillers = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'very', 'really', 'just', 'that', 'this'];
  let words = text.split(' ');
  
  // First pass: remove fillers
  if (words.length > 10) {
    words = words.filter(w => !fillers.includes(w.toLowerCase()));
  }
  
  let result = words.join(' ');
  
  // If still too long, truncate
  if (result.length > maxChars) {
    result = result.substring(0, maxChars - 3) + '...';
  }
  
  return result;
}

/**
 * Build full panel prompt (when we have space)
 */
export function buildPanelPrompt(panel: {
  sceneDescription: string;
  characters: Array<{
    name: string;
    handle: string;
    description: string;
    imageDescription?: string;
    position?: string;
    action?: string;
    expression?: string;
  }>;
  shotType: string;
  cameraAngle: string;
  emotion: string;
  visualNotes: string;
  artStyle: string;
}): string {
  return PANEL_GENERATION_PROMPT
    .replace('{sceneDescription}', panel.sceneDescription)
    .replace('{characterDescriptions}', buildCharacterDescriptions(panel.characters))
    .replace('{shotType}', panel.shotType)
    .replace('{cameraAngle}', panel.cameraAngle)
    .replace('{emotion}', panel.emotion)
    .replace('{visualNotes}', panel.visualNotes)
    .replace(/{artStyle}/g, panel.artStyle)
    .replace('{characterRenderingInstructions}', buildCharacterRenderingInstructions(panel.characters));
}

export const SHOT_TYPE_DESCRIPTIONS = {
  'wide': 'Wide shot showing full scene and environment',
  'medium': 'Medium shot showing characters from waist up',
  'close-up': 'Close-up shot focusing on character face and upper body',
  'extreme-close-up': 'Extreme close-up on specific detail (eyes, hands, object)',
  'establishing': 'Establishing shot showing location and setting',
};

export const CAMERA_ANGLE_DESCRIPTIONS = {
  'eye-level': 'Eye-level angle, neutral perspective',
  'high-angle': 'High angle looking down, makes subject appear smaller/vulnerable',
  'low-angle': 'Low angle looking up, makes subject appear powerful/imposing',
  'birds-eye': 'Birds-eye view from directly above',
  'worms-eye': 'Worms-eye view from ground level looking up',
  'dutch-angle': 'Dutch angle (tilted), creates tension and unease',
};
