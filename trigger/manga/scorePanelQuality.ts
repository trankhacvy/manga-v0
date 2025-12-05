import { schemaTask, logger } from "@trigger.dev/sdk";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";
import { createJobClient as createClient } from "@/utils/supabase/server";

const PanelQualityScoreSchema = z.object({
  overall: z.number().min(1).max(10).describe("Overall quality score (1-10)"),
  characterAccuracy: z.number().min(1).max(10).describe("Do characters match their descriptions? (1-10)"),
  compositionQuality: z.number().min(1).max(10).describe("Is it well-composed for the shot type? (1-10)"),
  styleConsistency: z.number().min(1).max(10).describe("Does it match the expected manga style? (1-10)"),
  contentMatch: z.number().min(1).max(10).describe("Does it show what the script describes? (1-10)"),
  issues: z.array(z.string()).describe("List of specific issues detected"),
  strengths: z.array(z.string()).describe("List of things done well"),
  regenerationSuggestion: z.string().optional().describe("Suggestion for improving regeneration prompt"),
});

const ScorePanelQualityPayloadSchema = z.object({
  panelId: z.string().describe("The panel ID"),
  imageUrl: z.string().describe("URL of the generated panel image"),
  expectedScene: z.string().describe("What the panel should show"),
  expectedCharacters: z.array(z.object({
    name: z.string(),
    consistencyString: z.string(),
  })).describe("Characters expected in the panel"),
  shotType: z.string().optional().describe("Expected shot type"),
  artStyle: z.string().describe("Expected art style"),
  styleAnchorUrl: z.string().optional().describe("Style anchor image for comparison"),
});

const QUALITY_SCORING_PROMPT = `Analyze this manga panel image for quality and accuracy.

EXPECTED:
- Scene: {expectedScene}
- Characters: {characterList}
- Shot type: {shotType}
- Art style: {artStyle}

CHARACTER REFERENCES:
{characterDescriptions}

SCORING CRITERIA (1-10 each):

1. **Character Accuracy**: Do the characters match their descriptions?
   - Correct hair style/color
   - Correct clothing/accessories
   - Correct body type
   - Distinctive features present

2. **Composition Quality**: Is the shot type correct? Is it well-framed?
   - Appropriate framing for {shotType}
   - Clear focal point
   - Good use of space
   - Readable composition

3. **Style Consistency**: Does it match manga style?
   - Clean lineart
   - Appropriate screentones
   - Professional quality
   - Consistent with {artStyle}

4. **Content Match**: Does the image show what the script describes?
   - Scene elements present
   - Action/pose correct
   - Mood/atmosphere appropriate
   - Setting details accurate

ISSUES TO CHECK:
- Wrong number of characters
- Character features don't match (wrong hair, missing accessories)
- Broken anatomy (extra limbs, distorted faces)
- Missing key elements from scene description
- Wrong shot type or angle
- Style inconsistencies
- Low quality or blurry areas

Provide an overall score (1-10) and list specific issues found.
Also note what was done well (strengths).
If score is below 7, suggest how to improve the regeneration prompt.`;

