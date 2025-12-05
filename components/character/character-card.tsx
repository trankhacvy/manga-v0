"use client";

import { useState } from "react";
import type { Character } from "@/types";

interface CharacterCardProps {
  character: Character;
  onDragStart?: (character: Character) => void;
  onClick?: (character: Character) => void;
  className?: string;
}

export function CharacterCard({
  character,
  onDragStart,
  onClick,
  className = "",
}: CharacterCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    // Store character data for drop handling
    e.dataTransfer.setData("character", JSON.stringify(character));
    e.dataTransfer.effectAllowed = "copy";

    if (onDragStart) {
      onDragStart(character);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (onClick) {
      onClick(character);
    }
  };

  // Get thumbnail from turnaround (prefer front view)
  const thumbnail =
    character.turnaround?.front ||
    character.referenceImages?.front ||
    character.expressions?.[0]?.imageUrl ||
    "";

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={`
        group relative bg-white dark:bg-gray-800 rounded-lg border-2 
        ${
          isDragging
            ? "border-blue-500 opacity-50"
            : "border-gray-200 dark:border-gray-700"
        }
        hover:border-blue-400 hover:shadow-lg
        transition-all duration-200 cursor-grab active:cursor-grabbing
        ${className}
      `}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-900">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={character.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              className="w-16 h-16"
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

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Character info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate flex-1">
            {character.name}
          </h3>
        </div>

        {/* @Handle */}
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
            {character.handle}
          </span>
        </div>

        {/* Description preview */}
        {character.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {character.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>
              {Object.values(character.turnaround || {}).filter(Boolean).length}{" "}
              views
            </span>
          </div>
          <div className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{character.expressions?.length || 0} expressions</span>
          </div>
        </div>
      </div>

      {/* Drag indicator */}
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-20 rounded-lg">
          <div className="text-blue-600 dark:text-blue-400 font-medium">
            Drop on canvas
          </div>
        </div>
      )}
    </div>
  );
}
