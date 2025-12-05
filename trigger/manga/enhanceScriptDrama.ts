import { schemaTask, logger } from "@trigger.dev/sdk";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";
import { appendProgress } from "../streams";
import type { Script, Page, Panel } from "./types";
import type { DramaticCore } from "./analyzeStory";

// Schema for enhanced panel (same structure, enhanced content)
const EnhancedPanelSchema = z.object({
  panelNumber: z.number(),
  sceneDescription: z.string().describe("Enhanced scene description - more cinematic"),
  prompt: z.string().describe("Enhanced image generation prompt"),
  dialogue: z.string().describe("Sharpened dialogue - punchier, more emotional"),
  narration: z.string().describe("Enhanced narration"),
  soundEffects: z.array(z.string()),
  emotion: z.string().describe("Refined emotion/mood"),
  visualNotes: z.string().describe("Enhanced visual notes"),
  // Preserve original fields
  shotType: z.enum(["wide", "medium", "close-up", "extreme-close-up", "establishing"]),
  cameraAngle: z.enum(["eye-level", "high-angle", "low-angle", "birds-eye", "worms-eye", "dutch-angle"]),
  characters: z.array(z.string()),
});

const EnhancedPageSchema = z.object({
  pageNumber: z.number(),
  panels: z.array(EnhancedPanelSchema),
  pageHook: z.string().nullable().describe("The micro-hook that makes readers turn the page"),
  // Preserve original fields
  layoutTemplateId: z.string(),
  storyBeat: z.string(),
});

const EnhancedScriptSchema = z.object({
  pages: z.array(EnhancedPageSchema),
  enhancementNotes: z.string().nullable().describe("Notes on what was enhanced"),
});

const EnhanceScriptDramaPayloadSchema = z.object({
  projectId: z.string().describe("The project ID"),
  script: z.custom<Script>().describe("The original script to enhance"),
  dramaticCore: z.custom<DramaticCore>().describe("The dramatic core from story analysis"),
  climaxPage: z.number().describe("The page number of the climax"),
});

const DRAMA_ENHANCEMENT_PROMPT = `You are a manga editor reviewing a script draft. Your job is to PUNCH UP THE DRAMA without changing the structure.

CURRENT SCRIPT:
{scriptJson}

STORY'S DRAMATIC CORE:
- Central conflict: {centralConflict}
- Stakes: {stakes}
- Emotional arc: {emotionalArcStart} → {emotionalArcEnd}
- The Turn: {theTurn}

CLIMAX PAGE: {climaxPage}

YOUR TASK:
Review each page and enhance it. For each panel, you may:

1. **SHARPEN DIALOGUE**: Make it punchier, more emotional, more character-specific
   - Before: "I won't let you do this."
   - After: "You think I'll just watch? After everything?"

2. **ADD MICRO-TENSION**: Every page should have a small hook
   - End pages on questions, revelations, or decisions
   - Even quiet scenes need undercurrent of what's at stake

3. **ENHANCE VISUAL MOMENTS**: Make scene descriptions more cinematic
   - Before: "Character A looks angry"
   - After: "Character A's fist trembles at their side, jaw clenched, eyes locked on their target"

4. **AMPLIFY THE TURN**: The climax page ({climaxPage}) should be the emotional peak
   - Use visual contrast (quiet panel before explosive one)
   - Dialogue should land like a punch

5. **ADD PAGE HOOKS**: Each page should end with something that makes readers turn the page
   - A question
   - A revelation
   - A decision
   - A cliffhanger moment

DO NOT:
- Change the page count or panel count
- Change character names or basic plot
- Add new characters or scenes
- Change the layout templates or shot types

FOCUS ON:
- Dialogue enhancement
- Scene description enhancement
- Emotional amplification
- Visual storytelling improvement

Return the enhanced script with the same structure but improved content.`;

