/**
 * Test Script for Image Generation
 * 
 * This script tests different prompt styles and models to find the best
 * configuration for manga/comic generation.
 * 
 * Usage:
 * npx tsx scripts/test-image-generation.ts
 */

import * as fal from "@fal-ai/serverless-client";
import * as fs from "fs";
import * as path from "path";

// Configure FAL.ai
fal.config({
  credentials: process.env.FAL_KEY,
});

interface TestResult {
  name: string;
  model: string;
  prompt: string;
  imageUrl: string;
  duration: number;
  success: boolean;
  error?: string;
}

const results: TestResult[] = [];

// ============================================================================
// CHARACTER GENERATION PROMPTS
// ============================================================================

const characterPrompts = {
  // Style 1: Detailed anime character
  detailed: `Anime character design sheet, full body turnaround.
Young male protagonist, age 17, spiky black hair, determined brown eyes.
Wearing modern school uniform with loose tie and jacket.
Three views: front view, side profile, back view.
Clean lineart, cel shading, white background.
Professional anime character design, model sheet style.
High quality, detailed, consistent proportions.`,

  // Style 2: Manga character sheet
  mangaSheet: `Manga character reference sheet.
Character: Akira, teenage samurai warrior.
Appearance: Short spiky black hair, intense eyes, athletic build, scar on left cheek.
Outfit: Traditional hakama pants, loose white gi top, wooden sandals.
Multiple angles: front, 3/4 view, side, back.
Black and white manga style, clean ink lines, professional character design.
Include facial expressions: neutral, angry, determined, surprised.
White background, character turnaround sheet format.`,

  // Style 3: Simple and focused
  simple: `Character design: Young samurai named Akira.
Black spiky hair, brown eyes, lean build, age 16-18.
Traditional Japanese clothing: hakama and gi.
Front view, side view, back view.
Anime style, clean lines, white background.
Professional character sheet.`,

  // Style 4: Comic book style
  comic: `Comic book character design sheet.
Superhero character, dynamic pose, muscular build.
Costume: red and blue suit with cape.
Multiple views: front, side, back, 3/4 angle.
American comic book art style, bold lines, vibrant colors.
Professional character turnaround, model sheet.`,

  // Style 5: Chibi style
  chibi: `Chibi character design, cute style.
Small proportions, big head, tiny body.
Character: magical girl with pink hair and star wand.
Multiple expressions: happy, sad, angry, surprised.
Pastel colors, kawaii aesthetic, white background.
Professional chibi character sheet.`,
};

// ============================================================================
// PANEL GENERATION PROMPTS
// ============================================================================

const panelPrompts = {
  // Style 1: Detailed manga panel
  detailedManga: `Manga panel illustration.
Scene: Wide establishing shot of Tokyo cityscape at sunset.
Cherry blossom petals falling in the wind.
Dramatic lighting, golden hour atmosphere.
Black and white manga art style with screentones.
Clean ink lines, detailed background, professional manga illustration.
Cinematic composition, wide angle view.`,

  // Style 2: Action scene
  action: `Dynamic manga action panel.
Scene: Young samurai mid-jump, sword drawn, attacking motion.
Speed lines radiating from center, dramatic angle from below.
Intense expression, flowing clothes and hair.
Black and white manga style, bold ink lines, high contrast.
Action-packed composition, professional shonen manga art.`,

  // Style 3: Character close-up
  closeUp: `Manga panel, extreme close-up.
Scene: Character's face, intense determined expression.
Eyes filled with resolve, slight sweat on forehead.
Dramatic lighting from side, strong shadows.
Black and white manga style, detailed facial features.
Professional manga illustration, emotional impact.`,

  // Style 4: Dialogue scene
  dialogue: `Manga panel, two-shot composition.
Scene: Two characters talking in school hallway.
Medium shot, both characters visible, casual poses.
Clean background with perspective lines.
Black and white manga style, clear character details.
Professional manga illustration, slice of life aesthetic.`,

  // Style 5: Environmental shot
  environment: `Manga background illustration.
Scene: Traditional Japanese dojo interior.
Wooden floors, sliding doors, training equipment.
Detailed architecture, atmospheric lighting through windows.
Black and white manga style with screentones.
Professional manga background art, high detail.`,

  // Style 6: Western comic style
  westernComic: `Comic book panel illustration.
Scene: Superhero landing on city rooftop at night.
Dynamic pose, cape flowing, city lights in background.
Bold colors, strong shadows, dramatic lighting.
American comic book art style, professional illustration.
Cinematic composition, action-packed.`,
};

