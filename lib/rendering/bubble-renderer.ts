/**
 * Bubble Renderer
 * 
 * Handles speech bubble positioning and rendering within panels.
 * Converts relative bubble positions to absolute positions.
 */

import type { SpeechBubbleModel, PanelModel } from '@/types/models';
import type { AbsolutePosition, RenderedBubble } from '@/types/layouts';

/**
 * Bounds for positioning calculations
 */
interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Bubble with relative positioning
 */
interface BubbleWithRelative extends SpeechBubbleModel {
  relativeX?: number;
  relativeY?: number;
  relativeWidth?: number;
  relativeHeight?: number;
}

/**
 * Main BubbleRenderer class
 */
export class BubbleRenderer {
  /**
   * Render all bubbles for a panel
   */
  renderBubbles(
    bubbles: SpeechBubbleModel[],
    panelBounds: Bounds
  ): RenderedBubble[] {
    if (!bubbles || bubbles.length === 0) {
      return [];
    }
    
    return bubbles.map(bubble => this.renderBubble(bubble, panelBounds));
  }
  
  /**
   * Render a single bubble
   */
  private renderBubble(
    bubble: SpeechBubbleModel,
    panelBounds: Bounds
  ): RenderedBubble {
    const bubbleWithRelative = bubble as BubbleWithRelative;
    
    // Check if bubble has relative positioning
    const hasRelativePosition = 
      bubbleWithRelative.relativeX !== undefined &&
      bubbleWithRelative.relativeY !== undefined;
    
    let absolutePosition: AbsolutePosition;
    
    if (hasRelativePosition) {
      // Convert relative to absolute
      absolutePosition = this.calculateBubblePosition(
        {
          x: bubbleWithRelative.relativeX!,
          y: bubbleWithRelative.relativeY!,
          width: bubbleWithRelative.relativeWidth ?? bubble.width / panelBounds.width,
          height: bubbleWithRelative.relativeHeight ?? bubble.height / panelBounds.height,
        },
        panelBounds
      );
    } else {
      // Use absolute position directly, but ensure it's within panel bounds
      absolutePosition = this.constrainToPanelBounds(
        {
          x: bubble.x,
          y: bubble.y,
          width: bubble.width,
          height: bubble.height,
        },
        panelBounds
      );
    }
    
    return {
      id: bubble.id,
      text: bubble.text,
      type: bubble.type,
      x: absolutePosition.x,
      y: absolutePosition.y,
      width: absolutePosition.width,
      height: absolutePosition.height,
      tailDirection: this.determineTailDirection(absolutePosition, panelBounds),
      tailTarget: this.calculateTailTarget(absolutePosition, panelBounds),
    };
  }
  
  /**
   * Calculate absolute bubble position from relative coordinates
   */
  calculateBubblePosition(
    relative: { x: number; y: number; width: number; height: number },
    panelBounds: Bounds
  ): AbsolutePosition {
    const absolute = {
      x: panelBounds.x + (relative.x * panelBounds.width),
      y: panelBounds.y + (relative.y * panelBounds.height),
      width: relative.width * panelBounds.width,
      height: relative.height * panelBounds.height,
    };
    
    // Ensure bubble stays within panel bounds
    return this.constrainToPanelBounds(absolute, panelBounds);
  }
  
  /**
   * Constrain bubble to stay within panel bounds
   */
  private constrainToPanelBounds(
    bubble: AbsolutePosition,
    panelBounds: Bounds
  ): AbsolutePosition {
    const padding = 5; // Minimum padding from panel edges
    
    let { x, y, width, height } = bubble;
    
    // Constrain width and height
    const maxWidth = panelBounds.width - (padding * 2);
    const maxHeight = panelBounds.height - (padding * 2);
    
    if (width > maxWidth) {
      width = maxWidth;
    }
    if (height > maxHeight) {
      height = maxHeight;
    }
    
    // Constrain position
    const minX = panelBounds.x + padding;
    const maxX = panelBounds.x + panelBounds.width - width - padding;
    const minY = panelBounds.y + padding;
    const maxY = panelBounds.y + panelBounds.height - height - padding;
    
    if (x < minX) {
      x = minX;
    } else if (x > maxX) {
      x = maxX;
    }
    
    if (y < minY) {
      y = minY;
    } else if (y > maxY) {
      y = maxY;
    }
    
    return { x, y, width, height };
  }
  
