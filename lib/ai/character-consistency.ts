// // Character Consistency Utilities
// // Manages IP-Adapter configuration for maintaining character appearance

// import { createClient } from "@/utils/supabase/server";
// import type { CharacterModel } from "@/types";

// export interface CharacterReference {
//   characterId: string;
//   name: string;
//   handle: string; // e.g., "@Akira"
//   referenceImages: string[];
//   turnaroundImages: {
//     front?: string;
//     side?: string;
//     back?: string;
//     threequarter?: string;
//   };
//   promptTriggers: string[];
// }

// export interface IPAdapterConfig {
//   images: string[];
//   scale: number;
//   characterNames: string[];
// }

// /**
//  * Fetch character references for IP-Adapter by character IDs
//  */
// export async function getCharacterReferences(
//   characterIds: string[]
// ): Promise<CharacterReference[]> {
//   if (characterIds.length === 0) {
//     return [];
//   }
//   const supabase = await createClient();

//   const { data: characters, error } = await supabase
//     .from("characters")
//     .select("*")
//     .in("id", characterIds);

//   if (error) {
//     console.error("Failed to fetch characters:", error);
//     return [];
//   }

//   return characters.map((char: CharacterModel) => ({
//     characterId: char.id,
//     name: char.name,
//     handle: char.handle,
//     referenceImages: [
//       char.reference_images.front,
//       ...(char.reference_images.expressions || []),
//     ].filter(Boolean),
//     turnaroundImages: char.turnaround || {},
//     promptTriggers: char.prompt_triggers || [],
//   }));
// }

// /**
//  * Fetch character references by @handles
//  */
// export async function getCharacterReferencesByHandles(
//   projectId: string,
//   handles: string[]
// ): Promise<CharacterReference[]> {
//   if (handles.length === 0) {
//     return [];
//   }
//   const supabase = await createClient();

//   const { data: characters, error } = await supabase
//     .from("characters")
//     .select("*")
//     .eq("project_id", projectId)
//     .in("handle", handles);

//   if (error) {
//     console.error("Failed to fetch characters by handles:", error);
//     return [];
//   }

//   return characters.map((char: CharacterModel) => ({
//     characterId: char.id,
//     name: char.name,
//     handle: char.handle,
//     referenceImages: [
//       char.reference_images.front,
//       ...(char.reference_images.expressions || []),
//     ].filter(Boolean),
//     turnaroundImages: char.turnaround || {},
//     promptTriggers: char.prompt_triggers || [],
//   }));
// }

// /**
//  * Build IP-Adapter configuration from character references
//  * Prioritizes turnaround images for better character consistency
//  */
// export function buildIPAdapterConfig(
//   characters: CharacterReference[],
//   options: {
//     maxImages?: number;
//     scale?: number;
//     prioritizeFrontView?: boolean;
//     includeTurnaround?: boolean;
//   } = {}
// ): IPAdapterConfig {
//   const {
//     maxImages = 4,
//     scale = 0.8,
//     prioritizeFrontView = true,
//     includeTurnaround = true,
//   } = options;

//   const images: string[] = [];
//   const characterNames: string[] = [];

//   for (const char of characters) {
//     characterNames.push(char.name);

//     // Collect turnaround images if available and requested
//     const turnaroundImages: string[] = [];
//     if (includeTurnaround && char.turnaroundImages) {
//       // Priority order: front, threequarter, side, back
//       if (char.turnaroundImages.front) {
//         turnaroundImages.push(char.turnaroundImages.front);
//       }
//       if (char.turnaroundImages.threequarter) {
//         turnaroundImages.push(char.turnaroundImages.threequarter);
//       }
//       if (char.turnaroundImages.side) {
//         turnaroundImages.push(char.turnaroundImages.side);
//       }
//       if (char.turnaroundImages.back) {
//         turnaroundImages.push(char.turnaroundImages.back);
//       }
//     }

//     // Add turnaround images first (best for consistency)
//     if (turnaroundImages.length > 0) {
//       const slotsForTurnaround = Math.min(
//         turnaroundImages.length,
//         maxImages - images.length
//       );
//       images.push(...turnaroundImages.slice(0, slotsForTurnaround));
//     }

//     // Add additional reference images if space allows
//     if (images.length < maxImages && char.referenceImages.length > 0) {
//       const remainingSlots = maxImages - images.length;

//       if (prioritizeFrontView && char.referenceImages.length > 0) {
//         // Add front view first if not already added via turnaround
//         const frontImage = char.referenceImages[0];
//         if (!images.includes(frontImage)) {
//           images.push(frontImage);
//         }

//         // Add additional views if space allows
//         if (images.length < maxImages && char.referenceImages.length > 1) {
//           const additionalImages = char.referenceImages
//             .slice(1)
//             .filter((img) => !images.includes(img))
//             .slice(0, maxImages - images.length);
//           images.push(...additionalImages);
//         }
//       } else {
//         // Add all available images up to max
//         const additionalImages = char.referenceImages
//           .filter((img) => !images.includes(img))
//           .slice(0, remainingSlots);
//         images.push(...additionalImages);
//       }
//     }

