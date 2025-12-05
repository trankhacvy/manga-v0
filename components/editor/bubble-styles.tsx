"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { BUBBLE_TYPES, type BubbleTypeDefinition } from "@/lib/bubble-types";
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

interface BubbleStylesProps {
  className?: string;
  selectedBubbleId?: string | null;
  currentBubbleType?: string;
  onApplyStyle?: (bubbleTypeId: string) => void;
  onShowToast?: (message: string, type?: "success" | "error" | "info") => void;
}

/**
 * Bubble Styles Selector Component
 *
 * Displays a grid of bubble type options with visual previews.
 * Users can click to apply different bubble styles to selected bubbles.
 */
export function BubbleStyles({
  className = "",
  selectedBubbleId,
  currentBubbleType = "standard",
  onApplyStyle,
  onShowToast,
}: BubbleStylesProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const handleApplyClick = (bubbleType: BubbleTypeDefinition) => {
    if (!selectedBubbleId) {
      onShowToast?.("No bubble selected", "error");
      return;
    }

    if (onApplyStyle) {
      onApplyStyle(bubbleType.id);
      onShowToast?.(`Applied "${bubbleType.name}" style to bubble`, "success");
    }

    setOpenPopoverId(null); // Close popover
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
            Bubble Styles
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {selectedBubbleId
              ? "Click to apply style"
              : "Select a bubble to change style"}
          </p>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            {isOpen ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
            <span className="sr-only">Toggle bubble styles</span>
          </Button>
        </CollapsibleTrigger>
      </div>

      {/* Bubble Types Grid */}
      <CollapsibleContent>
        <div className="p-4">
          {!selectedBubbleId ? (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Select a bubble to change its style
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {BUBBLE_TYPES.map((bubbleType) => {
                const isSelected = currentBubbleType === bubbleType.id;

                return (
                  <Popover
                    key={bubbleType.id}
                    open={openPopoverId === bubbleType.id}
                    onOpenChange={(open) =>
                      setOpenPopoverId(open ? bubbleType.id : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <button
                        className={`
                          relative group cursor-pointer rounded-lg overflow-hidden
                          border-2 transition-all duration-200
                          ${
                            isSelected
                              ? "border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                          }
                          hover:shadow-md
                        `}
                      >
                        {/* Bubble Type Preview */}
                        <div className="aspect-square bg-gray-100 dark:bg-gray-900 p-4 flex items-center justify-center">
                          <BubblePreview bubbleType={bubbleType} />
                        </div>

                        {/* Bubble Type Name Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-2">
                          <p className="text-xs font-medium text-white truncate">
                            {bubbleType.name}
                          </p>
                        </div>

                        {/* Selected Indicator */}
                        {isSelected && (
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
                      </button>
                    </PopoverTrigger>

                    {/* Bubble Type Details Popover */}
                    <PopoverContent className="w-80" side="left" align="start">
                      <div className="space-y-4">
                        {/* Header */}
                        <div>
                          <h4 className="font-semibold text-base leading-none mb-1">
                            {bubbleType.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {bubbleType.shape} • {bubbleType.tailType} tail
                          </p>
                        </div>

                        {/* Description */}
                        <div>
                          <p className="text-sm">{bubbleType.description}</p>
                        </div>

                        {/* Preview */}
                        <div>
                          <h5 className="text-xs font-semibold mb-2">
                            Style Preview
                          </h5>
                          <div className="w-full aspect-video bg-gray-100 dark:bg-gray-900 rounded border p-6 flex items-center justify-center">
                            <BubblePreview
                              bubbleType={bubbleType}
                              showText={true}
                            />
                          </div>
                        </div>

                        {/* Style Details */}
                        <div>
                          <h5 className="text-xs font-semibold mb-2">
                            Style Details
                          </h5>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Font Size:</span>
                              <span>{bubbleType.defaultStyle.fontSize}px</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Font Weight:</span>
                              <span>{bubbleType.defaultStyle.fontWeight}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Border Width:</span>
                              <span>
                                {bubbleType.defaultStyle.borderWidth}px
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Text Transform:</span>
                              <span>
                                {bubbleType.defaultStyle.textTransform ||
                                  "none"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Tags */}
                        {bubbleType.tags.length > 0 && (
                          <div>
                            <h5 className="text-xs font-semibold mb-2">Tags</h5>
                            <div className="flex flex-wrap gap-1">
                              {bubbleType.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Apply Button */}
                        <div className="pt-2 border-t">
                          <Button
                            onClick={() => handleApplyClick(bubbleType)}
                            disabled={!selectedBubbleId}
                            className="w-full"
                            size="sm"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Apply Style
                          </Button>
                        </div>
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

/**
 * Visual preview of bubble type
 * Renders a simplified SVG representation of the bubble shape
 */
function BubblePreview({
  bubbleType,
  showText = false,
}: {
  bubbleType: BubbleTypeDefinition;
  showText?: boolean;
}) {
  const style = bubbleType.defaultStyle;

  return (
    <svg
      viewBox="0 0 120 80"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Render different shapes based on bubble type */}
      {bubbleType.shape === "ellipse" && (
        <g>
          <rect
            x="10"
            y="10"
            width="100"
            height="60"
            rx="18"
            ry="18"
            fill={style.backgroundColor}
            stroke={style.borderColor}
            strokeWidth={style.borderWidth}
          />
          {showText && (
            <text
              x="60"
              y="45"
              textAnchor="middle"
              fontSize="12"
              fill={style.textColor}
              fontWeight={style.fontWeight}
            >
              Hello!
            </text>
          )}
        </g>
      )}

      {bubbleType.shape === "cloud" && (
        <g>
          {/* Main ellipse */}
          <ellipse
            cx="60"
            cy="40"
            rx="45"
            ry="28"
            fill={style.backgroundColor}
            stroke={style.borderColor}
            strokeWidth={style.borderWidth}
          />
          {/* Cloud bumps */}
          <circle
            cx="30"
            cy="25"
            r="12"
            fill={style.backgroundColor}
            stroke={style.borderColor}
            strokeWidth={style.borderWidth * 0.8}
          />
          <circle
            cx="90"
            cy="25"
            r="12"
            fill={style.backgroundColor}
            stroke={style.borderColor}
            strokeWidth={style.borderWidth * 0.8}
          />
          <circle
            cx="30"
            cy="55"
            r="12"
            fill={style.backgroundColor}
            stroke={style.borderColor}
            strokeWidth={style.borderWidth * 0.8}
          />
          <circle
            cx="90"
            cy="55"
            r="12"
            fill={style.backgroundColor}
            stroke={style.borderColor}
            strokeWidth={style.borderWidth * 0.8}
          />
          {showText && (
            <text
              x="60"
              y="45"
              textAnchor="middle"
              fontSize="11"
              fill={style.textColor}
              fontWeight={style.fontWeight}
            >
              Thinking...
            </text>
          )}
        </g>
      )}

      {bubbleType.shape === "jagged" && (
        <g>
          {/* Jagged/spiky shape */}
          <path
            d="M 20,15 L 30,10 L 40,15 L 50,10 L 60,15 L 70,10 L 80,15 L 90,10 L 100,15 L 105,25 L 100,35 L 105,45 L 100,55 L 105,65 L 100,70 L 90,65 L 80,70 L 70,65 L 60,70 L 50,65 L 40,70 L 30,65 L 20,70 L 15,60 L 20,50 L 15,40 L 20,30 L 15,20 Z"
            fill={style.backgroundColor}
            stroke={style.borderColor}
            strokeWidth={style.borderWidth}
          />
          {showText && (
            <text
              x="60"
              y="45"
              textAnchor="middle"
              fontSize="14"
              fill={style.textColor}
              fontWeight={style.fontWeight}
              textTransform={style.textTransform}
            >
              SHOUT!
            </text>
          )}
        </g>
      )}

      {bubbleType.shape === "whisper" && (
        <g>
          <rect
            x="10"
            y="10"
            width="100"
            height="60"
            rx="15"
            ry="15"
            fill={style.backgroundColor}
            stroke={style.borderColor}
            strokeWidth={style.borderWidth}
            strokeDasharray="4,2"
          />
          {showText && (
            <text
              x="60"
              y="45"
              textAnchor="middle"
              fontSize="10"
              fill={style.textColor}
              fontWeight={style.fontWeight}
            >
              whisper...
            </text>
          )}
        </g>
      )}

      {bubbleType.shape === "rectangle" && (
        <g>
          <rect
            x="10"
            y="10"
            width="100"
            height="60"
            rx="3"
            ry="3"
            fill={style.backgroundColor}
            stroke={style.borderColor}
            strokeWidth={style.borderWidth}
          />
          {showText && (
            <text
              x="15"
              y="30"
              fontSize="9"
              fill={style.textColor}
              fontWeight={style.fontWeight}
            >
              <tspan x="15" dy="0">
                Meanwhile, in
              </tspan>
              <tspan x="15" dy="12">
                another place...
              </tspan>
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
