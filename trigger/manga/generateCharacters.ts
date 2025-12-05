import { schemaTask, logger } from "@trigger.dev/sdk";
import { createJobClient as createClient } from "@/utils/supabase/server";
import { appendProgress } from "../streams";
import { z } from "zod";
import { ExtractedCharacterSchema } from "./extractCharacters";

const GenerateCharactersPayloadSchema = z.object({
  projectId: z.string().describe("The project ID"),
  characters: z
    .array(ExtractedCharacterSchema)
    .describe("Array of extracted character profiles to create in database"),
});

export const generateCharacters = schemaTask({
  id: "generate-characters",
  schema: GenerateCharactersPayloadSchema,
  maxDuration: 120, // 2 minutes
  run: async (payload) => {
    const { projectId, characters } = payload;

    logger.info("Starting character generation with consistency data", {
      projectId,
      characterCount: characters.length,
    });

    await appendProgress(
      {
        stage: "characters",
        progress: 30,
        message: `👥 Creating ${characters.length} character profiles...`,
        timestamp: new Date().toISOString(),
      },
      "parent"
    );

    try {
      const supabase = await createClient();
      const characterIds: Record<string, string> = {};

      for (let i = 0; i < characters.length; i++) {
        const char = characters[i];
        
        // Build outfit description
        let outfitDesc = `Main: ${char.outfit?.main || 'None'}`;
        if (char.outfit?.alternative) outfitDesc += `\nAlternative: ${char.outfit.alternative}`;
        if (char.outfit?.accessories) outfitDesc += `\nAccessories: ${char.outfit.accessories}`;

        // Build comprehensive description
        const fullDescription = `**Identity:** ${char.name} (${char.handle})
**Species:** ${char.species} (${char.category})
**Visual Keywords:** ${char.visualKeywords}

**Personality:** ${char.personality}

**Physical Appearance:**
- Head/Face: ${char.appearance.headFeature}
- Skin/Fur: ${char.appearance.skinOrFurType}
- Eyes: ${char.appearance.eyeColor}
- Build: ${char.appearance.height}, ${char.appearance.build}
- Distinctive Features: ${char.appearance.distinctiveFeatures}

**Outfit:**
${outfitDesc}

**Visual Notes:** ${char.visualReferenceNotes}

**Consistency String:** ${char.consistencyString}`;

        // Prepare visual anchors data
        const visualAnchorsData = char.visualAnchors ? {
          silhouette: char.visualAnchors.silhouette,
          faceAnchor: char.visualAnchors.faceAnchor,
          clothingAnchor: char.visualAnchors.clothingAnchor,
          primaryTone: char.visualAnchors.primaryTone,
        } : null;

        const { data: character, error: charError } = await supabase
          .from("characters")
          .insert({
            project_id: projectId,
            name: char.name,
            description: fullDescription,
            handle: char.handle,
            prompt_triggers: [char.handle, char.species],
            reference_images: {
              front: "",
              side: "",
              expressions: [],
            },
            // NEW: Consistency string for panel prompts (max 100 chars)
            consistency_string: char.consistencyString,
            // NEW: Visual anchors for recognition
            visual_anchors: visualAnchorsData,
            // Full turnaround data
            turnaround: {
              role: char.role,
              age: char.age,
              gender: char.gender,
              species: char.species,
              category: char.category,
              visualKeywords: char.visualKeywords,
              personality: char.personality,
              appearance: char.appearance,
              outfit: char.outfit,
              expressions: char.expressions,
              firstAppearance: char.firstAppearance,
              visualReferenceNotes: char.visualReferenceNotes,
              // Also store consistency data in turnaround for backup
              consistencyString: char.consistencyString,
              visualAnchors: char.visualAnchors,
            },
          })
          .select()
          .single();

        if (charError) {
          logger.error("Failed to create character", {
            projectId,
            characterName: char.name,
            error: charError.message,
          });
          throw new Error(`Failed to create character: ${char.name}`);
        }

        if (character) {
          characterIds[char.name] = character.id;
          
          logger.info("Character created with consistency data", {
            characterName: char.name,
            characterId: character.id,
            consistencyString: char.consistencyString,
            hasVisualAnchors: !!visualAnchorsData,
          });
        }

        // Update progress
        const progress = 30 + ((i + 1) / characters.length) * 20;
        await appendProgress(
          {
            stage: "characters",
            progress: Math.round(progress),
            message: `Created character: ${char.name} (${char.species})`,
            timestamp: new Date().toISOString(),
          },
          "parent"
        );
      }

      logger.info("Characters created successfully", {
        projectId,
        characterCount: characters.length,
        charactersWithConsistency: characters.filter(c => c.consistencyString).length,
      });

      // Fetch created characters
      const { data: createdCharacters } = await supabase
        .from("characters")
        .select("id, name, reference_images, consistency_string")
        .eq("project_id", projectId);

      await appendProgress(
        {
          stage: "characters",
          progress: 38,
          message: "Character profiles created!",
          timestamp: new Date().toISOString(),
          data: {
            characters: (createdCharacters || []).map((char) => {
              const refImages = char.reference_images as any;
              return {
                id: char.id,
                name: char.name,
                imageUrl: refImages?.front || undefined,
                consistencyString: char.consistency_string,
              };
            }),
          },
        },
        "parent"
      );

      // Update project progress
      await supabase
        .from("projects")
        .update({
          generation_stage: "characters",
          generation_progress: {
            script: 100,
            characters: 100,
            storyboard: 0,
            preview: 0,
          },
        })
        .eq("id", projectId);

      return {
        success: true,
        characterIds,
        characterCount: characters.length,
      };
    } catch (error) {
      logger.error("Character generation failed", {
        projectId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

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