const openrouter = createOpenRouter({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const scorePanelQuality = schemaTask({
  id: "score-panel-quality",
  schema: ScorePanelQualityPayloadSchema,
  maxDuration: 120, // 2 minutes
  run: async (payload) => {
    const { 
      panelId, 
      imageUrl, 
      expectedScene, 
      expectedCharacters, 
      shotType, 
      artStyle,
      styleAnchorUrl 
    } = payload;

    logger.info("Starting panel quality scoring", {
      panelId,
      characterCount: expectedCharacters.length,
      shotType,
    });

    try {
      const characterList = expectedCharacters.map(c => c.name).join(', ') || 'none specified';
      const characterDescriptions = expectedCharacters.length > 0
        ? expectedCharacters.map(c => `- ${c.name}: ${c.consistencyString}`).join('\n')
        : 'No specific character descriptions provided.';

      const prompt = QUALITY_SCORING_PROMPT
        .replace('{expectedScene}', expectedScene)
        .replace('{characterList}', characterList)
        .replace('{shotType}', shotType || 'medium')
        .replace(/{artStyle}/g, artStyle)
        .replace('{characterDescriptions}', characterDescriptions);

      logger.info("[AI VISION] Panel Quality Scoring - Input", {
        panelId,
        model: "openai/gpt-4o",
        imageUrl,
        hasStyleAnchor: !!styleAnchorUrl,
      });

      // Build message content with images
      const messageContent: any[] = [
        { type: "text", text: prompt },
        { type: "image", image: new URL(imageUrl) },
      ];

      // Add style anchor for comparison if available
      if (styleAnchorUrl) {
        messageContent.push({
          type: "text",
          text: "\n\nSTYLE REFERENCE (compare style consistency to this image):",
        });
        messageContent.push({
          type: "image",
          image: new URL(styleAnchorUrl),
        });
      }

      const { object: score } = await generateObject({
        model: openrouter("openai/gpt-4o"),
        schema: PanelQualityScoreSchema,
        messages: [
          {
            role: "user",
            content: messageContent,
          },
        ],
        temperature: 0.3, // Lower temperature for consistent scoring
      });

      logger.info("[AI VISION] Panel Quality Scoring - Output", {
        panelId,
        overall: score.overall,
        characterAccuracy: score.characterAccuracy,
        compositionQuality: score.compositionQuality,
        styleConsistency: score.styleConsistency,
        contentMatch: score.contentMatch,
        issueCount: score.issues.length,
        issues: score.issues,
      });

      // Update panel with quality score
      const supabase = await createClient();
      await supabase
        .from("panels")
        .update({
          quality_score: score.overall,
          quality_details: {
            characterAccuracy: score.characterAccuracy,
            compositionQuality: score.compositionQuality,
            styleConsistency: score.styleConsistency,
            contentMatch: score.contentMatch,
            issues: score.issues,
            strengths: score.strengths,
            regenerationSuggestion: score.regenerationSuggestion,
            scoredAt: new Date().toISOString(),
          },
        })
        .eq("id", panelId);

      return {
        success: true,
        panelId,
        score,
        needsRegeneration: score.overall < 7,
      };
    } catch (error) {
      logger.error("Panel quality scoring failed", {
        panelId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Return a default score instead of failing
      return {
        success: false,
        panelId,
        score: null,
        needsRegeneration: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Adjust prompt based on detected issues
 * Used for regeneration attempts
 */
export function adjustPromptFromIssues(
  originalPrompt: string, 
  issues: string[]
): string {
  let enhancedPrompt = originalPrompt;
  
  for (const issue of issues) {
    const lowerIssue = issue.toLowerCase();
    
    if (lowerIssue.includes('wrong hair') || lowerIssue.includes('hair')) {
      enhancedPrompt = `IMPORTANT: Exact hair style and color as described. ${enhancedPrompt}`;
    }
    
    if (lowerIssue.includes('missing character') || lowerIssue.includes('wrong number')) {
      enhancedPrompt = `Must show ALL characters mentioned. ${enhancedPrompt}`;
    }
    
    if (lowerIssue.includes('anatomy') || lowerIssue.includes('distorted')) {
      enhancedPrompt += ' Correct human anatomy, proper proportions, no distortion.';
    }
    
    if (lowerIssue.includes('missing') && lowerIssue.includes('accessory')) {
      enhancedPrompt = `Include ALL accessories and distinctive features. ${enhancedPrompt}`;
    }
    
    if (lowerIssue.includes('style') || lowerIssue.includes('inconsistent')) {
      enhancedPrompt += ' Maintain consistent manga style throughout.';
    }
    
    if (lowerIssue.includes('composition') || lowerIssue.includes('framing')) {
      enhancedPrompt += ' Clear composition with proper framing.';
    }
  }
  
  return enhancedPrompt;
}

// Export types
export type PanelQualityScore = z.infer<typeof PanelQualityScoreSchema>;
