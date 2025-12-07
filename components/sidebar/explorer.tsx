"use client";

import { useState } from "react";
import Image from "next/image";
import { FileText, Users, BookOpen } from "lucide-react";
import type { Page, Character } from "@/types";

interface ExplorerProps {
  projectId?: string;
  pages?: Page[];
  characters?: Character[];
  currentPageId?: string;
  onPageSelect?: (pageId: string) => void;
  onCreatePage?: () => void;
  onReorderPages?: (pages: Page[]) => void;
  onCharacterClick?: (character: Character) => void;
  onCreateCharacter?: () => void;
}

type SectionType = "pages" | "script" | "characters";

export function Explorer({
  projectId,
  pages = [],
  characters = [],
  currentPageId,
  onPageSelect,
  onCreatePage,
  onReorderPages,
  onCharacterClick,
  onCreateCharacter,
}: ExplorerProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<SectionType, boolean>
  >({
    pages: true,
    script: false,
    characters: true,
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const toggleSection = (section: SectionType) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (
      draggedIndex !== null &&
      dragOverIndex !== null &&
      draggedIndex !== dragOverIndex &&
      onReorderPages
    ) {
      const reorderedPages = [...pages];
      const [movedPage] = reorderedPages.splice(draggedIndex, 1);
      reorderedPages.splice(dragOverIndex, 0, movedPage);

      // Update page numbers
      const updatedPages = reorderedPages.map((page, index) => ({
        ...page,
        pageNumber: index + 1,
      }));

      onReorderPages(updatedPages);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  if (!projectId) {
    return (
      <div className="text-sm text-muted-foreground">
        No project open. Create or open a project to get started.
      </div>
    );
  }

  const sections: { key: SectionType; label: string; icon: React.ReactNode }[] =
    [
      { key: "pages", label: "PAGES", icon: <BookOpen className="w-4 h-4" /> },
      {
        key: "script",
        label: "SCRIPT",
        icon: <FileText className="w-4 h-4" />,
      },
      {
        key: "characters",
        label: "CHARACTERS",
        icon: <Users className="w-4 h-4" />,
      },
    ];

  return (
    <div className="space-y-4">
      {/* Pages Section */}
      <div>
        <button
          onClick={() => toggleSection("pages")}
          className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-primary transition-colors group"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>PAGES</span>
          </div>
          <svg
            className={`w-4 h-4 transition-transform ${
              expandedSections.pages ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {expandedSections.pages && (
          <div className="mt-2 space-y-2">
            {/* New Page Button */}
            {onCreatePage && (
              <button
                onClick={onCreatePage}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-primary/10 hover:bg-primary/20 rounded transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Page
              </button>
            )}

            {pages.length === 0 ? (
              <div className="text-xs text-muted-foreground pl-2">
                No pages yet
              </div>
            ) : (
              <>
                {pages.length > 1 && (
                  <div className="text-xs text-muted-foreground px-2">
                    Drag to reorder
                  </div>
                )}
                <div className="space-y-1">
                  {pages.map((page, index) => (
                    <button
                      key={page.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragLeave={handleDragLeave}
                      onClick={() => onPageSelect?.(page.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded text-sm transition-colors cursor-move ${
                        currentPageId === page.id
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50 text-foreground"
                      } ${
                        dragOverIndex === index && draggedIndex !== index
                          ? "border-2 border-primary"
                          : ""
                      }`}
                    >
                      {/* @ts-expect-error */}
                      {page.thumbnailUrl ? (
                        <div className="relative w-12 h-16 shrink-0 bg-muted rounded overflow-hidden">
                          <Image
                          // @ts-expect-error
                            src={page.thumbnailUrl}
                            alt={`Page ${page.pageNumber}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-16 shrink-0 bg-muted rounded flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                      )}
                      <span className="text-left">Page {page.pageNumber}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Script Section */}
      <div>
        <button
          onClick={() => toggleSection("script")}
          className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-primary transition-colors group"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>SCRIPT</span>
          </div>
          <svg
            className={`w-4 h-4 transition-transform ${
              expandedSections.script ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {expandedSections.script && (
          <div className="mt-2 space-y-2">
            <div className="text-xs text-muted-foreground pl-2">
              Script editor coming soon
            </div>
          </div>
        )}
      </div>

      {/* Characters Section */}
      <div>
        <button
          onClick={() => toggleSection("characters")}
          className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-primary transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>CHARACTERS</span>
          </div>
          <svg
            className={`w-4 h-4 transition-transform ${
              expandedSections.characters ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {expandedSections.characters && (
          <div className="mt-2 space-y-2">
            {/* New Character Button */}
            {onCreateCharacter && (
              <button
                onClick={onCreateCharacter}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-primary/10 hover:bg-primary/20 rounded transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Character
              </button>
            )}

            {characters.length === 0 ? (
              <div className="text-xs text-muted-foreground pl-2">
                No characters yet
              </div>
            ) : (
              <div className="space-y-1">
                {characters.map((character) => (
                  <button
                    key={character.id}
                    onClick={() => onCharacterClick?.(character)}
                    className="w-full flex items-center gap-2 p-2 rounded hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    {character.referenceImages.front ? (
                      <div className="relative w-10 h-10 shrink-0 bg-muted rounded-full overflow-hidden">
                        <Image
                          src={character.referenceImages.front}
                          alt={character.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 shrink-0 bg-muted rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-medium text-foreground truncate">
                        {character.name}
                      </div>
                      {character.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {character.description}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
