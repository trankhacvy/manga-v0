"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useEditorStore } from "@/lib/store/editor-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface PanelInspectorProps {
  className?: string;
}

export function PanelInspector({ className = "" }: PanelInspectorProps) {
  const selectedPanelIds = useEditorStore((state) => state.selectedPanelIds);
  const panels = useEditorStore((state) => state.panels);
  const characters = useEditorStore((state) => state.characters);
  const updatePanel = useEditorStore((state) => state.updatePanel);

  const [isOpen, setIsOpen] = useState(true);
  const [localPrompt, setLocalPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Get the selected panel (only show inspector for single selection)
  const selectedPanel =
    selectedPanelIds.length === 1
      ? panels.find((p) => p.id === selectedPanelIds[0])
      : null;

  // Update local prompt when selection changes
  useEffect(() => {
    if (selectedPanel) {
      setLocalPrompt(selectedPanel.prompt || "");
    }
  }, [selectedPanel?.id]);

  // Don't render if no panel is selected or multiple panels selected
  if (!selectedPanel) {
    return null;
  }

  const handlePromptChange = (value: string) => {
    setLocalPrompt(value);
  };

  const handlePromptBlur = async () => {
    if (localPrompt !== selectedPanel.prompt) {
      setIsSaving(true);
      try {
        await updatePanel(selectedPanel.id, { prompt: localPrompt });
      } catch (error) {
        console.error("Failed to save prompt:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAddCharacter = async (characterHandle: string) => {
    const currentHandles = selectedPanel.characterHandles || [];
    if (!currentHandles.includes(characterHandle)) {
      await updatePanel(selectedPanel.id, {
        characterHandles: [...currentHandles, characterHandle],
      });
    }
  };

  const handleRemoveCharacter = async (characterHandle: string) => {
    const currentHandles = selectedPanel.characterHandles || [];
    await updatePanel(selectedPanel.id, {
      characterHandles: currentHandles.filter((h) => h !== characterHandle),
    });
  };

  const handleAddStyleLock = async (styleLock: string) => {
    if (!styleLock.trim()) return;
    const currentLocks = selectedPanel.styleLocks || [];
    if (!currentLocks.includes(styleLock)) {
      await updatePanel(selectedPanel.id, {
        styleLocks: [...currentLocks, styleLock],
      });
    }
  };

  const handleRemoveStyleLock = async (styleLock: string) => {
    const currentLocks = selectedPanel.styleLocks || [];
    await updatePanel(selectedPanel.id, {
      styleLocks: currentLocks.filter((l) => l !== styleLock),
    });
  };

  // Get available characters not already in panel
  const availableCharacters = characters.filter(
    (c) => !(selectedPanel.characterHandles || []).includes(c.handle)
  );

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={`flex flex-col border-b border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Header with Collapse Toggle */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Panel Inspector
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Panel {selectedPanel.panelIndex + 1}
          </p>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            {isOpen ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
            <span className="sr-only">Toggle panel inspector</span>
          </Button>
        </CollapsibleTrigger>
      </div>

      {/* Inspector Content */}
      <CollapsibleContent>
        <div className="p-4 space-y-4">
          {/* Panel Prompt */}
          <div className="space-y-2">
            <Label htmlFor="panel-prompt" className="text-xs font-medium">
              Prompt
            </Label>
            <Textarea
              id="panel-prompt"
              value={localPrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              onBlur={handlePromptBlur}
              placeholder="Describe what should appear in this panel..."
              className="min-h-[100px] text-sm resize-none"
              disabled={isSaving}
            />
            {isSaving && (
              <p className="text-xs text-muted-foreground">Saving...</p>
            )}
          </div>

          {/* Character Handles */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Characters</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(selectedPanel.characterHandles || []).map((handle) => {
                const character = characters.find((c) => c.handle === handle);
                return (
                  <Badge
                    key={handle}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    <span className="text-xs">{handle}</span>
                    <button
                      onClick={() => handleRemoveCharacter(handle)}
                      className="ml-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                );
              })}
              {(selectedPanel.characterHandles || []).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No characters added
                </p>
              )}
            </div>
            {availableCharacters.length > 0 && (
              <Select onValueChange={handleAddCharacter}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Add character..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCharacters.map((character) => (
                    <SelectItem key={character.id} value={character.handle}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">
                          {character.handle}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {character.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Style Locks */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Style Locks</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(selectedPanel.styleLocks || []).map((lock) => (
                <Badge
                  key={lock}
                  variant="outline"
                  className="flex items-center gap-1 pr-1"
                >
                  <span className="text-xs">{lock}</span>
                  <button
                    onClick={() => handleRemoveStyleLock(lock)}
                    className="ml-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              {(selectedPanel.styleLocks || []).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No style locks added
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add style lock..."
                className="flex-1 text-sm px-3 py-1.5 border rounded-md bg-background"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddStyleLock(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Press Enter to add (e.g., "dramatic-lighting", "rain")
            </p>
          </div>

          {/* Panel Information */}
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs font-medium">Information</Label>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Dimensions:</span>
                <span className="font-mono">
                  {Math.round(selectedPanel.width)} ×{" "}
                  {Math.round(selectedPanel.height)}px
                </span>
              </div>
              <div className="flex justify-between">
                <span>Position:</span>
                <span className="font-mono">
                  ({Math.round(selectedPanel.x)}, {Math.round(selectedPanel.y)})
                </span>
              </div>
              {selectedPanel.createdAt && (
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{formatTimestamp(selectedPanel.createdAt)}</span>
                </div>
              )}
              {selectedPanel.updatedAt && (
                <div className="flex justify-between">
                  <span>Updated:</span>
                  <span>{formatTimestamp(selectedPanel.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
