"use client";

import { useEffect } from "react";
import type { Character } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";

interface CharacterDetailsModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CharacterDetailsModal({
  character,
  isOpen,
  onClose,
}: CharacterDetailsModalProps) {
  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!character) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="text-2xl">{character.name}</SheetTitle>
          <SheetDescription>
            <span className="text-base font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
              {character.handle}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Description */}
          {character.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Description
              </h3>
              <Markdown className="text-sm text-gray-700 dark:text-gray-300">
                {character.description}
              </Markdown>
            </div>
          )}

          {/* Turnaround Views */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Turnaround Views
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {character.turnaround?.front && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Front View
                  </p>
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <img
                      src={character.turnaround.front}
                      alt={`${character.name} - Front`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {character.turnaround?.side && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Side View
                  </p>
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <img
                      src={character.turnaround.side}
                      alt={`${character.name} - Side`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {character.turnaround?.back && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Back View
                  </p>
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <img
                      src={character.turnaround.back}
                      alt={`${character.name} - Back`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {character.turnaround?.threequarter && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Three-Quarter View
                  </p>
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <img
                      src={character.turnaround.threequarter}
                      alt={`${character.name} - Three-Quarter`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Empty state for turnaround */}
            {!character.turnaround?.front &&
              !character.turnaround?.side &&
              !character.turnaround?.back &&
              !character.turnaround?.threequarter && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">No turnaround views available</p>
                </div>
              )}
          </div>

          {/* Expressions Library */}
          {character.expressions && character.expressions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Expressions Library
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {character.expressions.map((expression) => (
                  <div key={expression.id} className="space-y-2">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                      <img
                        src={expression.imageUrl}
                        alt={`${character.name} - ${expression.name}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-center text-gray-600 dark:text-gray-400 truncate">
                      {expression.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompt Triggers */}
          {character.promptTriggers && character.promptTriggers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Prompt Triggers
              </h3>
              <div className="flex flex-wrap gap-2">
                {character.promptTriggers.map((trigger, index) => (
                  <span
                    key={index}
                    className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded border border-gray-200 dark:border-gray-700"
                  >
                    {trigger}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
