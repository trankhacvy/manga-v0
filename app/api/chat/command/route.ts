import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import type { Panel, Character, StyleType } from "@/types";

export const runtime = "edge";

interface ChatCommandRequest {
  projectId: string;
  panelId?: string;
  command: string;
  context: {
    currentPanel?: Panel;
    characterBank: Character[];
    projectStyle: StyleType;
  };
}

interface ChatCommandResponse {
  action:
    | "regenerate"
    | "inpaint"
    | "edit_bubble"
    | "resize"
    | "add_bubble"
    | "delete_bubble"
    | "activate_mask_tool"
    | "info"
    | "error";
  parameters: Record<string, any>;
  message: string;
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
      return unauthorizedResponse("You must be logged in to use chat commands");
    }

    const body = (await request.json()) as ChatCommandRequest;
    const { projectId, panelId, command, context } = body;

    if (!projectId || !command) {
      return NextResponse.json(
        { error: "Missing required fields: projectId and command" },
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
    const systemPrompt = `You are an AI assistant for a manga/comic creation IDE. Your job is to interpret user commands and return structured actions.

Available actions:
- "regenerate": Regenerate a panel with a new or modified prompt
- "inpaint": Regenerate a specific region of a panel (for commands like "fix the hands", "change the background")
- "edit_bubble": Edit the text of a speech bubble
- "resize": Resize a panel
- "add_bubble": Add a new speech bubble to a panel
- "delete_bubble": Delete a speech bubble
- "activate_mask_tool": Activate the mask selection tool for manual region selection
- "info": Provide information or clarification
- "error": When the command cannot be understood or executed

Current context:
- Project Style: ${context.projectStyle}
- Panel Selected: ${panelId ? "Yes" : "No"}
${
  context.currentPanel
    ? `- Current Panel Prompt: ${context.currentPanel.prompt}`
    : ""
}
${
  context.currentPanel?.bubbles.length
    ? `- Speech Bubbles: ${context.currentPanel.bubbles.length}`
    : ""
}
${
  context.characterBank.length
    ? `- Available Characters: ${context.characterBank
        .map((c) => c.name)
        .join(", ")}`
    : ""
}

Analyze the user's command and respond with a JSON object containing:
{
  "action": "<action_type>",
  "parameters": {
    // Action-specific parameters
  },
  "message": "<user-friendly response>"
}

Examples:
User: "Make the background darker"
Response: {"action": "regenerate", "parameters": {"promptModification": "darker background"}, "message": "I'll regenerate this panel with a darker background."}

User: "Fix the hands"
Response: {"action": "inpaint", "parameters": {"region": "hands", "promptModification": "fix and improve the hands"}, "message": "I'll fix the hands in this panel using inpainting."}

User: "Change the character's expression"
Response: {"action": "inpaint", "parameters": {"region": "face", "promptModification": "different facial expression"}, "message": "I'll modify the character's expression using inpainting."}

User: "Let me select the area to fix"
Response: {"action": "activate_mask_tool", "parameters": {"mode": "rectangle"}, "message": "I've activated the mask selection tool. Draw a rectangle around the area you want to edit."}

User: "Change the dialogue to 'Hello there'"
Response: {"action": "edit_bubble", "parameters": {"bubbleIndex": 0, "newText": "Hello there"}, "message": "I'll update the dialogue text."}

User: "Make this panel bigger"
Response: {"action": "resize", "parameters": {"widthMultiplier": 1.5, "heightMultiplier": 1.5}, "message": "I'll resize this panel to be 50% larger."}

User: "Add a thought bubble saying 'What should I do?'"
Response: {"action": "add_bubble", "parameters": {"text": "What should I do?", "type": "thought"}, "message": "I'll add a thought bubble with that text."}`;

    const userPrompt = `User command: "${command}"

${
  !panelId
    ? "Note: No panel is currently selected. If the command requires a panel selection, inform the user."
    : ""
}`;

    // Call LLM to interpret the command
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
    });

    // Parse the LLM response
    let response: ChatCommandResponse;
    try {
      // Extract JSON from the response (handle cases where LLM adds extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      response = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse LLM response:", text);
      response = {
        action: "error",
        parameters: {},
        message: "I couldn't understand that command. Could you rephrase it?",
      };
    }

    // Validate that panel is selected for panel-specific actions
    if (
      !panelId &&
      [
        "regenerate",
        "inpaint",
        "edit_bubble",
        "resize",
        "add_bubble",
        "activate_mask_tool",
      ].includes(response.action)
    ) {
      return NextResponse.json({
        action: "error",
        parameters: {},
        message: "Please select a panel first before using this command.",
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat command error:", error);
    return NextResponse.json(
      {
        action: "error",
        parameters: {},
        message: "An error occurred while processing your command.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
