import { schemaTask, logger } from "@trigger.dev/sdk";
import { createJobClient as createClient } from "@/utils/supabase/server";
import { appendProgress } from "../streams";
import { z } from "zod";
import { truncatePrompt } from "./prompts";
import { buildCharacterDesignPrompt } from "./prompts/characterDesign";
import { generateCharacterImage as generateCharacterImageWrapper, IMAGE_MODELS } from "@/lib/ai/image-generation";


const CharacterSchema = z.object({
  id: z.string().describe("Character database ID"),
  name: z.string().describe("Character name"),
  description: z.string().describe("Full character description including appearance and personality"),
  turnaround: z.any().nullable().describe("Character turnaround data with detailed attributes"),
});

const GenerateCharacterImagesPayloadSchema = z.object({
  projectId: z.string().describe("The project ID"),
  characters: z
    .array(CharacterSchema)
    .describe("Array of characters with full details to generate reference images for"),
  artStyle: z.string().describe("The art style for character design"),
});

interface Character {
  id: string;
  name: string;
  description: string;
  turnaround?: any;
}

/**
 * Generate a single character reference image using the unified wrapper
 */
async function generateCharacterImage(
  character: Character,
  artStyle: string
): Promise<string> {
  try {
    const turnaround = character.turnaround || {};
    const app = turnaround.appearance || {};
    const outfit = turnaround.outfit || {};
    
    // Build appearance description
    let appearanceDesc = "";
    if (app.skinOrFurType || app.headFeature) {
      // New structure for both animals and humans
      appearanceDesc = `
        - Body/Texture: ${app.skinOrFurType || 'Standard'}
        - Head/Face: ${app.headFeature || 'Standard'}
        - Eyes: ${app.eyeColor || ''}
        - Build: ${app.height || ''}, ${app.build || ''}
        - Distinctive Features: ${app.distinctiveFeatures || ''}
        `.trim();
    } else {
      // Fallback for old data (Human only)
      appearanceDesc = `${app.height || ''} ${app.build || ''} character with ${app.hairColor || ''} ${app.hairStyle || ''} hair and ${app.eyeColor || ''} eyes.`.trim();
    }
    
    // Build outfit description
    const outfitDesc = outfit.main || "Standard outfit";
    
    // Get personality & species info
    const personality = turnaround.personality || '';
    const species = turnaround.species || 'Human'; 
    const category = turnaround.category || 'Human';
    const visualKeywords = turnaround.visualKeywords || species;

    // Build prompt using the character design prompt builder
    const { prompt: basePrompt, negativePrompt } = buildCharacterDesignPrompt({
      name: character.name,
      appearance: appearanceDesc || character.description,
      personality: personality,
      outfit: outfitDesc,
      artStyle,
      species,
      category,
      visualKeywords,
    });

    // Merge negative prompt
    let fullPrompt = `${basePrompt}\n\nAvoid: ${negativePrompt}`;
    
    // Check prompt limit
    const MAX_PROMPT_LENGTH = 4900;
    if (fullPrompt.length > MAX_PROMPT_LENGTH) {
      fullPrompt = truncatePrompt(fullPrompt, MAX_PROMPT_LENGTH);
    }

    logger.info("[AI IMAGE] Character Design - Input", {
      characterName: character.name,
      model: IMAGE_MODELS.FAL_NANO_BANANA,
      promptLength: fullPrompt.length,
    });

    // Use the unified wrapper function
    const result = await generateCharacterImageWrapper(fullPrompt, {
      guidance_scale: 7.5,
      num_inference_steps: 25,
    });

    if (!result.success || !result.imageUrl) {
      throw new Error(result.error || "No image generated");
    }

    logger.info("[AI IMAGE] Character Design - Output", {
      characterName: character.name,
      imageUrl: result.imageUrl,
      provider: result.provider,
      model: result.model,
    });

    return result.imageUrl;
  } catch (error) {
    logger.error("Failed to generate character image", {
      characterName: character.name,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

export const generateCharacterImages = schemaTask({
  id: "generate-character-images",
  schema: GenerateCharacterImagesPayloadSchema,
  maxDuration: 600, // 10 minutes
  run: async (payload) => {
    const { projectId, characters, artStyle } = payload;

    logger.info("Starting character image generation", {
      projectId,
      characterCount: characters.length,
      artStyle,
    });

    // Update progress
    await appendProgress(
      {
        stage: "designs",
        progress: 40,
        message: `🎨 Designing character looks for ${characters.length} characters...`,
        timestamp: new Date().toISOString(),
      },
      "parent"
    );

    try {
      const supabase = await createClient();
      const generatedImages: Record<string, string> = {};

      // Process characters individually for better quality
      for (let i = 0; i < characters.length; i++) {
        const character = characters[i];

        try {
          logger.info("Generating character image", {
            projectId,
            characterName: character.name,
            progress: `${i + 1}/${characters.length}`,
          });

          // Generate image for this character
          const imageUrl = await generateCharacterImage(character, artStyle);
          // const imageUrl = 'https://v3b.fal.media/files/b/koala/K0TcInteO0lSGzUCegSDa.png';
          
          generatedImages[character.id] = imageUrl;

          // Build metadata about the reference image
          const imageDescription = `Character turnaround sheet showing front, side, and back views of ${character.name}. ${character.description}`;

          // Update database with image and metadata
          await supabase
            .from("characters")
            .update({
              reference_images: {
                front: imageUrl,
                frontDescription: imageDescription,
                side: "",
                expressions: [],
              },
            })
            .eq("id", character.id);

          logger.info("Character image saved", {
            projectId,
            characterName: character.name,
            imageUrl,
          });

          // Update progress
          const progress = 40 + ((i + 1) / characters.length) * 10;
          await appendProgress(
            {
              stage: "designs",
              progress: Math.round(progress),
              message: `Generated design for ${character.name} (${i + 1}/${characters.length})`,
              timestamp: new Date().toISOString(),
            },
            "parent"
          );
        } catch (error) {
          logger.error("Failed to generate character image", {
            projectId,
            characterName: character.name,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          // Continue with next character instead of failing entire task
        }
      }

      logger.info("Character images generated successfully", {
        projectId,
        characterCount: characters.length,
      });

      // Fetch updated characters with images
      const { data: updatedCharacters } = await supabase
        .from("characters")
        .select("id, name, reference_images")
        .eq("project_id", projectId);

      // Update progress with updated character images
      await appendProgress(
        {
          stage: "designs",
          progress: 50,
          message: "Character designs complete!",
          timestamp: new Date().toISOString(),
          data: {
            characters: (updatedCharacters || []).map((char) => {
              const refImages = char.reference_images as any;
              return {
                id: char.id,
                name: char.name,
                imageUrl: refImages?.front || undefined,
              };
            }),
            designs: {
              completed: characters.length,
              total: characters.length,
            },
          },
        },
        "parent"
      );

      return {
        success: true,
        generatedImages,
        characterCount: characters.length,
      };
    } catch (error) {
      logger.error("Character image generation failed", {
        projectId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  },
});