import { schemaTask, logger, batch } from "@trigger.dev/sdk";
import { createJobClient as createClient } from "@/utils/supabase/server";
import { analyzeStory } from "./analyzeStory";
import { generateScript } from "./generateScript";
import { extractCharacters } from "./extractCharacters";
import { extractRoughCharacters } from "./extractRoughCharacters";
import { generateCharacters } from "./generateCharacters";
import { generateStoryboard } from "./generateStoryboard";
import { generateCharacterImages } from "./generateCharacterImages";
import { generatePageImages } from "./generatePageImages";
import { generateSmartBubbles } from "./generateSmartBubbles";
import { generateStyleAnchor } from "./generateStyleAnchor";
import { enhanceScriptDrama } from "./enhanceScriptDrama";
import { appendProgress } from "../streams";
import { z } from "zod";

const GenerateMangaPayloadSchema = z.object({
  projectId: z.string().describe("The project ID"),
  storyDescription: z.string().describe("The story description"),
  genre: z.string().optional().describe("The genre (optional)"),
  artStyle: z.string().describe("The art style"),
  pageCount: z.number().int().min(1).max(16).describe("Number of pages (1-16)"),
  // Options
  enableDramaEnhancement: z
    .boolean()
    .default(true)
    .describe("Enable drama doctor pass"),
  enableStyleAnchor: z
    .boolean()
    .default(true)
    .describe("Enable style anchor generation"),
  enableParallelPhase1: z
    .boolean()
    .default(true)
    .describe("Enable parallel Phase 1"),
});

