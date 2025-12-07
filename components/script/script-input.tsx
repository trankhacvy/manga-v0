"use client";

import { useState } from "react";
import type { LayoutTemplate } from "@/types";

interface ScriptInputProps {
  projectId: string;
  onSubmit: (
    scriptText: string,
    layoutTemplate: LayoutTemplate
  ) => Promise<void>;
  isLoading?: boolean;
}

export function ScriptInput({
  projectId,
  onSubmit,
  isLoading = false,
}: ScriptInputProps) {
  const [scriptText, setScriptText] = useState("");
  const [layoutTemplate, setLayoutTemplate] =
    // @ts-expect-error
    useState<LayoutTemplate>("standard-grid");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptText.trim()) return;

    await onSubmit(scriptText, layoutTemplate);
  };

  const layoutOptions: {
    value: LayoutTemplate;
    label: string;
    description: string;
  }[] = [
    {
      // @ts-expect-error
      value: "4-koma",
      label: "4-Koma",
      description:
        "Four vertical panels, traditional Japanese comic strip format",
    },
    {
      // @ts-expect-error
      value: "action-spread",
      label: "Action Spread",
      description: "Dynamic layout with large focal panel for action scenes",
    },
    {
      // @ts-expect-error
      value: "standard-grid",
      label: "Standard Grid",
      description: "Flexible grid layout, adapts to story pacing",
    },
    {
      // @ts-expect-error
      value: "custom",
      label: "Custom",
      description: "AI determines optimal layout based on story content",
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="script-text" className="text-sm font-medium">
          Story Script
        </label>
        <textarea
          id="script-text"
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
          placeholder="Enter your story here... Describe the scene, dialogue, and action. The AI will convert it into a comic page layout."
          className="min-h-[200px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500">
          Tip: Include character names, actions, and dialogue. Be descriptive
          about the scene and mood.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="layout-template" className="text-sm font-medium">
          Layout Template
        </label>
        <div className="grid grid-cols-1 gap-2">
          {layoutOptions.map((option) => (
            <label
              // @ts-expect-error
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                layoutTemplate === option.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              } ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <input
                type="radio"
                name="layout-template"
                // @ts-expect-error
                value={option.value}
                checked={layoutTemplate === option.value}
                onChange={(e) =>
                  // @ts-expect-error
                  setLayoutTemplate(e.target.value as LayoutTemplate)
                }
                disabled={isLoading}
                className="mt-1"
              />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-gray-600">
                  {option.description}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !scriptText.trim()}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Generating Page..." : "Generate Page"}
      </button>
    </form>
  );
}
