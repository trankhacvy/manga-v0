/**
 * Centralized prompt management system for manga generation
 * All prompts are defined here for easy updates and versioning
 * 
 * Enhanced with:
 * - Hierarchical prompt compression for token limits
 * - Smart truncation that preserves meaning
 * - Budget allocation system
 */

export interface PromptVariables {
  [key: string]: string | number | boolean | undefined | null | any;
}

/**
 * Interpolate variables into a prompt template
 */
export function buildPrompt(template: string, variables: PromptVariables): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(placeholder, String(value ?? ''));
  }
  
  return result;
}

/**
 * Build a negative prompt for image generation
 */
export function buildNegativePrompt(additions: string[] = []): string {
  const baseNegative = [
    'realistic',
    'photo',
    '3d',
    'render',
    'low quality',
    'blurry',
    'watermark',
    'text',
    'signature',
    'username',
    'multiple views',
    'crowded',
    'messy',
  ];
  
  return [...baseNegative, ...additions].join(', ');
}

// ============================================
// HIERARCHICAL PROMPT COMPRESSION SYSTEM
// ============================================

interface PromptBudget {
  scene: number;      // 40% - what's happening
  characters: number; // 30% - who's in it
  style: number;      // 20% - how it looks
  technical: number;  // 10% - composition/shot type
}

const DEFAULT_BUDGET: PromptBudget = {
  scene: 0.4,
  characters: 0.3,
  style: 0.2,
  technical: 0.1,
};

// Filler words to remove during compression
const FILLER_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'very', 'really', 'just', 'that', 'this', 'these', 'those',
  'and', 'but', 'or', 'so', 'yet', 'for', 'nor',
  'in', 'on', 'at', 'to', 'of', 'with', 'by', 'from',
  'it', 'its', "it's",
]);

// High-priority keywords to preserve
const PRIORITY_KEYWORDS = new Set([
  // Visual elements
  'black', 'white', 'dark', 'light', 'shadow', 'bright',
  'tall', 'short', 'large', 'small', 'big', 'tiny',
  'young', 'old', 'elderly', 'teen', 'child', 'adult',
  // Actions
  'running', 'fighting', 'standing', 'sitting', 'walking', 'jumping',
  'crying', 'laughing', 'smiling', 'frowning', 'angry', 'sad', 'happy',
  // Composition
  'close-up', 'wide', 'medium', 'establishing',
  'eye-level', 'high-angle', 'low-angle', 'dutch-angle',
  // Style
  'manga', 'anime', 'lineart', 'screentone', 'professional',
]);

/**
 * Compress text to fit within character limit while preserving meaning
 * Uses intelligent truncation that keeps the most critical parts
 */
