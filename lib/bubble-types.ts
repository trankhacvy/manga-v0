/**
 * Bubble Type Definitions
 * 
 * Defines predefined speech bubble types with default styling.
 * Each bubble type has specific visual characteristics for different
 * types of dialogue and narration.
 */

export type BubbleShape = 'ellipse' | 'rectangle' | 'cloud' | 'jagged' | 'whisper';
export type TailType = 'standard' | 'thought' | 'scream' | 'none';

/**
 * Default style configuration for a bubble type
 */
export interface BubbleStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  textColor: string;
  padding: number;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
}

/**
 * Complete bubble type definition
 */
export interface BubbleTypeDefinition {
  id: string;
  name: string;
  description: string;
  shape: BubbleShape;
  tailType: TailType;
  defaultStyle: BubbleStyle;
  tags: string[];
}

/**
 * Standard Speech Bubble
 * Classic oval/ellipse bubble for normal dialogue
 */
export const STANDARD_BUBBLE: BubbleTypeDefinition = {
  id: 'standard',
  name: 'Standard Speech',
  description: 'Classic speech bubble for normal dialogue',
  shape: 'ellipse',
  tailType: 'standard',
  defaultStyle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    borderWidth: 2,
    fontSize: 14,
    fontFamily: '"Comic Sans MS", "Manga Temple", sans-serif',
    fontWeight: 'normal',
    textColor: '#000000',
    padding: 12,
    lineHeight: 1.3,
    textAlign: 'center',
    textTransform: 'none',
  },
  tags: ['dialogue', 'speech', 'normal'],
};

/**
 * Thought Bubble
 * Cloud-shaped bubble for internal thoughts
 */
export const THOUGHT_BUBBLE: BubbleTypeDefinition = {
  id: 'thought',
  name: 'Thought Bubble',
  description: 'Cloud-shaped bubble for internal thoughts',
  shape: 'cloud',
  tailType: 'thought',
  defaultStyle: {
    backgroundColor: '#F8F8F8',
    borderColor: '#666666',
    borderWidth: 2,
    fontSize: 13,
    fontFamily: '"Comic Sans MS", "Manga Temple", sans-serif',
    fontWeight: 'normal',
    textColor: '#333333',
    padding: 14,
    lineHeight: 1.4,
    textAlign: 'center',
    textTransform: 'none',
  },
  tags: ['thought', 'internal', 'monologue'],
};

/**
 * Shout/Scream Bubble
 * Jagged/spiky bubble for shouting or screaming
 */
export const SHOUT_BUBBLE: BubbleTypeDefinition = {
  id: 'shout',
  name: 'Shout Bubble',
  description: 'Jagged bubble for shouting or screaming',
  shape: 'jagged',
  tailType: 'scream',
  defaultStyle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
    borderWidth: 3,
    fontSize: 16,
    fontFamily: '"Comic Sans MS", "Manga Temple", sans-serif',
    fontWeight: 'bold',
    textColor: '#000000',
    padding: 10,
    lineHeight: 1.2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  tags: ['shout', 'scream', 'loud', 'emphasis'],
};

/**
 * Whisper Bubble
 * Dashed border bubble for whispers or quiet speech
 */
