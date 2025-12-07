"use client";

import { useCanvasStore } from "@/lib/store/canvas-store";
import { SketchUpload } from "./sketch-upload";
import { VersionHistory } from "./version-history";

export function PanelEditor() {
  // const {
  //   getSelectedPanel,
  //   setSketchForPanel,
  //   removeSketchFromPanel,
  //   setControlNetStrength,
  // } = useCanvasStore();

  // const selectedPanel = getSelectedPanel();

  // if (!selectedPanel) {
  //   return (
  //     <div className="p-4 text-sm text-gray-500">
  //       Select a panel to edit its properties
  //     </div>
  //   );
  // }

  return (
    <div className="p-4 space-y-4">
      {/* <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Panel Properties
        </h3>
        <div className="text-xs text-gray-600 space-y-1">
          <div>
            Position: ({selectedPanel.x}, {selectedPanel.y})
          </div>
          <div>
            Size: {selectedPanel.width} × {selectedPanel.height}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <SketchUpload
          panelId={selectedPanel.id}
          currentSketchUrl={selectedPanel.sketchUrl}
          controlNetStrength={selectedPanel.controlNetStrength}
          onSketchUpload={(sketchUrl) => {
            setSketchForPanel(selectedPanel.id, sketchUrl);
          }}
          onSketchRemove={() => {
            removeSketchFromPanel(selectedPanel.id);
          }}
          onStrengthChange={(strength) => {
            setControlNetStrength(selectedPanel.id, strength);
          }}
        />
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="text-xs text-gray-600">
          <p className="font-medium mb-1">Prompt:</p>
          <p className="text-gray-500">{selectedPanel.prompt}</p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <VersionHistory panelId={selectedPanel.id} />
      </div> */}
    </div>
  );
}
