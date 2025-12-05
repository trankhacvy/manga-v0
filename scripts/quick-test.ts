/**
 * Quick Test Script for Image Generation
 * 
 * Tests a single prompt quickly to iterate on prompt engineering.
 * 
 * Usage:
 * npx tsx scripts/quick-test.ts
 */

import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import * as fal from "@fal-ai/serverless-client";
import { CharacterExtractionSchema } from "@/trigger/manga/extractCharacters";
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
require("dotenv").config({ path: ".env.local" });

// Configure FAL.ai
fal.config({
  credentials: process.env.FAL_KEY,
});

// ============================================================================
// OPTIMIZED PROMPTS FOR MANGA/COMIC GENERATION
// ============================================================================

// Character prompt - optimized for manga character sheets
const CHARACTER_PROMPT = `Professional manga character design sheet, full body reference.

Character: Akira, 17-year-old male protagonist
Physical: Spiky black hair, determined brown eyes, athletic lean build, height 175cm
Clothing: Modern Japanese school uniform - white shirt, navy blazer, red tie, dark pants
Personality: Determined, brave, slightly hot-headed

Layout: Character turnaround showing front view, 3/4 view, side profile, and back view
Style: Clean black ink lineart, professional manga character sheet
Background: Pure white, minimal shadows
Quality: High detail, consistent proportions, professional anime/manga art style

Additional: Include 4 facial expressions in corners - neutral, happy, angry, determined
Reference style: Similar to Shonen Jump character designs`;

// Panel prompt - optimized for manga panels
const PANEL_PROMPT = `Professional manga panel illustration, black and white.

Scene: Establishing shot of Tokyo high school at sunset
Composition: Wide angle view from street level, looking up at school building
Details: Cherry blossom trees in foreground, petals falling, dramatic clouds
Atmosphere: Golden hour lighting, peaceful yet dramatic mood
Characters: Single male student (Akira) standing at school gate, back to camera, looking up

Art style: Professional shonen manga illustration
Technique: Clean ink lines, screentone shading, high contrast blacks and whites
Quality: Detailed background, atmospheric perspective, cinematic composition
Reference: Similar to manga like "My Hero Academia" or "Haikyuu!!"

Panel format: Horizontal landscape panel, suitable for manga page layout`;

// Alternative: More detailed scene prompt
const DETAILED_SCENE_PROMPT = `Manga panel, black and white illustration.

SCENE DESCRIPTION:
- Location: Traditional Japanese dojo interior
- Time: Late afternoon, sunlight streaming through windows
- Action: Young samurai (Akira) in mid-training stance, wooden sword raised
- Mood: Intense concentration, sweat on forehead

VISUAL ELEMENTS:
- Foreground: Character in dynamic pose, detailed facial expression
- Midground: Training equipment, wooden floor with grain texture
- Background: Sliding doors (shoji), sunlight creating dramatic shadows
- Effects: Motion lines around sword, dust particles in sunbeams

ART STYLE:
- Black and white manga illustration
- Clean ink linework with varied line weights
- Screentone shading for depth and atmosphere
- High contrast for dramatic effect
- Professional shonen manga quality

COMPOSITION:
- Dynamic angle from slightly below (hero shot)
- Rule of thirds composition
- Strong diagonal lines for energy
- Clear focal point on character's face

REFERENCE STYLE: Similar to "Demon Slayer" or "Bleach" manga panels`;

// ============================================================================
// TEST FUNCTION
// ============================================================================

