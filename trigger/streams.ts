import { streams, InferStreamType } from "@trigger.dev/sdk";
import { z } from "zod";

// Zod schema for progress stream data
export const ProgressStreamSchema = z.object({
  stage: z.enum([
    "analyzing",
    'style',
    "script",
    "characters",
    "designs",
    "layouts",
    "panels",
    "dialogue",
    "finalizing",
    "complete",
  ]),
  progress: z.number(),
  message: z.string(),
  timestamp: z.string(),
  estimatedTimeRemaining: z.number().optional(),
  data: z.optional(
    z.object({
      analysis: z.optional(
        z.object({
          theme: z.string(),
          setting: z.string(),
          conflict: z.string(),
          stakes: z.string(),
        })
      ),
      styleAnchor: z.optional(z.object({
        imageUrl: z.string().nullable(),
        styleDescription: z.string().nullable(),
      })),
      script: z.optional(
        z.object({
          title: z.string(),
          characterCount: z.number(),
          pageCount: z.number(),
        })
      ),
      characters: z.optional(
        z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            imageUrl: z.optional(z.string()),
          })
        )
      ),
      designs: z.optional(
        z.object({
          completed: z.number(),
          total: z.number(),
        })
      ),
      layouts: z.optional(
        z.object({
          pageCount: z.number(),
        })
      ),
      storyboard: z.optional(
        z.object({
          pageCount: z.number(),
        })
      ),
      panels: z.optional(
        z.object({
          completed: z.number(),
          total: z.number(),
        })
      ),
      images: z.optional(
        z.object({
          completed: z.number(),
          total: z.number(),
        })
      ),
    })
  ),
});

export type ProgressStreamData = z.infer<typeof ProgressStreamSchema>;

// Define progress stream for real-time updates (as string)
export const progressStream = streams.define<string>({
  id: "generation-progress",
});

export type ProgressStreamPart = InferStreamType<typeof progressStream>;

// Helper function to append progress updates
export async function appendProgress(
  data: ProgressStreamData,
  target?: "self" | "parent" | "root" | string
): Promise<void> {
  await progressStream.append(JSON.stringify(data), target ? { target } : undefined);
}
