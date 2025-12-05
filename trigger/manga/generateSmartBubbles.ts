import { schemaTask, logger } from "@trigger.dev/sdk";
import { createJobClient as createClient } from "@/utils/supabase/server";
import { appendProgress } from "../streams";
import { z } from "zod";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import {
  validateBubblePosition,
  adjustForOverlap,
  estimateBubbleSize,
} from "./utils/bubblePositioning";

const GenerateSmartBubblesPayloadSchema = z.object({
  projectId: z.string().describe("The project ID"),
  pageCount: z.number().int().describe("Number of pages to process"),
});

// Bubble position schema for AI response
const BubblePositionSchema = z.object({
  type: z.enum(["dialogue", "narration", "thought"]),
  relativeX: z.number().min(0).max(1).describe("X position (0-1 scale)"),
  relativeY: z.number().min(0).max(1).describe("Y position (0-1 scale)"),
  relativeWidth: z.number().min(0.1).max(0.9).describe("Width (0-1 scale)"),
  relativeHeight: z.number().min(0.05).max(0.4).describe("Height (0-1 scale)"),
  tailTarget: z.object({
    x: z.number().min(0).max(1).nullable(),
    y: z.number().min(0).max(1).nullable(),
  }).nullable().describe("Tail pointing to character's mouth"),
});

const VisionAnalysisSchema = z.object({
  bubbles: z.array(BubblePositionSchema),
  safeZones: z.array(z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().min(0).max(1),
    height: z.number().min(0).max(1),
  })).nullable(),
});

// Batch analysis schema for multiple panels
const BatchVisionAnalysisSchema = z.object({
  panels: z.array(z.object({
    panelIndex: z.number(),
    bubbles: z.array(BubblePositionSchema),
  })),
});

interface PanelBubble {
  id: string;
  text: string;
  type: string;
}

interface PanelData {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
  bubbles: PanelBubble[];
  characterHandles: string[];
  prompt: string;
  panelIndex: number;
}

