// /**
//  * Style Presets for Manga/Comic Generation
//  * Defines 12 distinct visual styles with prompt templates
//  */

// import type { StyleType } from "@/types";

// export interface StylePreset {
//   id: StyleType;
//   name: string;
//   description: string;
//   prefix: string;
//   suffix: string;
//   negativePrompt: string;
//   thumbnailUrl?: string;
//   category: "manga" | "comic" | "anime" | "hybrid";
//   colorMode: "black-white" | "grayscale" | "color";
//   recommendedSettings: {
//     numInferenceSteps: number;
//     guidanceScale: number;
//     ipAdapterScale?: number;
//   };
// }

// /**
//  * Complete style preset definitions
//  */
// export const STYLE_PRESETS: Record<StyleType, StylePreset> = {
//   shonen: {
//     id: "shonen",
//     name: "Shonen Screentone",
//     description:
//       "Dynamic action manga style with bold lines, high contrast, and dramatic speed lines",
//     prefix:
//       "manga panel, shonen style, dynamic action pose, bold ink lines, high contrast screentone,",
//     suffix:
//       "dramatic lighting, speed lines, intense expression, black and white manga art, professional manga quality",
//     negativePrompt:
//       "color, realistic photo, 3d render, blurry, low quality, watermark, text, signature, soft lines, pastel",
//     category: "manga",
//     colorMode: "black-white",
//     recommendedSettings: {
//       numInferenceSteps: 28,
//       guidanceScale: 3.5,
//       ipAdapterScale: 0.85,
//     },
//   },

//   shojo: {
//     id: "shojo",
//     name: "Shojo Sparkle",
//     description:
//       "Elegant romantic manga style with delicate lines, sparkles, and beautiful detailed eyes",
//     prefix:
//       "manga panel, shojo style, elegant composition, delicate lines, soft shading,",
//     suffix:
//       "beautiful detailed eyes, flowing hair, sparkles and flowers, romantic atmosphere, black and white manga art, shoujo aesthetic",
//     negativePrompt:
//       "color, realistic photo, 3d render, harsh lines, blurry, low quality, watermark, text, masculine, rough",
//     category: "manga",
//     colorMode: "black-white",
//     recommendedSettings: {
//       numInferenceSteps: 30,
//       guidanceScale: 4.0,
//       ipAdapterScale: 0.9,
//     },
//   },

//   chibi: {
//     id: "chibi",
//     name: "Chibi Cute",
//     description:
//       "Super deformed cute style with round shapes, simple lines, and adorable expressions",
//     prefix:
//       "manga panel, chibi style, cute super deformed characters, simple lines, round shapes,",
//     suffix:
//       "adorable expression, exaggerated features, kawaii aesthetic, black and white manga art, SD proportions",
//     negativePrompt:
//       "color, realistic proportions, detailed anatomy, blurry, low quality, watermark, text, serious, realistic",
//     category: "manga",
//     colorMode: "black-white",
//     recommendedSettings: {
//       numInferenceSteps: 25,
//       guidanceScale: 3.0,
//       ipAdapterScale: 0.75,
//     },
//   },

//   webtoon: {
//     id: "webtoon",
//     name: "Webtoon Color",
//     description:
//       "Modern digital comic style with clean lines, full color, and vertical scroll format",
//     prefix:
//       "webtoon panel, digital comic style, clean lines, modern aesthetic,",
//     suffix:
//       "full color illustration, smooth shading, contemporary art style, vertical scroll format, digital painting",
//     negativePrompt:
//       "black and white, traditional manga, screentone, blurry, low quality, watermark, text, signature, sketchy",
//     category: "comic",
//     colorMode: "color",
//     recommendedSettings: {
//       numInferenceSteps: 32,
//       guidanceScale: 4.5,
//       ipAdapterScale: 0.8,
//     },
//   },

//   american: {
//     id: "american",
//     name: "Marvel Ink",
//     description:
//       "American comic book style with bold inking, vibrant colors, and superhero aesthetic",
//     prefix:
//       "comic book panel, American comic style, bold inking, dynamic composition,",
//     suffix:
//       "superhero aesthetic, dramatic shadows, full color, professional comic art, Marvel style, DC comics style",
//     negativePrompt:
//       "manga style, anime, black and white, blurry, low quality, watermark, text, signature, soft lines",
//     category: "comic",
//     colorMode: "color",
//     recommendedSettings: {
//       numInferenceSteps: 30,
//       guidanceScale: 4.0,
//       ipAdapterScale: 0.85,
//     },
//   },

