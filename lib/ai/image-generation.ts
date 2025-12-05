import { experimental_generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import { NoImageGeneratedError } from "ai";
import * as fal from "@fal-ai/serverless-client";
import { z } from "zod";

// ============================================
// MODEL CONSTANTS - Easy to switch models
// ============================================

export const IMAGE_MODELS = {
  // FAL.ai Models
  FAL_NANO_BANANA: "fal-ai/nano-banana",
  FAL_NANO_BANANA_EDIT: "fal-ai/nano-banana/edit",
  FAL_FLUX_DEV: "fal-ai/flux/dev",
  FAL_FLUX_PRO: "fal-ai/flux-pro",
  FAL_FLUX_SCHNELL: "fal-ai/flux/schnell",
  
  // OpenAI Models (via Vercel AI SDK)
  DALLE_3: "dall-e-3",
  DALLE_2: "dall-e-2",
} as const;

export type ImageModelType = typeof IMAGE_MODELS[keyof typeof IMAGE_MODELS];

// Default models for different use cases
export const DEFAULT_MODELS = {
  CHARACTER_DESIGN: IMAGE_MODELS.FAL_NANO_BANANA,
  PANEL_GENERATION: IMAGE_MODELS.FAL_NANO_BANANA,
  PANEL_WITH_REFERENCE: IMAGE_MODELS.FAL_NANO_BANANA_EDIT,
  STYLE_ANCHOR: IMAGE_MODELS.FAL_NANO_BANANA,
  GENERAL: IMAGE_MODELS.DALLE_3,
} as const;

// Provider type
export type ImageProvider = "fal-ai" | "vercel-ai";

// ============================================
// COMMON INTERFACES
// ============================================

export interface BaseImageOptions {
  prompt: string;
  num_images?: number;
  aspect_ratio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "4:5" | "5:4";
  guidance_scale?: number;
  num_inference_steps?: number;
  seed?: number;
  output_format?: "png" | "jpeg" | "webp";
}

export interface FalImageOptions extends BaseImageOptions {
  image_urls?: string[]; // For edit models
  enable_safety_checker?: boolean;
}

export interface VercelImageOptions {
  prompt: string;
  model?: "dall-e-3" | "dall-e-2";
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  n?: number;
  quality?: "standard" | "hd";
  style?: "natural" | "vivid";
}

export interface GeneratedImage {
  imageUrl: string;
  base64?: string;
  width?: number | null;
  height?: number | null;
  contentType?: string | null;
  revisedPrompt?: string;
  seed?: number;
}

export interface GenerateImageResult {
  success: boolean;
  imageUrl: string;
  images?: GeneratedImage[];
  provider: ImageProvider;
  model: string;
  metadata?: Record<string, any>;
  error?: string;
}

// ============================================
// FAL.AI SCHEMAS
// ============================================

const FalImageResultSchema = z.object({
  images: z.array(
    z.object({
      url: z.string(),
      width: z.number().nullable().optional(),
      height: z.number().nullable().optional(),
      content_type: z.string().nullable().optional(),
    })
  ),
  seed: z.number().optional(),
});

// ============================================
// PROVIDER-SPECIFIC FUNCTIONS
// ============================================

/**
 * Generate image using FAL.ai
 */
async function generateWithFal(
  model: string,
  options: FalImageOptions
): Promise<GenerateImageResult> {
  try {
    const input: Record<string, any> = {
      prompt: options.prompt,
      num_images: options.num_images || 1,
      output_format: options.output_format || "png",
    };

    // Add optional parameters
    if (options.aspect_ratio) input.aspect_ratio = options.aspect_ratio;
    if (options.guidance_scale) input.guidance_scale = options.guidance_scale;
    if (options.num_inference_steps) input.num_inference_steps = options.num_inference_steps;
    if (options.seed) input.seed = options.seed;
    if (options.enable_safety_checker !== undefined) {
      input.enable_safety_checker = options.enable_safety_checker;
    }

    // Add reference images for edit models
    if (options.image_urls && options.image_urls.length > 0) {
      input.image_urls = options.image_urls;
    }

    const result = await fal.subscribe(model, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs?.map((log) => log.message).forEach((msg) => 
            console.log(`[FAL.ai] ${msg}`)
          );
        }
      },
    });

    const parsedResult = FalImageResultSchema.parse(result);

    if (!parsedResult.images[0]) {
      throw new Error("No image generated");
    }

    const images: GeneratedImage[] = parsedResult.images.map((img) => ({
      imageUrl: img.url,
      width: img.width,
      height: img.height,
      contentType: img.content_type,
      seed: parsedResult.seed,
    }));

    return {
      success: true,
      imageUrl: images[0].imageUrl,
      images,
      provider: "fal-ai",
      model,
      metadata: {
        seed: parsedResult.seed,
      },
    };
  } catch (error) {
    console.error(`[FAL.ai] Image generation failed:`, error);
    return {
      success: false,
      imageUrl: "",
      provider: "fal-ai",
      model,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate image using Vercel AI SDK (OpenAI)
 */
async function generateWithVercelAI(
  options: VercelImageOptions
): Promise<GenerateImageResult> {
  try {
    const model = options.model || "dall-e-3";
    
    const result = await experimental_generateImage({
      model: openai.image(model),
      prompt: options.prompt,
      ...(options.size && { size: options.size }),
      ...(options.n && options.n > 1 && { n: options.n }),
      ...(options.quality && {
        providerOptions: {
          openai: {
            quality: options.quality,
            ...(options.style && { style: options.style }),
          },
        },
      }),
    });

    // Handle single or multiple images
    const images: GeneratedImage[] = [];
    
    if ("image" in result) {
      // Single image
      const base64 = result.image.base64;
      const imageUrl = `data:image/png;base64,${base64}`;
      images.push({
        imageUrl,
        base64,
      });
    }

    return {
      success: true,
      imageUrl: images[0]?.imageUrl || "",
      images,
      provider: "vercel-ai",
      model,
    };
  } catch (error) {
    if (NoImageGeneratedError.isInstance(error)) {
      console.error("[Vercel AI] Image generation failed:", error);
      return {
        success: false,
        imageUrl: "",
        provider: "vercel-ai",
        model: options.model || "dall-e-3",
        error: error.message || "Unknown error",
      };
    }

    throw error;
  }
}

// ============================================
// UNIFIED IMAGE GENERATION FUNCTION
// ============================================

/**
 * Generate image with automatic provider detection
 * Supports both FAL.ai and Vercel AI SDK
 */
export async function generateImage(
  options: FalImageOptions,
  model: string = DEFAULT_MODELS.GENERAL,
  provider?: ImageProvider
): Promise<GenerateImageResult> {
  // Auto-detect provider from model if not specified
  const detectedProvider = provider || (model.startsWith("fal-ai/") ? "fal-ai" : "vercel-ai");

  if (detectedProvider === "fal-ai") {
    return generateWithFal(model, options);
  } else {
    // Convert to Vercel AI options
    const vercelOptions: VercelImageOptions = {
      prompt: options.prompt,
      model: model as "dall-e-3" | "dall-e-2",
      n: options.num_images || 1,
    };
    return generateWithVercelAI(vercelOptions);
  }
}

// ============================================
// CONVENIENCE FUNCTIONS FOR SPECIFIC USE CASES
// ============================================

/**
 * Generate character design image
 */
export async function generateCharacterImage(
  prompt: string,
  options?: Partial<FalImageOptions>
): Promise<GenerateImageResult> {
  return generateImage(
    {
      prompt,
      aspect_ratio: "4:5", // Character sheet ratio
      guidance_scale: 7.5,
      num_inference_steps: 25,
      ...options,
    },
    DEFAULT_MODELS.CHARACTER_DESIGN
  );
}

/**
 * Generate manga panel image
 */
export async function generatePanelImage(
  prompt: string,
  options?: Partial<FalImageOptions>
): Promise<GenerateImageResult> {
  return generateImage(
    {
      prompt,
      aspect_ratio: "16:9",
      guidance_scale: 7,
      num_inference_steps: 20,
      ...options,
    },
    DEFAULT_MODELS.PANEL_GENERATION
  );
}

/**
 * Generate manga panel with reference images (for consistency)
 */
export async function generatePanelWithReference(
  prompt: string,
  referenceImageUrls: string[],
  options?: Partial<FalImageOptions>
): Promise<GenerateImageResult> {
  return generateImage(
    {
      prompt,
      image_urls: referenceImageUrls,
      aspect_ratio: "16:9",
      guidance_scale: 7,
      num_inference_steps: 20,
      ...options,
    },
    DEFAULT_MODELS.PANEL_WITH_REFERENCE
  );
}

/**
 * Generate style anchor image
 */
export async function generateStyleAnchor(
  prompt: string,
  options?: Partial<FalImageOptions>
): Promise<GenerateImageResult> {
  return generateImage(
    {
      prompt,
      aspect_ratio: "16:9",
      guidance_scale: 8,
      num_inference_steps: 30,
      ...options,
    },
    DEFAULT_MODELS.STYLE_ANCHOR
  );
}

// ============================================
// LEGACY COMPATIBILITY (for existing code)
// ============================================

/**
 * @deprecated Use generateImage() instead
 * Generate a single image using nano-banana with fallback
 */
export async function generateNanoBananaImageWithFallback(
  options: FalImageOptions,
  provider: "fal-ai" | "vercel-ai" = "fal-ai"
): Promise<GenerateImageResult> {
  return generateImage(options, IMAGE_MODELS.FAL_NANO_BANANA, provider);
}
