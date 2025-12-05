import { describe, it, expect } from "@jest/globals";
import {
  validateBubblePosition,
  calculateOverlap,
  adjustForOverlap,
  toAbsolutePosition,
  toRelativePosition,
  estimateBubbleSize,
} from "../bubblePositioning";

describe("bubblePositioning", () => {
  describe("validateBubblePosition", () => {
    it("should validate correct positions", () => {
      expect(
        validateBubblePosition({
          relativeX: 0.1,
          relativeY: 0.1,
          relativeWidth: 0.3,
          relativeHeight: 0.2,
        })
      ).toBe(true);
    });

    it("should reject out-of-bounds positions", () => {
      expect(
        validateBubblePosition({
          relativeX: -0.1,
          relativeY: 0.1,
          relativeWidth: 0.3,
          relativeHeight: 0.2,
        })
      ).toBe(false);

      expect(
        validateBubblePosition({
          relativeX: 0.9,
          relativeY: 0.1,
          relativeWidth: 0.3,
          relativeHeight: 0.2,
        })
      ).toBe(false);
    });

    it("should reject invalid dimensions", () => {
      expect(
        validateBubblePosition({
          relativeX: 0.1,
          relativeY: 0.1,
          relativeWidth: 0,
          relativeHeight: 0.2,
        })
      ).toBe(false);
    });
  });

  describe("calculateOverlap", () => {
    it("should detect no overlap", () => {
      const bubble1 = {
        relativeX: 0.1,
        relativeY: 0.1,
        relativeWidth: 0.2,
        relativeHeight: 0.2,
      };
      const bubble2 = {
        relativeX: 0.5,
        relativeY: 0.5,
        relativeWidth: 0.2,
        relativeHeight: 0.2,
      };

      expect(calculateOverlap(bubble1, bubble2)).toBe(0);
    });

    it("should detect partial overlap", () => {
      const bubble1 = {
        relativeX: 0.1,
        relativeY: 0.1,
        relativeWidth: 0.3,
        relativeHeight: 0.3,
      };
      const bubble2 = {
        relativeX: 0.2,
        relativeY: 0.2,
        relativeWidth: 0.3,
        relativeHeight: 0.3,
      };

      const overlap = calculateOverlap(bubble1, bubble2);
      expect(overlap).toBeGreaterThan(0);
      expect(overlap).toBeLessThan(1);
    });

    it("should detect complete overlap", () => {
      const bubble1 = {
        relativeX: 0.1,
        relativeY: 0.1,
        relativeWidth: 0.3,
        relativeHeight: 0.3,
      };
      const bubble2 = {
        relativeX: 0.1,
        relativeY: 0.1,
        relativeWidth: 0.3,
        relativeHeight: 0.3,
      };

      expect(calculateOverlap(bubble1, bubble2)).toBe(1);
    });
  });

  describe("toAbsolutePosition", () => {
    it("should convert relative to absolute positions", () => {
      const relative = {
        relativeX: 0.5,
        relativeY: 0.5,
        relativeWidth: 0.2,
        relativeHeight: 0.1,
      };

      const absolute = toAbsolutePosition(relative, 1000, 800);

      expect(absolute).toEqual({
        x: 500,
        y: 400,
        width: 200,
        height: 80,
      });
    });
  });

  describe("toRelativePosition", () => {
    it("should convert absolute to relative positions", () => {
      const absolute = {
        x: 500,
        y: 400,
        width: 200,
        height: 80,
      };

      const relative = toRelativePosition(absolute, 1000, 800);

      expect(relative).toEqual({
        relativeX: 0.5,
        relativeY: 0.5,
        relativeWidth: 0.2,
        relativeHeight: 0.1,
      });
    });
  });

  describe("estimateBubbleSize", () => {
    it("should estimate narration box size", () => {
      const size = estimateBubbleSize(
        "This is a narration box with some text",
        "narration"
      );

      expect(size.width).toBeGreaterThan(0.4);
      expect(size.width).toBeLessThanOrEqual(0.8);
      expect(size.height).toBeGreaterThan(0);
      expect(size.height).toBeLessThanOrEqual(0.15);
    });

    it("should estimate dialogue bubble size", () => {
      const size = estimateBubbleSize("Short dialogue", "dialogue");

      expect(size.width).toBeGreaterThan(0);
      expect(size.height).toBeGreaterThan(0);
      expect(size.width / size.height).toBeCloseTo(1.5, 0.5); // Aspect ratio ~1.5
    });

    it("should scale with text length", () => {
      const shortSize = estimateBubbleSize("Hi", "dialogue");
      const longSize = estimateBubbleSize(
        "This is a much longer piece of dialogue that should result in a larger bubble",
        "dialogue"
      );

      expect(longSize.width).toBeGreaterThan(shortSize.width);
      expect(longSize.height).toBeGreaterThan(shortSize.height);
    });
  });

  describe("adjustForOverlap", () => {
    it("should adjust overlapping bubbles", () => {
      const bubbles = [
        {
          id: "1",
          relativeX: 0.1,
          relativeY: 0.1,
          relativeWidth: 0.3,
          relativeHeight: 0.2,
        },
        {
          id: "2",
          relativeX: 0.15,
          relativeY: 0.15,
          relativeWidth: 0.3,
          relativeHeight: 0.2,
        },
      ];

      const adjusted = adjustForOverlap(bubbles);

      // Second bubble should be moved
      expect(adjusted[1].relativeY).toBeGreaterThan(bubbles[1].relativeY);
    });

    it("should not modify non-overlapping bubbles", () => {
      const bubbles = [
        {
          id: "1",
          relativeX: 0.1,
          relativeY: 0.1,
          relativeWidth: 0.2,
          relativeHeight: 0.2,
        },
        {
          id: "2",
          relativeX: 0.6,
          relativeY: 0.6,
          relativeWidth: 0.2,
          relativeHeight: 0.2,
        },
      ];

      const adjusted = adjustForOverlap(bubbles);

      expect(adjusted).toEqual(bubbles);
    });
  });
});
