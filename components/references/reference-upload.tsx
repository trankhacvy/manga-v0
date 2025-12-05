"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import type { ReferenceType } from "@/types";

interface ReferenceUploadProps {
  projectId: string;
  onUploadComplete: () => void;
}

export function ReferenceUpload({
  projectId,
  onUploadComplete,
}: ReferenceUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<ReferenceType>("background");
  const [tags, setTags] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Set default name from filename
    if (!name) {
      setName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!previewUrl || !name) return;

    setIsUploading(true);

    try {
      // In a real implementation, you would upload to storage first
      // For now, we'll use the preview URL as a placeholder
      const response = await fetch("/api/references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name,
          type,
          imageUrl: previewUrl, // In production, this would be the storage URL
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create reference");
      }

      // Reset form
      setPreviewUrl(null);
      setName("");
      setTags("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onUploadComplete();
    } catch (error) {
      console.error("Error uploading reference:", error);
      alert("Failed to upload reference");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    setName("");
    setTags("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-4 border border-border rounded-lg bg-card">
      <h3 className="text-sm font-semibold mb-3">Upload Reference</h3>

      {!previewUrl ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors"
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Click to upload an image
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG up to 10MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-40 object-cover rounded-lg"
            />
            <button
              onClick={handleCancel}
              className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Reference name"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ReferenceType)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
            >
              <option value="background">Background</option>
              <option value="style">Style Reference</option>
              <option value="character-ref">Character Reference</option>
              <option value="moodboard">Moodboard</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="sunset, outdoor, dramatic"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={isUploading || !name}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isUploading ? "Uploading..." : "Upload Reference"}
          </button>
        </div>
      )}
    </div>
  );
}
