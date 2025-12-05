import { schemaTask, logger } from "@trigger.dev/sdk";
import { createJobClient as createClient } from "@/utils/supabase/server";
import { appendProgress } from "../streams";
import { z } from "zod";
import * as fal from "@fal-ai/serverless-client";
import { buildNegativePrompt, truncatePrompt } from "./prompts";
import {
  buildPanelPrompt,
  PANEL_GENERATION_NEGATIVE_PROMPT,
} from "./prompts/panelGeneration";

const GeneratePageImagesPayloadSchema = z.object({
  projectId: z.string().describe("The project ID"),
  pageCount: z
    .number()
    .int()
    .describe("Number of pages to generate images for"),
  artStyle: z.string().describe("The art style"),
  // Style anchor support
  styleAnchorUrl: z
    .string()
    .nullable()
    .describe("URL of the style anchor image"),
  stylePromptSuffix: z
    .string()
    .nullable()
    .describe("Style prompt suffix to append"),
  // Batch configuration
  batchSize: z
    .number()
    .int()
    .default(8)
    .describe("Number of panels to generate in parallel"),
});

// FAL.ai result schema
const FalImageResult = z.object({
  images: z.array(
    z.object({
      url: z.string(),
      width: z.number().nullable(),
      height: z.number().nullable(),
      content_type: z.string().nullable(),
    })
  ),
});

interface PanelData {
  id: string;
  prompt: string;
  character_handles: string[];
  pageNumber?: number;
  panelIndex?: number;
}

interface CharacterInfo {
  handle: string;
  name: string;
  description: string;
  imageUrl: string;
  imageDescription: string;
  consistencyString: string;
}

/**
 * Generate a single panel image with character context and style anchor
 * Uses fal-ai/nano-banana/edit when reference images are available
 * Uses fal-ai/nano-banana for text-to-image when no references
 */
