"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageCompositor } from "@/components/preview/PageCompositor";

interface Character {
  id: string;
  name: string;
  handle: string;
  description?: string;
  referenceImages?: any;
  turnaround?: any;
  expressions?: any[];
  promptTriggers?: string[];
}

interface Bubble {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  type: string;
}

interface Panel {
  id: string;
  panelIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  relativeX?: number;
  relativeY?: number;
  relativeWidth?: number;
  relativeHeight?: number;
  zIndex?: number;
  panelType?: string;
  borderStyle?: string;
  borderWidth?: number;
  panelMargins?: any;
  imageUrl?: string;
  thumbnailUrl?: string;
  prompt?: string;
  characterHandles: string[];
  characterIds: string[];
  styleLocks: string[];
  bubbles: Bubble[];
  bubblePositions?: any;
  sketchUrl?: string;
  controlnetStrength?: number;
  generationParams?: any;
}

interface PageData {
  id: string;
  pageNumber: number;
  width: number;
  height: number;
  layoutSuggestion?: string;
  thumbnailUrl?: string;
  panels: Panel[];
}

interface PreviewData {
  project: {
    id: string;
    title: string;
    totalPages: number;
    previewOnly?: boolean;
    generationStage?: string;
    genre?: string;
    style?: string;
    synopsis?: string;
    storyAnalysis?: any;
  };
  characters: Character[];
  pages: PageData[];
  previewPages: PageData[]; // Legacy field
}

