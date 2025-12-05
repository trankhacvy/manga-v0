/**
 * BubbleRenderer Tests
 */

import { BubbleRenderer, bubbleAbsoluteToRelative, bubbleRelativeToAbsolute } from '../bubble-renderer';
import type { SpeechBubbleModel } from '@/types/models';

describe('BubbleRenderer', () => {
  let renderer: BubbleRenderer;

  beforeEach(() => {
    renderer = new BubbleRenderer();
  });

  describe('calculateBubblePosition', () => {
    it('should convert relative to absolute position', () => {
      const position = renderer.calculateBubblePosition(
        { x: 0.5, y: 0.2, width: 0.4, height: 0.3 },
        { x: 100, y: 100, width: 500, height: 800 }
      );

      expect(position.x).toBe(350); // 100 + (0.5 * 500)
      expect(position.y).toBe(260); // 100 + (0.2 * 800)
      expect(position.width).toBe(200); // 0.4 * 500
      expect(position.height).toBe(240); // 0.3 * 800
    });

    it('should constrain bubble to panel bounds', () => {
      const position = renderer.calculateBubblePosition(
        { x: 0.9, y: 0.9, width: 0.5, height: 0.5 },
        { x: 0, y: 0, width: 500, height: 500 }
      );

      // Bubble should be constrained to fit within panel
      expect(position.x + position.width).toBeLessThanOrEqual(500);
      expect(position.y + position.height).toBeLessThanOrEqual(500);
    });
  });

  describe('renderBubbles', () => {
    it('should render multiple bubbles', () => {
      const bubbles: SpeechBubbleModel[] = [
        {
          id: 'bubble-1',
          x: 50,
          y: 50,
          width: 100,
          height: 60,
          text: 'Hello!',
          type: 'standard',
        },
        {
          id: 'bubble-2',
          x: 200,
          y: 50,
          width: 100,
          height: 60,
          text: 'Hi there!',
          type: 'standard',
        },
      ];

      const rendered = renderer.renderBubbles(bubbles, {
        x: 0,
        y: 0,
        width: 500,
        height: 500,
      });

      expect(rendered).toHaveLength(2);
      expect(rendered[0].id).toBe('bubble-1');
      expect(rendered[1].id).toBe('bubble-2');
    });

    it('should handle empty bubbles array', () => {
      const rendered = renderer.renderBubbles([], {
        x: 0,
        y: 0,
        width: 500,
        height: 500,
      });

      expect(rendered).toHaveLength(0);
    });

    it('should add tail direction to bubbles', () => {
      const bubbles: SpeechBubbleModel[] = [
        {
          id: 'bubble-1',
          x: 50,
          y: 50,
          width: 100,
          height: 60,
          text: 'Hello!',
          type: 'standard',
        },
      ];

      const rendered = renderer.renderBubbles(bubbles, {
        x: 0,
        y: 0,
        width: 500,
        height: 500,
      });

      expect(rendered[0].tailDirection).toBeDefined();
      expect(['top-left', 'top-right', 'bottom-left', 'bottom-right']).toContain(
        rendered[0].tailDirection
      );
    });
  });

  describe('checkOverlap', () => {
    it('should detect overlapping bubbles', () => {
      const bubble1 = { x: 100, y: 100, width: 150, height: 80 };
      const bubble2 = { x: 150, y: 120, width: 150, height: 80 };

      expect(renderer.checkOverlap(bubble1, bubble2)).toBe(true);
    });

    it('should detect non-overlapping bubbles', () => {
      const bubble1 = { x: 100, y: 100, width: 150, height: 80 };
      const bubble2 = { x: 300, y: 100, width: 150, height: 80 };

      expect(renderer.checkOverlap(bubble1, bubble2)).toBe(false);
    });

    it('should detect touching bubbles as non-overlapping', () => {
      const bubble1 = { x: 100, y: 100, width: 150, height: 80 };
      const bubble2 = { x: 250, y: 100, width: 150, height: 80 };

      expect(renderer.checkOverlap(bubble1, bubble2)).toBe(false);
    });
  });

  describe('resolveOverlaps', () => {
    it('should resolve overlapping bubbles', () => {
      const bubbles = [
        {
          id: 'bubble-1',
          text: 'Hello!',
          type: 'standard',
          x: 100,
          y: 100,
          width: 150,
          height: 80,
          tailDirection: 'bottom-right',
        },
        {
          id: 'bubble-2',
          text: 'Hi!',
          type: 'standard',
          x: 150,
          y: 120,
          width: 150,
          height: 80,
          tailDirection: 'bottom-left',
        },
      ];

      const resolved = renderer.resolveOverlaps(bubbles, {
        x: 0,
        y: 0,
        width: 500,
        height: 500,
      });

      // Second bubble should be moved
      expect(resolved[1].y).toBeGreaterThan(bubbles[1].y);
    });

    it('should not modify non-overlapping bubbles', () => {
      const bubbles = [
        {
          id: 'bubble-1',
          text: 'Hello!',
          type: 'standard',
          x: 100,
          y: 100,
          width: 150,
          height: 80,
          tailDirection: 'bottom-right',
        },
        {
          id: 'bubble-2',
          text: 'Hi!',
          type: 'standard',
          x: 300,
          y: 100,
          width: 150,
          height: 80,
          tailDirection: 'bottom-left',
        },
      ];

      const resolved = renderer.resolveOverlaps(bubbles, {
        x: 0,
        y: 0,
        width: 500,
        height: 500,
      });

      expect(resolved[0].y).toBe(bubbles[0].y);
      expect(resolved[1].y).toBe(bubbles[1].y);
    });
  });
});

describe('bubbleAbsoluteToRelative', () => {
  it('should convert absolute to relative', () => {
    const bubble: SpeechBubbleModel = {
      id: 'bubble-1',
      x: 150,
      y: 120,
      width: 100,
      height: 60,
      text: 'Hello!',
      type: 'standard',
    };

    const relative = bubbleAbsoluteToRelative(bubble, {
      x: 100,
      y: 100,
      width: 500,
      height: 800,
    });

    expect(relative.relativeX).toBeCloseTo(0.1); // (150 - 100) / 500
    expect(relative.relativeY).toBeCloseTo(0.025); // (120 - 100) / 800
    expect(relative.relativeWidth).toBeCloseTo(0.2); // 100 / 500
    expect(relative.relativeHeight).toBeCloseTo(0.075); // 60 / 800
  });
});

describe('bubbleRelativeToAbsolute', () => {
  it('should convert relative to absolute', () => {
    const absolute = bubbleRelativeToAbsolute(
      {
        relativeX: 0.1,
        relativeY: 0.025,
        relativeWidth: 0.2,
        relativeHeight: 0.075,
      },
      { x: 100, y: 100, width: 500, height: 800 }
    );

    expect(absolute.x).toBe(150); // 100 + (0.1 * 500)
    expect(absolute.y).toBe(120); // 100 + (0.025 * 800)
    expect(absolute.width).toBe(100); // 0.2 * 500
    expect(absolute.height).toBe(60); // 0.075 * 800
  });
});