//     // Stop if we've reached max images
//     if (images.length >= maxImages) {
//       break;
//     }
//   }

//   return {
//     images,
//     scale,
//     characterNames,
//   };
// }

// /**
//  * Calculate optimal IP-Adapter scale based on scene context
//  */
// export function calculateIPAdapterScale(context: {
//   shotType?: string;
//   numCharacters: number;
//   sceneComplexity?: "simple" | "medium" | "complex";
// }): number {
//   const { shotType, numCharacters, sceneComplexity = "medium" } = context;

//   let scale = 0.8; // Default

//   // Adjust based on shot type
//   if (shotType === "close-up") {
//     // Higher scale for close-ups (more character detail needed)
//     scale = 0.9;
//   } else if (shotType === "wide" || shotType === "establishing") {
//     // Lower scale for wide shots (more scene flexibility)
//     scale = 0.6;
//   }

//   // Adjust based on number of characters
//   if (numCharacters > 2) {
//     // Reduce scale slightly for multiple characters
//     scale -= 0.1;
//   }

//   // Adjust based on scene complexity
//   if (sceneComplexity === "complex") {
//     // Lower scale for complex scenes (more creative freedom)
//     scale -= 0.1;
//   } else if (sceneComplexity === "simple") {
//     // Higher scale for simple scenes (more character focus)
//     scale += 0.1;
//   }

//   // Clamp between 0.5 and 1.0
//   return Math.max(0.5, Math.min(1.0, scale));
// }

// /**
//  * Validate character reference images
//  */
// export function validateCharacterReferences(characters: CharacterReference[]): {
//   valid: boolean;
//   errors: string[];
//   warnings: string[];
// } {
//   const errors: string[] = [];
//   const warnings: string[] = [];

//   if (characters.length === 0) {
//     warnings.push("No character references provided");
//   }

//   for (const char of characters) {
//     if (char.referenceImages.length === 0) {
//       errors.push(`Character "${char.name}" has no reference images`);
//     }

//     if (char.promptTriggers.length === 0) {
//       warnings.push(`Character "${char.name}" has no prompt triggers defined`);
//     }

//     // Check if images are accessible (basic URL validation)
//     for (const imageUrl of char.referenceImages) {
//       if (!imageUrl.startsWith("http")) {
//         errors.push(
//           `Invalid image URL for character "${char.name}": ${imageUrl}`
//         );
//       }
//     }
//   }

//   return {
//     valid: errors.length === 0,
//     errors,
//     warnings,
//   };
// }

// /**
//  * Extract @handles from a prompt string
//  */
// export function extractHandlesFromPrompt(prompt: string): string[] {
//   const handleRegex = /@[a-zA-Z0-9_-]+/g;
//   const matches = prompt.match(handleRegex);
//   return matches ? Array.from(new Set(matches)) : [];
// }

// /**
//  * Replace @handles in prompt with character names and triggers
//  */
// export function replaceHandlesInPrompt(
//   prompt: string,
//   characters: CharacterReference[]
// ): string {
//   let processedPrompt = prompt;

//   for (const char of characters) {
//     // Replace @handle with character name and primary trigger
//     const handleRegex = new RegExp(char.handle, "gi");
//     const replacement = `${char.name}`;
//     processedPrompt = processedPrompt.replace(handleRegex, replacement);
//   }

//   return processedPrompt;
// }

// /**
//  * Build IP-Adapter configuration from @handles in prompt
//  */
// export async function buildIPAdapterConfigFromPrompt(
//   projectId: string,
//   prompt: string,
//   options: {
//     maxImages?: number;
//     scale?: number;
//     prioritizeFrontView?: boolean;
//   } = {}
// ): Promise<IPAdapterConfig | null> {
//   // Extract @handles from prompt
//   const handles = extractHandlesFromPrompt(prompt);

//   if (handles.length === 0) {
//     return null;
//   }

//   // Fetch character references
//   const characters = await getCharacterReferencesByHandles(projectId, handles);

//   if (characters.length === 0) {
//     console.warn(`No characters found for handles: ${handles.join(", ")}`);
//     return null;
//   }

//   // Build IP-Adapter config
//   return buildIPAdapterConfig(characters, options);
// }

// /**
//  * Merge character prompt triggers into generation prompt
//  */
// export function mergeCharacterTriggers(
//   basePrompt: string,
//   characters: CharacterReference[]
// ): string {
//   const triggers = characters.flatMap((char) => [
//     char.name,
//     ...char.promptTriggers,
//   ]);

//   if (triggers.length === 0) {
//     return basePrompt;
//   }

//   // Check if triggers are already in prompt
//   const lowercasePrompt = basePrompt.toLowerCase();
//   const uniqueTriggers = triggers.filter(
//     (trigger) => !lowercasePrompt.includes(trigger.toLowerCase())
//   );

//   if (uniqueTriggers.length === 0) {
//     return basePrompt;
//   }

