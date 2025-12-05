import { schemaTask, logger } from "@trigger.dev/sdk";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";
import { createJobClient as createClient } from "@/utils/supabase/server";
import { appendProgress } from "../streams";
import { buildPrompt } from "./prompts";
import { STORY_ANALYSIS_PROMPT } from "./prompts/storyAnalysis";

// ============================================
// DRAMATIC CORE SCHEMA (NEW)
// ============================================
const DramaticCoreSchema = z.object({
  centralConflict: z.string().describe("The opposing forces driving the story (character vs character, vs self, vs environment)"),
  stakes: z.string().describe("What the protagonist loses if they fail - be specific and visceral"),
  emotionalArc: z.object({
    start: z.string().describe("The emotional state/feeling at the beginning"),
    end: z.string().describe("The emotional state/feeling at the end"),
  }).describe("The emotional journey from start to end"),
  theTurn: z.string().describe("The single moment where everything changes - the climax anchor"),
});

const SplashMomentSchema = z.object({
  description: z.string().describe("Description of this splash-worthy moment"),
  suggestedPage: z.number().describe("Recommended page number for this moment"),
  emotionalFunction: z.string().describe("Why this moment deserves emphasis - what emotion does it deliver?"),
});

// ============================================
// EXISTING SCHEMAS (ENHANCED)
// ============================================
const TonalShiftSchema = z.object({
  page: z.number().describe("The page number where this tonal shift occurs"),
  tone: z.string().describe("The tone/mood at this point (e.g., 'peaceful', 'tense', 'triumphant', 'melancholic')"),
});

const KeySceneSchema = z.object({
  description: z.string().describe("Detailed description of this key scene and what happens"),
  importance: z.enum(["high", "medium", "low"]).describe("How critical this scene is to the story"),
  suggestedPanels: z.number().describe("Recommended number of panels to dedicate to this scene (typically 2-8)"),
  emotionalBeat: z.string().nullable().describe("The emotional purpose of this scene"),
});

export const StoryAnalysisSchema = z.object({
  language: z.string().describe("The main language of the story"),
  
  // NEW: Dramatic Core (Phase 1)
  dramaticCore: DramaticCoreSchema.describe("The dramatic foundation of the story"),
  
  // NEW: Visual Opportunities (Phase 2)
  splashMoments: z.array(SplashMomentSchema).max(2).describe("1-2 scenes deserving full-page or dominant treatment"),
  visualMotif: z.string().nullable().describe("Recurring visual element to unify the manga (symbol, weather, object)"),
  contrastPairs: z.array(z.object({
    scene1: z.string().describe("First scene in the contrast pair"),
    scene2: z.string().describe("Second scene that gains power by juxtaposition"),
    effect: z.string().describe("The emotional effect of this contrast"),
  })).nullable().describe("Scenes that gain power by juxtaposition"),
  
  // EXISTING: Structure (Phase 3)
  mainTheme: z.string().describe("The central theme or message of the story"),
  setting: z.object({
    time: z.string().describe("Time period of the story"),
    location: z.string().describe("Primary location(s) where the story takes place"),
    atmosphere: z.string().describe("Overall atmosphere and mood of the setting"),
  }).describe("The setting and world of the story"),
  tonalShifts: z.array(TonalShiftSchema).describe("Key moments where the tone/mood changes significantly"),
  keyScenes: z.array(KeySceneSchema).describe("The most important scenes that must be included"),
  pacing: z.object({
    opening: z.enum(["slow", "medium", "fast"]).describe("Pacing of the opening pages"),
    middle: z.string().describe("How the middle section should be paced"),
    climax: z.string().describe("Description of where and how the climax should occur"),
    resolution: z.string().describe("How the resolution should be handled"),
  }).describe("Pacing recommendations for different sections"),
});

export const AnalyzeStoryPayloadSchema = z.object({
  projectId: z.string().describe("The project ID"),
  storyDescription: z.string().describe("The story description"),
  genre: z.string().nullable().describe("The genre (optional)"),
  pageCount: z.number().int().min(1).max(16).describe("Number of pages (1-16)"),
});

const openrouter = createOpenRouter({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const analyzeStory = schemaTask({
  id: "analyze-story",
  schema: AnalyzeStoryPayloadSchema,
  maxDuration: 180, // 3 minutes
  run: async (payload) => {
    const { projectId, storyDescription, genre, pageCount } = payload;

    logger.info("Starting story analysis with dramatic core", {
      projectId,
      pageCount,
      genre,
    });

    await appendProgress(
      {
        stage: "analyzing",
        progress: 5,
        message: "📖 Analyzing your story's dramatic core...",
        timestamp: new Date().toISOString(),
      },
      "parent"
    );

    try {
      const climaxPage = Math.floor(pageCount * 0.75);
      
      const analysisPrompt = buildPrompt(STORY_ANALYSIS_PROMPT, {
        storyDescription,
        genre: genre || "Not specified",
        pageCount,
        climaxPage,
      });

      logger.info("[AI TEXT] Story Analysis - Input", {
        projectId,
        model: "openai/gpt-4.1-mini",
        promptLength: analysisPrompt.length,
        prompt: analysisPrompt,
        temperature: 0.7,
      });

      const { object: analysis } = await generateObject({
        model: openrouter("openai/gpt-4.1-mini"),
        schema: StoryAnalysisSchema,
        prompt: analysisPrompt,
        temperature: 0.7,
      });

      logger.info("[AI TEXT] Story Analysis - Output", {
        projectId,
        mainTheme: analysis.mainTheme,
        dramaticCore: analysis.dramaticCore,
        splashMoments: analysis.splashMoments?.length || 0,
        keySceneCount: analysis.keyScenes.length,
        tonalShiftCount: analysis.tonalShifts.length,
        output: JSON.stringify(analysis, null, 2),
      });

      // Update database with analysis AND dramatic core
      const supabase = await createClient();
      await supabase
        .from("projects")
        .update({
          story_analysis: analysis,
          dramatic_core: analysis.dramaticCore, // Store separately for quick access
        })
        .eq("id", projectId);

      await appendProgress(
        {
          stage: "analyzing",
          progress: 10,
          message: "Story analysis complete!",
          timestamp: new Date().toISOString(),
          data: {
            analysis: {
              theme: analysis.mainTheme,
              setting: analysis.setting.location,
              conflict: analysis.dramaticCore.centralConflict,
              stakes: analysis.dramaticCore.stakes,
            },
          },
        },
        "parent"
      );

      return {
        success: true,
        analysis,
      };
    } catch (error) {
      logger.error("Story analysis failed", {
        projectId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  },
});

// Export type for use in other files
export type StoryAnalysis = z.infer<typeof StoryAnalysisSchema>;
export type DramaticCore = z.infer<typeof DramaticCoreSchema>;
