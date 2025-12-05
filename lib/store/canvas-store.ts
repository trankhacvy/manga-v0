import { create } from "zustand";

interface CanvasState {
  // UI state
  zoom: number;
  canvasOffset: { x: number; y: number };

  // Actions - Canvas controls
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToView: (
    items: { x: number; y: number; width: number; height: number }[],
    containerWidth: number,
    containerHeight: number
  ) => void;
  centerOnPage: (pageId: string) => void;
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  resetCanvas: () => void;
}

const initialState = {
  zoom: 1,
  canvasOffset: { x: 0, y: 0 },
};

export const useCanvasStore = create<CanvasState>((set, get) => ({
  ...initialState,

  // Canvas controls
  setZoom: (zoom: number) => {
    set({ zoom: Math.min(3, Math.max(0.1, zoom)) });
  },

  zoomIn: () => {
    const currentZoom = get().zoom;
    const newZoom = Math.min(3, currentZoom + 0.1);
    set({ zoom: newZoom });
  },

  zoomOut: () => {
    const currentZoom = get().zoom;
    const newZoom = Math.max(0.1, currentZoom - 0.1);
    set({ zoom: newZoom });
  },

  resetZoom: () => {
    set({ zoom: 1 });
  },

  fitToView: (items, containerWidth, containerHeight) => {
    if (items.length === 0) {
      set({ zoom: 1, canvasOffset: { x: 0, y: 0 } });
      return;
    }

    // Calculate bounding box of all items (panels or pages)
    const minX = Math.min(...items.map((p) => p.x));
    const minY = Math.min(...items.map((p) => p.y));
    const maxX = Math.max(...items.map((p) => p.x + p.width));
    const maxY = Math.max(...items.map((p) => p.y + p.height));

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Calculate zoom to fit with padding
    const padding = 50;
    const zoomX = (containerWidth - padding * 2) / contentWidth;
    const zoomY = (containerHeight - padding * 2) / contentHeight;
    const newZoom = Math.min(zoomX, zoomY, 3);

    // Calculate offset to center content
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const offsetX = containerWidth / 2 - centerX * newZoom;
    const offsetY = containerHeight / 2 - centerY * newZoom;

    set({
      zoom: Math.max(0.1, newZoom),
      canvasOffset: { x: offsetX, y: offsetY },
    });
  },

  centerOnPage: (pageId: string) => {
    // This method will be called with the page ID
    // The actual implementation needs access to the editor store to get panels
    // For now, we'll just reset the canvas - the actual centering logic
    // should be implemented in the component that has access to both stores
    console.log("Center on page:", pageId);
  },

  setCanvasOffset: (offset: { x: number; y: number }) => {
    set({ canvasOffset: offset });
  },

  resetCanvas: () => {
    set({
      zoom: 1,
      canvasOffset: { x: 0, y: 0 },
    });
  },
}));
