import { schemaTask, logger } from "@trigger.dev/sdk";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";

const RoughCharacterSchema = z.object({
  name: z.string().describe("Character's name"),
  role: z.enum(["protagonist", "antagonist", "supporting", "minor"]).describe("Character's role in the story"),
  species: z.string().describe("Species (Human, Animal type, Robot, etc.)"),
  category: z.enum(["Human", "Anthropomorphic", "Feral", "Object/Mecha"]).describe("Visual category"),
  briefDescription: z.string().describe("Brief visual description (2-3 sentences)"),
  visualKeywords: z.string().describe("5-7 comma-separated keywords for image generation"),
  estimatedAge: z.string().describe("Age range (e.g., 'teen', 'adult', 'elderly')"),
  gender: z.string().describe("Gender"),
  // Rough consistency anchors
  silhouette: z.string().describe("Body type + signature shape"),
  distinctiveFeature: z.string().describe("One most distinctive visual feature"),
});

const RoughExtractionSchema = z.object({
  characters: z.array(RoughCharacterSchema).max(5),
  settingHints: z.string().nullable().describe("Visual hints about the setting"),
  toneHints: z.string().nullable().describe("Visual tone hints (dark, bright, etc.)"),
});

const ExtractRoughCharactersPayloadSchema = z.object({
  projectId: z.string().describe("The project ID"),
  storyDescription: z.string().describe("The original story description"),
  genre: z.string().nullable().describe("The genre"),
  artStyle: z.string().describe("The art style"),
});

const ROUGH_EXTRACTION_PROMPT = `You are a manga character designer doing a QUICK initial pass to identify characters from a story description.

**Story Description:**
{storyDescription}

**Genre:** {genre}
**Art Style:** {artStyle}
**Page Count:** {pageCount}

## CRITICAL INSTRUCTIONS - Read Carefully

**Character Limit Based on Story Length:**
- 1-2 pages: Extract 2-3 characters MAXIMUM
- 3-4 pages: Extract 3-4 characters MAXIMUM  
- 5+ pages: Extract 4-5 characters MAXIMUM

**ONLY Extract Characters Who:**
✅ Physically appear in the manga scenes
✅ Have dialogue OR significant on-screen action
✅ Are present for 2+ panels
✅ Directly participate in the story events

**DO NOT Extract:**
❌ Characters who are only mentioned/discussed (e.g., "they're pitching a game about pandas" - the pandas are NOT characters)
❌ Characters shown only in photos, screens, or presentations
❌ Background extras without names or dialogue
❌ Concepts, objects, or ideas mistaken for characters
❌ Characters from stories-within-the-story

**Examples:**
- Story: "Two devs pitch a panda game to investors" → Characters: Dev 1, Dev 2, Investor (3 total)
  - NOT: "Panda Warrior" (it's the game content, not a scene participant)
- Story: "Girl shows her friend photos of her cat" → Characters: Girl, Friend (2 total)
  - NOT: "Cat" (only in photos, not physically present)

**Genre-Specific Minimalism:**
- Slice of Life: Default to 2-3 characters (intimate focus)
- Romance: Default to 2-3 characters (relationship depth)
- Horror: Default to 2-4 characters (tension through isolation)
- Action/Shounen: Can use 3-5 if battles/teams are core to the plot

## Pre-Extraction Check

Before listing characters, answer these questions:
1. "How many people are PHYSICALLY PRESENT in the actual scenes?"
2. "Which characters speak or perform actions that need to be drawn?"
3. "Can I tell this story with fewer characters?"

If your initial count exceeds the page-based limit above, CUT the least essential characters.

## Character Profile Requirements

For each character, provide:
1. Name and role (protagonist/deuteragonist/antagonist/supporting)
2. Species and visual category (Human/Anthropomorphic/Feral/Object)
3. Brief visual description (2-3 sentences max)
4. 5-7 visual keywords for image generation
5. Age range and gender
6. Silhouette description (body type + signature shape)
7. ONE most distinctive visual feature

**Guidelines:**
- Focus on VISUAL distinctiveness
- Keep descriptions concise
- Prioritize features that make characters recognizable
- Consider {artStyle} aesthetic
- STAY WITHIN THE CHARACTER LIMIT FOR {pageCount} PAGES

Also provide hints about:
- Setting visuals (if apparent from the story)
- Visual tone (dark, bright, colorful, muted, etc.)

**Final Reminder:** For {pageCount} pages, you should extract {maxCharacters} characters maximum. Quality over quantity - fewer well-defined characters are better than many generic ones.`;

const openrouter = createOpenRouter({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const extractRoughCharacters = schemaTask({
  id: "extract-rough-characters",
  schema: ExtractRoughCharactersPayloadSchema,
  maxDuration: 120, // 2 minutes - should be fast
  run: async (payload) => {
    const { projectId, storyDescription, genre, artStyle } = payload;

    logger.info("Starting rough character extraction", {
      projectId,
      genre,
      artStyle,
    });

    try {
      const prompt = ROUGH_EXTRACTION_PROMPT
        .replace('{storyDescription}', storyDescription)
        .replace('{genre}', genre || 'manga')
        .replace(/{artStyle}/g, artStyle);

      logger.info("[AI TEXT] Rough Character Extraction - Input", {
        projectId,
        model: "openai/gpt-4.1-mini",
        promptLength: prompt.length,
        prompt: prompt,
      });

      const { object: extraction } = await generateObject({
        model: openrouter("openai/gpt-4.1-mini"),
        schema: RoughExtractionSchema,
        prompt,
        temperature: 0.5,
      });

      logger.info("[AI TEXT] Rough Character Extraction - Output", {
        projectId,
        characterCount: extraction.characters.length,
        characters: extraction.characters.map(c => ({
          name: c.name,
          role: c.role,
          species: c.species,
        })),
      });

      return {
        success: true,
        characters: extraction.characters,
        settingHints: extraction.settingHints,
        toneHints: extraction.toneHints,
      };
    } catch (error) {
      logger.error("Rough character extraction failed", {
        projectId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Return empty result instead of failing
      // The full extraction from script will still run
      return {
        success: false,
        characters: [],
        settingHints: null,
        toneHints: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Export types
export type RoughCharacter = z.infer<typeof RoughCharacterSchema>;