async function quickTest() {
  console.log("🚀 Quick Image Generation Test\n");

  // Choose which prompt to test
  const testType = process.argv[2] || "character"; // character, panel, or scene
  
  let prompt: string;
  let imageSize: string;
  
  switch (testType) {
    case "character":
      prompt = CHARACTER_PROMPT;
      imageSize = "portrait_4_3";
      console.log("📝 Testing: Character Design");
      break;
    case "panel":
      prompt = PANEL_PROMPT;
      imageSize = "landscape_4_3";
      console.log("📝 Testing: Manga Panel");
      break;
    case "scene":
      prompt = DETAILED_SCENE_PROMPT;
      imageSize = "landscape_4_3";
      console.log("📝 Testing: Detailed Scene");
      break;
    default:
      console.error("❌ Invalid test type. Use: character, panel, or scene");
      process.exit(1);
  }

  console.log("\n📋 Prompt:");
  console.log("-".repeat(80));
  console.log(prompt);
  console.log("-".repeat(80));

  console.log("\n⏳ Generating image...\n");

  const startTime = Date.now();

  try {
    const result = await fal.subscribe("fal-ai/nano-banana", {
      input: {
        prompt: prompt,
        image_size: imageSize,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
        // aspect_ratio: '1:1'
      },
      onQueueUpdate: (update) => {
        console.log(`📊 Status: ${update.status}`);
        // if (update.queue_position !== undefined) {
        //   console.log(`📍 Queue Position: ${update.queue_position}`);
        // }
        // if (update.logs && update.logs.length > 0) {
        //   console.log(`💬 ${update.logs[update.logs.length - 1].message}`);
        // }
      },
    });

    const duration = Date.now() - startTime;
    const imageUrl = (result as any).images[0].url;

    console.log("\n✅ Success!");
    console.log(`⏱️  Duration: ${duration}ms (${(duration / 1000).toFixed(1)}s)`);
    console.log(`🖼️  Image URL: ${imageUrl}`);
    console.log("\n💡 Open this URL in your browser to view the image");

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("\n❌ Generation failed!");
    console.error(`⏱️  Duration: ${duration}ms`);
    console.error(`🔥 Error: ${error}`);
    process.exit(1);
  }
}

async function runn() {
  const openrouter = createOpenRouter({
  apiKey: process.env.OPENAI_API_KEY!,
});

try {
  // const prompt = `You are a manga character designer analyzing a script to extract detailed character information.\n\n**Script to Analyze:**\nMANGA SCRIPT: \"The Tortoise's Triumph\"\n\nCHARACTERS:\n1. Hare: A boastful, overconfident rabbit who loves to show off his speed.\n2. Tortoise: A calm and steady tortoise who believes in perseverance.\n\n================================================================================\n\nPAGE 1 (Layout: grid-6)\n--------------------------------------------------------------------------------\n\n  Panel 1:\n    Scene: Wide shot of a peaceful meadow with flowers and a tree. The Hare stands proudly on the left, boasting with a big grin, while the Tortoise stands calmly on the right, looking determined.\n    Shot: wide / eye-level\n    Characters: Hare, Tortoise\n    Emotion: confident\n    Dialogue: \"Hare: \"I’m the fastest! No one can beat me!\"\"\n    Visual Notes: Sunshine illuminating the scene, flowers swaying gently in the breeze.\n\n  Panel 2:\n    Scene: Close-up of the Hare laughing, with an exaggerated expr`

  // const { object: extraction } = await generateObject({
  //         model: openrouter("openai/gpt-4.1-mini"),
  //         schema: CharacterExtractionSchema,
  //         prompt: prompt,
  //         temperature: 0.7,
  //       });
  //       console.log(extraction)

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY! });

  const prompt =
    "Goku vs Saitama at valley of the end (in Naruto), in manga style";

  const response = await ai.models.generateContent({
    model: "models/gemini-3-pro-image-preview",
    contents: prompt,
  });
  // @ts-expect-error
  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      console.log('imagexx')
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("goku.png", buffer);
    }
  }


} catch (error) {
  // @ts-expect-error
  console.debug(error?.data);
  console.error(error)
}
}

// ============================================================================
// USAGE INSTRUCTIONS
// ============================================================================

if (require.main === module) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  Quick Image Generation Test                   ║
╚════════════════════════════════════════════════════════════════╝

Usage:
  npx tsx scripts/quick-test.ts [type]

Types:
  character  - Test character design generation
  panel      - Test manga panel generation
  scene      - Test detailed scene generation

Examples:
  npx tsx scripts/quick-test.ts character
  npx tsx scripts/quick-test.ts panel
  npx tsx scripts/quick-test.ts scene

Make sure FAL_KEY is set in your .env.local file!
  `);

  runn().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
