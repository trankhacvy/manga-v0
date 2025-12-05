// // Prompt Engineering System for Manga Generation
// // Builds style-specific prompts with character consistency

// import type { StyleType } from "@/types";

// export interface PromptBuilderOptions {
//   basePrompt: string;
//   style: StyleType;
//   characterTriggers?: string[];
//   shotType?: string;
//   quality?: "draft" | "standard" | "high";
//   additionalDetails?: string;
// }

// export interface BuildPromptResult {
//   prompt: string;
//   negativePrompt: string;
// }

// import { getStylePreset, applyStyleToPrompt } from "./style-presets";

// // Legacy style templates for backward compatibility
// // New code should use style-presets.ts instead
// const STYLE_TEMPLATES: Record<
//   StyleType,
//   { prefix: string; suffix: string; negative: string }
// > = {
//   shonen: {
//     prefix:
//       "manga panel, shonen style, dynamic action pose, bold lines, high contrast,",
//     suffix:
//       "dramatic lighting, speed lines, intense expression, black and white manga art",
//     negative:
//       "color, realistic photo, 3d render, blurry, low quality, watermark, text, signature",
//   },
//   shojo: {
//     prefix:
//       "manga panel, shojo style, elegant composition, delicate lines, soft shading,",
//     suffix:
//       "beautiful detailed eyes, flowing hair, sparkles and flowers, romantic atmosphere, black and white manga art",
//     negative:
//       "color, realistic photo, 3d render, harsh lines, blurry, low quality, watermark, text",
//   },
//   chibi: {
//     prefix:
//       "manga panel, chibi style, cute super deformed characters, simple lines, round shapes,",
//     suffix:
//       "adorable expression, exaggerated features, kawaii aesthetic, black and white manga art",
//     negative:
//       "color, realistic proportions, detailed anatomy, blurry, low quality, watermark, text",
//   },
//   webtoon: {
//     prefix:
//       "webtoon panel, digital comic style, clean lines, modern aesthetic,",
//     suffix:
//       "full color illustration, smooth shading, contemporary art style, vertical scroll format",
//     negative:
//       "black and white, traditional manga, blurry, low quality, watermark, text, signature",
//   },
//   american: {
//     prefix:
//       "comic book panel, American comic style, bold inking, dynamic composition,",
//     suffix:
//       "superhero aesthetic, dramatic shadows, full color, professional comic art",
//     negative:
//       "manga style, anime, blurry, low quality, watermark, text, signature",
//   },
//   noir: {
//     prefix:
//       "noir comic panel, dark atmospheric style, heavy shadows, dramatic contrast,",
//     suffix:
//       "film noir aesthetic, moody lighting, black and white with high contrast, detective story mood",
//     negative:
//       "color, bright lighting, cheerful, blurry, low quality, watermark, text",
//   },
//   ghibli: {
//     prefix:
//       "anime panel, studio ghibli style, soft watercolor, gentle lighting,",
//     suffix:
//       "pastoral atmosphere, hand-painted aesthetic, warm colors, miyazaki style",
//     negative:
//       "harsh lines, dark, gritty, realistic photo, 3d render, blurry, low quality, watermark, text",
//   },
//   cyberpunk: {
//     prefix:
//       "cyberpunk comic panel, futuristic style, neon lights, high tech aesthetic,",
//     suffix:
//       "cyberpunk cityscape, neon signs, high tech low life, blade runner aesthetic",
//     negative:
//       "medieval, fantasy, natural, pastoral, blurry, low quality, watermark, text",
//   },
//   seinen: {
//     prefix:
//       "manga panel, seinen style, realistic proportions, detailed linework,",
//     suffix:
//       "mature themes, gritty atmosphere, detailed shading, black and white manga art",
//     negative:
//       "color, cute, chibi, simplified, blurry, low quality, watermark, text",
//   },
//   marvel: {
//     prefix:
//       "marvel comic panel, superhero style, bold colors, dynamic action pose,",
//     suffix:
//       "heroic composition, dramatic lighting, vibrant colors, professional comic book art",
//     negative:
//       "manga, anime, black and white, realistic photo, blurry, low quality, watermark, text",
//   },
//   "manga-classic": {
//     prefix:
//       "manga panel, classic manga style, clean ink lines, traditional screentone,",
//     suffix:
//       "black and white manga art, professional manga quality, classic composition",
//     negative:
//       "color, digital art, modern, realistic photo, 3d render, blurry, low quality, watermark, text",
//   },
//   "anime-cel": {
//     prefix: "anime panel, cel animation style, flat colors, clean outlines,",
//     suffix:
//       "traditional anime aesthetic, 90s anime style, vibrant colors, cel shading",
//     negative:
//       "realistic, 3d render, gradient shading, blurry, low quality, watermark, text",
//   },
// };

