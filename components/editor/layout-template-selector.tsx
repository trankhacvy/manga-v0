"use client";

import React, { useState } from "react";
import { LAYOUT_TEMPLATES } from "@/lib/layout-templates";
import type { LayoutTemplate } from "@/types/layouts";

interface LayoutTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: LayoutTemplate) => void;
  isLoading?: boolean;
}

/**
 * Layout Template Selector Modal
 *
 * Displays all available layout templates and allows user to select one
 * to apply to the current page.
 */
export function LayoutTemplateSelector({
  isOpen,
  onClose,
  onSelectTemplate,
  isLoading = false,
}: LayoutTemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<LayoutTemplate | null>(null);

  if (!isOpen) return null;

  const handleSelectTemplate = (template: LayoutTemplate) => {
    setSelectedTemplate(template);
    onSelectTemplate(template);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        role="presentation"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Choose a Layout
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Select a layout template to start creating your manga page
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Templates Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {LAYOUT_TEMPLATES.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplate?.id === template.id}
                  onSelect={handleSelectTemplate}
                  isLoading={isLoading}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

interface TemplateCardProps {
  template: LayoutTemplate;
  isSelected: boolean;
  onSelect: (template: LayoutTemplate) => void;
  isLoading: boolean;
}

/**
 * Individual template card component
 */
function TemplateCard({
  template,
  isSelected,
  onSelect,
  isLoading,
}: TemplateCardProps) {
  return (
    <button
      onClick={() => onSelect(template)}
      disabled={isLoading}
      className={`p-4 rounded-lg border-2 transition-all text-left ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {/* Template Preview Grid */}
      <div className="mb-3 bg-gray-100 rounded aspect-video flex items-center justify-center overflow-hidden">
        <TemplatePreview template={template} />
      </div>

      {/* Template Info */}
      <h3 className="font-semibold text-gray-900">{template.name}</h3>
      <p className="text-sm text-gray-600 mt-1">{template.description}</p>

      {/* Panel Count Badge */}
      <div className="mt-3 flex items-center gap-2">
        <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded">
          {template.panelCount} panels
        </span>
      </div>

      {/* Tags */}
      {template.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {template.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

/**
 * Visual preview of the layout template
 */
function TemplatePreview({ template }: { template: LayoutTemplate }) {
  return (
    <svg
      viewBox="0 0 200 150"
      className="w-full h-full"
      style={{ maxWidth: "100%", maxHeight: "100%" }}
    >
      {/* Background */}
      <rect width="200" height="150" fill="white" stroke="#e5e7eb" />

      {/* Panel rectangles */}
      {template.panels.map((panel, index) => {
        const x = panel.x * 200;
        const y = panel.y * 150;
        const width = panel.width * 200;
        const height = panel.height * 150;

        return (
          <g key={panel.id}>
            {/* Panel rect */}
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill="none"
              stroke="#9ca3af"
              strokeWidth="1"
            />
            {/* Panel number */}
            <text
              x={x + width / 2}
              y={y + height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill="#6b7280"
              fontWeight="500"
            >
              {index + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
