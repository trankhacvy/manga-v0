"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEditorStore } from "@/lib/store/editor-store";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Markdown } from "@/components/ui/markdown";
import type { Character } from "@/types";

interface CharacterLibraryProps {
  className?: string;
}

export function CharacterLibrary({ className = "" }: CharacterLibraryProps) {
  const characters = useEditorStore((state) => state.characters);
  const selectedPanelIds = useEditorStore((state) => state.selectedPanelIds);
  const panels = useEditorStore((state) => state.panels);

  const [isOpen, setIsOpen] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );

  // Get selected panels to check which characters are in use
  const selectedPanels = panels.filter((p) => selectedPanelIds.includes(p.id));

  // Check if a character is in any selected panel
  const isCharacterInSelectedPanel = (character: Character): boolean => {
    return selectedPanels.some(
      (panel) =>
        panel.characterHandles?.includes(character.handle) ||
        panel.characterRefs?.includes(character.id)
    );
  };

  const handleCharacterDragStart = (
    e: React.DragEvent,
    character: Character
  ) => {
    e.dataTransfer.setData("character", JSON.stringify(character));
    e.dataTransfer.effectAllowed = "copy";
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
            Characters
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {characters.length} character{characters.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            {isOpen ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
            <span className="sr-only">Toggle characters</span>
          </Button>
        </CollapsibleTrigger>
      </div>

      {/* Character Grid */}
      <CollapsibleContent>
        <div className="p-4">
          {characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <svg
                className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                No characters yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {characters.map((character) => {
                const thumbnail =
                  character.turnaround?.front ||
                  character.referenceImages?.front ||
                  character.expressions?.[0]?.imageUrl ||
                  "";
                const isInPanel = isCharacterInSelectedPanel(character);

                return (
                  <Popover key={character.id}>
                    <PopoverTrigger asChild>
                      <div
                        draggable
                        onDragStart={(e) =>
                          handleCharacterDragStart(e, character)
                        }
                        className={`
                          relative group cursor-pointer rounded-lg overflow-hidden
                          border-2 transition-all duration-200
                          ${
                            isInPanel
                              ? "border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                          }
                          hover:shadow-md
                        `}
                      >
                        {/* Character Thumbnail */}
                        <div className="aspect-square bg-gray-100 dark:bg-gray-900">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={character.name}
                              className="w-full h-full object-cover"
                              draggable={false}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg
                                className="w-8 h-8 text-gray-400"
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
                        </div>

                        {/* Character Name Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-2">
                          <p className="text-xs font-medium text-white truncate">
                            {character.name}
                          </p>
                          <p className="text-xs text-gray-300 font-mono">
                            {character.handle}
                          </p>
                        </div>

                        {/* In Panel Indicator */}
                        {isInPanel && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                              <svg
                                className="w-2.5 h-2.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                    </PopoverTrigger>

                    {/* Character Details Popover */}
                    <PopoverContent
                      className="w-80 max-h-[500px] overflow-y-auto"
                      side="left"
                      align="start"
                    >
                      <div className="space-y-4">
                        {/* Header */}
                        <div>
                          <h4 className="font-semibold text-base leading-none mb-1">
                            {character.name}
                          </h4>
                          <p className="text-sm text-muted-foreground font-mono">
                            {character.handle}
                          </p>
                        </div>

                        {/* Description */}
                        {character.description && (
                          <div>
                            <h5 className="text-xs font-semibold mb-2">
                              Description
                            </h5>
                            <Markdown className="text-xs">
                              {character.description}
                            </Markdown>
                          </div>
                        )}

                        {/* Turnaround Views */}
                        {(character.turnaround?.front ||
                          character.turnaround?.side ||
                          character.turnaround?.back ||
                          character.turnaround?.threequarter) && (
                          <div>
                            <h5 className="text-xs font-semibold mb-2">
                              Turnaround Views
                            </h5>
                            <div className="grid grid-cols-2 gap-2">
                              {character.turnaround?.front && (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    Front
                                  </p>
                                  <img
                                    src={character.turnaround.front}
                                    alt="Front view"
                                    className="w-full aspect-square object-cover rounded border"
                                  />
                                </div>
                              )}
                              {character.turnaround?.side && (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    Side
                                  </p>
                                  <img
                                    src={character.turnaround.side}
                                    alt="Side view"
                                    className="w-full aspect-square object-cover rounded border"
                                  />
                                </div>
                              )}
                              {character.turnaround?.back && (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    Back
                                  </p>
                                  <img
                                    src={character.turnaround.back}
                                    alt="Back view"
                                    className="w-full aspect-square object-cover rounded border"
                                  />
                                </div>
                              )}
                              {character.turnaround?.threequarter && (
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">
                                    3/4
                                  </p>
                                  <img
                                    src={character.turnaround.threequarter}
                                    alt="Three-quarter view"
                                    className="w-full aspect-square object-cover rounded border"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Expressions */}
                        {character.expressions &&
                          character.expressions.length > 0 && (
                            <div>
                              <h5 className="text-xs font-semibold mb-2">
                                Expressions ({character.expressions.length})
                              </h5>
                              <div className="grid grid-cols-3 gap-2">
                                {character.expressions
                                  .slice(0, 6)
                                  .map((expression) => (
                                    <div
                                      key={expression.id}
                                      className="space-y-1"
                                    >
                                      <img
                                        src={expression.imageUrl}
                                        alt={expression.name}
                                        className="w-full aspect-square object-cover rounded border"
                                      />
                                      <p className="text-xs text-muted-foreground truncate">
                                        {expression.name}
                                      </p>
                                    </div>
                                  ))}
                              </div>
                              {character.expressions.length > 6 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  +{character.expressions.length - 6} more
                                </p>
                              )}
                            </div>
                          )}

                        {/* Prompt Triggers */}
                        {character.promptTriggers &&
                          character.promptTriggers.length > 0 && (
                            <div>
                              <h5 className="text-xs font-semibold mb-2">
                                Prompt Triggers
                              </h5>
                              <div className="flex flex-wrap gap-1">
                                {character.promptTriggers.map(
                                  (trigger, index) => (
                                    <span
                                      key={index}
                                      className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded"
                                    >
                                      {trigger}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