//   noir: {
//     id: "noir",
//     name: "Noir Shadow",
//     description:
//       "Dark atmospheric style with heavy shadows, dramatic contrast, and film noir aesthetic",
//     prefix:
//       "noir comic panel, dark atmospheric style, heavy shadows, dramatic contrast,",
//     suffix:
//       "film noir aesthetic, moody lighting, black and white with high contrast, detective story mood, chiaroscuro",
//     negativePrompt:
//       "color, bright lighting, cheerful, blurry, low quality, watermark, text, soft shadows, pastel",
//     category: "comic",
//     colorMode: "black-white",
//     recommendedSettings: {
//       numInferenceSteps: 28,
//       guidanceScale: 4.5,
//       ipAdapterScale: 0.8,
//     },
//   },

//   ghibli: {
//     id: "ghibli",
//     name: "Ghibli Soft",
//     description:
//       "Studio Ghibli inspired style with soft watercolor, gentle lighting, and pastoral atmosphere",
//     prefix:
//       "anime panel, studio ghibli style, soft watercolor, gentle lighting,",
//     suffix:
//       "pastoral atmosphere, hand-painted aesthetic, warm colors, miyazaki style, detailed background, whimsical",
//     negativePrompt:
//       "harsh lines, dark, gritty, realistic photo, 3d render, blurry, low quality, watermark, text, digital art",
//     category: "anime",
//     colorMode: "color",
//     recommendedSettings: {
//       numInferenceSteps: 35,
//       guidanceScale: 5.0,
//       ipAdapterScale: 0.85,
//     },
//   },

//   cyberpunk: {
//     id: "cyberpunk",
//     name: "Cyberpunk 2077",
//     description:
//       "Futuristic cyberpunk style with neon lights, high tech aesthetic, and urban dystopia",
//     prefix:
//       "cyberpunk comic panel, futuristic style, neon lights, high tech aesthetic,",
//     suffix:
//       "cyberpunk cityscape, neon signs, rain-slicked streets, high tech low life, blade runner aesthetic, dystopian future",
//     negativePrompt:
//       "medieval, fantasy, natural, pastoral, blurry, low quality, watermark, text, bright daylight, clean",
//     category: "hybrid",
//     colorMode: "color",
//     recommendedSettings: {
//       numInferenceSteps: 32,
//       guidanceScale: 4.5,
//       ipAdapterScale: 0.8,
//     },
//   },

//   seinen: {
//     id: "seinen",
//     name: "Seinen Gritty",
//     description:
//       "Mature manga style with realistic proportions, detailed linework, and dark themes",
//     prefix:
//       "manga panel, seinen style, realistic proportions, detailed linework,",
//     suffix:
//       "mature themes, gritty atmosphere, detailed shading, black and white manga art, realistic anatomy, dark mood",
//     negativePrompt:
//       "color, cute, chibi, simplified, blurry, low quality, watermark, text, cheerful, bright",
//     category: "manga",
//     colorMode: "black-white",
//     recommendedSettings: {
//       numInferenceSteps: 32,
//       guidanceScale: 4.0,
//       ipAdapterScale: 0.9,
//     },
//   },

//   marvel: {
//     id: "marvel",
//     name: "Marvel Superhero",
//     description:
//       "Classic Marvel comic style with bold colors, dynamic poses, and heroic aesthetic",
//     prefix:
//       "marvel comic panel, superhero style, bold colors, dynamic action pose,",
//     suffix:
//       "heroic composition, dramatic lighting, vibrant colors, professional comic book art, jack kirby style, marvel universe",
//     negativePrompt:
//       "manga, anime, black and white, realistic photo, blurry, low quality, watermark, text, muted colors",
//     category: "comic",
//     colorMode: "color",
//     recommendedSettings: {
//       numInferenceSteps: 30,
//       guidanceScale: 4.0,
//       ipAdapterScale: 0.85,
//     },
//   },

//   "manga-classic": {
//     id: "manga-classic",
//     name: "Manga Classic",
//     description:
//       "Traditional manga style with clean lines, classic screentone, and timeless aesthetic",
//     prefix:
//       "manga panel, classic manga style, clean ink lines, traditional screentone,",
//     suffix:
//       "black and white manga art, professional manga quality, tezuka style, classic composition, traditional manga aesthetic",
//     negativePrompt:
//       "color, digital art, modern, realistic photo, 3d render, blurry, low quality, watermark, text",
//     category: "manga",
//     colorMode: "black-white",
//     recommendedSettings: {
//       numInferenceSteps: 28,
//       guidanceScale: 3.5,
//       ipAdapterScale: 0.85,
//     },
//   },

//   "anime-cel": {
//     id: "anime-cel",
//     name: "Anime Cel",
//     description:
//       "Traditional anime cel style with flat colors, clean lines, and 90s anime aesthetic",
//     prefix: "anime panel, cel animation style, flat colors, clean outlines,",
//     suffix:
//       "traditional anime aesthetic, 90s anime style, vibrant colors, hand-drawn look, cel shading, anime composition",
//     negativePrompt:
//       "realistic, 3d render, gradient shading, blurry, low quality, watermark, text, modern digital, painterly",
//     category: "anime",
//     colorMode: "color",
//     recommendedSettings: {
//       numInferenceSteps: 28,
//       guidanceScale: 4.0,
//       ipAdapterScale: 0.85,
//     },
//   },
// };

