"use client";

import { Character } from "@/types";
import { useState } from "react";

interface CharacterSheetProps {
  character: Character;
  onEdit?: (character: Character) => void;
  onRegenerate?: (characterId: string) => void;
  onClose?: () => void;
}

export function CharacterSheet({
  character,
  onEdit,
  onRegenerate,
  onClose,
}: CharacterSheetProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (!onRegenerate) return;

    setIsRegenerating(true);
    try {
      await onRegenerate(character.id);
    } catch (error) {
      console.error("Failed to regenerate character:", error);
      alert("Failed to regenerate character. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{character.name}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Character Reference Sheet
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(character)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
          )}
          {onRegenerate && (
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* @Handle */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Character Handle
          </h3>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-lg font-mono font-semibold text-blue-700">
              {character.handle}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(character.handle);
                alert("Handle copied to clipboard!");
              }}
              className="p-1 hover:bg-blue-100 rounded transition-colors"
              title="Copy handle"
            >
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Use this handle in prompts to reference this character (e.g., "
            {character.handle} running through the rain")
          </p>
        </div>

        {/* Description */}
        {character.description && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Description
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {character.description}
            </p>
          </div>
        )}

        {/* Turnaround Views (4 views) */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Character Turnaround
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {/* Front View */}
            {character.turnaround?.front && (
              <div className="space-y-2">
                <div className="aspect-3/4 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={character.turnaround.front}
                    alt={`${character.name} - Front View`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs text-center text-gray-500 font-medium">
                  Front
                </p>
              </div>
            )}

            {/* Side View */}
            {character.turnaround?.side && (
              <div className="space-y-2">
                <div className="aspect-3/4 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={character.turnaround.side}
                    alt={`${character.name} - Side View`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs text-center text-gray-500 font-medium">
                  Side
                </p>
              </div>
            )}

            {/* Back View */}
            {character.turnaround?.back && (
              <div className="space-y-2">
                <div className="aspect-3/4 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={character.turnaround.back}
                    alt={`${character.name} - Back View`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs text-center text-gray-500 font-medium">
                  Back
                </p>
              </div>
            )}

            {/* Three-Quarter View */}
            {character.turnaround?.threequarter && (
              <div className="space-y-2">
                <div className="aspect-3/4 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={character.turnaround.threequarter}
                    alt={`${character.name} - Three-Quarter View`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs text-center text-gray-500 font-medium">
                  3/4 View
                </p>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            These turnaround views are used with IP-Adapter for consistent
            character appearance across panels.
          </p>
        </div>

        {/* Expressions Grid (12 expressions) */}
        {character.expressions && character.expressions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Expression Library
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {character.expressions.map((expression) => (
                <div key={expression.id} className="space-y-2">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors">
                    <img
                      src={expression.imageUrl}
                      alt={`${character.name} - ${expression.name}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-center text-gray-500 font-medium capitalize">
                    {expression.name}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Reference these expressions in your prompts (e.g., "
              {character.handle} happy" or "{character.handle} crying")
            </p>
          </div>
        )}

        {/* Prompt Triggers */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Prompt Triggers
          </h3>
          <div className="flex flex-wrap gap-2">
            {character.promptTriggers.map((trigger, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200"
              >
                {trigger}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            These keywords will automatically reference this character in panel
            generation.
          </p>
        </div>

        {/* Metadata */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Created: {new Date(character.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
