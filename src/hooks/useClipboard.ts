import { useState, useCallback } from "react";

interface Selection {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface ClipboardData {
  width: number;
  height: number;
  pixels: boolean[];
}

/**
 * Custom hook for managing clipboard operations and selection
 * Handles copy, cut, paste, and selection state
 */
export function useClipboard() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const copy = useCallback((pixels: boolean[], selection: Selection, canvasWidth: number) => {
    if (!selection) return;

    const { startX, startY, endX, endY } = selection;
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);
    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    const clipboardPixels: boolean[] = [];
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        clipboardPixels.push(pixels[y * canvasWidth + x]);
      }
    }

    setClipboard({ width, height, pixels: clipboardPixels });
  }, []);

  const cut = useCallback((pixels: boolean[], selection: Selection, canvasWidth: number) => {
    if (!selection) return null;

    copy(pixels, selection, canvasWidth);

    const { startX, startY, endX, endY } = selection;
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    const newPixels = [...pixels];
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        newPixels[y * canvasWidth + x] = false;
      }
    }

    setSelection(null);
    return newPixels;
  }, [copy]);

  const paste = useCallback((pixels: boolean[], pasteX: number, pasteY: number, canvasWidth: number, canvasHeight: number) => {
    if (!clipboard) return null;

    const newPixels = [...pixels];
    for (let y = 0; y < clipboard.height; y++) {
      for (let x = 0; x < clipboard.width; x++) {
        const targetX = pasteX + x;
        const targetY = pasteY + y;
        if (targetX >= 0 && targetX < canvasWidth && targetY >= 0 && targetY < canvasHeight) {
          newPixels[targetY * canvasWidth + targetX] = clipboard.pixels[y * clipboard.width + x];
        }
      }
    }

    return newPixels;
  }, [clipboard]);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setIsSelecting(false);
  }, []);

  const hasSelection = selection !== null;
  const hasClipboard = clipboard !== null;

  return {
    selection,
    setSelection,
    clipboard,
    setClipboard,
    isSelecting,
    setIsSelecting,
    copy,
    cut,
    paste,
    clearSelection,
    hasSelection,
    hasClipboard,
  };
}