export const WHISPER_BUBBLE: BubbleTypeDefinition = {
  id: 'whisper',
  name: 'Whisper Bubble',
  description: 'Dashed border bubble for whispers',
  shape: 'whisper',
  tailType: 'standard',
  defaultStyle: {
    backgroundColor: '#FFFFFF',
    borderColor: '#999999',
    borderWidth: 1,
    fontSize: 12,
    fontFamily: '"Comic Sans MS", "Manga Temple", sans-serif',
    fontWeight: 'normal',
    textColor: '#666666',
    padding: 10,
    lineHeight: 1.3,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  tags: ['whisper', 'quiet', 'soft'],
};

/**
 * Narration Box
 * Rectangular box for narration or captions
 */
export const NARRATION_BOX: BubbleTypeDefinition = {
  id: 'narration',
  name: 'Narration Box',
  description: 'Rectangular box for narration or captions',
  shape: 'rectangle',
  tailType: 'none',
  defaultStyle: {
    backgroundColor: '#FFFACD',
    borderColor: '#000000',
    borderWidth: 2,
    fontSize: 13,
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontWeight: 'normal',
    textColor: '#000000',
    padding: 12,
    lineHeight: 1.5,
    textAlign: 'left',
    textTransform: 'none',
  },
  tags: ['narration', 'caption', 'description'],
};

/**
 * All available bubble types
 */
export const BUBBLE_TYPES: BubbleTypeDefinition[] = [
  STANDARD_BUBBLE,
  THOUGHT_BUBBLE,
  SHOUT_BUBBLE,
  WHISPER_BUBBLE,
  NARRATION_BOX,
];

/**
 * Get bubble type by ID
 */
export function getBubbleType(id: string): BubbleTypeDefinition | undefined {
  return BUBBLE_TYPES.find(type => type.id === id);
}

/**
 * Get all available bubble types
 */
export function getAllBubbleTypes(): BubbleTypeDefinition[] {
  return BUBBLE_TYPES;
}

/**
 * Get bubble types by tag
 */
export function getBubbleTypesByTag(tag: string): BubbleTypeDefinition[] {
  return BUBBLE_TYPES.filter(type => type.tags.includes(tag));
}

/**
 * Get default bubble type (standard)
 */
export function getDefaultBubbleType(): BubbleTypeDefinition {
  return STANDARD_BUBBLE;
}

/**
 * Auto-detect bubble type from text content
 * Uses heuristics to determine the most appropriate bubble type
 */
export function detectBubbleType(text: string): BubbleTypeDefinition {
  const trimmedText = text.trim();
  
  // Check for empty text
  if (!trimmedText) {
    return STANDARD_BUBBLE;
  }
  
  // Count uppercase characters
  const upperCaseCount = (trimmedText.match(/[A-Z]/g) || []).length;
  const upperCaseRatio = upperCaseCount / trimmedText.length;
  
  // Check for special indicators
  const hasMultipleExclamation = trimmedText.includes('!!') || trimmedText.includes('!!!');
  const hasEllipsis = trimmedText.includes('...');
  const hasParentheses = trimmedText.startsWith('(') && trimmedText.endsWith(')');
  const hasBrackets = trimmedText.startsWith('[') && trimmedText.endsWith(']');
  const hasQuestionMark = trimmedText.includes('?');
  
  // Thought indicators
  const thoughtIndicators = [
    'i think',
    'i wonder',
    'i wish',
    'maybe',
    'perhaps',
    'i should',
    'what if',
  ];
  const hasThoughtIndicator = thoughtIndicators.some(indicator => 
    trimmedText.toLowerCase().includes(indicator)
  );
  
  // Narration indicators
  const narrationIndicators = [
    'meanwhile',
    'later',
    'earlier',
    'the next day',
    'that night',
    'years ago',
    'once upon',
  ];
  const hasNarrationIndicator = narrationIndicators.some(indicator =>
    trimmedText.toLowerCase().includes(indicator)
  );
  
  // Decision logic
  
  // Narration: Starts with narration indicators or in brackets
  if (hasNarrationIndicator || hasBrackets) {
    return NARRATION_BOX;
  }
  
  // Shout: Mostly uppercase or multiple exclamation marks
  if (upperCaseRatio > 0.6 || hasMultipleExclamation) {
    return SHOUT_BUBBLE;
  }
  
  // Thought: In parentheses or has thought indicators
  if (hasParentheses || hasThoughtIndicator) {
    return THOUGHT_BUBBLE;
  }
  
  // Whisper: Has ellipsis without exclamation, or very quiet indicators
  if (hasEllipsis && !hasMultipleExclamation) {
    const whisperIndicators = ['shh', 'psst', 'quietly', 'softly'];
    const hasWhisperIndicator = whisperIndicators.some(indicator =>
      trimmedText.toLowerCase().includes(indicator)
    );
    if (hasWhisperIndicator) {
      return WHISPER_BUBBLE;
    }
  }
  
  // Default to standard
  return STANDARD_BUBBLE;
}

/**
 * Calculate optimal bubble size based on text and bubble type
 */
export function calculateBubbleSize(
  text: string,
  bubbleType: BubbleTypeDefinition
): { width: number; height: number } {
  const style = bubbleType.defaultStyle;
  
  // Base dimensions
  const minWidth = 80;
  const minHeight = 40;
  const maxWidth = bubbleType.id === 'narration' ? 400 : 300;
  
  // Estimate character width based on font size
  const charWidth = style.fontSize * 0.6;
  const lineHeight = style.fontSize * style.lineHeight;
  
  // Calculate text dimensions
  const textLength = text.length;
  const padding = style.padding * 2;
  
  // Estimate width needed
  let estimatedWidth = Math.min(
    Math.max(textLength * charWidth + padding, minWidth),
    maxWidth
  );
  
  // For narration boxes, prefer wider rectangles
  if (bubbleType.id === 'narration') {
    estimatedWidth = Math.max(estimatedWidth, 200);
  }
  
  // Calculate height based on text wrapping
  const charsPerLine = Math.floor((estimatedWidth - padding) / charWidth);
  const lines = Math.ceil(textLength / charsPerLine);
  const estimatedHeight = Math.max(
    lines * lineHeight + padding,
    minHeight
  );
  
  // Adjust for bubble shape
  let widthMultiplier = 1;
  let heightMultiplier = 1;
  
  switch (bubbleType.shape) {
    case 'cloud':
      // Thought bubbles are slightly rounder
      widthMultiplier = 1.1;
      heightMultiplier = 1.1;
      break;
    case 'jagged':
      // Shout bubbles are slightly larger
      widthMultiplier = 1.2;
      heightMultiplier = 1.2;
      break;
    case 'whisper':
      // Whisper bubbles are slightly smaller
      widthMultiplier = 0.9;
      heightMultiplier = 0.9;
      break;
    case 'rectangle':
      // Narration boxes maintain aspect ratio
      widthMultiplier = 1.0;
      heightMultiplier = 1.0;
      break;
  }
  
  return {
    width: Math.round(estimatedWidth * widthMultiplier),
    height: Math.round(estimatedHeight * heightMultiplier),
  };
}

/**
 * Merge custom style overrides with default bubble style
 */
export function mergeBubbleStyle(
  bubbleType: BubbleTypeDefinition,
  overrides?: Partial<BubbleStyle>
): BubbleStyle {
  return {
    ...bubbleType.defaultStyle,
    ...overrides,
  };
}

/**
 * Get CSS styles for a bubble
 */
export function getBubbleCSS(
  bubbleType: BubbleTypeDefinition,
  overrides?: Partial<BubbleStyle>
): React.CSSProperties {
  const style = mergeBubbleStyle(bubbleType, overrides);
  
  return {
    backgroundColor: style.backgroundColor,
    borderColor: style.borderColor,
    borderWidth: `${style.borderWidth}px`,
    borderStyle: bubbleType.shape === 'whisper' ? 'dashed' : 'solid',
    fontSize: `${style.fontSize}px`,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    color: style.textColor,
    padding: `${style.padding}px`,
    lineHeight: style.lineHeight,
    textAlign: style.textAlign,
    textTransform: style.textTransform,
  };
}
