"use client";

import { useState, useEffect } from "react";
import { Trash2, Copy } from "lucide-react";
import { ReferenceUpload } from "./reference-upload";
import type { Reference } from "@/types";

interface ReferenceLibraryProps {
  projectId: string;
}

export function ReferenceLibrary({ projectId }: ReferenceLibraryProps) {
  const [references, setReferences] = useState<Reference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchReferences = async () => {
    try {
      const response = await fetch(`/api/references?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setReferences(data.references || []);
      }
    } catch (error) {
      console.error("Error fetching references:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferences();
  }, [projectId]);

  const handleDelete = async (referenceId: string) => {
    if (!confirm("Are you sure you want to delete this reference?")) return;

    try {
      const response = await fetch(`/api/references/${referenceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setReferences(references.filter((r) => r.id !== referenceId));
      }
    } catch (error) {
      console.error("Error deleting reference:", error);
      alert("Failed to delete reference");
    }
  };

  const handleCopyRefSyntax = (reference: Reference) => {
    const refSyntax = `@ref-${reference.name
      .toLowerCase()
      .replace(/\s+/g, "-")}`;
    navigator.clipboard.writeText(refSyntax);
    setCopiedId(reference.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading references...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Reference Library</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Upload images to use with @ref-name syntax in prompts
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <ReferenceUpload
          projectId={projectId}
          onUploadComplete={fetchReferences}
        />

        {references.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No references yet. Upload your first reference image above.
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Your References</h3>
            <div className="grid grid-cols-2 gap-3">
              {references.map((reference) => (
                <div
                  key={reference.id}
                  className="border border-border rounded-lg overflow-hidden bg-card hover:border-primary transition-colors group"
                >
                  <div className="relative aspect-video">
                    <img
                      src={reference.imageUrl}
                      alt={reference.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleCopyRefSyntax(reference)}
                        className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                        title="Copy @ref syntax"
                      >
                        {copiedId === reference.id ? (
                          <span className="text-xs">Copied!</span>
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(reference.id)}
                        className="p-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90"
                        title="Delete reference"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-2">
                    <div className="text-sm font-medium truncate">
                      {reference.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      @ref-{reference.name.toLowerCase().replace(/\s+/g, "-")}
                    </div>
                    {reference.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {reference.tags.slice(0, 3).map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs px-1.5 py-0.5 bg-accent rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