export function compressToTokens(text: string, targetChars: number): string {
  if (text.length <= targetChars) return text;
  
  const words = text.split(/\s+/);
  
  // If very short target, just truncate
  if (targetChars < 50) {
    return text.substring(0, targetChars - 3) + '...';
  }
  
  // First pass: remove filler words (but keep priority keywords)
  let filtered = words.filter(word => {
    const lower = word.toLowerCase().replace(/[.,!?;:'"]/g, '');
    // Keep if it's a priority keyword
    if (PRIORITY_KEYWORDS.has(lower)) return true;
    // Remove if it's a filler word
    if (FILLER_WORDS.has(lower)) return false;
    // Keep everything else
    return true;
  });
  
  let result = filtered.join(' ');
  
  // If still too long, extract key nouns and adjectives
  if (result.length > targetChars) {
    // Keep only words that are likely important (longer words, capitalized, etc.)
    filtered = filtered.filter(word => {
      const lower = word.toLowerCase();
      // Keep priority keywords
      if (PRIORITY_KEYWORDS.has(lower)) return true;
      // Keep longer words (likely nouns/adjectives)
      if (word.length >= 5) return true;
      // Keep capitalized words (likely names/places)
      if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) return true;
      // Keep numbers
      if (/\d/.test(word)) return true;
      return false;
    });
    
    result = filtered.join(' ');
  }
  
  // Final hard truncate if needed
  if (result.length > targetChars) {
    result = result.substring(0, targetChars - 3) + '...';
  }
  
  return result;
}

/**
 * Truncate a prompt to fit within character limit while preserving important information
 * Uses intelligent truncation that keeps the most critical parts
 */
export function truncatePrompt(prompt: string, maxLength: number = 5000): string {
  if (prompt.length <= maxLength) {
    return prompt;
  }

  // Split prompt into sections
  const sections = prompt.split('\n\n');
  
  // Priority order: keep most important sections first
  const prioritySections: string[] = [];
  const otherSections: string[] = [];
  
  sections.forEach(section => {
    const lowerSection = section.toLowerCase();
    // High priority: scene description, characters, technical specs
    if (
      lowerSection.includes('scene description:') ||
      lowerSection.includes('scene:') ||
      lowerSection.includes('characters in scene:') ||
      lowerSection.includes('characters:') ||
      lowerSection.includes('art style:') ||
      lowerSection.includes('style:') ||
      lowerSection.includes('technical requirements:') ||
      lowerSection.includes('technical:') ||
      lowerSection.includes('shot type:') ||
      lowerSection.includes('shot:') ||
      lowerSection.includes('camera angle:') ||
      lowerSection.includes('mood:')
    ) {
      prioritySections.push(section);
    } else {
      otherSections.push(section);
    }
  });
  
  // Start with priority sections
  let result = prioritySections.join('\n\n');
  
  // Add other sections if space allows
  for (const section of otherSections) {
    const testResult = result + '\n\n' + section;
    if (testResult.length <= maxLength - 100) { // Leave 100 char buffer
      result = testResult;
    } else {
      break;
    }
  }
  
  // If still too long, compress individual sections
  if (result.length > maxLength) {
    const lines = result.split('\n');
    result = '';
    
    for (const line of lines) {
      const testResult = result + (result ? '\n' : '') + line;
      if (testResult.length <= maxLength - 50) {
        result = testResult;
      } else {
        break;
      }
    }
  }
  
  // Final hard truncate if needed
  if (result.length > maxLength) {
    result = result.substring(0, maxLength - 3) + '...';
  }
  
  return result;
}

/**
 * Build a concise prompt optimized for character limits
 * Focuses on essential visual information only
 */
export function buildConcisePrompt(params: {
  scene: string;
  characters?: string[];
  style: string;
  shotType?: string;
  mood?: string;
  avoid?: string;
}): string {
  const parts: string[] = [];
  
  // Core scene (most important)
  parts.push(params.scene);
  
  // Characters (if any)
  if (params.characters && params.characters.length > 0) {
    parts.push(`Characters: ${params.characters.join(', ')}`);
  }
  
  // Shot type and mood
  if (params.shotType) {
    parts.push(`${params.shotType} shot`);
  }
  
  if (params.mood) {
    parts.push(`${params.mood} mood`);
  }
  
  // Style
  parts.push(`${params.style} manga art`);
  
  // Technical specs
  parts.push('Black and white manga illustration, clean line art, professional quality');
  
  // Avoid (negative prompt)
  if (params.avoid) {
    parts.push(`Avoid: ${params.avoid}`);
  }
  
  return parts.join('. ');
}

/**
 * Build a compressed prompt with budget allocation
 * Ensures each section gets appropriate space within the limit
 */
export function buildBudgetedPrompt(params: {
  scene: string;
  characters: string;
  style: string;
  technical: string;
  maxLength?: number;
  budget?: Partial<PromptBudget>;
}): string {
  const maxLength = params.maxLength || 4900;
  const budget = { ...DEFAULT_BUDGET, ...params.budget };
  
  // Calculate character budgets
  const sceneBudget = Math.floor(maxLength * budget.scene);
  const charactersBudget = Math.floor(maxLength * budget.characters);
  const styleBudget = Math.floor(maxLength * budget.style);
  const technicalBudget = Math.floor(maxLength * budget.technical);
  
  // Compress each section to fit budget
  const sceneSection = compressToTokens(params.scene, sceneBudget);
  const charactersSection = compressToTokens(params.characters, charactersBudget);
  const styleSection = compressToTokens(params.style, styleBudget);
  const technicalSection = compressToTokens(params.technical, technicalBudget);
  
  // Combine sections
  const parts = [
    sceneSection,
    charactersSection,
    styleSection,
    technicalSection,
  ].filter(Boolean);
  
  return parts.join('\n\n');
}

// ============================================
// EXPORTS
// ============================================

export {
  FILLER_WORDS,
  PRIORITY_KEYWORDS,
  DEFAULT_BUDGET,
  type PromptBudget,
};
