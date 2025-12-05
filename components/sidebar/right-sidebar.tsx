"use client";

import { useState, useEffect } from "react";
import {
  Layers,
  Settings,
  History,
  MessageSquare,
  Eye,
  EyeOff,
} from "lucide-react";
import { useCanvasStore } from "@/lib/store/canvas-store";
import { VersionHistory } from "@/components/panel/version-history";

interface RightSidebarProps {
  projectId: string;
}

type TabType = "layers" | "properties" | "history" | "chat";

export function RightSidebar({ projectId }: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>("layers");

  const panels = useCanvasStore((state) => state.panels);
  const selectedPanelIds = useCanvasStore((state) => state.selectedPanelIds);
  const selectedPanel = useCanvasStore((state) => state.getSelectedPanel());

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: "layers", label: "Layers", icon: <Layers className="w-4 h-4" /> },
    {
      key: "properties",
      label: "Properties",
      icon: <Settings className="w-4 h-4" />,
    },
    { key: "history", label: "History", icon: <History className="w-4 h-4" /> },
    { key: "chat", label: "Chat", icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="border-b border-border bg-card">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title={tab.label}
            >
              {tab.icon}
              <span className="hidden lg:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "layers" && (
          <LayersPanel panels={panels} selectedPanelIds={selectedPanelIds} />
        )}
        {activeTab === "properties" && (
          <PropertiesPanel selectedPanel={selectedPanel} />
        )}
        {activeTab === "history" && (
          <HistoryPanel selectedPanel={selectedPanel} />
        )}
        {activeTab === "chat" && (
          <ChatPanel projectId={projectId} selectedPanel={selectedPanel} />
        )}
      </div>
    </div>
  );
}