const openrouter = createOpenRouter({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Determine if a panel needs AI-based bubble positioning
 */
function needsAIPositioning(panel: PanelData): boolean {
  const bubbleCount = panel.bubbles.length;
  const characterCount = panel.characterHandles.length;
  
  const actionKeywords = ['fight', 'battle', 'run', 'jump', 'attack', 'dodge', 'explosion', 'crash'];
  const hasAction = actionKeywords.some(keyword => 
    panel.prompt.toLowerCase().includes(keyword)
  );
  
  return (
    bubbleCount >= 3 ||
    (characterCount >= 2 && bubbleCount >= 2) ||
    (hasAction && bubbleCount >= 2)
  );
}

/**
 * Generate bubble positions using simple rules
 */
function generateRuleBasedBubbles(panel: PanelData): any[] {
  const bubbles = panel.bubbles;
  
  return bubbles.map((bubble, idx) => {
    const isNarration = bubble.type === "narration";
    
    if (isNarration) {
      return {
        id: bubble.id,
        type: bubble.type,
        text: bubble.text,
        relativeX: 0.1,
        relativeY: 0.05,
        relativeWidth: 0.8,
        relativeHeight: 0.12,
        x: Math.round(panel.width * 0.1),
        y: Math.round(panel.height * 0.05),
        width: Math.round(panel.width * 0.8),
        height: Math.round(panel.height * 0.12),
        isManuallyPositioned: false,
        positioningMethod: "rule-based",
      };
    }
    
    const positions = [
      { x: 0.55, y: 0.15, w: 0.35, h: 0.15 },
      { x: 0.1, y: 0.45, w: 0.35, h: 0.15 },
      { x: 0.55, y: 0.7, w: 0.35, h: 0.15 },
    ];
    
    const pos = positions[idx % positions.length];
    
    return {
      id: bubble.id,
      type: bubble.type,
      text: bubble.text,
      relativeX: pos.x,
      relativeY: pos.y,
      relativeWidth: pos.w,
      relativeHeight: pos.h,
      x: Math.round(panel.width * pos.x),
      y: Math.round(panel.height * pos.y),
      width: Math.round(panel.width * pos.w),
      height: Math.round(panel.height * pos.h),
      isManuallyPositioned: false,
      positioningMethod: "rule-based",
    };
  });
}

/**
 * Generate bubble positions using AI vision analysis (single panel)
 */
async function generateAIBubbles(panel: PanelData): Promise<any[]> {
  try {
    const visionPrompt = `Analyze this manga panel image and determine optimal positions for speech bubbles.

Panel context:
- Scene: ${panel.prompt}
- Characters: ${panel.characterHandles.join(", ") || "none specified"}
- Bubbles to place: ${panel.bubbles.length}

Bubble content:
${panel.bubbles.map((b, i) => `${i + 1}. [${b.type}] "${b.text}"`).join("\n")}

Requirements:
1. Don't cover characters' faces or important visual elements
2. Don't obscure action or key details
3. Follow manga reading flow (right-to-left for manga, top-to-bottom)
4. Place in empty/background areas when possible
5. Narration boxes typically go at top
6. Dialogue bubbles near speaking character's mouth

For each bubble, provide:
- relativeX, relativeY (0-1 scale, top-left origin)
- relativeWidth, relativeHeight (0-1 scale)
- tailTarget: {x, y} pointing to character's mouth if applicable`;

    logger.info("[AI VISION] Bubble Positioning - Input", {
      panelId: panel.id,
      model: "openai/gpt-4o",
      bubbleCount: panel.bubbles.length,
      visionPrompt
    });

    const { object: analysis } = await generateObject({
      model: openrouter("openai/gpt-4o"),
      schema: VisionAnalysisSchema,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: visionPrompt },
            { type: "image", image: new URL(panel.imageUrl) },
          ],
        },
      ],
      temperature: 0.3,
    });

    logger.info("[AI VISION] Bubble Positioning - Output", {
      panelId: panel.id,
      bubblesAnalyzed: analysis.bubbles.length,
    });

    const bubblePositions = panel.bubbles.map((bubble, idx) => {
      const aiPosition = analysis.bubbles[idx] || analysis.bubbles[0];
      
      if (!validateBubblePosition(aiPosition)) {
        const estimatedSize = estimateBubbleSize(
          bubble.text,
          bubble.type as "dialogue" | "narration" | "thought"
        );
        
        return {
          id: bubble.id,
          relativeX: 0.1,
          relativeY: 0.1 + (idx * 0.25),
          relativeWidth: estimatedSize.width,
          relativeHeight: estimatedSize.height,
        };
      }
      
      return {
        id: bubble.id,
        relativeX: aiPosition.relativeX,
        relativeY: aiPosition.relativeY,
        relativeWidth: aiPosition.relativeWidth,
        relativeHeight: aiPosition.relativeHeight,
        tailTarget: aiPosition.tailTarget,
      };
    });
    
    const adjustedPositions = adjustForOverlap(bubblePositions);
    
    return panel.bubbles.map((bubble, idx) => {
      const pos = adjustedPositions[idx];
      const originalPos = bubblePositions[idx];
      
      return {
        id: bubble.id,
        type: bubble.type,
        text: bubble.text,
        relativeX: pos.relativeX,
        relativeY: pos.relativeY,
        relativeWidth: pos.relativeWidth,
        relativeHeight: pos.relativeHeight,
        x: Math.round(panel.width * pos.relativeX),
        y: Math.round(panel.height * pos.relativeY),
        width: Math.round(panel.width * pos.relativeWidth),
        height: Math.round(panel.height * pos.relativeHeight),
        tailTarget: originalPos.tailTarget,
        isManuallyPositioned: false,
        positioningMethod: "ai-vision",
      };
    });
  } catch (error) {
    logger.error("AI bubble positioning failed, falling back to rules", {
      panelId: panel.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    
    return generateRuleBasedBubbles(panel);
  }
}

/**
 * Generate bubbles for a page (batched processing)
 * Groups panels and processes efficiently
 */
async function generateBubblesForPage(
  panels: PanelData[]
): Promise<Map<string, any[]>> {
  const results = new Map<string, any[]>();
  
  // Separate panels by positioning method
  const aiPanels = panels.filter(needsAIPositioning);
  const rulePanels = panels.filter(p => !needsAIPositioning(p));
  
  // Process rule-based panels immediately (parallel)
  const ruleResults = await Promise.all(
    rulePanels.map(async (panel) => {
      const bubbles = generateRuleBasedBubbles(panel);
      return { panelId: panel.id, bubbles };
    })
  );
  
  for (const result of ruleResults) {
    results.set(result.panelId, result.bubbles);
  }
  
  // Process AI panels
  if (aiPanels.length > 0) {
    // If 4 or fewer AI panels, we could batch them
    // For now, process in parallel individually
    const aiResults = await Promise.all(
      aiPanels.map(async (panel) => {
        const bubbles = await generateAIBubbles(panel);
        return { panelId: panel.id, bubbles };
      })
    );
    
    for (const result of aiResults) {
      results.set(result.panelId, result.bubbles);
    }
  }
  
  return results;
}

export const generateSmartBubbles = schemaTask({
  id: "generate-smart-bubbles",
  schema: GenerateSmartBubblesPayloadSchema,
  maxDuration: 600, // 10 minutes
  run: async (payload) => {
    const { projectId, pageCount } = payload;

    logger.info("Starting smart bubble positioning (batched)", {
      projectId,
      pageCount,
    });

    await appendProgress(
      {
        stage: "dialogue",
        progress: 92,
        message: "💬 Positioning speech bubbles intelligently...",
        timestamp: new Date().toISOString(),
      },
      "parent"
    );

    try {
      const supabase = await createClient();

      // Get all pages
      const { data: pages } = await supabase
        .from("pages")
        .select("id, page_number")
        .eq("project_id", projectId)
        .order("page_number")
        .limit(pageCount);

      if (!pages || pages.length === 0) {
        throw new Error("No pages found");
      }

      let aiUsedCount = 0;
      let rulesUsedCount = 0;
      let totalPanelsProcessed = 0;

      // Process each page
      for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
        const page = pages[pageIdx];
        
        // Get panels for this page
        const { data: panels, error: panelsError } = await supabase
          .from("panels")
          .select("id, image_url, width, height, bubbles, character_handles, prompt, panel_index")
          .eq("page_id", page.id)
          .not("image_url", "is", null)
          .order("panel_index");

        if (panelsError || !panels || panels.length === 0) {
          continue;
        }

        // Prepare panel data
        const panelDataList: PanelData[] = panels
          .filter(p => p.bubbles && Array.isArray(p.bubbles) && (p.bubbles as unknown[]).length > 0)
          .map(panel => ({
            id: panel.id,
            imageUrl: panel.image_url!,
            width: panel.width,
            height: panel.height,
            bubbles: panel.bubbles as unknown as PanelBubble[],
            characterHandles: panel.character_handles || [],
            prompt: panel.prompt || "",
            panelIndex: panel.panel_index,
          }));

        if (panelDataList.length === 0) {
          continue;
        }

        logger.info(`Processing page ${page.page_number} bubbles`, {
          panelCount: panelDataList.length,
        });

        // Process all panels for this page
        const pageResults = await generateBubblesForPage(panelDataList);

        // Update database for each panel
        for (const [panelId, bubbles] of pageResults) {
          await supabase
            .from("panels")
            .update({ bubbles })
            .eq("id", panelId);

          // Count methods used
          const method = bubbles[0]?.positioningMethod;
          if (method === "ai-vision") {
            aiUsedCount++;
          } else {
            rulesUsedCount++;
          }
          totalPanelsProcessed++;
        }

        // Update progress
        const progress = 92 + ((pageIdx + 1) / pages.length) * 6;
        await appendProgress(
          {
            stage: "dialogue",
            progress: Math.round(progress),
            message: `Positioned bubbles for page ${page.page_number}`,
            timestamp: new Date().toISOString(),
          },
          "parent"
        );
      }

      logger.info("Smart bubble positioning complete", {
        projectId,
        totalPanelsProcessed,
        aiUsed: aiUsedCount,
        rulesUsed: rulesUsedCount,
      });

      await appendProgress(
        {
          stage: "dialogue",
          progress: 98,
          message: "Speech bubbles positioned!",
          timestamp: new Date().toISOString(),
        },
        "parent"
      );

      return {
        success: true,
        panelsProcessed: totalPanelsProcessed,
        aiUsed: aiUsedCount,
        rulesUsed: rulesUsedCount,
      };
    } catch (error) {
      logger.error("Smart bubble positioning failed", {
        projectId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  },
});
