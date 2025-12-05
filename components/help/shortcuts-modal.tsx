"use client";

import { useState, useEffect } from "react";
import { X, Command } from "lucide-react";

interface ShortcutsModalProps {
  onClose?: () => void;
}

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const isMac =
    typeof window !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const modKey = isMac ? "⌘" : "Ctrl";

  const shortcuts = [
    {
      category: "General",
      items: [
        { keys: [modKey, "K"], description: "Focus global prompt bar" },
        { keys: ["Esc"], description: "Deselect all / Close modals" },
        { keys: [modKey, "A"], description: "Select all panels" },
        { keys: ["?"], description: "Show keyboard shortcuts" },
        {
          keys: [modKey, "S"],
          description: "Save project (auto-save enabled)",
        },
      ],
    },
    {
      category: "Panel Navigation",
      items: [
        { keys: ["↑"], description: "Navigate to previous panel" },
        { keys: ["↓"], description: "Navigate to next panel" },
        { keys: ["←"], description: "Navigate to previous panel" },
        { keys: ["→"], description: "Navigate to next panel" },
        { keys: ["Shift", "Click"], description: "Multi-select panels" },
        { keys: ["Drag"], description: "Select multiple panels" },
      ],
    },
    {
      category: "Panel Editing",
      items: [
        { keys: ["Delete"], description: "Delete selected panel(s)" },
        { keys: ["Backspace"], description: "Delete selected panel(s)" },
        { keys: [modKey, "C"], description: "Copy selected panel(s)" },
        { keys: [modKey, "V"], description: "Paste panel(s)" },
        { keys: [modKey, "D"], description: "Duplicate selected panel(s)" },
        { keys: [modKey, "Z"], description: "Undo last action" },
        { keys: [modKey, "Shift", "Z"], description: "Redo last action" },
        { keys: ["↑", "↓", "←", "→"], description: "Nudge panel 1px" },
        { keys: ["Shift", "↑↓←→"], description: "Nudge panel 10px" },
        { keys: ["Drag panel"], description: "Move panel position" },
        {
          keys: ["Drag handles"],
          description: "Resize panel (triggers outpaint)",
        },
        {
          keys: ["Double-click bubble"],
          description: "Edit speech bubble text",
        },
      ],
    },
    {
      category: "Generation & AI",
      items: [
        { keys: ["Enter"], description: "Generate from prompt" },
        { keys: ["Shift", "Enter"], description: "New line in prompt" },
        { keys: ["@"], description: "Mention character (@handle)" },
        { keys: ["@ref-"], description: "Reference image from library" },
        { keys: [modKey, "L"], description: "Open AI Composer (coming soon)" },
      ],
    },
    {
      category: "Canvas Controls",
      items: [
        { keys: ["Space", "Drag"], description: "Pan canvas" },
        { keys: [modKey, "+"], description: "Zoom in" },
        { keys: [modKey, "-"], description: "Zoom out" },
        { keys: [modKey, "0"], description: "Reset zoom to 100%" },
        { keys: ["Mouse wheel"], description: "Zoom in/out" },
      ],
    },
    {
      category: "Quick Actions",
      items: [
        { keys: ["V"], description: "Vary selected panel(s)" },
        { keys: ["I"], description: "Activate inpaint mode" },
        { keys: ["U"], description: "Upscale selected panel" },
        { keys: ["G"], description: "Generate with current prompt" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold">Keyboard Shortcuts</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shortcuts.map((section) => (
              <div key={section.category}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {section.category}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="text-sm text-foreground">
                        {item.description}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center">
                            <kbd className="px-2 py-1 bg-muted border border-border rounded text-xs font-mono">
                              {key}
                            </kbd>
                            {keyIndex < item.keys.length - 1 && (
                              <span className="mx-1 text-muted-foreground">
                                +
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30">
          <p className="text-sm text-muted-foreground text-center">
            Press{" "}
            <kbd className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">
              ?
            </kbd>{" "}
            anytime to view this help
          </p>
        </div>
      </div>
    </div>
  );
}