//   // Add triggers at the beginning for emphasis
//   return `${uniqueTriggers.join(", ")}, ${basePrompt}`;
// }

// /**
//  * Prepare image generation request with IP-Adapter character consistency
//  */
// export async function prepareGenerationWithCharacters(
//   projectId: string,
//   prompt: string,
//   options: {
//     characterHandles?: string[];
//     characterIds?: string[];
//     width?: number;
//     height?: number;
//     shotType?: string;
//     sceneComplexity?: "simple" | "medium" | "complex";
//     maxIPAdapterImages?: number;
//   } = {}
// ): Promise<{
//   prompt: string;
//   ipAdapterImages: string[];
//   ipAdapterScale: number;
//   characterNames: string[];
// }> {
//   const {
//     characterHandles,
//     characterIds,
//     width = 1024,
//     height = 1024,
//     shotType,
//     sceneComplexity = "medium",
//     maxIPAdapterImages = 4,
//   } = options;

//   let characters: CharacterReference[] = [];

//   // Fetch characters by handles or IDs
//   if (characterHandles && characterHandles.length > 0) {
//     characters = await getCharacterReferencesByHandles(
//       projectId,
//       characterHandles
//     );
//   } else if (characterIds && characterIds.length > 0) {
//     characters = await getCharacterReferences(characterIds);
//   } else {
//     // Try to extract handles from prompt
//     const extractedHandles = extractHandlesFromPrompt(prompt);
//     if (extractedHandles.length > 0) {
//       characters = await getCharacterReferencesByHandles(
//         projectId,
//         extractedHandles
//       );
//     }
//   }

//   if (characters.length === 0) {
//     // No characters found, return basic config
//     return {
//       prompt,
//       ipAdapterImages: [],
//       ipAdapterScale: 0,
//       characterNames: [],
//     };
//   }

//   // Calculate optimal IP-Adapter scale
//   const scale = calculateIPAdapterScale({
//     shotType,
//     numCharacters: characters.length,
//     sceneComplexity,
//   });

//   // Build IP-Adapter config with turnaround images
//   const ipConfig = buildIPAdapterConfig(characters, {
//     maxImages: maxIPAdapterImages,
//     scale,
//     prioritizeFrontView: true,
//     includeTurnaround: true,
//   });

//   // Replace @handles in prompt with character names
//   const processedPrompt = replaceHandlesInPrompt(prompt, characters);

//   // Merge character triggers
//   const finalPrompt = mergeCharacterTriggers(processedPrompt, characters);

//   return {
//     prompt: finalPrompt,
//     ipAdapterImages: ipConfig.images,
//     ipAdapterScale: ipConfig.scale,
//     characterNames: ipConfig.characterNames,
//   };
// }

// /**
//  * Test IP-Adapter consistency across multiple panels
//  * Generates test images with the same character to verify consistency
//  */
// export async function testCharacterConsistency(
//   projectId: string,
//   characterHandle: string,
//   testPrompts: string[],
//   options: {
//     width?: number;
//     height?: number;
//     ipAdapterScale?: number;
//   } = {}
// ): Promise<{
//   success: boolean;
//   results: Array<{
//     prompt: string;
//     imageUrl: string;
//     ipAdapterImages: string[];
//     scale: number;
//   }>;
//   errors: string[];
// }> {
//   const { width = 1024, height = 1024, ipAdapterScale } = options;

//   const results: Array<{
//     prompt: string;
//     imageUrl: string;
//     ipAdapterImages: string[];
//     scale: number;
//   }> = [];
//   const errors: string[] = [];

//   try {
//     // Fetch character reference
//     const characters = await getCharacterReferencesByHandles(projectId, [
//       characterHandle,
//     ]);

//     if (characters.length === 0) {
//       throw new Error(`Character not found: ${characterHandle}`);
//     }

//     const character = characters[0];

//     // Validate character references
//     const validation = validateCharacterReferences([character]);
//     if (!validation.valid) {
//       errors.push(...validation.errors);
//       return { success: false, results, errors };
//     }

//     // Build IP-Adapter config
//     const ipConfig = buildIPAdapterConfig([character], {
//       maxImages: 4,
//       scale: ipAdapterScale || 0.8,
//       includeTurnaround: true,
//     });

//     // Generate test images
//     for (const testPrompt of testPrompts) {
//       const processedPrompt = replaceHandlesInPrompt(testPrompt, [character]);
//       const finalPrompt = mergeCharacterTriggers(processedPrompt, [character]);

//       // Note: Actual image generation would happen here
//       // For now, we just prepare the configuration
//       results.push({
//         prompt: finalPrompt,
//         imageUrl: "", // Would be filled by actual generation
//         ipAdapterImages: ipConfig.images,
//         scale: ipConfig.scale,
//       });
//     }

//     return {
//       success: true,
//       results,
//       errors: validation.warnings,
//     };
//   } catch (error) {
//     errors.push(
//       error instanceof Error ? error.message : "Unknown error occurred"
//     );
//     return {
//       success: false,
//       results,
//       errors,
//     };
//   }
// }