// // Shot type modifiers
// const SHOT_TYPE_MODIFIERS: Record<string, string> = {
//   "close-up":
//     "extreme close-up shot, detailed facial features, emotional expression",
//   medium: "medium shot, upper body visible, balanced composition",
//   full: "full body shot, character from head to toe, environmental context",
//   wide: "wide establishing shot, full scene visible, environmental details",
//   "over-shoulder": "over the shoulder shot, perspective from behind character",
//   "dutch-angle": "dutch angle, tilted camera, dynamic tension",
//   "birds-eye": "bird's eye view, looking down from above",
//   "worms-eye": "worm's eye view, looking up from below, dramatic perspective",
// };

// // Quality presets
// const QUALITY_MODIFIERS: Record<string, string> = {
//   draft: "sketch quality, rough lines",
//   standard: "professional manga quality, clean lines",
//   high: "masterpiece quality, highly detailed, professional manga artist, award-winning",
// };

// /**
//  * Build a complete prompt with style-specific templates
//  * Uses the new style presets system for better consistency
//  */
// export function buildPrompt(options: PromptBuilderOptions): BuildPromptResult {
//   const {
//     basePrompt,
//     style,
//     characterTriggers = [],
//     shotType,
//     quality = "standard",
//     additionalDetails,
//   } = options;

//   // Build prompt parts
//   const parts: string[] = [];

//   // Add shot type if specified
//   if (shotType && SHOT_TYPE_MODIFIERS[shotType]) {
//     parts.push(SHOT_TYPE_MODIFIERS[shotType]);
//   }

//   // Add character triggers
//   if (characterTriggers.length > 0) {
//     parts.push(characterTriggers.join(", "));
//   }

//   // Add base prompt (the main scene description)
//   parts.push(basePrompt);

//   // Add additional details
//   if (additionalDetails) {
//     parts.push(additionalDetails);
//   }

//   // Combine parts
//   const combinedPrompt = parts.join(", ");

//   // Apply style preset
//   const styled = applyStyleToPrompt(combinedPrompt, style, {
//     quality,
//     includePrefix: true,
//     includeSuffix: true,
//   });

//   return styled;
// }

// /**
//  * Build prompt using legacy template system (for backward compatibility)
//  */
// export function buildPromptLegacy(
//   options: PromptBuilderOptions
// ): BuildPromptResult {
//   const {
//     basePrompt,
//     style,
//     characterTriggers = [],
//     shotType,
//     quality = "standard",
//     additionalDetails,
//   } = options;

//   const template = STYLE_TEMPLATES[style];
//   const qualityMod = QUALITY_MODIFIERS[quality];

//   // Build prompt parts
//   const parts: string[] = [];

//   // Add style prefix
//   parts.push(template.prefix);

//   // Add quality modifier
//   parts.push(qualityMod);

//   // Add shot type if specified
//   if (shotType && SHOT_TYPE_MODIFIERS[shotType]) {
//     parts.push(SHOT_TYPE_MODIFIERS[shotType]);
//   }

//   // Add character triggers
//   if (characterTriggers.length > 0) {
//     parts.push(characterTriggers.join(", "));
//   }