async function generatePanelImage(
  panel: PanelData,
  characters: CharacterInfo[],
  artStyle: string,
  styleAnchorUrl?: string,
  stylePromptSuffix?: string
): Promise<string> {
  try {
    // Get characters in this panel
    const panelCharacters = panel.character_handles
      .map((handle) => characters.find((c) => c.handle === handle))
      .filter(Boolean) as CharacterInfo[];

    const negativePrompt = buildNegativePrompt(PANEL_GENERATION_NEGATIVE_PROMPT);

    // Build full prompt using PANEL_GENERATION_PROMPT
    const basePrompt = buildPanelPrompt({
      sceneDescription: panel.prompt,
      characters: panelCharacters.map((c) => ({
        name: c.name,
        handle: c.handle,
        description: c.consistencyString || c.description,
        imageDescription: c.imageDescription,
      })),
      shotType: "medium",
      cameraAngle: "eye-level",
      emotion: "neutral",
      visualNotes: "",
      artStyle,
    });

    // Add style anchor suffix if available
    let fullPrompt = stylePromptSuffix
      ? `${basePrompt}\n\n${stylePromptSuffix}`
      : basePrompt;

    fullPrompt = `${fullPrompt}\n\nAvoid: ${negativePrompt}`;

    // Check if prompt exceeds limit (5000 chars for nano-banana)
    const MAX_PROMPT_LENGTH = 4900;

    if (fullPrompt.length > MAX_PROMPT_LENGTH) {
      logger.warn("Prompt exceeds limit, truncating", {
        panelId: panel.id,
        originalLength: fullPrompt.length,
        maxLength: MAX_PROMPT_LENGTH,
      });

      fullPrompt = truncatePrompt(fullPrompt, MAX_PROMPT_LENGTH);
    }

    // Collect all reference image URLs (character images + style anchor)
    const referenceImageUrls: string[] = [];

    // Add style anchor first (most important for style consistency)
    if (styleAnchorUrl) {
      referenceImageUrls.push(styleAnchorUrl);
    }

    // Add character reference images
    const characterImageUrls = panelCharacters
      .map((c) => c.imageUrl)
      .filter(Boolean);
    referenceImageUrls.push(...characterImageUrls);

    // Determine which model to use based on reference images
    const hasReferenceImages = referenceImageUrls.length > 0;
    const modelId = hasReferenceImages
      ? "fal-ai/nano-banana/edit"
      : "fal-ai/nano-banana";

    // Build input parameters
    const input: any = {
      prompt: fullPrompt,
      num_images: 1,
      aspect_ratio: "16:9",
      output_format: "png",
      guidance_scale: 7,
      num_inference_steps: 20,
    };

    // Add reference images for edit model
    if (hasReferenceImages) {
      input.image_urls = referenceImageUrls;
    }

    logger.info("[AI IMAGE] Panel Generation - Input", {
      panelId: panel.id,
      model: modelId,
      input
    });

    const result = await fal.subscribe(modelId, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs
            ?.map((log) => log.message)
            .forEach((msg) => logger.info("FAL.ai progress", { message: msg }));
        }
      },
    });

    const parsedResult = FalImageResult.parse(result);

    if (!parsedResult.images[0]) {
      throw new Error("No image generated");
    }

    logger.info("[AI IMAGE] Panel Generation - Output", {
      panelId: panel.id,
      model: modelId,
      imageUrl: parsedResult.images[0].url,
      imageWidth: parsedResult.images[0].width,
      imageHeight: parsedResult.images[0].height,
    });

    return parsedResult.images[0].url;
  } catch (error) {
    logger.error("Failed to generate panel image", {
      panelId: panel.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Generate panels in batches for better performance
 */
async function generatePanelBatch(
  panels: PanelData[],
  characters: CharacterInfo[],
  artStyle: string,
  styleAnchorUrl?: string,
  stylePromptSuffix?: string
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Generate all panels in parallel
  const promises = panels.map(async (panel) => {
    try {
      const imageUrl = await generatePanelImage(
        panel,
        characters,
        artStyle,
        styleAnchorUrl,
        stylePromptSuffix
      );
      return { panelId: panel.id, imageUrl, success: true };
    } catch (error) {
      logger.error("Panel generation failed in batch", {
        panelId: panel.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return { panelId: panel.id, imageUrl: null, success: false };
    }
  });

  const batchResults = await Promise.all(promises);

  for (const result of batchResults) {
    if (result.success && result.imageUrl) {
      results.set(result.panelId, result.imageUrl);
    }
  }

  return results;
}

/**
 * Chunk array into batches
 */
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export const generatePageImages = schemaTask({
  id: "generate-page-images",
  schema: GeneratePageImagesPayloadSchema,
  maxDuration: 900, // 15 minutes
  run: async (payload) => {
    const {
      projectId,
      pageCount,
      artStyle,
      styleAnchorUrl,
      stylePromptSuffix,
      batchSize = 8,
    } = payload;

    logger.info("Starting batched page image generation", {
      projectId,
      pageCount,
      artStyle,
      batchSize,
      hasStyleAnchor: !!styleAnchorUrl,
    });

    await appendProgress(
      {
        stage: "panels",
        progress: 60,
        message: `🖼️ Generating panels for ${pageCount} pages...`,
        timestamp: new Date().toISOString(),
      },
      "parent"
    );

    try {
      const supabase = await createClient();

      // Get all panels for the pages
      const { data: pages } = await supabase
        .from("pages")
        .select("id, page_number")
        .eq("project_id", projectId)
        .order("page_number")
        .limit(pageCount);

      if (!pages || pages.length === 0) {
        throw new Error("No pages found");
      }

      const { data: panels, error: panelsError } = await supabase
        .from("panels")
        .select("id, page_id, prompt, panel_index, character_handles")
        .in(
          "page_id",
          pages.map((p) => p.id)
        )
        .order("panel_index");

      if (panelsError) {
        throw new Error(`Failed to fetch panels: ${panelsError.message}`);
      }

      // Get character reference images, descriptions, AND consistency strings
      const { data: characters } = await supabase
        .from("characters")
        .select(
          "id, name, handle, description, reference_images, consistency_string, visual_anchors"
        )
        .eq("project_id", projectId);

      // Build character info lookup map with consistency strings
      const characterInfoMap: CharacterInfo[] = (characters || []).map(
        (char) => {
          const refImages = char.reference_images as any;
          return {
            handle: char.handle,
            name: char.name,
            description: char.description || "",
            imageUrl: refImages?.front || "",
            imageDescription:
              refImages?.frontDescription ||
              `Character reference for ${char.name}`,
            consistencyString:
              char.consistency_string || char.description || char.name,
          };
        }
      );

      logger.info("Character info with consistency strings", {
        characters: characterInfoMap.map((c) => ({
          name: c.name,
          consistencyString: c.consistencyString,
          hasImage: !!c.imageUrl,
        })),
      });

      const totalPanels = panels?.length || 0;
      let completedPanels = 0;

      // Create page number lookup
      const pageNumberMap = new Map(pages.map((p) => [p.id, p.page_number]));

      // Prepare panel data with page numbers
      const panelDataList: PanelData[] = (panels || []).map((panel) => ({
        id: panel.id,
        prompt: panel.prompt || "",
        character_handles: panel.character_handles || [],
        pageNumber: pageNumberMap.get(panel.page_id),
        panelIndex: panel.panel_index,
      }));

      // Process panels in batches
      const batches = chunk(panelDataList, batchSize);

      logger.info("Processing panels in batches", {
        totalPanels,
        batchCount: batches.length,
        batchSize,
      });

      for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
        const batch = batches[batchIdx];

        logger.info(`Processing batch ${batchIdx + 1}/${batches.length}`, {
          panelCount: batch.length,
          panelIds: batch.map((p) => p.id),
        });

        // Generate batch in parallel
        const batchResults = await generatePanelBatch(
          batch,
          characterInfoMap,
          artStyle,
          styleAnchorUrl ?? undefined,
          stylePromptSuffix ?? undefined
        );

        // Update database for each successful panel
        for (const [panelId, imageUrl] of batchResults) {
          await supabase
            .from("panels")
            .update({
              image_url: imageUrl,
              generation_attempts: 1,
            })
            .eq("id", panelId);

          completedPanels++;
        }

        // Update progress after each batch
        const progress = 60 + (completedPanels / totalPanels) * 30;
        await appendProgress(
          {
            stage: "panels",
            progress: Math.round(progress),
            message: `Generated ${completedPanels}/${totalPanels} panels`,
            timestamp: new Date().toISOString(),
            data: {
              panels: {
                completed: completedPanels,
                total: totalPanels,
              },
            },
          },
          "parent"
        );
      }

      logger.info("Page images generated successfully", {
        projectId,
        panelCount: completedPanels,
        totalPanels,
      });

      await appendProgress(
        {
          stage: "panels",
          progress: 90,
          message: "Panel generation complete!",
          timestamp: new Date().toISOString(),
          data: {
            panels: {
              completed: completedPanels,
              total: totalPanels,
            },
          },
        },
        "parent"
      );

      // Update database - mark as complete
      await supabase
        .from("projects")
        .update({
          generation_stage: "complete",
          generation_progress: {
            script: 100,
            characters: 100,
            storyboard: 100,
            preview: 100,
          },
        })
        .eq("id", projectId);

      return {
        success: true,
        panelCount: completedPanels,
        totalPanels,
        batchesProcessed: batches.length,
      };
    } catch (error) {
      logger.error("Page image generation failed", {
        projectId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      const supabase = await createClient();
      await supabase
        .from("projects")
        .update({
          generation_stage: "preview",
          error_message:
            error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", projectId);

      throw error;
    }
  },
});
