"use client";

import { use, useRef } from "react";
import { EditorLayout } from "./editor-layout";
import { EditorCanvasContent } from "./editor-canvas-content";

export default function EditorPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const addBubbleRef = useRef<(() => void) | null>(null);

  return (
    <EditorLayout projectId={projectId} onAddBubbleRef={addBubbleRef}>
      <EditorCanvasContent onAddBubbleRef={addBubbleRef} />
    </EditorLayout>
  );
}
