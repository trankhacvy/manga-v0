// Example usage of the image upload pipeline
// This file demonstrates how to use the various upload functions

import {
  uploadPanelImage,
  uploadCharacterSheet,
  uploadPageThumbnail,
  uploadSketchImage,
  uploadPanelImageBatch,
} from "./image-upload-pipeline";

/**
 * Example 1: Upload a single panel image after generation
 */
async function exampleUploadPanelImage() {
  const result = await uploadPanelImage({
    projectId: "project-uuid",
    panelId: "panel-uuid",
    imageUrl: "https://example.com/generated-image.png",
    prompt: "A hero standing on a cliff at sunset",
    generationParams: {
      seed: 12345,
      width: 1024,
      height: 1024,
      style: "shonen",
      characterRefs: ["character-uuid-1"],
    },
    saveToHistory: true, // Save to generation_history table
  });

  console.log("Uploaded panel image:", result.imageUrl);
  console.log("History ID:", result.historyId);
}

/**
 * Example 2: Upload a complete character sheet
 */
async function exampleUploadCharacterSheet() {
  const result = await uploadCharacterSheet({
    projectId: "project-uuid",
    characterId: "character-uuid",
    images: {
      front: "https://example.com/character-front.png",
      side: "https://example.com/character-side.png",
      expressions: [
        "https://example.com/character-happy.png",
        "https://example.com/character-sad.png",
        "https://example.com/character-angry.png",
      ],
    },
  });

  console.log("Character sheet uploaded:");
  console.log("Front view:", result.front);
  console.log("Side view:", result.side);
  console.log("Expressions:", result.expressions);
}

/**
 * Example 3: Upload a page thumbnail
 */
async function exampleUploadPageThumbnail() {
  const result = await uploadPageThumbnail({
    projectId: "project-uuid",
    pageId: "page-uuid",
    imageUrl: "https://example.com/page-thumbnail.png",
  });

  console.log("Thumbnail uploaded:", result.url);
}

/**
 * Example 4: Upload a sketch image for ControlNet
 */
async function exampleUploadSketchImage() {
  const result = await uploadSketchImage({
    projectId: "project-uuid",
    panelId: "panel-uuid",
    imageUrl: "https://example.com/sketch.png",
  });

  console.log("Sketch uploaded:", result.url);
}

/**
 * Example 5: Batch upload multiple panel images
 */
async function exampleBatchUpload() {
  const results = await uploadPanelImageBatch([
    {
      projectId: "project-uuid",
      panelId: "panel-uuid-1",
      imageUrl: "https://example.com/panel-1.png",
      prompt: "Panel 1 prompt",
      generationParams: { seed: 1 },
    },
    {
      projectId: "project-uuid",
      panelId: "panel-uuid-2",
      imageUrl: "https://example.com/panel-2.png",
      prompt: "Panel 2 prompt",
      generationParams: { seed: 2 },
    },
    {
      projectId: "project-uuid",
      panelId: "panel-uuid-3",
      imageUrl: "https://example.com/panel-3.png",
      prompt: "Panel 3 prompt",
      generationParams: { seed: 3 },
    },
  ]);

  console.log(`Uploaded ${results.length} panels`);
  results.forEach((result, index) => {
    console.log(`Panel ${index + 1}:`, result.imageUrl);
  });
}

/**
 * Example 6: Upload panel without saving to history
 */
async function exampleUploadWithoutHistory() {
  const result = await uploadPanelImage({
    projectId: "project-uuid",
    panelId: "panel-uuid",
    imageUrl: "https://example.com/generated-image.png",
    prompt: "Test panel",
    saveToHistory: false, // Don't save to generation_history
  });

  console.log("Uploaded without history:", result.imageUrl);
  console.log("History ID:", result.historyId); // Will be undefined
}

// Export examples for reference
export {
  exampleUploadPanelImage,
  exampleUploadCharacterSheet,
  exampleUploadPageThumbnail,
  exampleUploadSketchImage,
  exampleBatchUpload,
  exampleUploadWithoutHistory,
};
