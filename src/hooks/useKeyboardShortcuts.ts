import { useEffect } from "react";
import type { Tool, BrushMode } from "@/lib/types";

interface UseKeyboardShortcutsProps {
  onPlayPause: () => void;
  onNextFrame: () => void;
  onPrevFrame: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onUndo: () => void;
  onToolChange: (tool: Tool) => void;
  onBrushModeChange: (mode: BrushMode) => void;
  onBrushSizeChange: (delta: number) => void;
  onClearSelection: () => void;
  hasSelection: boolean;
  hasClipboard: boolean;
}

/**
 * Hook that manages keyboard shortcuts for the editor
 */
export function useKeyboardShortcuts({
  onPlayPause,
  onNextFrame,
  onPrevFrame,
  onCopy,
  onPaste,
  onUndo,
  onToolChange,
  onBrushModeChange,
  onBrushSizeChange,
  onClearSelection,
  hasSelection,
  hasClipboard,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const key = e.key.toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      
      // Playback controls
      if (key === ' ') {
        e.preventDefault();
        onPlayPause();
      } else if (key === 'arrowleft') {
        e.preventDefault();
        onPrevFrame();
      } else if (key === 'arrowright') {
        e.preventDefault();
        onNextFrame();
      }
      
      // Tool shortcuts
      else if (key === 'b') {
        onToolChange('brush');
        onBrushModeChange('paint');
      } else if (key === 'x') {
        onToolChange('brush');
        onBrushModeChange('erase');
      } else if (key === 'l') {
        onToolChange('line');
      } else if (key === 'e') {
        onToolChange('ellipse');
      } else if (key === 'r') {
        onToolChange('rect');
      } else if (key === 'f') {
        onToolChange('fill');
      } else if (key === 's') {
        onToolChange('select');
      }
      
      // Brush size
      else if (key === '[') {
        onBrushSizeChange(-1);
      } else if (key === ']') {
        onBrushSizeChange(1);
      }
      
      // Clipboard
      else if (ctrlOrCmd && key === 'c' && hasSelection) {
        e.preventDefault();
        onCopy();
      } else if (ctrlOrCmd && key === 'v' && hasClipboard) {
        e.preventDefault();
        onPaste();
      }
      
      // History
      else if (ctrlOrCmd && key === 'z') {
        e.preventDefault();
        onUndo();
      }
      
      // Clear selection
      else if (key === 'escape' && hasSelection) {
        onClearSelection();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onPlayPause,
    onNextFrame,
    onPrevFrame,
    onCopy,
    onPaste,
    onUndo,
    onToolChange,
    onBrushModeChange,
    onBrushSizeChange,
    onClearSelection,
    hasSelection,
    hasClipboard,
  ]);
}