  /**
   * Determine tail direction based on bubble position in panel
   */
  private determineTailDirection(
    bubble: AbsolutePosition,
    panelBounds: Bounds
  ): string {
    // Calculate bubble center relative to panel
    const bubbleCenterX = bubble.x + bubble.width / 2;
    const bubbleCenterY = bubble.y + bubble.height / 2;
    
    const panelCenterX = panelBounds.x + panelBounds.width / 2;
    const panelCenterY = panelBounds.y + panelBounds.height / 2;
    
    // Determine quadrant
    const isLeft = bubbleCenterX < panelCenterX;
    const isTop = bubbleCenterY < panelCenterY;
    
    if (isTop && isLeft) {
      return 'bottom-right';
    } else if (isTop && !isLeft) {
      return 'bottom-left';
    } else if (!isTop && isLeft) {
      return 'top-right';
    } else {
      return 'top-left';
    }
  }
  
  /**
   * Calculate tail target point (where the tail should point to)
   */
  private calculateTailTarget(
    bubble: AbsolutePosition,
    panelBounds: Bounds
  ): { x: number; y: number } | undefined {
    // Default: point to center-bottom of panel (where character might be)
    const targetX = panelBounds.x + panelBounds.width / 2;
    const targetY = panelBounds.y + panelBounds.height * 0.7; // 70% down
    
    return { x: targetX, y: targetY };
  }
  
  /**
   * Check if bubbles overlap
   */
  checkOverlap(bubble1: AbsolutePosition, bubble2: AbsolutePosition): boolean {
    return !(
      bubble1.x + bubble1.width < bubble2.x ||
      bubble2.x + bubble2.width < bubble1.x ||
      bubble1.y + bubble1.height < bubble2.y ||
      bubble2.y + bubble2.height < bubble1.y
    );
  }
  
  /**
   * Resolve overlapping bubbles by adjusting positions
   */
  resolveOverlaps(bubbles: RenderedBubble[], panelBounds: Bounds): RenderedBubble[] {
    const resolved = [...bubbles];
    const maxIterations = 10;
    let iteration = 0;
    
    while (iteration < maxIterations) {
      let hasOverlap = false;
      
      for (let i = 0; i < resolved.length; i++) {
        for (let j = i + 1; j < resolved.length; j++) {
          if (this.checkOverlap(resolved[i], resolved[j])) {
            hasOverlap = true;
            
            // Move second bubble down
            const moveDistance = 10;
            resolved[j] = {
              ...resolved[j],
              y: resolved[j].y + moveDistance,
            };
            
            // Constrain to panel bounds
            const constrained = this.constrainToPanelBounds(resolved[j], panelBounds);
            resolved[j] = { ...resolved[j], ...constrained };
          }
        }
      }
      
      if (!hasOverlap) {
        break;
      }
      
      iteration++;
    }
    
    return resolved;
  }
}

/**
 * Helper function to create a bubble renderer instance
 */
export function createBubbleRenderer(): BubbleRenderer {
  return new BubbleRenderer();
}

/**
 * Convenience function to render bubbles
 */
export function renderBubbles(
  bubbles: SpeechBubbleModel[],
  panelBounds: Bounds
): RenderedBubble[] {
  const renderer = new BubbleRenderer();
  return renderer.renderBubbles(bubbles, panelBounds);
}

/**
 * Calculate relative bubble position from absolute
 */
export function bubbleAbsoluteToRelative(
  bubble: SpeechBubbleModel,
  panelBounds: Bounds
): {
  relativeX: number;
  relativeY: number;
  relativeWidth: number;
  relativeHeight: number;
} {
  return {
    relativeX: (bubble.x - panelBounds.x) / panelBounds.width,
    relativeY: (bubble.y - panelBounds.y) / panelBounds.height,
    relativeWidth: bubble.width / panelBounds.width,
    relativeHeight: bubble.height / panelBounds.height,
  };
}

/**
 * Calculate absolute bubble position from relative
 */
export function bubbleRelativeToAbsolute(
  relative: {
    relativeX: number;
    relativeY: number;
    relativeWidth: number;
    relativeHeight: number;
  },
  panelBounds: Bounds
): AbsolutePosition {
  return {
    x: panelBounds.x + (relative.relativeX * panelBounds.width),
    y: panelBounds.y + (relative.relativeY * panelBounds.height),
    width: relative.relativeWidth * panelBounds.width,
    height: relative.relativeHeight * panelBounds.height,
  };
}
