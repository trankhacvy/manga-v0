"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useProjectStore } from "@/lib/store/project-store";
import { Sparkles, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface StoryTabProps {
  projectId: string;
}

export function StoryTab({ projectId }: StoryTabProps) {
  const [script, setScript] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [showInlineMenu, setShowInlineMenu] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [inlineEditResult, setInlineEditResult] = useState<{
    editedText: string;
    alternatives: string[];
  } | null>(null);
  const [expandResult, setExpandResult] = useState<{
    panelSuggestions: Array<{
      panelNumber: number;
      prompt: string;
      shotType: string;
      characters: string[];
      mood: string;
      description: string;
    }>;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentProject = useProjectStore((state) => state.currentProject);

  // Load script from project
  useEffect(() => {
    const loadScript = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .select("script")
        .eq("id", projectId)
        .single();

      if (data && !error) {
        setScript(data.script || "");
      }
    };

    loadScript();
  }, [projectId]);

  // Auto-save functionality
  const saveScript = useCallback(
    async (scriptContent: string) => {
      setIsSaving(true);
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("projects")
          .update({
            script: scriptContent,
            updated_at: new Date().toISOString(),
          })
          .eq("id", projectId);

        if (!error) {
          setLastSaved(new Date());
        }
      } catch (error) {
        console.error("Failed to save script:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [projectId]
  );

  // Debounced auto-save
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (script) {
        saveScript(script);
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [script, saveScript]);

  // Handle text selection for inline AI editing
  const handleTextSelect = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) {
      const selected = script.substring(start, end);
      setSelectedText(selected);
      setSelectionRange({ start, end });
    } else {
      setSelectedText("");
      setSelectionRange(null);
      setShowInlineMenu(false);
    }
  };

  // Handle Cmd+K for inline editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        if (selectedText) {
          e.preventDefault();
          setShowInlineMenu(true);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedText]);

  // Apply syntax highlighting by wrapping speaker names
  const renderHighlightedScript = () => {
    // Split script into lines and highlight speaker names
    const lines = script.split("\n");
    return lines.map((line, index) => {
      // Match speaker names (e.g., "AKIRA:", "LUNA (angry):")
      const speakerMatch = line.match(/^([A-Z][A-Z\s]+)(\s*\([^)]+\))?:/);

      if (speakerMatch) {
        const speaker = speakerMatch[1];
        const modifier = speakerMatch[2] || "";
        const dialogue = line.substring(speakerMatch[0].length);

        return (
          <div key={index} className="leading-relaxed">
            <span className="font-bold text-primary">{speaker}</span>
            {modifier && (
              <span className="text-muted-foreground">{modifier}</span>
            )}
            <span>:</span>
            <span className="text-foreground">{dialogue}</span>
          </div>
        );
      }

      // Scene headings (e.g., "INT. SCHOOL - DAY")
      if (line.match(/^(INT\.|EXT\.)/)) {
        return (
          <div
            key={index}
            className="leading-relaxed font-semibold text-accent-foreground"
          >
            {line}
          </div>
        );
      }

      // Action lines or empty lines
      return (
        <div key={index} className="leading-relaxed text-foreground">
          {line || "\u00A0"}
        </div>
      );
    });
  };

  const handleInlineEdit = async (command: string) => {
    if (!selectedText || !selectionRange) return;

    setIsEditingInline(true);
    setShowInlineMenu(false);

    try {
      const response = await fetch("/api/script/inline-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          selectedText,
          command,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInlineEditResult(data);
      }
    } catch (error) {
      console.error("Failed to perform inline edit:", error);
    } finally {
      setIsEditingInline(false);
    }
  };

  const applyInlineEdit = (editedText: string) => {
    if (!selectionRange) return;

    const newScript =
      script.substring(0, selectionRange.start) +
      editedText +
      script.substring(selectionRange.end);

    setScript(newScript);
    setInlineEditResult(null);
    setSelectionRange(null);
    setSelectedText("");
  };

  const handleExpandToStoryboard = async () => {
    if (!selectedText) return;

    setIsExpanding(true);
    try {
      const response = await fetch("/api/script/expand-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          sceneText: selectedText,
          targetPanelCount: 4,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setExpandResult(data);
      }
    } catch (error) {
      console.error("Failed to expand scene:", error);
    } finally {
      setIsExpanding(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="text-lg font-semibold">Story</h2>
          <p className="text-sm text-muted-foreground">
            Write your screenplay with AI assistance
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedText && (
            <button
              onClick={handleExpandToStoryboard}
              disabled={isExpanding}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isExpanding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Expand to Panels</span>
            </button>
          )}
          <div className="text-xs text-muted-foreground">
            {isSaving ? (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            ) : lastSaved ? (
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Syntax-highlighted overlay */}
        <div className="absolute inset-0 px-6 py-4 overflow-auto pointer-events-none font-mono text-sm whitespace-pre-wrap">
          {renderHighlightedScript()}
        </div>

        {/* Actual textarea (transparent text) */}
        <textarea
          ref={textareaRef}
          value={script}
          onChange={(e) => setScript(e.target.value)}
          onSelect={handleTextSelect}
          placeholder="Start writing your screenplay...

Example format:

INT. SCHOOL HALLWAY - DAY

AKIRA walks down the hallway, looking determined.

AKIRA:
I won't give up. Not now.

LUNA (appearing behind):
You don't have to do this alone."
          className="absolute inset-0 w-full h-full px-6 py-4 bg-transparent resize-none outline-none font-mono text-sm text-transparent caret-foreground selection:bg-primary/20"
          spellCheck={false}
        />
      </div>

      {/* Inline AI Menu */}
      {showInlineMenu && selectedText && !isEditingInline && (
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 bg-card border border-border rounded-lg shadow-lg p-2 z-10 min-w-[300px]">
          <div className="text-xs text-muted-foreground mb-2 px-2">
            AI Suggestions for selected text:
          </div>
          <button
            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors"
            onClick={() => handleInlineEdit("Make this dialogue more tsundere")}
          >
            Make this dialogue more tsundere
          </button>
          <button
            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors"
            onClick={() => handleInlineEdit("Add internal monologue")}
          >
            Add internal monologue
          </button>
          <button
            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors"
            onClick={() => handleInlineEdit("Convert to visual description")}
          >
            Convert to visual description
          </button>
          <button
            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent transition-colors"
            onClick={() => setShowInlineMenu(false)}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Inline Edit Loading */}
      {isEditingInline && (
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 bg-card border border-border rounded-lg shadow-lg p-4 z-10">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">AI is editing your text...</span>
          </div>
        </div>
      )}

      {/* Inline Edit Results */}
      {inlineEditResult && !isEditingInline && (
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 bg-card border border-border rounded-lg shadow-lg p-4 z-10 min-w-[400px] max-w-[600px]">
          <div className="text-xs text-muted-foreground mb-3">
            AI Suggestions:
          </div>

          {/* Main suggestion */}
          <div className="mb-3">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Primary suggestion:
            </div>
            <div className="p-3 bg-accent/50 rounded text-sm mb-2">
              {inlineEditResult.editedText}
            </div>
            <button
              onClick={() => applyInlineEdit(inlineEditResult.editedText)}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Apply This
            </button>
          </div>

          {/* Alternatives */}
          {inlineEditResult.alternatives.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Alternatives:
              </div>
              {inlineEditResult.alternatives.map((alt, index) => (
                <div key={index} className="mb-2">
                  <div className="p-2 bg-muted rounded text-sm mb-1">{alt}</div>
                  <button
                    onClick={() => applyInlineEdit(alt)}
                    className="text-xs text-primary hover:underline"
                  >
                    Apply Alternative {index + 1}
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setInlineEditResult(null)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Expand Results Modal */}
      {expandResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold">Panel Suggestions</h3>
              <button
                onClick={() => setExpandResult(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="grid gap-4">
                {expandResult.panelSuggestions.map((panel) => (
                  <div
                    key={panel.panelNumber}
                    className="p-4 bg-muted/30 rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">
                          Panel {panel.panelNumber}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-accent rounded">
                          {panel.shotType}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-accent rounded">
                          {panel.mood}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {panel.description}
                    </p>

                    <div className="text-sm mb-2">
                      <span className="font-medium">Prompt: </span>
                      <span className="text-foreground">{panel.prompt}</span>
                    </div>

                    {panel.characters.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Characters: {panel.characters.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setExpandResult(null)}
                className="px-4 py-2 text-sm border border-border rounded hover:bg-accent transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // TODO: Create panels from suggestions (Storyboard tab deferred)
                  console.log("Create panels:", expandResult.panelSuggestions);
                  setExpandResult(null);
                }}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                Create Panels
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="px-6 py-3 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Tips:</span> Use ALL CAPS for speaker
          names. Select text and press{" "}
          <kbd className="px-1 py-0.5 bg-background border border-border rounded text-xs">
            Cmd+K
          </kbd>{" "}
          for AI suggestions. Select a scene and click "Expand to Panels" to
          generate storyboard.
        </p>
      </div>
    </div>
  );
}