export const generateManga = schemaTask({
  id: "generate-manga",
  schema: GenerateMangaPayloadSchema,
  maxDuration: 3600, // 1 hour total
  run: async (payload) => {
    const {
      projectId,
      storyDescription,
      genre,
      artStyle,
      pageCount,
      enableDramaEnhancement = true,
      enableStyleAnchor = true,
      enableParallelPhase1 = true,
    } = payload;

    logger.info("Starting enhanced manga generation", {
      projectId,
      pageCount,
      genre,
      artStyle,
      enableDramaEnhancement,
      enableStyleAnchor,
      enableParallelPhase1,
    });

    try {
      logger.info("Phase 1: Foundation", { projectId });

      await appendProgress({
        stage: "analyzing",
        progress: 2,
        message: "🚀 Starting manga generation...",
        timestamp: new Date().toISOString(),
      });

      let analysis: any;
      let roughCharacters: any[] = [];
      let styleAnchorUrl: string | null = null;
      let styleAnchorData: any = null;

      if (enableParallelPhase1) {
        const batchTasks = [
          { task: analyzeStory, payload: {
              projectId,
              storyDescription,
              genre: genre!,
              pageCount,
            } },
            { task: extractRoughCharacters, payload: {
              projectId,
              storyDescription,
              genre: genre!,
              artStyle,
            } }
        ];

        if(enableStyleAnchor) {
          batchTasks.push({
            // @ts-expect-error
            task: generateStyleAnchor, payload: {
              projectId,
              storyDescription,
              artStyle,
              genre: genre!,
              // @ts-expect-error
               setting: '',
            atmosphere: ''
            }
          })
        }

        // // Build batch tasks array
        // const batchTasks: Array<
        //   | { id: "analyze-story"; payload: any }
        //   | { id: "extract-rough-characters"; payload: any }
        //   | { id: "generate-style-anchor"; payload: any }
        // > = [
        //   {
        //     id: "analyze-story",
        //     payload: {
        //       projectId,
        //       storyDescription,
        //       genre,
        //       pageCount,
        //     },
        //   },
        //   {
        //     id: "extract-rough-characters",
        //     payload: {
        //       projectId,
        //       storyDescription,
        //       genre: genre ?? null,
        //       artStyle,
        //     },
        //   },
        // ];

        // // Add style anchor task if enabled
        // if (enableStyleAnchor) {
        //   batchTasks.push({
        //     id: "generate-style-anchor",
        //     payload: {
        //       projectId,
        //       storyDescription,
        //       artStyle,
        //       genre,
        //        setting: '',
        //     atmosphere: ''
        //     },
        //   });
        // }

        // Run Phase 1 tasks in parallel using batch
        const {
          runs: [run1, run2, run3],
        } = await batch.triggerByTaskAndWait(batchTasks);

        logger.info('run1', run1)
        logger.info('run2', run2)
        logger.info('run3', run3)

        if(run1.ok) {
          // @ts-expect-error
          analysis = run1.output.analysis;
        } else {
          throw new Error(`Story analysis failed: ${run1.error}`);
        }

        if(run2.ok) {
          // @ts-expect-error
          roughCharacters = run2.output.characters || [];
        } else {
          logger.error(`Phase 1 task failed: ${run2.taskIdentifier}`, {
              error: run2.error,
            });
        }

        if(run3 && run3.ok && run3.output.success) {
          // @ts-expect-error
          styleAnchorUrl = run3.output.imageUrl;
          // @ts-expect-error
                  styleAnchorData = run3.output.styleAnchorData;
        } else {
          logger.error(`Phase 1 task failed: ${run3.taskIdentifier}`, {
            // @ts-expect-error
              error: run3.error,
            });
        }
      } else {
        // Sequential fallback
        const analysisResult = await analyzeStory.triggerAndWait({
          projectId,
          storyDescription,
          genre: genre!,
          pageCount,
        });

        if (!analysisResult.ok) {
          throw new Error(`Story analysis failed: ${analysisResult.error}`);
        }
        analysis = analysisResult.output.analysis;

        const roughCharsResult = await extractRoughCharacters.triggerAndWait({
          projectId,
          storyDescription,
          genre: genre ?? null,
          artStyle,
        });

        if (roughCharsResult.ok) {
          roughCharacters = roughCharsResult.output.characters || [];
        }

        if (enableStyleAnchor) {
          const styleResult = await generateStyleAnchor.triggerAndWait({
            projectId,
            storyDescription,
            artStyle,
            genre: genre!,
            setting: '',
            atmosphere: ''
          });

          if (styleResult.ok && styleResult.output.success) {
            styleAnchorUrl = styleResult.output.imageUrl;
            styleAnchorData = styleResult.output.styleAnchorData;
          }
        }
      }

      if (!analysis) {
        throw new Error("Story analysis failed - no analysis data");
      }

      logger.info("Phase 1 complete", {
        projectId,
        hasAnalysis: !!analysis,
        roughCharacterCount: roughCharacters.length,
        hasStyleAnchor: !!styleAnchorUrl,
      });

      await appendProgress({
        stage: "script",
        progress: 13,
        message: "Foundation complete! Starting script generation...",
        timestamp: new Date().toISOString(),
      });

      // ═══════════════════════════════════════════════════════════════
      // PHASE 2: SCRIPT + CHARACTER DESIGN
      // ═══════════════════════════════════════════════════════════════
      logger.info("Phase 2: Script + Characters", { projectId });

      // Step 2a: Generate Script (needs story analysis)
      const scriptResult = await generateScript.triggerAndWait({
        projectId,
        storyDescription,
        genre: genre!,
        artStyle,
        pageCount,
        storyAnalysis: analysis,
      });

      if (!scriptResult.ok) {
        throw new Error(`Script generation failed: ${scriptResult.error}`);
      }

      let { script, pages } = scriptResult.output;

      // Step 2b: Drama Enhancement Pass (optional)
      if (enableDramaEnhancement && analysis.dramaticCore) {
        logger.info("Running drama enhancement pass", { projectId });

        const climaxPage = Math.floor(pageCount * 0.75);
        const dramaResult = await enhanceScriptDrama.triggerAndWait({
          projectId,
          script,
          dramaticCore: analysis.dramaticCore,
          climaxPage,
        });

        if (dramaResult.ok && dramaResult.output.success) {
          script = dramaResult.output.enhancedScript;
          pages = script.pages;
          logger.info("Drama enhancement complete", {
            projectId,
            pagesEnhanced: dramaResult.output.pagesEnhanced,
          });
        }
      }

      // Step 2c: Extract Characters from Script (full extraction)
      logger.info("Extracting characters from script", { projectId });
      const extractionResult = await extractCharacters.triggerAndWait({
        projectId,
        script,
        artStyle,
        genre: genre ?? null,
        pageCount,
      });

      if (!extractionResult.ok) {
        throw new Error(
          `Character extraction failed: ${extractionResult.error}`
        );
      }

      const { characters } = extractionResult.output;

      // Step 2d: Create Character Records
      logger.info("Creating character records", {
        projectId,
        characterCount: characters.length,
      });

      const charactersResult = await generateCharacters.triggerAndWait({
        projectId,
        characters,
      });

      if (!charactersResult.ok) {
        throw new Error(
          `Character generation failed: ${charactersResult.error}`
        );
      }

      const { characterIds } = charactersResult.output;

      // Step 2e: Generate Character Designs
      logger.info("Generating character designs", {
        projectId,
        characterCount: characters.length,
      });

      const supabase = await createClient();
      const { data: dbCharacters } = await supabase
        .from("characters")
        .select(
          "id, name, description, turnaround, consistency_string, visual_anchors"
        )
        .eq("project_id", projectId);

      const characterImagesResult =
        await generateCharacterImages.triggerAndWait({
          projectId,
          characters: (dbCharacters || []).map((char) => ({
            id: char.id,
            name: char.name,
            description: char.description || "",
            turnaround: char.turnaround,
          })),
          artStyle,
        });

      if (!characterImagesResult.ok) {
        logger.warn("Character image generation had issues", {
          projectId,
          error: characterImagesResult.error,
        });
      }

      await appendProgress({
        stage: "layouts",
        progress: 51,
        message: "Characters ready! Planning page layouts...",
        timestamp: new Date().toISOString(),
      });

      // ═══════════════════════════════════════════════════════════════
      // PHASE 3: STORYBOARD + PANEL GENERATION
      // ═══════════════════════════════════════════════════════════════
      logger.info("Phase 3: Storyboard + Panels", { projectId });

      // Step 3a: Generate Storyboard & Plan Layouts
      const storyboardResult = await generateStoryboard.triggerAndWait({
        projectId,
        pages: pages as any, // Type assertion for layout template compatibility
        characterIds,
        previewPageCount: Math.min(pageCount, 4),
      });

      if (!storyboardResult.ok) {
        throw new Error(
          `Storyboard generation failed: ${storyboardResult.error}`
        );
      }

      // Step 3b: Generate Panel Images (batched, with style anchor)
      logger.info("Generating panel images with style anchor", { projectId });

      const pageImagesResult = await generatePageImages.triggerAndWait({
        projectId,
        pageCount: Math.min(pageCount, 4),
        artStyle,
        styleAnchorUrl: styleAnchorUrl ?? null,
        stylePromptSuffix: styleAnchorData?.stylePromptSuffix ?? undefined,
        batchSize: 8, // Generate 8 panels in parallel
      });

      if (!pageImagesResult.ok) {
        logger.warn("Panel image generation had issues", {
          projectId,
          error: pageImagesResult.error,
        });
      }

      // ═══════════════════════════════════════════════════════════════
      // PHASE 4: ASSEMBLY
      // ═══════════════════════════════════════════════════════════════
      logger.info("Phase 4: Assembly", { projectId });

      // Step 4a: Smart Bubble Positioning
      const bubblesResult = await generateSmartBubbles.triggerAndWait({
        projectId,
        pageCount: Math.min(pageCount, 4),
      });

      if (!bubblesResult.ok) {
        logger.warn("Smart bubble positioning had issues", {
          projectId,
          error: bubblesResult.error,
        });
      } else {
        logger.info("Smart bubble positioning complete", {
          projectId,
          stats: bubblesResult.output,
        });
      }

      // Step 4b: Finalize
      logger.info("Finalizing manga", { projectId });

      await appendProgress({
        stage: "finalizing",
        progress: 98,
        message: "✨ Finalizing your manga!",
        timestamp: new Date().toISOString(),
      });

      // Final update
      await appendProgress({
        stage: "complete",
        progress: 100,
        message: "Your manga is ready!",
        timestamp: new Date().toISOString(),
      });

      logger.info("Manga generation completed successfully", {
        projectId,
        totalTime: "See trigger.dev dashboard for timing",
      });

      return {
        success: true,
        projectId,
        message: "Manga generation completed successfully",
        stats: {
          pageCount: Math.min(pageCount, 4),
          characterCount: characters.length,
          hasStyleAnchor: !!styleAnchorUrl,
          dramaEnhanced: enableDramaEnhancement,
        },
      };
    } catch (error) {
      logger.error("Manga generation failed", {
        projectId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      const supabase = await createClient();
      await supabase
        .from("projects")
        .update({
          generation_stage: "error",
          error_message:
            error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", projectId);

      await appendProgress({
        stage: "complete",
        progress: 0,
        message: `Generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  },
});
