"use client";

import { useEffect, useState } from "react";
import { Clock, RotateCcw } from "lucide-react";
import type { GenerationHistory } from "@/types";
import { createClient } from "@/utils/supabase/client";

interface VersionHistoryProps {
  panelId: string;
  onRestore?: (version: GenerationHistory) => void;
}

export function VersionHistory({ panelId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<GenerationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!panelId) {
      setVersions([]);
      setLoading(false);
      return;
    }

    loadVersionHistory();
  }, [panelId]);

  const loadVersionHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("generation_history")
        .select("*")
        .eq("panel_id", panelId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const formattedVersions: GenerationHistory[] = (data || []).map(
        (item) => ({
          id: item.id,
          panelId: item.panel_id,
          imageUrl: item.image_url,
          prompt: item.prompt,
          characterHandles: item.character_handles || [],
          styleLocks: item.style_locks || [],
          parameters: item.parameters || {},
          createdAt: new Date(item.created_at),
        })
      );

      setVersions(formattedVersions);
    } catch (err) {
      console.error("Failed to load version history:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load version history"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const handleRestore = async (version: GenerationHistory) => {
    try {
      const supabase = createClient();

      // Call the restore API endpoint
      const response = await fetch(`/api/panels/${panelId}/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          versionId: version.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to restore version");
      }

      const result = await response.json();

      // Call the parent callback with the restored version
      if (onRestore) {
        onRestore({
          ...version,
          imageUrl: result.imageUrl,
          prompt: result.prompt,
          characterHandles: result.characterHandles,
          styleLocks: result.styleLocks,
        });
      }

      // Reload the history to show the new restoration entry
      await loadVersionHistory();
    } catch (err) {
      console.error("Failed to restore version:", err);
      alert(err instanceof Error ? err.message : "Failed to restore version");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive p-4 bg-destructive/10 rounded">
        {error}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No generation history yet</p>
        <p className="text-xs mt-1">
          Generate this panel to start tracking versions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {versions.length} {versions.length === 1 ? "version" : "versions"}
        </div>
        <button
          onClick={loadVersionHistory}
          className="text-xs text-primary hover:underline"
          title="Refresh history"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        {versions.map((version, index) => (
          <div
            key={version.id}
            className="group relative border border-border rounded-lg overflow-hidden hover:border-primary transition-colors"
          >
            {/* Thumbnail */}
            <div className="relative aspect-3/4 bg-muted">
              <img
                src={version.imageUrl}
                alt={`Version ${versions.length - index}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handleRestore(version)}
                  className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  title="Restore this version"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-sm font-medium">Restore</span>
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="p-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">
                  Version {versions.length - index}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(version.createdAt)}
                </span>
              </div>

              {version.prompt && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {version.prompt}
                </p>
              )}

              {/* Character handles */}
              {version.characterHandles &&
                version.characterHandles.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {version.characterHandles.map((handle, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded"
                      >
                        {handle}
                      </span>
                    ))}
                  </div>
                )}

              {/* Style locks */}
              {version.styleLocks && version.styleLocks.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {version.styleLocks.map((lock, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-1.5 py-0.5 bg-accent text-accent-foreground rounded"
                    >
                      {lock}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
