import { useState, useCallback } from "react";
import type { Tool, BrushMode, BrushShape } from "@/lib/types";

/**
 * Custom hook for managing drawing tools and brush settings
 * Handles tool selection, brush mode, shape, size, and onion skinning
 */
export function useDrawingTools() {
  const [activeTool, setActiveTool] = useState<Tool>('brush');
  const [brushMode, setBrushMode] = useState<BrushMode>('paint');
  const [brushShape, setBrushShape] = useState<BrushShape>('circle');
  const [brushSize, setBrushSize] = useState(2);
  const [onionEnabled, setOnionEnabled] = useState(false);

  const selectTool = useCallback((tool: Tool) => {
    setActiveTool(tool);
    // Reset selection when switching away from select tool
    if (tool !== 'select') {
      setActiveTool(tool);
    }
  }, []);

  const toggleOnion = useCallback(() => {
    setOnionEnabled(prev => !prev);
  }, []);

  const increaseBrushSize = useCallback(() => {
    setBrushSize(prev => Math.min(prev + 1, 10));
  }, []);

  const decreaseBrushSize = useCallback(() => {
    setBrushSize(prev => Math.max(prev - 1, 1));
  }, []);

  return {
    activeTool,
    setActiveTool: selectTool,
    brushMode,
    setBrushMode,
    brushShape,
    setBrushShape,
    brushSize,
    setBrushSize,
    onionEnabled,
    setOnionEnabled,
    toggleOnion,
    increaseBrushSize,
    decreaseBrushSize,
  };
}