// Layers Panel Component
function LayersPanel({
  panels,
  selectedPanelIds,
}: {
  panels: any[];
  selectedPanelIds: string[];
}) {
  const selectPanel = useCanvasStore((state) => state.selectPanel);
  const updatePanel = useCanvasStore((state) => state.updatePanel);
  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>(
    {}
  );

  // Initialize visibility map
  useEffect(() => {
    const initialMap: Record<string, boolean> = {};
    panels.forEach((panel) => {
      if (!(panel.id in visibilityMap)) {
        initialMap[panel.id] = true; // All visible by default
      }
    });
    if (Object.keys(initialMap).length > 0) {
      setVisibilityMap((prev) => ({ ...prev, ...initialMap }));
    }
  }, [panels]);

  const toggleVisibility = (panelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVisibilityMap((prev) => ({
      ...prev,
      [panelId]: !prev[panelId],
    }));
    // TODO: Actually hide/show the panel on canvas
    // This would require adding a 'visible' property to the panel state
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
        LAYERS
      </h3>
      {panels.length === 0 ? (
        <div className="text-xs text-muted-foreground">No panels yet</div>
      ) : (
        <div className="space-y-1">
          {panels.map((panel) => {
            const isVisible = visibilityMap[panel.id] !== false;
            const isSelected = selectedPanelIds.includes(panel.id);
            return (
              <div key={panel.id} className="space-y-1">
                {/* Panel layer */}
                <button
                  onClick={() => selectPanel(panel.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded text-sm transition-colors ${
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50 text-foreground"
                  }`}
                >
                  <button
                    onClick={(e) => toggleVisibility(panel.id, e)}
                    className="shrink-0 hover:bg-background/50 rounded p-0.5"
                    title={isVisible ? "Hide panel" : "Show panel"}
                  >
                    {isVisible ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                  </button>
                  <Layers className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left truncate">
                    Panel {panel.panelIndex + 1}
                  </span>
                  {panel.imageUrl && (
                    <div className="w-8 h-8 bg-muted rounded overflow-hidden shrink-0">
                      <img
                        src={panel.imageUrl}
                        alt={`Panel ${panel.panelIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </button>

                {/* Speech bubbles for this panel */}
                {panel.bubbles && panel.bubbles.length > 0 && (
                  <div className="ml-6 space-y-1">
                    {panel.bubbles.map((bubble: any, idx: number) => (
                      <div
                        key={bubble.id}
                        className="flex items-center gap-2 p-1.5 rounded text-xs hover:bg-accent/30 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3 shrink-0 text-muted-foreground" />
                        <span className="flex-1 text-left truncate text-muted-foreground">
                          {bubble.text || `Bubble ${idx + 1}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Properties Panel Component
function PropertiesPanel({ selectedPanel }: { selectedPanel: any }) {
  const updatePanel = useCanvasStore((state) => state.updatePanel);

  if (!selectedPanel) {
    return (
      <div className="text-sm text-muted-foreground">
        Select a panel to view properties
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
        PROPERTIES
      </h3>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Position
          </label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <input
                type="number"
                value={Math.round(selectedPanel.x)}
                onChange={(e) =>
                  updatePanel(selectedPanel.id, { x: Number(e.target.value) })
                }
                className="w-full px-2 py-1 text-sm bg-background border border-border rounded"
                placeholder="X"
              />
            </div>
            <div>
              <input
                type="number"
                value={Math.round(selectedPanel.y)}
                onChange={(e) =>
                  updatePanel(selectedPanel.id, { y: Number(e.target.value) })
                }
                className="w-full px-2 py-1 text-sm bg-background border border-border rounded"
                placeholder="Y"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Size
          </label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <input
                type="number"
                value={Math.round(selectedPanel.width)}
                onChange={(e) =>
                  updatePanel(selectedPanel.id, {
                    width: Number(e.target.value),
                  })
                }
                className="w-full px-2 py-1 text-sm bg-background border border-border rounded"
                placeholder="Width"
              />
            </div>
            <div>
              <input
                type="number"
                value={Math.round(selectedPanel.height)}
                onChange={(e) =>
                  updatePanel(selectedPanel.id, {
                    height: Number(e.target.value),
                  })
                }
                className="w-full px-2 py-1 text-sm bg-background border border-border rounded"
                placeholder="Height"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Prompt
          </label>
          <textarea
            value={selectedPanel.prompt}
            onChange={(e) =>
              updatePanel(selectedPanel.id, { prompt: e.target.value })
            }
            className="w-full px-2 py-1 text-sm bg-background border border-border rounded mt-1 resize-none"
            rows={3}
            placeholder="Panel prompt..."
          />
        </div>

        {selectedPanel.characterRefs &&
          selectedPanel.characterRefs.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Characters
              </label>
              <div className="mt-1 flex flex-wrap gap-1">
                {selectedPanel.characterRefs.map((ref: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs bg-primary/10 text-primary rounded"
                  >
                    {ref}
                  </span>
                ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

// History Panel Component
function HistoryPanel({ selectedPanel }: { selectedPanel: any }) {
  const updatePanel = useCanvasStore((state) => state.updatePanel);

  if (!selectedPanel) {
    return (
      <div className="text-sm text-muted-foreground">
        Select a panel to view history
      </div>
    );
  }

  const handleRestore = async (version: any) => {
    try {
      // Update the panel with the restored version
      await updatePanel(selectedPanel.id, {
        imageUrl: version.imageUrl,
        prompt: version.prompt,
        characterHandles: version.characterHandles,
        styleLocks: version.styleLocks,
      });
    } catch (error) {
      console.error("Failed to restore version:", error);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
        VERSION HISTORY
      </h3>
      <VersionHistory panelId={selectedPanel.id} onRestore={handleRestore} />
    </div>
  );
}

// Chat Panel Component
function ChatPanel({
  projectId,
  selectedPanel,
}: {
  projectId: string;
  selectedPanel: any;
}) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);

  const handleSend = () => {
    if (!message.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setMessage("");

    // TODO: Implement AI chat
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "AI chat integration coming soon" },
      ]);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full -m-4">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-muted-foreground">AI CHAT</h3>
        {selectedPanel && (
          <div className="text-xs text-muted-foreground mt-1">
            Panel {selectedPanel.panelIndex}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Ask me to:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Regenerate with changes</li>
              <li>Fix specific details</li>
              <li>Change composition</li>
              <li>Edit speech bubbles</li>
            </ul>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask AI..."
            className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