//   // Add base prompt (the main scene description)
//   parts.push(basePrompt);

//   // Add additional details
//   if (additionalDetails) {
//     parts.push(additionalDetails);
//   }

//   // Add style suffix
//   parts.push(template.suffix);

//   // Combine all parts
//   const prompt = parts.join(", ");

//   // Build negative prompt
//   const negativePrompt = template.negative;

//   return {
//     prompt,
//     negativePrompt,
//   };
// }

// /**
//  * Extract character names from prompt and generate trigger words
//  */
// export function generateCharacterTriggers(
//   characterName: string,
//   characterDescription?: string
// ): string[] {
//   const triggers: string[] = [];

//   // Add character name
//   triggers.push(characterName.toLowerCase());

//   // Extract key descriptors from description
//   if (characterDescription) {
//     const descriptors = extractKeyDescriptors(characterDescription);
//     triggers.push(...descriptors);
//   }

//   return triggers;
// }

// /**
//  * Extract key visual descriptors from character description
//  */
// function extractKeyDescriptors(description: string): string[] {
//   const descriptors: string[] = [];

//   // Common descriptor patterns
//   const patterns = [
//     /(\w+)\s+hair/gi, // hair color/style
//     /(\w+)\s+eyes/gi, // eye color
//     /wearing\s+(\w+)/gi, // clothing
//     /(\w+)\s+outfit/gi, // outfit type
//   ];

//   patterns.forEach((pattern) => {
//     const matches = description.matchAll(pattern);
//     for (const match of matches) {
//       if (match[1]) {
//         descriptors.push(match[1].toLowerCase());
//       }
//     }
//   });

//   return descriptors;
// }

// /**
//  * Build prompt for character sheet generation
//  */
// export function buildCharacterSheetPrompt(
//   characterName: string,
//   characterDescription: string,
//   style: StyleType,
//   view: "front" | "side" | "expression"
// ): BuildPromptResult {
//   const template = STYLE_TEMPLATES[style];

//   let viewDescription = "";
//   switch (view) {
//     case "front":
//       viewDescription =
//         "character reference sheet, front view, standing pose, neutral expression, full body";
//       break;
//     case "side":
//       viewDescription =
//         "character reference sheet, side profile view, standing pose, full body";
//       break;
//     case "expression":
//       viewDescription =
//         "character expression sheet, multiple facial expressions, close-up faces";
//       break;
//   }

//   const prompt = [
//     template.prefix,
//     "character design sheet",
//     viewDescription,
//     characterName,
//     characterDescription,
//     "white background, reference art, model sheet",
//     template.suffix,
//   ].join(", ");

//   const negativePrompt = [
//     template.negative,
//     "multiple characters, background scenery, action pose, dynamic pose",
//   ].join(", ");

//   return {
//     prompt,
//     negativePrompt,
//   };
// }

// /**
//  * Enhance a user prompt with context and quality improvements
//  */
// export function enhancePrompt(
//   userPrompt: string,
//   context?: {
//     previousPanel?: string;
//     nextPanel?: string;
//     pageContext?: string;
//   }
// ): string {
//   const parts: string[] = [userPrompt];

//   // Add contextual continuity
//   if (context?.previousPanel) {
//     parts.push(`continuing from: ${context.previousPanel}`);
//   }

//   if (context?.pageContext) {
//     parts.push(`scene context: ${context.pageContext}`);
//   }

//   return parts.join(", ");
// }

// /**
//  * Sanitize user input to prevent prompt injection
//  */
// export function sanitizePrompt(prompt: string): string {
//   // Remove potentially harmful patterns
//   let sanitized = prompt
//     .replace(/\[INST\]/gi, "")
//     .replace(/\[\/INST\]/gi, "")
//     .replace(/<\|.*?\|>/g, "")
//     .replace(/###/g, "")
//     .trim();

//   // Limit length
//   if (sanitized.length > 1000) {
//     sanitized = sanitized.substring(0, 1000);
//   }

//   return sanitized;
// }
