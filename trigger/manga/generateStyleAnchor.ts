import { schemaTask, logger } from "@trigger.dev/sdk";
import { createJobClient as createClient } from "@/utils/supabase/server";
import { appendProgress } from "../streams";
import { z } from "zod";
import * as fal from "@fal-ai/serverless-client";

const GenerateStyleAnchorPayloadSchema = z.object({
  projectId: z.string().describe("The project ID"),
  storyDescription: z.string().describe("Brief story description for context"),
  artStyle: z.string().describe("The art style"),
  genre: z.string().nullable().describe("The genre"),
  setting: z.string().nullable().describe("The setting/location of the story"),
  atmosphere: z.string().nullable().describe("The atmosphere/mood"),
});

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

/**
 * Build the style anchor prompt
 * Creates a dramatic establishing shot that captures the art style
 */
function buildStyleAnchorPrompt(params: {
  storyDescription: string;
  artStyle: string;
  genre?: string;
  setting?: string;
  atmosphere?: string;
}): string {
  const { storyDescription, artStyle, genre, setting, atmosphere } = params;
  
  // Extract first 200 chars of story for context
  const storyContext = storyDescription.length > 2000 
    ? storyDescription.substring(0, 2000) + '...'
    : storyDescription;
  
  const genreStyle = genre ? `${genre} manga style, ` : '';
  const settingDesc = setting ? `Setting: ${setting}. ` : '';
  const atmosphereDesc = atmosphere ? `Atmosphere: ${atmosphere}. ` : '';
  
  return `${artStyle} manga illustration, professional quality, ${genreStyle}masterpiece.

Scene: ${storyContext}

${settingDesc}${atmosphereDesc}

Wide establishing shot showing the world and atmosphere.
Black and white, clean lineart, manga screentones.
This image sets the visual tone for the entire manga.

Technical specifications:
- Professional manga illustration quality
- Clean, confident linework
- Appropriate screentone usage
- Strong composition with clear focal point
- Atmospheric depth and mood
- ${artStyle} aesthetic throughout

This is the STYLE ANCHOR image - all subsequent panels should match this visual style.`;
}

/**
 * Build negative prompt for style anchor
 */
function buildStyleAnchorNegativePrompt(): string {
  return [
    'color',
    'colored',
    'realistic photo',
    '3d render',
    'low quality',
    'blurry',
    'messy lines',
    'inconsistent style',
    'amateur',
    'sketch',
    'unfinished',
    'watermark',
    'text',
    'speech bubbles',
  ].join(', ');
}

/**
 * Analyze the generated style anchor to extract style description
 */
function analyzeStyleAnchor(artStyle: string, genre?: string): {
  styleDescription: string;
  stylePromptSuffix: string;
} {
  // Build a condensed style description based on the art style
  const styleDescription = `${artStyle} manga style with clean lineart, professional inking, and manga screentones. Black and white illustration with strong composition.`;
  
  // Build a suffix to append to all future panel prompts
  const stylePromptSuffix = `Style: ${artStyle} manga, B&W, clean lineart, screentones, professional quality.`;
  
  return {
    styleDescription,
    stylePromptSuffix,
  };
}

export const generateStyleAnchor = schemaTask({
  id: "generate-style-anchor",
  schema: GenerateStyleAnchorPayloadSchema,
  maxDuration: 300, // 5 minutes
  run: async (payload) => {
    const { projectId, storyDescription, artStyle, genre, setting, atmosphere } = payload;

    logger.info("Starting style anchor generation", {
      projectId,
      artStyle,
      genre,
    });

    await appendProgress(
      {
        stage: "style",
        progress: 8,
        message: "🎨 Establishing visual style...",
        timestamp: new Date().toISOString(),
      },
      "parent"
    );

    try {
      const prompt = buildStyleAnchorPrompt({
        storyDescription,
        artStyle,
        genre: genre!,
        setting: setting!,
        atmosphere: atmosphere!,
      });
      
      const negativePrompt = buildStyleAnchorNegativePrompt();
      const fullPrompt = `${prompt}\n\nAvoid: ${negativePrompt}`;

      const inputParams = {
        prompt: fullPrompt,
        num_images: 1,
        aspect_ratio: "16:9", // Wide establishing shot
        output_format: "png",
        guidance_scale: 8, // Higher guidance for style anchor
        num_inference_steps: 30, // More steps for quality
      };

      logger.info("[AI IMAGE] Style Anchor - Input", {
        projectId,
        model: "fal-ai/nano-banana",
        artStyle,
        promptLength: fullPrompt.length,
        fullPrompt: fullPrompt,
      });

      const result = await fal.subscribe("fal-ai/nano-banana", {
        input: inputParams,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs?.map((log) => log.message).forEach((msg) => 
              logger.info("FAL.ai progress", { message: msg })
            );
          }
        },
      });

      const parsedResult = FalImageResult.parse(result);
      
      if (!parsedResult.images[0]) {
        throw new Error("No style anchor image generated");
      }

      const imageUrl = parsedResult.images[0].url;

      logger.info("[AI IMAGE] Style Anchor - Output", {
        projectId,
        imageUrl,
        imageWidth: parsedResult.images[0].width,
        imageHeight: parsedResult.images[0].height,
      });

      // Analyze the style anchor
      const { styleDescription, stylePromptSuffix } = analyzeStyleAnchor(artStyle, genre!);

      // Build style anchor data
      const styleAnchorData = {
        styleDescription,
        stylePromptSuffix,
        artStyle,
        genre,
        generatedAt: new Date().toISOString(),
        imageWidth: parsedResult.images[0].width,
        imageHeight: parsedResult.images[0].height,
      };

      // Update database with style anchor
      const supabase = await createClient();
      await supabase
        .from("projects")
        .update({
          style_anchor_url: imageUrl,
          style_anchor_data: styleAnchorData,
        })
        .eq("id", projectId);

      await appendProgress(
        {
          stage: "style",
          progress: 12,
          message: "Visual style established!",
          timestamp: new Date().toISOString(),
          data: {
            styleAnchor: {
              imageUrl,
              styleDescription,
            },
          },
        },
        "parent"
      );

      return {
        success: true,
        imageUrl,
        styleAnchorData,
      };
    } catch (error) {
      logger.error("Style anchor generation failed", {
        projectId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Don't fail the entire pipeline - style anchor is optional
      logger.warn("Continuing without style anchor", { projectId });
      
      return {
        success: false,
        imageUrl: null,
        styleAnchorData: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Export types
export interface StyleAnchorData {
  styleDescription: string;
  stylePromptSuffix: string;
  artStyle: string;
  genre?: string;
  generatedAt: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
}
