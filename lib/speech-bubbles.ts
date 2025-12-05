import type { BubbleType } from "@/types";
import type { PanelCoordinates } from "./layouts";
import { 
  getBubbleType, 
  detectBubbleType, 
  calculateBubbleSize as calculateBubbleSizeFromType,
  type BubbleTypeDefinition 
} from "./bubble-types";

export interface BubblePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PositionedBubble {
  panelIndex: number;
  text: string;
  type: BubbleType;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate bubble dimensions based on text length
 * Enhanced to use bubble type definitions
 */
export function calculateBubbleSize(
  text: string,
  type: BubbleType
): { width: number; height: number } {
  // Get bubble type definition
  const bubbleTypeDef = getBubbleType(type);
  
  if (bubbleTypeDef) {
    // Use new bubble type system
    return calculateBubbleSizeFromType(text, bubbleTypeDef);
  }
  
  // Fallback to legacy calculation
  return calculateBubbleSizeLegacy(text, type);
}

/**
 * Legacy bubble size calculation (for backward compatibility)
 */
function calculateBubbleSizeLegacy(
  text: string,
  type: BubbleType
): { width: number; height: number } {
  // Base dimensions
  const minWidth = 80;
  const minHeight = 40;
  const maxWidth = 300;

  // Estimate character width (approximate)
  const charWidth = 8;
  const lineHeight = 20;
  const padding = 20;

  // Calculate approximate width needed
  const textLength = text.length;
  const estimatedWidth = Math.min(
    Math.max(textLength * charWidth + padding * 2, minWidth),
    maxWidth
  );

  // Calculate height based on text wrapping
  const charsPerLine = Math.floor((estimatedWidth - padding * 2) / charWidth);
  const lines = Math.ceil(textLength / charsPerLine);
  const estimatedHeight = Math.max(lines * lineHeight + padding * 2, minHeight);

  // Adjust for bubble type
  let widthMultiplier = 1;
  let heightMultiplier = 1;

  switch (type) {
    case "shout":
      widthMultiplier = 1.2;
      heightMultiplier = 1.2;
      break;
    case "whisper":
      widthMultiplier = 0.9;
      heightMultiplier = 0.9;
      break;
    case "thought":
      widthMultiplier = 1.1;
      heightMultiplier = 1.1;
      break;
  }

  return {
    width: Math.round(estimatedWidth * widthMultiplier),
    height: Math.round(estimatedHeight * heightMultiplier),
  };
}

/**
 * Calculate optimal position for a speech bubble within a panel
 * Positions bubbles in the top portion of panels to avoid covering important visual elements
 */
export function calculateBubblePosition(
  panelCoords: PanelCoordinates,
  bubbleSize: { width: number; height: number },
  bubbleIndex: number,
  totalBubblesInPanel: number
): BubblePosition {
  const {
    x: panelX,
    y: panelY,
    width: panelWidth,
    height: panelHeight,
  } = panelCoords;
  const { width: bubbleWidth, height: bubbleHeight } = bubbleSize;

  // Padding from panel edges
  const padding = 15;

  // Available space for bubble
  const availableWidth = panelWidth - padding * 2;
  const availableHeight = panelHeight * 0.4; // Use top 40% of panel for bubbles

  // Ensure bubble fits within available space
  const actualBubbleWidth = Math.min(bubbleWidth, availableWidth);
  const actualBubbleHeight = Math.min(
    bubbleHeight,
    availableHeight / totalBubblesInPanel - 10
  );

  // Calculate position based on bubble index
  let x: number;
  let y: number;

  if (totalBubblesInPanel === 1) {
    // Center single bubble horizontally, place near top
    x = panelX + (panelWidth - actualBubbleWidth) / 2;
    y = panelY + padding;
  } else if (totalBubblesInPanel === 2) {
    // Stack two bubbles vertically
    x = panelX + (panelWidth - actualBubbleWidth) / 2;
    y = panelY + padding + bubbleIndex * (actualBubbleHeight + 10);
  } else {
    // For 3+ bubbles, alternate left and right, stacking vertically
    const isLeft = bubbleIndex % 2 === 0;
    x = isLeft
      ? panelX + padding
      : panelX + panelWidth - actualBubbleWidth - padding;
    y =
      panelY +
      padding +
      Math.floor(bubbleIndex / 2) * (actualBubbleHeight + 10);
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(actualBubbleWidth),
    height: Math.round(actualBubbleHeight),
  };
}

/**
 * Generate positioned speech bubbles for all panels
 * Enhanced with collision detection
 */
export function generateSpeechBubblePositions(
  bubbles: Array<{ panelIndex: number; text: string; type: BubbleType }>,
  panelCoordinates: PanelCoordinates[]
): PositionedBubble[] {
  // Group bubbles by panel
  const bubblesByPanel = new Map<
    number,
    Array<{ text: string; type: BubbleType }>
  >();

  for (const bubble of bubbles) {
    if (!bubblesByPanel.has(bubble.panelIndex)) {
      bubblesByPanel.set(bubble.panelIndex, []);
    }
    bubblesByPanel.get(bubble.panelIndex)!.push({
      text: bubble.text,
      type: bubble.type,
    });
  }

  // Calculate positions for each bubble
  const positionedBubbles: PositionedBubble[] = [];

  for (const [panelIndex, panelBubbles] of bubblesByPanel.entries()) {
    // Ensure panel index is valid
    if (panelIndex < 0 || panelIndex >= panelCoordinates.length) {
      console.warn(`Invalid panel index ${panelIndex}, skipping bubbles`);
      continue;
    }

    const panelCoords = panelCoordinates[panelIndex];
    const totalBubblesInPanel = panelBubbles.length;

    panelBubbles.forEach((bubble, bubbleIndex) => {
      const bubbleSize = calculateBubbleSize(bubble.text, bubble.type);
      const position = calculateBubblePosition(
        panelCoords,
        bubbleSize,
        bubbleIndex,
        totalBubblesInPanel
      );

      positionedBubbles.push({
        panelIndex,
        text: bubble.text,
        type: bubble.type,
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
      });
    });
  }

  // Apply collision detection and resolution
  return resolveCollisions(positionedBubbles, panelCoordinates);
}

/**
 * Check if two bubbles overlap
 */
export function checkBubbleCollision(
  bubble1: BubblePosition,
  bubble2: BubblePosition
): boolean {
  return !(
    bubble1.x + bubble1.width < bubble2.x ||
    bubble2.x + bubble2.width < bubble1.x ||
    bubble1.y + bubble1.height < bubble2.y ||
    bubble2.y + bubble2.height < bubble1.y
  );
}

/**
 * Resolve collisions between bubbles in the same panel
 */
function resolveCollisions(
  bubbles: PositionedBubble[],
  panelCoordinates: PanelCoordinates[]
): PositionedBubble[] {
  const resolved = [...bubbles];
  const maxIterations = 10;
  
  // Group by panel for collision detection
  const bubblesByPanel = new Map<number, number[]>();
  resolved.forEach((bubble, index) => {
    if (!bubblesByPanel.has(bubble.panelIndex)) {
      bubblesByPanel.set(bubble.panelIndex, []);
    }
    bubblesByPanel.get(bubble.panelIndex)!.push(index);
  });
  
  // Resolve collisions within each panel
  for (const [panelIndex, bubbleIndices] of bubblesByPanel.entries()) {
    if (bubbleIndices.length < 2) continue;
    
    const panelCoords = panelCoordinates[panelIndex];
    let iteration = 0;
    
    while (iteration < maxIterations) {
      let hasCollision = false;
      
      for (let i = 0; i < bubbleIndices.length; i++) {
        for (let j = i + 1; j < bubbleIndices.length; j++) {
          const idx1 = bubbleIndices[i];
          const idx2 = bubbleIndices[j];
          
          if (checkBubbleCollision(resolved[idx1], resolved[idx2])) {
            hasCollision = true;
            
            // Move second bubble down
            const moveDistance = 10;
            resolved[idx2] = {
              ...resolved[idx2],
              y: resolved[idx2].y + moveDistance,
            };
            
            // Ensure bubble stays within panel
            const maxY = panelCoords.y + panelCoords.height - resolved[idx2].height - 15;
            if (resolved[idx2].y > maxY) {
              resolved[idx2].y = maxY;
            }
          }
        }
      }
      
      if (!hasCollision) break;
      iteration++;
    }
  }
  
  return resolved;
}

/**
 * Assign bubble type based on text content and context
 * Enhanced to use bubble type detection system
 */
export function assignBubbleType(text: string): BubbleType {
  const bubbleTypeDef = detectBubbleType(text);
  return bubbleTypeDef.id as BubbleType;
}

/**
 * Legacy detectBubbleType function (for backward compatibility)
 * @deprecated Use assignBubbleType instead
 */
export function detectBubbleTypeLegacy(text: string): BubbleType {
  const upperCaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  const hasExclamation = text.includes("!") || text.includes("!!");
  const hasEllipsis = text.includes("...");
  const hasParentheses = text.startsWith("(") && text.endsWith(")");

  // Shout: mostly uppercase or multiple exclamation marks
  if (upperCaseRatio > 0.6 || text.includes("!!")) {
    return "shout";
  }

  // Thought: text in parentheses or starts with thought indicators
  if (
    hasParentheses ||
    text.toLowerCase().startsWith("i think") ||
    text.toLowerCase().startsWith("i wonder")
  ) {
    return "thought";
  }

  // Whisper: has ellipsis or quiet indicators
  if (hasEllipsis && !hasExclamation) {
    return "whisper";
  }

  // Default to standard
  return "standard";
}
