"use client";

import { useState, useEffect, useRef } from "react";
import type { Character } from "@/types";

interface Reference {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
}

interface HandleAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  characters: Character[];
  references?: Reference[];
  placeholder?: string;
  className?: string;
  textareaClassName?: string;
  rows?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

interface AutocompleteMatch {
  type: "character" | "reference";
  item: Character | Reference;
  startIndex: number;
  query: string;
}

export function HandleAutocomplete({
  value,
  onChange,
  characters,
  references = [],
  placeholder = "Type @ to mention a character or @ref- for references...",
  className = "",
  textareaClassName = "",
  rows = 3,
  onKeyDown,
}: HandleAutocompleteProps) {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteMatch, setAutocompleteMatch] =
    useState<AutocompleteMatch | null>(null);
  const [filteredItems, setFilteredItems] = useState<
    Array<{ type: "character" | "reference"; item: Character | Reference }>
  >([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [autocompletePosition, setAutocompletePosition] = useState({
    top: 0,
    left: 0,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Detect @handle or @ref- typing and show autocomplete
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);

    // Find the last @ symbol before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex === -1) {
      setShowAutocomplete(false);
      setAutocompleteMatch(null);
      return;
    }

    // Check if there's a space after the @ (which would end the handle)
    const textAfterAt = textBeforeCursor.substring(lastAtIndex);
    if (textAfterAt.includes(" ")) {
      setShowAutocomplete(false);
      setAutocompleteMatch(null);
      return;
    }

    // Extract the query (text after @)
    const query = textAfterAt.substring(1); // Remove the @

    // Check if it's a reference query (@ref-)
    const isRefQuery = query.startsWith("ref-");
    const refQuery = isRefQuery ? query.substring(4) : ""; // Remove "ref-"

    let filtered: Array<{
      type: "character" | "reference";
      item: Character | Reference;
    }> = [];

    if (isRefQuery) {
      // Filter references
      filtered = references
        .filter((ref) =>
          ref.name.toLowerCase().includes(refQuery.toLowerCase())
        )
        .map((ref) => ({ type: "reference" as const, item: ref }));
    } else {
      // Filter characters
      filtered = characters
        .filter(
          (char) =>
            char.handle.toLowerCase().includes(`@${query.toLowerCase()}`) ||
            char.name.toLowerCase().includes(query.toLowerCase())
        )
        .map((char) => ({ type: "character" as const, item: char }));
    }

    if (filtered.length > 0) {
      setAutocompleteMatch({
        type: filtered[0].type,
        item: filtered[0].item,
        startIndex: lastAtIndex,
        query,
      });
      setFilteredItems(filtered);
      setShowAutocomplete(true);
      setSelectedIndex(0);

      // Calculate autocomplete position
      const coords = getCaretCoordinates(textarea, cursorPosition);
      setAutocompletePosition({
        top: coords.top + 20,
        left: coords.left,
      });
    } else {
      setShowAutocomplete(false);
    }
  }, [value, characters, references]);

  // Handle keyboard navigation in autocomplete
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showAutocomplete && filteredItems.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        return;
      }

      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectItem(filteredItems[selectedIndex]);
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setShowAutocomplete(false);
        return;
      }
    }

    // Call parent onKeyDown if provided
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  // Insert selected item (character or reference)
  const selectItem = (item: {
    type: "character" | "reference";
    item: Character | Reference;
  }) => {
    if (!autocompleteMatch) return;

    const beforeHandle = value.substring(0, autocompleteMatch.startIndex);
    const afterHandle = value.substring(
      autocompleteMatch.startIndex + autocompleteMatch.query.length + 1
    );

    let insertText: string;
    if (item.type === "character") {
      insertText = (item.item as Character).handle;
    } else {
      const ref = item.item as Reference;
      insertText = `@ref-${ref.name.toLowerCase().replace(/\s+/g, "-")}`;
    }

    const newValue = `${beforeHandle}${insertText} ${afterHandle}`;
    onChange(newValue);

    setShowAutocomplete(false);
    setAutocompleteMatch(null);

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos =
          autocompleteMatch.startIndex + insertText.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Get caret coordinates for positioning autocomplete
  const getCaretCoordinates = (
    element: HTMLTextAreaElement,
    position: number
  ) => {
    const div = document.createElement("div");
    const style = getComputedStyle(element);

    // Copy styles
    Array.from(style).forEach((prop) => {
      div.style.setProperty(prop, style.getPropertyValue(prop));
    });

    div.style.position = "absolute";
    div.style.visibility = "hidden";
    div.style.whiteSpace = "pre-wrap";
    div.style.wordWrap = "break-word";

    div.textContent = element.value.substring(0, position);

    const span = document.createElement("span");
    span.textContent = element.value.substring(position) || ".";
    div.appendChild(span);

    document.body.appendChild(div);

    const rect = element.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();

    document.body.removeChild(div);

    return {
      top: spanRect.top - rect.top,
      left: spanRect.left - rect.left,
    };
  };

  return (
    <div className={`relative ${className}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={textareaClassName}
        data-prompt-input="true"
      />

      {/* Autocomplete dropdown */}
      {showAutocomplete && filteredItems.length > 0 && (
        <div
          ref={autocompleteRef}
          className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          style={{
            top: `${autocompletePosition.top}px`,
            left: `${autocompletePosition.left}px`,
            minWidth: "280px",
          }}
        >
          {filteredItems.map((item, index) => {
            const isCharacter = item.type === "character";
            const character = isCharacter ? (item.item as Character) : null;
            const reference = !isCharacter ? (item.item as Reference) : null;

            return (
              <button
                key={item.item.id}
                type="button"
                onClick={() => selectItem(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 text-left
                  ${
                    index === selectedIndex
                      ? "bg-blue-50 dark:bg-blue-900/30"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }
                  transition-colors
                `}
              >
                {/* Thumbnail */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                  {isCharacter ? (
                    character?.turnaround?.front ||
                    character?.referenceImages?.front ? (
                      <img
                        src={
                          character.turnaround?.front ||
                          character.referenceImages?.front
                        }
                        alt={character.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )
                  ) : (
                    <img
                      src={reference?.imageUrl}
                      alt={reference?.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {isCharacter ? character?.name : reference?.name}
                  </div>
                  <div className="text-xs font-mono text-blue-600 dark:text-blue-400">
                    {isCharacter
                      ? character?.handle
                      : `@ref-${reference?.name
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                  </div>
                </div>

                {/* Selected indicator */}
                {index === selectedIndex && (
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}

          {/* Hint */}
          <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              ↑↓
            </kbd>{" "}
            navigate •{" "}
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              Enter
            </kbd>{" "}
            select •{" "}
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
              Esc
            </kbd>{" "}
            close
          </div>
        </div>
      )}
    </div>
  );
}
