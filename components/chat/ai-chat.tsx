"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { useCanvasStore } from "@/lib/store/canvas-store";
import { useProjectStore } from "@/lib/store/project-store";
import { CommandExecutor } from "@/lib/commands/executor";
import { HandleAutocomplete } from "@/components/ui/handle-autocomplete";
import type { Character } from "@/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  projectId: string;
}

export function AIChat({ projectId }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "system",
      content:
        "Welcome! Select a panel and tell me how you'd like to edit it. I can help you regenerate panels, edit speech bubbles, resize elements, and more. Type @ to mention characters.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Canvas store
  const selectedPanelId = useCanvasStore((state) => state.selectedPanelId);
  const getSelectedPanel = useCanvasStore((state) => state.getSelectedPanel);
  const updatePanel = useCanvasStore((state) => state.updatePanel);
  const updateSpeechBubble = useCanvasStore(
    (state) => state.updateSpeechBubble
  );
  const addSpeechBubble = useCanvasStore((state) => state.addSpeechBubble);
  const deleteSpeechBubble = useCanvasStore(
    (state) => state.deleteSpeechBubble
  );
  const getPanelById = useCanvasStore((state) => state.getPanelById);
  const setMaskToolActive = useCanvasStore((state) => state.setMaskToolActive);
  const setMaskMode = useCanvasStore((state) => state.setMaskMode);
  const currentMaskRegion = useCanvasStore((state) => state.currentMaskRegion);

  // Project store
  const currentProject = useProjectStore((state) => state.currentProject);
  const currentPage = useProjectStore((state) => state.currentPage);
  const characters = useProjectStore((state) => state.characters);

  // Fetch characters for autocomplete
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/characters`);
        if (response.ok) {
          const data = await response.json();
          setCharacters(data.characters || []);
        }
      } catch (error) {
        console.error("Failed to fetch characters:", error);
      }
    };

    fetchCharacters();
  }, [projectId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const commandText = input.trim();
    setInput("");
    setIsProcessing(true);

    try {
      // Gather context for the command
      const currentPanel = getSelectedPanel();

      if (!currentProject) {
        throw new Error("No project loaded");
      }

      if (!currentPage) {
        throw new Error("No page loaded");
      }

      // Call the chat command API with context
      const response = await fetch("/api/chat/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: projectId,
          panelId: selectedPanelId,
          command: commandText,
          context: {
            currentPanel: currentPanel,
            characterBank: characters,
            projectStyle: currentProject.style,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process command");
      }

      const commandResult = await response.json();

      // Execute the command using CommandExecutor
      if (selectedPanelId && commandResult.action !== "error") {
        const executor = new CommandExecutor({
          projectId: projectId,
          pageId: currentPage.id,
          panelId: selectedPanelId,
          updatePanel,
          updateSpeechBubble,
          addSpeechBubble,
          deleteSpeechBubble,
          getPanel: getPanelById,
          setMaskToolActive,
          setMaskMode,
          getCurrentMaskRegion: () => currentMaskRegion,
        });

        const result = await executor.execute(
          commandResult.action,
          commandResult.parameters
        );

        // Add assistant response based on execution result
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.success
            ? result.message
            : `${result.message}${result.error ? `: ${result.error}` : ""}`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Just show the message from the API (info or error)
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: commandResult.message || "Command processed.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${
          error instanceof Error ? error.message : "Failed to process command"
        }`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">AI Assistant</h2>
        {selectedPanelId && (
          <p className="text-xs text-muted-foreground mt-1">
            Panel selected - ready for commands
          </p>
        )}
        {!selectedPanelId && (
          <p className="text-xs text-muted-foreground mt-1">
            Select a panel to start editing
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : message.role === "system"
                  ? "bg-muted text-muted-foreground text-sm italic"
                  : "bg-muted"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}{" "}
        <div ref={messagesEndRef} />
      </div>

      {/* Input with @handle autocomplete */}
      <div className="border-t px-4 py-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <HandleAutocomplete
            value={input}
            onChange={setInput}
            characters={characters}
            placeholder={
              selectedPanelId
                ? "Describe how to edit this panel... Type @ to mention characters"
                : "Select a panel first, then describe your edit..."
            }
            className="flex-1"
            textareaClassName="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[60px] max-h-[120px]"
            rows={2}
            onKeyDown={handleKeyDown}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="self-end rounded-md bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line • Type @ to mention
          characters
        </p>
      </div>
    </div>
  );
}
