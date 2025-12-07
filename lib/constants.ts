// Application constants

import type { StyleType, LayoutTemplate } from "@/types";

export const STYLE_OPTIONS: {
  value: StyleType;
  label: string;
  description: string;
}[] = [
  {
    value: "shonen",
    label: "Shonen",
    description: "Action-packed style with dynamic angles and bold lines",
  },
  {
    value: "shojo",
    label: "Shojo",
    description: "Romantic style with soft lines and expressive emotions",
  },
  {
    value: "chibi",
    label: "Chibi",
    description: "Cute, simplified style with exaggerated proportions",
  },
  {
    value: "webtoon",
    label: "Webtoon",
    description: "Modern digital style optimized for vertical scrolling",
  },
  {
    value: "american",
    label: "American Comic",
    description: "Western comic book style with bold colors and inking",
  },
  {
    value: "noir",
    label: "Noir",
    description: "Dark, moody style with high contrast and shadows",
  },
];

export const LAYOUT_TEMPLATES: {
  value: LayoutTemplate;
  label: string;
  description: string;
}[] = [
  {
    // @ts-expect-error
    value: 'four-koma',
    label: "4-Koma",
    description: "Four-panel vertical strip format",
  },
  {
    // @ts-expect-error
    value: "action-spread",
    label: "Action Spread",
    description: "Dynamic layout for action sequences",
  },
  {
    // @ts-expect-error
    value: "standard-grid",
    label: "Standard Grid",
    description: "Traditional manga page layout",
  },
  {
    // @ts-expect-error
    value: "custom",
    label: "Custom",
    description: "Create your own panel arrangement",
  },
];

export const BUBBLE_TYPES = [
  { value: "standard", label: "Standard" },
  { value: "shout", label: "Shout" },
  { value: "whisper", label: "Whisper" },
  { value: "thought", label: "Thought" },
] as const;

export const CANVAS_CONFIG = {
  DEFAULT_WIDTH: 1200,
  DEFAULT_HEIGHT: 1600,
  MIN_PANEL_SIZE: 100,
  MAX_PANEL_SIZE: 2000,
  GRID_SIZE: 10,
} as const;

export const GENERATION_CONFIG = {
  MAX_RETRIES: 3,
  TIMEOUT_MS: 60000,
  POLL_INTERVAL_MS: 1000,
} as const;