// /**
//  * Get style preset by ID
//  */
// export function getStylePreset(styleId: StyleType): StylePreset {
//   return STYLE_PRESETS[styleId];
// }

// /**
//  * Get all style presets
//  */
// export function getAllStylePresets(): StylePreset[] {
//   return Object.values(STYLE_PRESETS);
// }

// /**
//  * Get style presets by category
//  */
// export function getStylePresetsByCategory(
//   category: "manga" | "comic" | "anime" | "hybrid"
// ): StylePreset[] {
//   return Object.values(STYLE_PRESETS).filter(
//     (preset) => preset.category === category
//   );
// }

// /**
//  * Get style presets by color mode
//  */
// export function getStylePresetsByColorMode(
//   colorMode: "black-white" | "grayscale" | "color"
// ): StylePreset[] {
//   return Object.values(STYLE_PRESETS).filter(
//     (preset) => preset.colorMode === colorMode
//   );
// }

// /**
//  * Apply style preset to prompt
//  */
// export function applyStyleToPrompt(
//   basePrompt: string,
//   styleId: StyleType,
//   options: {
//     includePrefix?: boolean;
//     includeSuffix?: boolean;
//     quality?: "draft" | "standard" | "high";
//   } = {}
// ): {
//   prompt: string;
//   negativePrompt: string;
// } {
//   const {
//     includePrefix = true,
//     includeSuffix = true,
//     quality = "standard",
//   } = options;

//   const preset = getStylePreset(styleId);
//   const parts: string[] = [];

//   // Add quality modifier
//   const qualityModifiers = {
//     draft: "sketch quality, rough lines",
//     standard: "professional quality, clean lines",
//     high: "masterpiece quality, highly detailed, award-winning, professional artist",
//   };
//   parts.push(qualityModifiers[quality]);

//   // Add style prefix
//   if (includePrefix) {
//     parts.push(preset.prefix);
//   }

//   // Add base prompt
//   parts.push(basePrompt);

//   // Add style suffix
//   if (includeSuffix) {
//     parts.push(preset.suffix);
//   }

//   return {
//     prompt: parts.join(", "),
//     negativePrompt: preset.negativePrompt,
//   };
// }

// /**
//  * Get recommended generation settings for style
//  */
// export function getStyleGenerationSettings(styleId: StyleType): {
//   numInferenceSteps: number;
//   guidanceScale: number;
//   ipAdapterScale: number;
// } {
//   const preset = getStylePreset(styleId);
//   return {
//     ...preset.recommendedSettings,
//     ipAdapterScale: preset.recommendedSettings.ipAdapterScale || 0.8,
//   };
// }

// /**
//  * Validate style compatibility with features
//  */
// export function validateStyleCompatibility(
//   styleId: StyleType,
//   features: {
//     hasColor?: boolean;
//     hasCharacters?: boolean;
//     hasControlNet?: boolean;
//   }
// ): {
//   compatible: boolean;
//   warnings: string[];
// } {
//   const preset = getStylePreset(styleId);
//   const warnings: string[] = [];

//   // Check color compatibility
//   if (features.hasColor && preset.colorMode === "black-white") {
//     warnings.push(
//       `Style "${preset.name}" is black and white, color information will be ignored`
//     );
//   }

//   // Check character consistency
//   if (features.hasCharacters && preset.recommendedSettings.ipAdapterScale) {
//     const scale = preset.recommendedSettings.ipAdapterScale;
//     if (scale < 0.7) {
//       warnings.push(
//         `Style "${preset.name}" has lower character consistency (IP-Adapter scale: ${scale})`
//       );
//     }
//   }

//   // Check ControlNet compatibility
//   if (features.hasControlNet && preset.category === "anime") {
//     warnings.push(
//       `Style "${preset.name}" may have reduced ControlNet accuracy with anime styles`
//     );
//   }

//   return {
//     compatible: true, // All styles are technically compatible
//     warnings,
//   };
// }

// /**
//  * Get style preset thumbnail URL
//  */
// export function getStyleThumbnailUrl(styleId: StyleType): string {
//   // In production, these would be actual thumbnail images
//   return `/styles/${styleId}-thumbnail.jpg`;
// }

// /**
//  * Create style preset grid for UI
//  */
// export function createStylePresetGrid(): Array<{
//   id: StyleType;
//   name: string;
//   description: string;
//   thumbnailUrl: string;
//   category: string;
//   colorMode: string;
// }> {
//   return getAllStylePresets().map((preset) => ({
//     id: preset.id,
//     name: preset.name,
//     description: preset.description,
//     thumbnailUrl: getStyleThumbnailUrl(preset.id),
//     category: preset.category,
//     colorMode: preset.colorMode,
//   }));
// }