const openrouter = createOpenRouter({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const enhanceScriptDrama = schemaTask({
  id: "enhance-script-drama",
  schema: EnhanceScriptDramaPayloadSchema,
  maxDuration: 300, // 5 minutes
  run: async (payload) => {
    const { projectId, script, dramaticCore, climaxPage } = payload;

    logger.info("Starting drama enhancement pass", {
      projectId,
      pageCount: script.pages.length,
      climaxPage,
    });

    await appendProgress(
      {
        stage: "script",
        progress: 26,
        message: "🎭 Enhancing dramatic moments...",
        timestamp: new Date().toISOString(),
      },
      "parent"
    );

    try {
      // Prepare script JSON (simplified for prompt)
      const scriptJson = JSON.stringify({
        title: script.title,
        pages: script.pages.map(page => ({
          pageNumber: page.pageNumber,
          layoutTemplateId: page.layoutTemplateId,
          storyBeat: page.storyBeat,
          panels: page.panels.map(panel => ({
            panelNumber: panel.panelNumber,
            sceneDescription: panel.sceneDescription,
            prompt: panel.prompt,
            dialogue: panel.dialogue,
            narration: panel.narration,
            soundEffects: panel.soundEffects,
            emotion: panel.emotion,
            visualNotes: panel.visualNotes,
            shotType: panel.shotType,
            cameraAngle: panel.cameraAngle,
            characters: panel.characters,
          })),
        })),
      }, null, 2);

      const prompt = DRAMA_ENHANCEMENT_PROMPT
        .replace('{scriptJson}', scriptJson)
        .replace('{centralConflict}', dramaticCore.centralConflict)
        .replace('{stakes}', dramaticCore.stakes)
        .replace('{emotionalArcStart}', dramaticCore.emotionalArc.start)
        .replace('{emotionalArcEnd}', dramaticCore.emotionalArc.end)
        .replace('{theTurn}', dramaticCore.theTurn)
        .replace(/{climaxPage}/g, String(climaxPage));

      logger.info("[AI TEXT] Drama Enhancement - Input", {
        projectId,
        model: "openai/gpt-4.1-mini",
        promptLength: prompt.length,
        prompt
      });

      const { object: enhanced } = await generateObject({
        model: openrouter("openai/gpt-4.1-mini"),
        schema: EnhancedScriptSchema,
        prompt,
        temperature: 0.7, // Higher temperature for creativity
      });

      logger.info("[AI TEXT] Drama Enhancement - Output", {
        projectId,
        enhancedPageCount: enhanced.pages.length,
        enhancementNotes: enhanced.enhancementNotes,
      });

      await appendProgress(
        {
          stage: "script",
          progress: 28,
          message: "Drama enhancement complete!",
          timestamp: new Date().toISOString(),
        },
        "parent"
      );

      // Merge enhanced content back into original script structure
      const enhancedScript: Script = {
        ...script,
        pages: script.pages.map((originalPage, pageIdx) => {
          const enhancedPage = enhanced.pages.find(p => p.pageNumber === originalPage.pageNumber);
          
          if (!enhancedPage) {
            return originalPage; // Keep original if not enhanced
          }

          return {
            ...originalPage,
            panels: originalPage.panels.map((originalPanel, panelIdx) => {
              const enhancedPanel = enhancedPage.panels.find(p => p.panelNumber === originalPanel.panelNumber);
              
              if (!enhancedPanel) {
                return originalPanel; // Keep original if not enhanced
              }

              return {
                ...originalPanel,
                // Enhanced fields
                sceneDescription: enhancedPanel.sceneDescription || originalPanel.sceneDescription,
                prompt: enhancedPanel.prompt || originalPanel.prompt,
                dialogue: enhancedPanel.dialogue || originalPanel.dialogue,
                narration: enhancedPanel.narration || originalPanel.narration,
                emotion: enhancedPanel.emotion || originalPanel.emotion,
                visualNotes: enhancedPanel.visualNotes || originalPanel.visualNotes,
                soundEffects: enhancedPanel.soundEffects.length > 0 
                  ? enhancedPanel.soundEffects 
                  : originalPanel.soundEffects,
              };
            }),
          };
        }),
      };

      return {
        success: true,
        enhancedScript,
        enhancementNotes: enhanced.enhancementNotes,
        pagesEnhanced: enhanced.pages.length,
      };
    } catch (error) {
      logger.error("Drama enhancement failed", {
        projectId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Return original script if enhancement fails
      logger.warn("Returning original script without enhancement", { projectId });
      
      return {
        success: false,
        enhancedScript: script,
        enhancementNotes: null,
        pagesEnhanced: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