// ============================================================================
// TEST CONFIGURATIONS
// ============================================================================

const models = [
  "fal-ai/flux/dev",
  "fal-ai/flux/schnell",
  "fal-ai/flux-pro",
  "fal-ai/fast-sdxl",
];

const imageSizes = {
  character: "portrait_4_3" as const,
  panel: "landscape_4_3" as const,
  square: "square_hd" as const,
};

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function testCharacterGeneration(
  name: string,
  prompt: string,
  model: string = "fal-ai/flux/dev"
): Promise<TestResult> {
  console.log(`\n🎨 Testing: ${name}`);
  console.log(`📝 Model: ${model}`);
  console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);

  const startTime = Date.now();

  try {
    const result = await fal.subscribe(model, {
      input: {
        prompt: prompt,
        image_size: imageSizes.character,
        num_inference_steps: model.includes("schnell") ? 4 : 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
      },
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`⏳ Generating... (${update.logs?.[0]?.message || ""})`);
        }
      },
    });

    const duration = Date.now() - startTime;
    const imageUrl = (result as any).images[0].url;

    console.log(`✅ Success! Duration: ${duration}ms`);
    console.log(`🖼️  Image: ${imageUrl}`);

    return {
      name,
      model,
      prompt,
      imageUrl,
      duration,
      success: true,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed: ${error}`);

    return {
      name,
      model,
      prompt,
      imageUrl: "",
      duration,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function testPanelGeneration(
  name: string,
  prompt: string,
  model: string = "fal-ai/flux/dev"
): Promise<TestResult> {
  console.log(`\n🎨 Testing: ${name}`);
  console.log(`📝 Model: ${model}`);
  console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);

  const startTime = Date.now();

  try {
    const result = await fal.subscribe(model, {
      input: {
        prompt: prompt,
        image_size: imageSizes.panel,
        num_inference_steps: model.includes("schnell") ? 4 : 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
      },
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`⏳ Generating... (${update.logs?.[0]?.message || ""})`);
        }
      },
    });

    const duration = Date.now() - startTime;
    const imageUrl = (result as any).images[0].url;

    console.log(`✅ Success! Duration: ${duration}ms`);
    console.log(`🖼️  Image: ${imageUrl}`);

    return {
      name,
      model,
      prompt,
      imageUrl,
      duration,
      success: true,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed: ${error}`);

    return {
      name,
      model,
      prompt,
      imageUrl: "",
      duration,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runTests() {
  console.log("🚀 Starting Image Generation Tests\n");
  console.log("=" .repeat(80));

  // Test 1: Character generation with different prompts
  console.log("\n📋 TEST SUITE 1: Character Generation Prompts");
  console.log("=" .repeat(80));

  for (const [name, prompt] of Object.entries(characterPrompts)) {
    const result = await testCharacterGeneration(
      `Character: ${name}`,
      prompt,
      "fal-ai/flux/dev"
    );
    results.push(result);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Rate limiting
  }

  // Test 2: Panel generation with different prompts
  console.log("\n📋 TEST SUITE 2: Panel Generation Prompts");
  console.log("=" .repeat(80));

  for (const [name, prompt] of Object.entries(panelPrompts)) {
    const result = await testPanelGeneration(
      `Panel: ${name}`,
      prompt,
      "fal-ai/flux/dev"
    );
    results.push(result);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Rate limiting
  }

  // Test 3: Compare models (using best prompt from above)
  console.log("\n📋 TEST SUITE 3: Model Comparison");
  console.log("=" .repeat(80));

  const bestCharacterPrompt = characterPrompts.mangaSheet;
  const bestPanelPrompt = panelPrompts.detailedManga;

  for (const model of models) {
    const result = await testCharacterGeneration(
      `Model: ${model}`,
      bestCharacterPrompt,
      model
    );
    results.push(result);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Generate report
  console.log("\n📊 TEST RESULTS SUMMARY");
  console.log("=" .repeat(80));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    const avgDuration =
      successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    console.log(`⏱️  Average Duration: ${Math.round(avgDuration)}ms`);

    console.log("\n🏆 Top 5 Fastest:");
    successful
      .sort((a, b) => a.duration - b.duration)
      .slice(0, 5)
      .forEach((r, i) => {
        console.log(
          `${i + 1}. ${r.name} - ${r.duration}ms (${r.model})`
        );
      });
  }

  // Save results to file
  const reportPath = path.join(
    process.cwd(),
    "test-results",
    `image-gen-test-${Date.now()}.json`
  );
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  console.log(`\n💾 Full results saved to: ${reportPath}`);

  // Generate HTML report
  generateHTMLReport(results, reportPath.replace(".json", ".html"));

  console.log("\n✨ Tests complete!");
}

// ============================================================================
// HTML REPORT GENERATOR
// ============================================================================

function generateHTMLReport(results: TestResult[], outputPath: string) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Image Generation Test Results</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 { color: #333; }
    .summary {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .card.success { border-left: 4px solid #4caf50; }
    .card.failed { border-left: 4px solid #f44336; }
    .card img {
      width: 100%;
      height: auto;
      border-radius: 4px;
      margin: 10px 0;
    }
    .card h3 { margin: 0 0 10px 0; color: #333; }
    .card .meta {
      font-size: 12px;
      color: #666;
      margin: 5px 0;
    }
    .card .prompt {
      font-size: 11px;
      color: #888;
      background: #f9f9f9;
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
      max-height: 100px;
      overflow-y: auto;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      margin-right: 5px;
    }
    .badge.success { background: #4caf50; color: white; }
    .badge.failed { background: #f44336; color: white; }
    .badge.model { background: #2196f3; color: white; }
  </style>
</head>
<body>
  <h1>🎨 Image Generation Test Results</h1>
  
  <div class="summary">
    <h2>Summary</h2>
    <p><strong>Total Tests:</strong> ${results.length}</p>
    <p><strong>Successful:</strong> ${results.filter((r) => r.success).length}</p>
    <p><strong>Failed:</strong> ${results.filter((r) => !r.success).length}</p>
    <p><strong>Average Duration:</strong> ${Math.round(
      results.filter((r) => r.success).reduce((sum, r) => sum + r.duration, 0) /
        results.filter((r) => r.success).length
    )}ms</p>
  </div>

  <div class="grid">
    ${results
      .map(
        (result) => `
      <div class="card ${result.success ? "success" : "failed"}">
        <h3>${result.name}</h3>
        <div>
          <span class="badge ${result.success ? "success" : "failed"}">
            ${result.success ? "✓ Success" : "✗ Failed"}
          </span>
          <span class="badge model">${result.model}</span>
        </div>
        <div class="meta">Duration: ${result.duration}ms</div>
        ${
          result.success
            ? `<img src="${result.imageUrl}" alt="${result.name}" loading="lazy" />`
            : `<div class="meta" style="color: #f44336;">Error: ${result.error}</div>`
        }
        <div class="prompt">${result.prompt}</div>
      </div>
    `
      )
      .join("")}
  </div>
</body>
</html>
  `;

  fs.writeFileSync(outputPath, html);
  console.log(`📄 HTML report saved to: ${outputPath}`);
}

// ============================================================================
// RUN TESTS
// ============================================================================

if (require.main === module) {
  runTests().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { testCharacterGeneration, testPanelGeneration, characterPrompts, panelPrompts };