export default function PreviewPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [data, setData] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch project and preview pages
  useEffect(() => {
    if (!projectId) return;

    const fetchPreviewData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/quick-start/preview/${projectId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch preview data");
        }

        const previewData: PreviewData = await response.json();
        setData(previewData);
      } catch (err) {
        console.error("Preview fetch error:", err);
        setError(err instanceof Error ? err.message : "Failed to load preview");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreviewData();
  }, [projectId]);

  // Handle generate all pages
  const handleGenerateAll = async () => {
    if (!data) return;

    setIsGeneratingAll(true);
    setError(null);

    try {
      const response = await fetch("/api/quick-start/generate-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate all pages");
      }

      // Redirect to editor after successful generation
      router.push(`/editor/${projectId}`);
    } catch (err) {
      console.error("Generate all error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate all pages"
      );
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // Handle return to editor
  const handleReturnToEditor = () => {
    router.push(`/editor/${projectId}`);
  };

  // Calculate credit cost and estimated time
  const remainingPages = data ? data.project.totalPages - 4 : 0;
  const creditCost = Math.ceil(remainingPages / 2); // Estimate: 1 credit per 2 pages
  const estimatedMinutes = Math.ceil(remainingPages * 0.5); // Estimate: 30 seconds per page

  if (isLoading) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="text-destructive text-4xl">⚠️</div>
          <h2 className="text-2xl font-bold">Error Loading Preview</h2>
          <p className="text-muted-foreground">
            {error || "Failed to load preview data"}
          </p>
          <Button onClick={() => router.push("/quick-start")} variant="outline">
            Return to Quick Start
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background">
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        {/* <header className="flex items-center justify-between whitespace-nowrap border-b border-border px-4 sm:px-6 md:px-10 py-3">
          <div className="flex items-center gap-4">
            <div className="size-5 text-primary">
              <svg
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v4h-2v-4zm0 6h2v2h-2v-2z"></path>
              </svg>
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">
              Project: {data.project.title}
            </h2>
          </div>
          <div className="flex flex-1 justify-end items-center gap-4 sm:gap-6 md:gap-8">
            <div className="hidden sm:flex items-center gap-6 md:gap-9">
              <button
                onClick={handleReturnToEditor}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium leading-normal"
              >
                Back to Editor
              </button>
              <a
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium leading-normal"
                href="#"
              >
                Settings
              </a>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <svg
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </Button>
              <Button variant="ghost" size="icon">
                <svg
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </Button>
            </div>
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 bg-muted" />
          </div>
        </header> */}

        {/* Main Content */}
        <main className="flex flex-col gap-8 md:gap-10 py-8 md:py-12 px-4 sm:px-8 md:px-20 lg:px-40">
          {/* Page Heading */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">
                Final Preview
              </p>
              <p className="text-muted-foreground text-base font-normal leading-normal">
                Here's a preview of your manga. If everything looks good,
                proceed to generate the full volume.
              </p>
            </div>
          </div>

          {/* Characters Section */}
          {/* {data.characters && data.characters.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Characters</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {data.characters.map((character) => {
                  const refImages = character.referenceImages as any;
                  const imageUrl = refImages?.front || undefined;
                  return (
                    <div
                      key={character.id}
                      className="flex flex-col gap-2 group"
                    >
                      <div
                        className="w-full aspect-square bg-center bg-no-repeat bg-cover rounded-lg border border-border group-hover:border-primary transition-colors overflow-hidden"
                        style={
                          imageUrl
                            ? { backgroundImage: `url(${imageUrl})` }
                            : undefined
                        }
                      >
                        {!imageUrl && (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <div className="text-4xl">👤</div>
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{character.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {character.handle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )} */}

          {/* Rendered Pages Gallery */}
          <div className="mb-8">
            {/* <h2 className="text-2xl font-bold mb-4">Preview Pages</h2>
            <p className="text-muted-foreground mb-6">
              Complete manga pages with all panels and speech bubbles rendered
            </p> */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {data.pages.map((page) => (
                <div key={page.id} className="flex flex-col gap-3">
                  <PageCompositor page={page} showPageNumber={true} />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Page {page.pageNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {page.panels.length} panels
                      {page.layoutSuggestion && ` • ${page.layoutSuggestion}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Page Details Section */}
          <div className="mb-8 hidden">
            <h2 className="text-2xl font-bold mb-4">Page Details</h2>
            <div className="space-y-8">
              {data.pages.map((page) => (
                <div
                  key={page.id}
                  className="bg-card rounded-xl p-6 border border-border"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">
                      Page {page.pageNumber}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{page.panels.length} panels</span>
                      {page.layoutSuggestion && (
                        <span className="px-2 py-1 bg-secondary rounded">
                          {page.layoutSuggestion}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Panels Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {page.panels.map((panel) => (
                      <div key={panel.id} className="flex flex-col gap-2 group">
                        <div
                          className="w-full aspect-4/3 bg-center bg-no-repeat bg-cover rounded-lg border border-border group-hover:border-primary transition-colors overflow-hidden relative"
                          style={
                            panel.imageUrl
                              ? { backgroundImage: `url(${panel.imageUrl})` }
                              : undefined
                          }
                        >
                          {!panel.imageUrl && (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <div className="text-xs text-muted-foreground">
                                Panel {panel.panelIndex + 1}
                              </div>
                            </div>
                          )}

                          {/* Bubble overlay indicators */}
                          {panel.bubbles && panel.bubbles.length > 0 && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                              💬 {panel.bubbles.length}
                            </div>
                          )}
                        </div>

                        <div className="text-xs space-y-1">
                          <p className="font-medium">
                            Panel {panel.panelIndex + 1}
                          </p>
                          {panel.characterHandles &&
                            panel.characterHandles.length > 0 && (
                              <p className="text-muted-foreground">
                                {panel.characterHandles.join(", ")}
                              </p>
                            )}
                          {panel.bubbles && panel.bubbles.length > 0 && (
                            <div className="space-y-1 mt-2">
                              {panel.bubbles.map((bubble, idx) => (
                                <p
                                  key={bubble.id || idx}
                                  className="text-muted-foreground italic text-xs line-clamp-2"
                                >
                                  "{bubble.text}"
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Info */}
          {data.project.synopsis && (
            <div className="mb-8 bg-card rounded-xl p-6 border border-border">
              <h2 className="text-xl font-bold mb-2">Story</h2>
              <p className="text-muted-foreground">{data.project.synopsis}</p>
              {data.project.genre && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm font-medium">Genre:</span>
                  <span className="px-3 py-1 bg-secondary rounded-full text-sm">
                    {data.project.genre}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Actions Section */}
          <div className="flex flex-col items-center gap-6 py-8 border-t border-border">
            {/* Generate All Button */}
            <div className="flex w-full justify-center">
              <Button
                onClick={handleGenerateAll}
                disabled={isGeneratingAll}
                className="w-full max-w-sm h-12 text-base font-bold shadow-lg shadow-primary/20"
                size="lg"
              >
                {isGeneratingAll ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2"></div>
                    Generating...
                  </>
                ) : (
                  `Generate All Pages`
                )}
              </Button>
            </div>

            {/* Generation Info & Secondary Action */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Estimated time: ~{estimatedMinutes} minutes. This will use{" "}
                {creditCost} credits.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Need to make changes?{" "}
                <button
                  onClick={handleReturnToEditor}
                  className="font-medium text-primary/80 hover:text-primary underline"
                >
                  Return to Editor
                </button>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
