import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export const runtime = "edge";

interface EditorChatRequest {
  projectId: string;
  message: string;
  context: {
    selectedPanelIds: string[];
    selectedPanels: Array<{
      id: string;
      prompt: string;
      characterHandles: string[];
    }>;
    characters: Array<{
      id: string;
      name: string;
      handle: string;
    }>;
    projectStyle?: string;
  };
}

interface EditorChatResponse {
  message: string;
  actions?: Array<{
    type: "regenerate" | "edit" | "add_character" | "inpaint" | "resize";
    label: string;
    parameters: Record<string, any>;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Import auth utilities dynamically to avoid edge runtime issues
    const {
      getAuthenticatedUser,
      verifyProjectOwnership,
      unauthorizedResponse,
      forbiddenResponse,
    } = await import("@/lib/api-auth");

    // Check authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return unauthorizedResponse("You must be logged in to use the AI chat");
    }

    const body = (await request.json()) as EditorChatRequest;
    const { projectId, message, context } = body;

    if (!projectId || !message) {
      return NextResponse.json(
        { error: "Missing required fields: projectId and message" },
        { status: 400 }
      );
    }

    // Verify user owns the project
    const isAuthorized = await verifyProjectOwnership(user.id, projectId);
    if (!isAuthorized) {
      return forbiddenResponse(
        "You do not have permission to edit this project"
      );
    }

    // Build context for the LLM
    const systemPrompt = `You are an AI assistant for a manga/comic editor. You help users edit their manga panels, add characters, and make creative decisions.

Current Context:
- Project Style: ${context.projectStyle || "Not specified"}
- Selected Panels: ${context.selectedPanelIds.length}
${
  context.selectedPanels.length > 0
    ? `- Panel Details:\n${context.selectedPanels
        .map(
          (p, i) =>
            `  ${i + 1}. Prompt: "${p.prompt || "No prompt"}", Characters: ${
              p.characterHandles.length > 0
                ? p.characterHandles.join(", ")
                : "None"
            }`
        )
        .join("\n")}`
    : ""
}
${
  context.characters.length > 0
    ? `- Available Characters: ${context.characters
        .map((c) => `${c.name} (${c.handle})`)
        .join(", ")}`
    : ""
}

Your role:
1. Understand user intent from their message
2. Provide helpful, conversational responses
3. Suggest actionable steps when appropriate
4. If the user wants to make changes, provide action buttons they can click

Available actions you can suggest:
- "regenerate": Regenerate a panel with a new or modified prompt
- "edit": Edit panel properties (prompt, characters, etc.)
- "add_character": Add a character to a panel
- "inpaint": Edit a specific region of a panel
- "resize": Resize a panel

Response format:
Respond with a JSON object containing:
{
  "message": "<conversational response to the user>",
  "actions": [
    {
      "type": "<action_type>",
      "label": "<button label>",
      "parameters": { <action-specific parameters> }
    }
  ]
}

Examples:

User: "Make the background darker"
Response: {
  "message": "I can help you make the background darker. Would you like me to regenerate the selected panel with a darker background?",
  "actions": [
    {
      "type": "regenerate",
      "label": "Regenerate with darker background",
      "parameters": { "promptModification": "darker background" }
    }
  ]
}

User: "Add @hero to this panel"
Response: {
  "message": "I'll add @hero to the selected panel. This will include the character in the next regeneration.",
  "actions": [
    {
      "type": "add_character",
      "label": "Add @hero",
      "parameters": { "characterHandle": "@hero" }
    }
  ]
}

User: "What characters are available?"
Response: {
  "message": "You have ${context.characters.length} characters in this project: ${context.characters.map((c) => c.name).join(", ")}. You can add them to panels by mentioning their handles or dragging them from the character library.",
  "actions": []
}

User: "Regenerate this panel"
Response: {
  "message": "I'll regenerate the selected panel using its current prompt. Click the button below to start.",
  "actions": [
    {
      "type": "regenerate",
      "label": "Regenerate Panel",
      "parameters": {}
    }
  ]
}

Guidelines:
- Be conversational and helpful
- If no panels are selected and the action requires one, mention that in your message
- Don't provide actions if the user is just asking questions
- Keep responses concise but friendly
- Use the context to provide relevant suggestions`;

    const userPrompt = `User message: "${message}"

${
  context.selectedPanelIds.length === 0
    ? "Note: No panels are currently selected. If the user's request requires a panel selection, let them know."
    : ""
}`;

    // Call LLM to generate response
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    // Parse the LLM response
    let response: EditorChatResponse;
    try {
      // Extract JSON from the response (handle cases where LLM adds extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      response = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse LLM response:", text);
      // Fallback response
      response = {
        message:
          "I understand you want to make changes, but I'm having trouble processing that request. Could you try rephrasing it?",
        actions: [],
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Editor chat error:", error);
    return NextResponse.json(
      {
        message:
          "Sorry, I encountered an error processing your request. Please try again.",
        actions: [],
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
