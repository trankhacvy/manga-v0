"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Check, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useEditorStore } from "@/lib/store/editor-store";
import { useAutoSave } from "@/lib/hooks/use-auto-save";
import { cn } from "@/lib/utils";

interface EditorTopBarProps {
  projectId: string;
}

type ModelType = "flux-manga-1.1" | "pony-xl" | "sd3.5";

const MODEL_OPTIONS: { value: ModelType; label: string }[] = [
  { value: "flux-manga-1.1", label: "Flux Manga 1.1" },
  { value: "pony-xl", label: "Pony XL" },
  { value: "sd3.5", label: "SD 3.5" },
];

export function EditorTopBar({ projectId }: EditorTopBarProps) {
  const router = useRouter();
  const project = useEditorStore((state) => state.project);
  const updateProject = useEditorStore((state) => state.setProject);

  // Auto-save hook for editor changes
  const { isSaving, lastSaved, saveError } = useAutoSave({
    enabled: true,
    debounceMs: 2000,
  });

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [selectedModel, setSelectedModel] =
    useState<ModelType>("flux-manga-1.1");
  const [isExporting, setIsExporting] = useState(false);

  // Initialize title from project
  useEffect(() => {
    if (project?.title) {
      setTitleValue(project.title);
    }
  }, [project?.title]);

  const handleTitleClick = () => {
    setIsEditingTitle(true);
  };

  const handleTitleBlur = async () => {
    setIsEditingTitle(false);
    if (titleValue.trim() && titleValue !== project?.title) {
      try {
        // Update project title in store
        if (project) {
          updateProject({ ...project, title: titleValue.trim() });
        }

        // Persist to database
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: titleValue.trim() }),
        });

        if (!response.ok) {
          throw new Error("Failed to update title");
        }
      } catch (error) {
        console.error("Failed to save title:", error);
        // Revert to original title on error
        if (project?.title) {
          setTitleValue(project.title);
        }
      }
    } else if (!titleValue.trim() && project?.title) {
      // Revert to original if empty
      setTitleValue(project.title);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      if (project?.title) {
        setTitleValue(project.title);
      }
      setIsEditingTitle(false);
    }
  };

  const handleBackToPreview = () => {
    router.push(`/quick-start/preview/${projectId}`);
  };

  const handleExport = async (format: "pdf" | "png") => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project?.title || "manga"}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
      // TODO: Show error toast
    } finally {
      setIsExporting(false);
    }
  };

  const handleModelChange = (model: ModelType) => {
    setSelectedModel(model);
    // TODO: Persist model selection to project settings or user preferences
    console.log("Model changed to:", model);
  };

  const getSaveStatusDisplay = () => {
    if (saveError) {
      return (
        <div
          className="flex items-center gap-1.5 text-sm text-destructive"
          title={saveError}
        >
          <AlertCircle className="size-3.5" />
          <span>Error saving</span>
        </div>
      );
    }

    if (isSaving) {
      return (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          <span>Saving...</span>
        </div>
      );
    }

    if (lastSaved) {
      return (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Check className="size-3.5" />
          <span>Saved</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex h-full w-full items-center justify-between gap-4">
      {/* Left section: Back button and title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleBackToPreview}
          className="shrink-0"
          title="Back to Preview"
        >
          <ArrowLeft className="size-5" />
        </Button>

        {isEditingTitle ? (
          <Input
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="h-9 max-w-md text-base font-semibold"
            placeholder="Untitled Project"
          />
        ) : (
          <button
            onClick={handleTitleClick}
            className={cn(
              "text-base font-semibold truncate hover:text-foreground/80 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 rounded px-2 py-1"
            )}
            title="Click to edit title"
          >
            {project?.title || "Untitled Project"}
          </button>
        )}

        {/* Save indicator */}
        <div className="shrink-0">{getSaveStatusDisplay()}</div>
      </div>

      {/* Right section: Model selector and Export */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Model Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="min-w-[140px]">
              {MODEL_OPTIONS.find((m) => m.value === selectedModel)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuLabel>AI Model</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {MODEL_OPTIONS.map((model) => (
              <DropdownMenuItem
                key={model.value}
                onClick={() => handleModelChange(model.value)}
                className={cn(selectedModel === model.value && "bg-accent")}
              >
                {model.label}
                {selectedModel === model.value && (
                  <Check className="ml-auto size-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleExport("pdf")}
              disabled={isExporting}
            >
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleExport("png")}
              disabled={isExporting}
            >
              Export as PNG
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
