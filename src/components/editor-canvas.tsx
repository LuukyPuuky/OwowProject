"use client";

import { memo } from "react";
import { PixelCanvas } from "@/components/pixel-canvas";
import type { BrushMode, BrushShape, Tool } from "@/lib/types";

interface EditorCanvasProps {
  pixels: boolean[];
  onPixelsChange: (pixels: boolean[]) => void;
  brushSize: number;
  brushMode: BrushMode;
  brushShape: BrushShape;
  activeTool: Tool;
  onionSkin: boolean[] | null;
  selection: { startX: number; startY: number; endX: number; endY: number } | null;
  onSelectionChange: (selection: { startX: number; startY: number; endX: number; endY: number } | null) => void;
  isSelecting: boolean;
  onSelectingChange: (isSelecting: boolean) => void;
  disabled?: boolean;
}

/**
 * Main canvas wrapper for pixel editing
 */
export const EditorCanvas = memo<EditorCanvasProps>(
  ({
    pixels,
    onPixelsChange,
    brushSize,
    brushMode,
    brushShape,
    activeTool,
    onionSkin,
    selection,
    onSelectionChange,
    isSelecting,
    onSelectingChange,
    disabled = false,
  }) => {
    return (
      <div className="w-full bg-black border-2 border-neutral-800 rounded-lg overflow-hidden mb-6 p-6 flex items-center justify-center">
        <PixelCanvas
          pixels={pixels}
          onPixelsChange={disabled ? () => {} : onPixelsChange}
          brushSize={brushSize}
          brushMode={brushMode}
          brushShape={brushShape}
          activeTool={activeTool}
          onionSkin={onionSkin || undefined}
          cellSize={14}
          showGrid={true}
          selection={selection}
          onSelectionChange={onSelectionChange}
          isSelecting={isSelecting}
          onSelectingChange={onSelectingChange}
        />
      </div>
    );
  }
);

EditorCanvas.displayName = "EditorCanvas";
