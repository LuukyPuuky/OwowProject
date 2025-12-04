"use client";

import { useCallback } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas";

export interface ClipboardData {
  width: number;
  height: number;
  pixels: boolean[];
}

export interface ClipboardManagerProps {
  clipboard: ClipboardData | null;
  workingPixels: boolean[];
  selection: { startX: number; startY: number; endX: number; endY: number } | null;
  mousePos: { x: number; y: number } | null;
  onClipboardChange: (clipboard: ClipboardData | null) => void;
  onPixelsChange: (pixels: boolean[]) => void;
  onSelectionClear: () => void;
  onPushHistory: () => void;
}

/**
 * Clipboard operations manager
 * Handles copy/paste operations with smart positioning
 */
export function useClipboardManager(props: ClipboardManagerProps) {
  const {
    clipboard,
    workingPixels,
    selection,
    mousePos,
    onClipboardChange,
    onPixelsChange,
    onSelectionClear,
    onPushHistory,
  } = props;

  /**
   * Copy only white (drawn) pixels from selection
   */
  const copy = useCallback(() => {
    if (!selection) return;

    const minX = Math.min(selection.startX, selection.endX);
    const maxX = Math.max(selection.startX, selection.endX);
    const minY = Math.min(selection.startY, selection.endY);
    const maxY = Math.max(selection.startY, selection.endY);

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const pixels: boolean[] = [];

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const index = y * CANVAS_WIDTH + x;
        // Only copy white pixels (true values)
        pixels.push(workingPixels[index] === true);
      }
    }

    onClipboardChange({ width, height, pixels });
  }, [selection, workingPixels, onClipboardChange]);

  /**
   * Paste clipboard at mouse position (centered)
   */
  const paste = useCallback(() => {
    if (!clipboard) return;

    // Calculate paste position centered on mouse, or center of canvas if no mouse pos
    let pasteX: number;
    let pasteY: number;

    if (mousePos) {
      // Center the clipboard on the mouse position
      pasteX = Math.max(0, Math.min(mousePos.x - Math.floor(clipboard.width / 2), CANVAS_WIDTH - clipboard.width));
      pasteY = Math.max(0, Math.min(mousePos.y - Math.floor(clipboard.height / 2), CANVAS_HEIGHT - clipboard.height));
    } else {
      // Fallback to center of canvas if no mouse position
      pasteX = Math.floor((CANVAS_WIDTH - clipboard.width) / 2);
      pasteY = Math.floor((CANVAS_HEIGHT - clipboard.height) / 2);
    }

    const newPixels = [...workingPixels];

    for (let dy = 0; dy < clipboard.height; dy++) {
      for (let dx = 0; dx < clipboard.width; dx++) {
        const targetX = pasteX + dx;
        const targetY = pasteY + dy;

        if (targetX >= 0 && targetX < CANVAS_WIDTH && targetY >= 0 && targetY < CANVAS_HEIGHT) {
          const sourceIndex = dy * clipboard.width + dx;
          const targetIndex = targetY * CANVAS_WIDTH + targetX;
          // Only paste white pixels (overwrite only if source pixel is true)
          if (clipboard.pixels[sourceIndex]) {
            newPixels[targetIndex] = true;
          }
        }
      }
    }

    onPixelsChange(newPixels);
    onPushHistory();
    onSelectionClear(); // Clear selection after paste
  }, [clipboard, mousePos, workingPixels, onPixelsChange, onPushHistory, onSelectionClear]);

  return { copy, paste };
}
