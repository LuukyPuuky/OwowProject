import { useEffect } from "react";
import type { Tool, BrushMode } from "@/lib/types";

export interface KeyboardShortcutsOptions {
  onPlayPause?: () => void;
  onNextFrame?: () => void;
  onPrevFrame?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onToolChange?: (tool: Tool) => void;
  onBrushModeChange?: (mode: BrushMode) => void;
  onBrushSizeChange?: (delta: number) => void;
  onClearSelection?: () => void;
  hasSelection?: boolean;
  hasClipboard?: boolean;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore shortcuts when typing in form fields (e.g., project title input)
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable =
        target?.isContentEditable ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT";
      if (isEditable) return;

      // Space: Play/Pause
      if (e.code === "Space" && options.onPlayPause) {
        e.preventDefault();
        options.onPlayPause();
      }
      // ArrowRight: Next frame
      if (e.code === "ArrowRight" && options.onNextFrame) {
        e.preventDefault();
        options.onNextFrame();
      }
      // ArrowLeft: Previous frame
      if (e.code === "ArrowLeft" && options.onPrevFrame) {
        e.preventDefault();
        options.onPrevFrame();
      }
      // Ctrl+C: Copy
      if (e.ctrlKey && e.code === "KeyC" && options.onCopy && options.hasSelection) {
        e.preventDefault();
        options.onCopy();
      }
      // Ctrl+X: Cut
      if (e.ctrlKey && e.code === "KeyX" && options.onCut && options.hasSelection) {
        e.preventDefault();
        options.onCut();
      }
      // Ctrl+V: Paste
      if (e.ctrlKey && e.code === "KeyV" && options.onPaste && options.hasClipboard) {
        e.preventDefault();
        options.onPaste();
      }
      // Ctrl+Z: Undo
      if (e.ctrlKey && e.code === "KeyZ" && options.onUndo) {
        e.preventDefault();
        options.onUndo();
      }
      // B: Brush
      if (e.code === "KeyB" && options.onToolChange) {
        e.preventDefault();
        options.onToolChange("brush");
        if (options.onBrushModeChange) options.onBrushModeChange("paint");
      }
      // X: Eraser
      if (e.code === "KeyX" && options.onToolChange) {
        e.preventDefault();
        options.onToolChange("brush");
        if (options.onBrushModeChange) options.onBrushModeChange("erase");
      }
      // L: Line
      if (e.code === "KeyL" && options.onToolChange) {
        e.preventDefault();
        options.onToolChange("line");
      }
      // E: Ellipse
      if (e.code === "KeyE" && options.onToolChange) {
        e.preventDefault();
        options.onToolChange("ellipse");
      }
      // R: Rectangle
      if (e.code === "KeyR" && options.onToolChange) {
        e.preventDefault();
        options.onToolChange("rect");
      }
      // F: Fill
      if (e.code === "KeyF" && options.onToolChange) {
        e.preventDefault();
        options.onToolChange("fill");
      }
      // S: Select
      if (e.code === "KeyS" && options.onToolChange) {
        e.preventDefault();
        options.onToolChange("select");
      }
      // [: Brush size down
      if (e.code === "BracketLeft" && options.onBrushSizeChange) {
        e.preventDefault();
        options.onBrushSizeChange(-1);
      }
      // ]: Brush size up
      if (e.code === "BracketRight" && options.onBrushSizeChange) {
        e.preventDefault();
        options.onBrushSizeChange(1);
      }
      // Escape: Clear selection
      if (e.code === "Escape" && options.onClearSelection) {
        e.preventDefault();
        options.onClearSelection();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options]);
}
