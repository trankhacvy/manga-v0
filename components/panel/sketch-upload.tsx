"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SketchUploadProps {
  panelId: string;
  currentSketchUrl?: string;
  controlNetStrength?: number;
  onSketchUpload: (sketchUrl: string) => void;
  onSketchRemove: () => void;
  onStrengthChange?: (strength: number) => void;
  className?: string;
}

export function SketchUpload({
  panelId,
  currentSketchUrl,
  controlNetStrength = 0.8,
  onSketchUpload,
  onSketchRemove,
  onStrengthChange,
  className,
}: SketchUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    currentSketchUrl
  );
  const [dragActive, setDragActive] = useState(false);
  const [strength, setStrength] = useState(controlNetStrength);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processFile(file);
  };

  const processFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64 for preview and API
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPreviewUrl(dataUrl);
        onSketchUpload(dataUrl);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to process sketch:", error);
      alert("Failed to upload sketch. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(undefined);
    onSketchRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleStrengthChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newStrength = parseFloat(e.target.value);
    setStrength(newStrength);
    onStrengthChange?.(newStrength);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Sketch Reference
        </label>
        {previewUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Remove
          </Button>
        )}
      </div>

      {previewUrl ? (
        <div className="relative rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50">
          <img
            src={previewUrl}
            alt="Sketch preview"
            className="w-full h-auto max-h-64 object-contain"
          />
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            <ImageIcon className="h-3 w-3 inline mr-1" />
            Sketch loaded
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "relative rounded-lg border-2 border-dashed transition-colors cursor-pointer",
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <Upload
              className={cn(
                "h-10 w-10 mb-3",
                dragActive ? "text-blue-500" : "text-gray-400"
              )}
            />
            <p className="text-sm font-medium text-gray-700 mb-1">
              {isUploading ? "Uploading..." : "Upload sketch"}
            </p>
            <p className="text-xs text-gray-500 text-center">
              Drag and drop or click to browse
              <br />
              PNG, JPG up to 10MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      )}

      {/* Strength control slider (only shown when sketch is loaded) */}
      {previewUrl && onStrengthChange && (
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700">
              Sketch Adherence
            </label>
            <span className="text-xs text-gray-500 font-mono">
              {(strength * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={strength}
            onChange={handleStrengthChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>More creative</span>
            <span>Follow sketch</span>
          </div>
          <p className="text-xs text-gray-500">
            Higher values follow the sketch more closely, lower values allow
            more creative freedom
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Upload a rough sketch to guide the composition of the generated panel
      </p>
    </div>
  );
}
