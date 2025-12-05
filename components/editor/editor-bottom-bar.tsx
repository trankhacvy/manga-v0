"use client";

import React, { useState, useEffect } from "react";
import {
  Wand2,
  Shuffle,
  Plus,
  Loader2,
  MessageSquarePlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HandleAutocomplete } from "@/components/ui/handle-autocomplete";
import { useProjectStore } from "@/lib/store/project-store";
import { useEditorStore } from "@/lib/store/editor-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EditorBottomBarProps {
  projectId: string;
  onAddBubble?: () => void;
}

interface GenerationProgress {
  isGenerating: boolean;
  progress: number; // 0-100
  panelId?: string;
  message?: string;
  estimatedTime?: number; // seconds
  canCancel?: boolean;
}

export function EditorBottomBar({
  projectId,
  onAddBubble,
}: EditorBottomBarProps) {
  const { characters } = useProjectStore();
  const { selectedPanelIds, panels, getSelectedPanels } = useEditorStore();
  const [promptValue, setPromptValue] = useState("");
  const [generationProgress, setGenerationProgress] =
    useState<GenerationProgress>({
      isGenerating: false,
      progress: 0,
    });

  // Pre-fill prompt with selected panel context
  useEffect(() => {
    if (selectedPanelIds.length === 1) {
      const selectedPanel = panels.find((p) => p.id === selectedPanelIds[0]);
      if (selectedPanel && selectedPanel.prompt && !promptValue) {
        setPromptValue(selectedPanel.prompt);
      }
    }
  }, [selectedPanelIds, panels]);

  // Cmd+K shortcut to focus input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Find the textarea with data-prompt-input attribute
        const textarea = document.querySelector(
          'textarea[data-prompt-input="true"]'
        ) as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleRegenerate = async () => {
    if (selectedPanelIds.length === 0) {
      toast.error("Please select a panel to regenerate");
      return;
    }

    const selectedPanel = panels.find((p) => p.id === selectedPanelIds[0]);
    if (!selectedPanel) {
      toast.error("Selected panel not found");
      return;
    }

    // Use prompt from input or panel's existing prompt
    const finalPrompt = promptValue.trim() || selectedPanel.prompt;
    if (!finalPrompt) {
      toast.error("Please enter a prompt");
      return;
    }

    setGenerationProgress({
      isGenerating: true,
      progress: 0,
      message: `Regenerating panel ${selectedPanel.panelIndex + 1}...`,
      panelId: selectedPanel.id,
      estimatedTime: 8,
      canCancel: true,
    });

    try {
      const response = await fetch("/api/panels/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          panelId: selectedPanel.id,
          prompt: finalPrompt,
          characterHandles: selectedPanel.characterHandles || [],
          styleLocks: selectedPanel.styleLocks || [],
          mode: "generate",
          width: selectedPanel.width,
          height: selectedPanel.height,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to regenerate panel");
      }

      const data = await response.json();

      // Simulate progress updates
      const interval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev.progress >= 100) {
            clearInterval(interval);
            toast.success("Panel regenerated successfully");
            return {
              isGenerating: false,
              progress: 100,
            };
          }
          return {
            ...prev,
            progress: Math.min(prev.progress + 12.5, 100),
          };
        });
      }, 1000);
    } catch (error) {
      console.error("Regenerate error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to regenerate panel"
      );
      setGenerationProgress({
        isGenerating: false,
        progress: 0,
      });
    }
  };

  const handleVary = async () => {
    if (selectedPanelIds.length === 0) {
      toast.error("Please select a panel to vary");
      return;
    }

    const selectedPanel = panels.find((p) => p.id === selectedPanelIds[0]);
    if (!selectedPanel) {
      toast.error("Selected panel not found");
      return;
    }

    // Use prompt from input or panel's existing prompt
    const finalPrompt = promptValue.trim() || selectedPanel.prompt;
    if (!finalPrompt) {
      toast.error("Please enter a prompt");
      return;
    }

    setGenerationProgress({
      isGenerating: true,
      progress: 0,
      message: `Creating variation of panel ${selectedPanel.panelIndex + 1}...`,
      panelId: selectedPanel.id,
      estimatedTime: 8,
      canCancel: true,
    });

    try {
      const response = await fetch("/api/panels/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          panelId: selectedPanel.id,
          prompt: finalPrompt,
          characterHandles: selectedPanel.characterHandles || [],
          styleLocks: selectedPanel.styleLocks || [],
          mode: "vary",
          varyStrength: "strong",
          width: selectedPanel.width,
          height: selectedPanel.height,
          seed: Math.floor(Math.random() * 1000000), // New seed for variation
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create variation");
      }

      const data = await response.json();

      // Simulate progress updates
      const interval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev.progress >= 100) {
            clearInterval(interval);
            toast.success("Variation created successfully");
            return {
              isGenerating: false,
              progress: 100,
            };
          }
          return {
            ...prev,
            progress: Math.min(prev.progress + 12.5, 100),
          };
        });
      }, 1000);
    } catch (error) {
      console.error("Vary error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create variation"
      );
      setGenerationProgress({
        isGenerating: false,
        progress: 0,
      });
    }
  };

  const handleGenerate = async () => {
    const finalPrompt = promptValue.trim();
    if (!finalPrompt) {
      toast.error("Please enter a prompt");
      return;
    }

    // TODO: Implement new panel creation
    // This requires determining the page and position for the new panel
    toast.info("Generate new panel feature coming soon");

    setGenerationProgress({
      isGenerating: true,
      progress: 0,
      message: "Generating new panel...",
      estimatedTime: 8,
      canCancel: true,
    });

    // Simulate progress
    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev.progress >= 100) {
          clearInterval(interval);
          return {
            isGenerating: false,
            progress: 100,
          };
        }
        return {
          ...prev,
          progress: Math.min(prev.progress + 12.5, 100),
        };
      });
    }, 1000);
  };

  const handleCancelGeneration = () => {
    // TODO: Implement actual cancellation logic
    setGenerationProgress({
      isGenerating: false,
      progress: 0,
    });
    toast.info("Generation cancelled");
  };

  const handlePromptKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleAddBubble = () => {
    if (onAddBubble) {
      onAddBubble();
    }
  };

  // Get selected panel info for context display
  const selectedPanels = getSelectedPanels();
  const contextInfo =
    selectedPanels.length > 0
      ? `${selectedPanels.length} panel${
          selectedPanels.length > 1 ? "s" : ""
        } selected`
      : null;

  return (
    <div className="flex h-full w-full flex-col gap-2">
      {/* Generation Progress Bar */}
      {generationProgress.isGenerating && (
        <div className="w-full px-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Loader2 className="size-3 animate-spin" />
            <span>{generationProgress.message || "Generating..."}</span>
            {generationProgress.estimatedTime &&
              generationProgress.progress < 100 && (
                <span className="text-xs">
                  (~
                  {Math.ceil(
                    (generationProgress.estimatedTime *
                      (100 - generationProgress.progress)) /
                      100
                  )}
                  s)
                </span>
              )}
            <span className="ml-auto">
              {Math.round(generationProgress.progress)}%
            </span>
            {generationProgress.canCancel && (
              <button
                onClick={handleCancelGeneration}
                className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Cancel generation"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
          <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1337ec] transition-all duration-300 ease-out"
              style={{ width: `${generationProgress.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Bottom Bar Content */}
      <div className="flex items-end gap-3 px-4">
        {/* Global Prompt Input with @handle autocomplete */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            {/* Context pills */}
            {contextInfo && (
              <div className="absolute -top-6 left-0 flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                  <svg
                    className="size-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {contextInfo}
                </span>
              </div>
            )}
            <HandleAutocomplete
              value={promptValue}
              onChange={setPromptValue}
              characters={characters}
              placeholder="Describe what you want to generate... (Cmd+K to focus, @ to mention characters)"
              className="w-full"
              textareaClassName={cn(
                "w-full min-h-[56px] max-h-[120px] resize-none",
                "rounded-lg border border-gray-300 dark:border-gray-700",
                "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                "px-4 py-3 text-sm",
                "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-[#1337ec]/50 focus:border-[#1337ec]",
                "transition-colors"
              )}
              rows={1}
              onKeyDown={handlePromptKeyDown}
            />
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 pb-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddBubble}
            disabled={selectedPanelIds.length !== 1}
            className="gap-2"
            title="Add speech bubble to selected panel"
          >
            <MessageSquarePlus className="size-4" />
            Add Bubble
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={
              generationProgress.isGenerating ||
              selectedPanelIds.length === 0 ||
              (!promptValue.trim() && !selectedPanels[0]?.prompt)
            }
            className="gap-2"
            title="Regenerate selected panel with current prompt"
          >
            <Wand2 className="size-4" />
            Regenerate
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleVary}
            disabled={
              generationProgress.isGenerating ||
              selectedPanelIds.length === 0 ||
              (!promptValue.trim() && !selectedPanels[0]?.prompt)
            }
            className="gap-2"
            title="Create a variation of selected panel"
          >
            <Shuffle className="size-4" />
            Vary
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleGenerate}
            disabled={generationProgress.isGenerating || !promptValue.trim()}
            className="gap-2"
            title="Generate new panel with current prompt (Enter)"
          >
            <Plus className="size-4" />
            Generate
          </Button>
        </div>
      </div>
    </div>
  );
}
