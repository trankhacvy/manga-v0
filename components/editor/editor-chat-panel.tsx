"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/lib/store/editor-store";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
}

interface ChatAction {
  type: "regenerate" | "edit" | "add_character" | "inpaint" | "resize";
  label: string;
  parameters: Record<string, any>;
}

interface EditorChatPanelProps {
  projectId: string;
  onShowToast?: (message: string, type?: "success" | "error" | "info") => void;
}

export function EditorChatPanel({
  projectId,
  onShowToast,
}: EditorChatPanelProps) {
  const { selectedPanelIds, characters, project, getSelectedPanels } =
    useEditorStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your AI assistant. I can help you edit panels, add characters, and more. Try selecting a panel and asking me to regenerate it or make changes!",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get context information for display
  const contextInfo = React.useMemo(() => {
    const info: string[] = [];

    if (selectedPanelIds.length > 0) {
      info.push(
        `${selectedPanelIds.length} panel${
          selectedPanelIds.length > 1 ? "s" : ""
        } selected`
      );
    }

    return info;
  }, [selectedPanelIds]);

  const handleSendMessage = async () => {
    const message = inputValue.trim();
    if (!message || isLoading) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Prepare context
      const selectedPanels = getSelectedPanels();
      const context = {
        selectedPanelIds,
        selectedPanels: selectedPanels.map((p) => ({
          id: p.id,
          prompt: p.prompt,
          characterHandles: p.characterHandles,
        })),
        characters: characters.map((c) => ({
          id: c.id,
          name: c.name,
          handle: c.handle,
        })),
        projectStyle: project?.style,
      };

      // Call AI chat API
      const response = await fetch("/api/editor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      // Add AI response to chat
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        actions: data.actions,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);

      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);

      if (onShowToast) {
        onShowToast("Failed to send message", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExecuteAction = async (action: ChatAction) => {
    console.log("Executing action:", action);

    try {
      switch (action.type) {
        case "regenerate":
          // TODO: Implement regenerate action
          if (onShowToast) {
            onShowToast("Regenerating panel...", "info");
          }
          break;

        case "edit":
          // TODO: Implement edit action
          if (onShowToast) {
            onShowToast("Applying edits...", "info");
          }
          break;

        case "add_character":
          // TODO: Implement add character action
          if (onShowToast) {
            onShowToast("Adding character...", "info");
          }
          break;

        case "inpaint":
          // TODO: Implement inpaint action
          if (onShowToast) {
            onShowToast("Starting inpainting...", "info");
          }
          break;

        case "resize":
          // TODO: Implement resize action
          if (onShowToast) {
            onShowToast("Resizing panel...", "info");
          }
          break;

        default:
          console.warn("Unknown action type:", action.type);
      }
    } catch (error) {
      console.error("Action execution error:", error);
      if (onShowToast) {
        onShowToast("Failed to execute action", "error");
      }
    }
  };

  const clearContext = (index: number) => {
    // Remove context pill (for future implementation)
    console.log("Clear context:", index);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Sparkles className="size-4 text-[#1337ec]" />
        <h3 className="text-sm font-medium">AI Assistant</h3>
      </div>

      {/* Context Pills */}
      {contextInfo.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-2 border-b bg-muted/30">
          {contextInfo.map((info, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-[#1337ec]/10 text-[#1337ec] rounded-full"
            >
              <span>{info}</span>
              <button
                onClick={() => clearContext(index)}
                className="hover:bg-[#1337ec]/20 rounded-full p-0.5"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex flex-col gap-2",
              message.role === "user" ? "items-end" : "items-start"
            )}
          >
            {/* Message Bubble */}
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                message.role === "user"
                  ? "bg-[#1337ec] text-white"
                  : "bg-muted text-foreground"
              )}
            >
              <p className="whitespace-pre-wrap wrap-break-word">
                {message.content}
              </p>
            </div>

            {/* Action Buttons */}
            {message.actions && message.actions.length > 0 && (
              <div className="flex flex-wrap gap-2 max-w-[85%]">
                {message.actions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExecuteAction(action)}
                    className="text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Timestamp */}
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="bg-muted rounded-lg px-3 py-2">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to edit panels, add characters, or make changes..."
            className={cn(
              "flex-1 min-h-[60px] max-h-[120px] resize-none",
              "rounded-lg border border-input bg-background",
              "px-3 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-[#1337ec]/50 focus:border-[#1337ec]",
              "transition-colors"
            )}
            rows={2}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="shrink-0 h-[60px] w-[60px]"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
