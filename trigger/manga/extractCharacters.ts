import { schemaTask, logger } from "@trigger.dev/sdk";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject, APICallError } from "ai";
import { z } from "zod";
import { appendProgress } from "../streams";
import { buildPrompt } from "./prompts";
import { CHARACTER_EXTRACTION_PROMPT } from "./prompts/characterExtraction"; 
import type { Script } from "./types";
import { formatScriptAsText } from "./types";

// ============================================
// VISUAL ANCHORS SCHEMA (NEW)
// ============================================
const VisualAnchorsSchema = z.object({
  silhouette: z.string().describe("Body type + signature shape (e.g., 'tall lanky, spiky hair pointing upward')"),
  faceAnchor: z.string().describe("One unchanging facial feature (e.g., 'scar over left eye', 'red eyes')"),
  clothingAnchor: z.string().describe("One unchanging clothing element (e.g., 'red scarf', 'leather jacket')"),
  primaryTone: z.enum(["light", "medium", "dark"]).describe("Primary grayscale value for this character"),
});

// ============================================
// APPEARANCE SCHEMA
// ============================================
const AppearanceSchema = z.object({
  headFeature: z.string().describe("Description of head/hair. For humans: hair style/color. For animals: ear shape, fur patterns on head, whiskers."),
  eyeColor: z.string().describe("Eye color (e.g., 'brown', 'red', 'glowing blue')"),
  skinOrFurType: z.string().describe("Texture and color of the body surface. (e.g., 'pale skin', 'brown fluffy fur', 'green hard scales')"),
  height: z.string().describe("Height description relative to others (e.g., 'tall', 'very small', 'looming')"),
  build: z.string().describe("Body build (e.g., 'round and soft', 'muscular', 'slender')"),
  distinctiveFeatures: z.string().describe("Unique visual identifiers (e.g., 'shell on back', 'scar on eye', 'tail type', 'glasses')"),
}).describe("Physical appearance details suited for both humans and non-humans");

const OutfitSchema = z.object({
  main: z.string().describe("Primary outfit or 'None' if the character doesn't wear clothes"),
  alternative: z.string().nullable().describe("Alternative outfit (optional)"),
  accessories: z.string().nullable().describe("Items they carry or wear (e.g., 'red scarf', 'magic staff', 'shell')"),
}).describe("Clothing and outfit information");

// ============================================
// EXTRACTED CHARACTER SCHEMA (ENHANCED)
// ============================================
export const ExtractedCharacterSchema = z.object({
  name: z.string().describe("Character's name"),
  species: z.string().describe("The specific species of the character (e.g., 'Human', 'Rabbit', 'Robot', 'Demon')"),
  category: z.enum(["Human", "Anthropomorphic", "Feral", "Object/Mecha"])
    .describe("Visual category: 'Human' (normal human), 'Anthropomorphic' (animal with human body structure), 'Feral' (animal on 4 legs), 'Object/Mecha' (robot/item)"),
  visualKeywords: z.string().describe("5-7 comma-separated keywords for AI image generator to strictly define the species and look"),
  handle: z.string().describe("Character handle @[name]"),
  role: z.enum(["protagonist", "antagonist", "supporting", "minor"]),
  age: z.string().describe("Age range (e.g., '16-18', 'elderly', 'young cub')"),
  gender: z.string().describe("Gender"),
  personality: z.string(),
  
  appearance: AppearanceSchema,
  outfit: OutfitSchema.nullable(),
  
  // NEW: Consistency System
  consistencyString: z.string().max(100).describe("Condensed visual anchor phrase (under 100 chars) for panel prompts. Example: 'tall spiky-haired teen, scar over left eye, red scarf'"),
  visualAnchors: VisualAnchorsSchema.describe("Structured visual anchors for consistency"),
  
  expressions: z.array(z.string()),
  firstAppearance: z.string(),
  visualReferenceNotes: z.string(),
});

export const CharacterExtractionSchema = z.object({
  characters: z.array(ExtractedCharacterSchema),
});

const ExtractCharactersPayloadSchema = z.object({
  projectId: z.string(),
  script: z.custom<Script>(),
  artStyle: z.string(),
  genre: z.string().nullable(),
  pageCount: z.number().int(),
});

const openrouter = createOpenRouter({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const extractCharacters = schemaTask({
  id: "extract-characters",
  schema: ExtractCharactersPayloadSchema,
  maxDuration: 180,
  run: async (payload) => {
    const { projectId, script, artStyle, genre, pageCount } = payload;

    logger.info("Starting character extraction with consistency system", { projectId, artStyle });

    await appendProgress(
      {
        stage: "characters",
        progress: 26,
        message: "👥 Extracting characters from script...",
        timestamp: new Date().toISOString(),
      },
      "parent"
    );

    try {
      const scriptText = formatScriptAsText(script);
      
      const extractionPrompt = buildPrompt(CHARACTER_EXTRACTION_PROMPT, {
        script: scriptText,
        artStyle,
        genre: genre || "manga",
        pageCount,
      });

      logger.info("[AI TEXT] Character Extraction - Input", {
        projectId,
        model: "openai/gpt-4.1-mini",
        promptLength: extractionPrompt.length,
        extractionPrompt
      });

      const { object: extraction } = await generateObject({
        model: openrouter("openai/gpt-4.1-mini"),
        schema: CharacterExtractionSchema, 
        prompt: extractionPrompt,
        temperature: 0.4, 
      });

      logger.info("[AI TEXT] Character Extraction - Output", {
        projectId,
        characterCount: extraction.characters.length,
        speciesCheck: extraction.characters.map(c => `${c.name}: ${c.species} (${c.category})`),
        consistencyStrings: extraction.characters.map(c => `${c.name}: "${c.consistencyString}"`),
      });

      // Validate consistency strings are under 100 chars
      extraction.characters.forEach(char => {
        if (char.consistencyString.length > 100) {
          logger.warn("Consistency string exceeds 100 chars, truncating", {
            characterName: char.name,
            originalLength: char.consistencyString.length,
          });
          char.consistencyString = char.consistencyString.substring(0, 97) + "...";
        }
      });

      await appendProgress(
        {
          stage: "characters",
          progress: 29,
          message: `Found ${extraction.characters.length} characters!`,
          timestamp: new Date().toISOString(),
        },
        "parent"
      );

      return {
        success: true,
        characters: extraction.characters,
      };
    } catch (error) {
      logger.info("Error", { data: (error as APICallError).data });
      logger.info("Error", { cause: (error as APICallError).cause });
      logger.info("message", { cause: (error as APICallError).message });
      logger.error("Character extraction failed", { projectId, error });
      throw error;
    }
  },
});

// Export types for use in other files
export type ExtractedCharacter = z.infer<typeof ExtractedCharacterSchema>;
export type VisualAnchors = z.infer<typeof VisualAnchorsSchema>;
