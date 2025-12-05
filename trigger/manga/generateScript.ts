import { schemaTask, logger } from "@trigger.dev/sdk";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";
import { createJobClient as createClient } from "@/utils/supabase/server";
import { appendProgress } from "../streams";
import { buildPrompt } from "./prompts";
import { SCRIPT_GENERATION_PROMPT, buildStoryAnalysisSection } from "./prompts/scriptGeneration";
import type { Script } from "./types";
import { StoryAnalysisSchema } from "./analyzeStory";

const CharacterSchema = z.object({
  name: z.string().describe("The character's name (e.g., 'Akira', 'Yuki')"),
  description: z.string().describe("Brief description of the character's role and basic traits (e.g., 'A determined young samurai seeking revenge')"),
});

const PanelSchema = z.object({
  panelNumber: z.number().describe("Panel number within this page (1-6)"),
  sceneDescription: z.string().describe("Detailed description of what is happening in this panel, including setting, character actions, and visual elements"),
  prompt: z.string().describe("Concise image generation prompt for this panel (focus on visual elements, composition, and mood)"),
  shotType: z.enum([
    "wide",
    "medium",
    "close-up",
    "extreme-close-up",
    "establishing",
  ]).describe("Camera shot type: wide (full scene), medium (waist up), close-up (face/upper body), extreme-close-up (detail), establishing (location)"),
  cameraAngle: z.enum([
    "eye-level",
    "high-angle",
    "low-angle",
    "birds-eye",
    "worms-eye",
    "dutch-angle",
  ]).describe("Camera angle: eye-level (neutral), high-angle (looking down), low-angle (looking up), birds-eye (from above), worms-eye (from ground), dutch-angle (tilted)"),
  characters: z.array(z.string()).describe("Array of character names appearing in this panel (use exact names from character list)"),
  dialogue: z.string().describe("Spoken dialogue in this panel (keep concise for manga bubbles, use empty string if no dialogue)"),
  narration: z.string().describe("Narrative text or internal monologue (use empty string if none)"),
  soundEffects: z.array(z.string()).describe("Manga-style sound effects (e.g., ['CRASH', 'WHOOSH', 'THUD'], use empty array if none)"),
  emotion: z.string().describe("Primary emotion or mood of this panel (e.g., 'tense', 'joyful', 'melancholic', 'intense')"),
  visualNotes: z.string().describe("Important visual details for the artist (e.g., 'cherry blossoms falling', 'dramatic lighting from window', 'speed lines for motion')"),
});

export const PageSchema = z.object({
  pageNumber: z.number().describe("Page number in the manga (1 to total page count)"),
  layoutTemplateId: z.enum([
    "dialogue-4panel",
    "action-6panel", 
    "establishing-3panel",
    "splash-single",
    "mixed-5panel",
    "grid-8panel"
  ]).describe("Layout template ID - choose based on content: dialogue-4panel (conversations), action-6panel (fast action), establishing-3panel (scene setup), splash-single (dramatic moment), mixed-5panel (action with focus), grid-8panel (complex sequences)"),
  storyBeat: z.enum(["introduction", "rising-action", "climax", "resolution", "transition"]).describe("Story beat for this page"),
  panels: z.array(PanelSchema).describe("Array of panels on this page - MUST match the panel count of the selected layout template"),
});

const ScriptSchema = z.object({
  title: z.string().describe("The title of this manga story (should be catchy and reflect the theme)"),
  characters: z.array(CharacterSchema).describe("List of all characters appearing in this manga (typically 2-5 main characters)"),
  pages: z.array(PageSchema).describe("Array of all pages in the manga, each containing multiple panels"),
});

const GenerateScriptPayloadSchema = z.object({
  projectId: z.string().describe("The project ID"),
  storyDescription: z.string().describe("The story description"),
  genre: z.string().nullable().describe("The genre (optional)"),
  artStyle: z.string().describe("The art style"),
  pageCount: z
    .number()
    .int()
    .min(1)
    .max(16)
    .describe("Number of pages (1-16)"),
  storyAnalysis: StoryAnalysisSchema,
});

const openrouter = createOpenRouter({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const generateScript = schemaTask({
  id: "generate-script",
  schema: GenerateScriptPayloadSchema,
  maxDuration: 300, // 5 minutes
  run: async (payload) => {
    const { projectId, storyDescription, genre, artStyle, pageCount, storyAnalysis } = payload;

    logger.info("Starting script generation", {
      projectId,
      pageCount,
      genre,
      artStyle,
    });

    // Update progress
    await appendProgress(
      {
        stage: "script",
        progress: 15,
        message: "✍️ Writing manga script...",
        timestamp: new Date().toISOString(),
      },
      "parent"
    );

    try {
      const climaxPage = Math.floor(pageCount * 0.75);
      const earlyPages = Math.ceil(pageCount * 0.25);
      const midPages = `${earlyPages + 1}-${climaxPage - 1}`;
      
      const storyAnalysisSection = storyAnalysis ? buildStoryAnalysisSection(storyAnalysis) : '';
      
      const scriptPrompt = buildPrompt(SCRIPT_GENERATION_PROMPT, {
        storyDescription,
        genre: genre || "manga",
        artStyle,
        pageCount,
        storyAnalysisSection,
        climaxPage,
        earlyPages,
        midPages,
        language: storyAnalysis.language
      });

      // Log AI call input
      logger.info("[AI TEXT] Script Generation - Input", {
        projectId,
        model: "openai/gpt-4.1-mini",
        promptLength: scriptPrompt.length,
        prompt: scriptPrompt,
        temperature: 0.7,
        parameters: {
          genre,
          artStyle,
          pageCount,
        },
      });

      const { object: parsedScript } = await generateObject({
        model: openrouter("openai/gpt-4.1-mini"),
        schema: ScriptSchema,
        prompt: scriptPrompt,
        temperature: 0.7,
      });

      // Log AI call output
      logger.info("[AI TEXT] Script Generation - Output", {
        projectId,
        parsedScript: JSON.stringify(parsedScript, null, 2),
      });

      // Update progress with script data
      await appendProgress(
        {
          stage: "script",
          progress: 25,
          message: "Script generation complete!",
          timestamp: new Date().toISOString(),
          data: {
            script: {
              title: parsedScript.title,
              characterCount: parsedScript.characters.length,
              pageCount: parsedScript.pages.length,
            },
          },
        },
        "parent"
      );

      // Update database
      const supabase = await createClient();
      await supabase
        .from("projects")
        .update({
          title: parsedScript.title,
          generation_stage: "script",
          generation_progress: {
            script: 100,
            characters: 0,
            storyboard: 0,
            preview: 0,
          },
          // script_data: parsedScript,
          // FIXME add field
          metadata: parsedScript
        })
        .eq("id", projectId);

      return {
        success: true,
        script: parsedScript as Script,
        title: parsedScript.title,
        characters: parsedScript.characters,
        pages: parsedScript.pages,
      };
    } catch (error) {
      logger.error("Script generation failed", {
        projectId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Update database with error
      const supabase = await createClient();
      await supabase
        .from("projects")
        .update({
          generation_stage: "preview",
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", projectId);

      throw error;
    }
  },
});
