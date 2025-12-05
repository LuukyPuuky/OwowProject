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

interface MousePosition {
  x: number;
  y: number;
}

/**
 * Custom hook for managing clipboard operations and selection
 * Handles copy, cut, paste, and selection state
 * Tracks mouse position for smart paste positioning
 */
export function useClipboard() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<MousePosition | null>(null);

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
        const index = y * canvasWidth + x;
        // Only copy white pixels (true values)
        clipboardPixels.push(pixels[index] === true);
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

  const paste = useCallback((pixels: boolean[], canvasWidth: number, canvasHeight: number, mousePos?: MousePosition | null) => {
    if (!clipboard) return null;

    // Calculate paste position centered on mouse, or center of canvas if no mouse pos
    let pasteX: number;
    let pasteY: number;

    if (mousePos) {
      // Center the clipboard on the mouse position
      pasteX = Math.max(0, Math.min(mousePos.x - Math.floor(clipboard.width / 2), canvasWidth - clipboard.width));
      pasteY = Math.max(0, Math.min(mousePos.y - Math.floor(clipboard.height / 2), canvasHeight - clipboard.height));
    } else {
      // Fallback to center of canvas if no mouse position
      pasteX = Math.floor((canvasWidth - clipboard.width) / 2);
      pasteY = Math.floor((canvasHeight - clipboard.height) / 2);
    }

    const newPixels = [...pixels];
    for (let y = 0; y < clipboard.height; y++) {
      for (let x = 0; x < clipboard.width; x++) {
        const targetX = pasteX + x;
        const targetY = pasteY + y;
        if (targetX >= 0 && targetX < canvasWidth && targetY >= 0 && targetY < canvasHeight) {
          const sourceIndex = y * clipboard.width + x;
          const targetIndex = targetY * canvasWidth + targetX;
          // Only paste white pixels (true values)
          if (clipboard.pixels[sourceIndex]) {
            newPixels[targetIndex] = true;
          }
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

  const updateMousePos = useCallback((x: number, y: number) => {
    setLastMousePos({ x, y });
  }, []);

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
    updateMousePos,
    lastMousePos,
    hasSelection,
    hasClipboard,
  };
}
