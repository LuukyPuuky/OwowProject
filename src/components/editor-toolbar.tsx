"use client";

import { memo } from "react";
import {
  Paintbrush,
  Eraser,
  Minus,
  Circle,
  Square,
  RectangleHorizontal,
  Copy,
  Scissors,
  Clipboard as ClipboardIcon,
  RotateCcw,
  RotateCw,
  Droplet,
} from "lucide-react";
import type { Tool, BrushMode } from "@/lib/types";

interface EditorToolbarProps {
  activeTool: Tool;
  brushMode: BrushMode;
  hasClipboard: boolean;
  hasSelection: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: Tool) => void;
  onBrushModeChange: (mode: BrushMode) => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

/**
 * Toolbar component for pixel editor tools
 * Provides brush, eraser, shapes, selection, and clipboard tools
 */
export const EditorToolbar = memo<EditorToolbarProps>(
  ({
    activeTool,
    brushMode,
    hasClipboard,
    hasSelection,
    canUndo,
    canRedo,
    onToolChange,
    onBrushModeChange,
    onCopy,
    onCut,
    onPaste,
    onUndo,
    onRedo,
  }) => {
    return (
      <div className="bg-background border-2 border-neutral-800 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-neutral-300 text-sm font-medium">Tools</span>
          <div className="flex-1 border-b border-neutral-800"></div>
          <span className="text-neutral-600 text-xs">
            B • X • L • E • R • F • S {hasClipboard && "• Ctrl+V"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Brush */}
          <button
            onClick={() => {
              onToolChange("brush");
              onBrushModeChange("paint");
            }}
            className={`p-2 rounded-md transition-colors ${brushMode === "paint"
                ? "bg-white text-black"
                : "bg-background text-neutral-300 hover:bg-neutral-800"
              }`}
            title="Brush (B)"
          >
            <Paintbrush className="w-5 h-5" />
          </button>

          {/* Eraser */}
          <button
            onClick={() => {
              onToolChange("brush");
              onBrushModeChange("erase");
            }}
            className={`p-2 rounded-md transition-colors ${brushMode === "erase"
                ? "bg-white text-black"
                : "bg-background text-neutral-300 hover:bg-neutral-800"
              }`}
            title="Eraser (X)"
          >
            <Eraser className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-neutral-800 mx-1"></div>

          {/* Line */}
          <button
            onClick={() => onToolChange("line")}
            className={`p-2 rounded-md transition-colors ${activeTool === "line"
                ? "bg-white text-black"
                : "bg-background text-neutral-300 hover:bg-neutral-800"
              }`}
            title="Line (L)"
          >
            <Minus className="w-5 h-5" />
          </button>

          {/* Ellipse */}
          <button
            onClick={() => onToolChange("ellipse")}
            className={`p-2 rounded-md transition-colors ${activeTool === "ellipse"
                ? "bg-white text-black"
                : "bg-background text-neutral-300 hover:bg-neutral-800"
              }`}
            title="Ellipse (E)"
          >
            <Circle className="w-5 h-5" />
          </button>

          {/* Rectangle */}
          <button
            onClick={() => onToolChange("rect")}
            className={`p-2 rounded-md transition-colors ${activeTool === "rect"
                ? "bg-white text-black"
                : "bg-background text-neutral-300 hover:bg-neutral-800"
              }`}
            title="Rectangle (R)"
          >
            <Square className="w-5 h-5" />
          </button>

          {/* Fill */}
          <button
            onClick={() => onToolChange("fill")}
            className={`p-2 rounded-md transition-colors ${activeTool === "fill"
                ? "bg-white text-black"
                : "bg-background text-neutral-300 hover:bg-neutral-800"
              }`}
            title="Fill (F)"
          >
            <Droplet className="w-5 h-5" />
          </button>

          {/* Select */}
          <button
            onClick={() => onToolChange("select")}
            className={`p-2 rounded-md transition-colors ${activeTool === "select"
                ? "bg-white text-black"
                : "bg-background text-neutral-300 hover:bg-neutral-800"
              }`}
            title="Select (S)"
          >
            <RectangleHorizontal className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-neutral-800 mx-1"></div>

          {/* Copy */}
          <button
            onClick={onCopy}
            disabled={!hasSelection}
            className={`p-2 rounded-md transition-colors ${!hasSelection
                ? "text-neutral-700 cursor-not-allowed"
                : "text-neutral-300 hover:bg-neutral-800"
              }`}
            title={!hasSelection ? "Select an area first to copy" : "Copy (Ctrl+C)"}
          >
            <Copy className="w-5 h-5" />
          </button>

          {/* Cut */}
          <button
            onClick={onCut}
            disabled={!hasSelection}
            className={`p-2 rounded-md transition-colors ${!hasSelection
                ? "text-neutral-700 cursor-not-allowed"
                : "text-neutral-300 hover:bg-neutral-800"
              }`}
            title={!hasSelection ? "Select an area first to cut" : "Cut (Ctrl+X)"}
          >
            <Scissors className="w-5 h-5" />
          </button>

          {/* Paste */}
          <button
            onClick={onPaste}
            disabled={!hasClipboard}
            className={`p-2 rounded-md transition-colors ${!hasClipboard
                ? "text-neutral-700 cursor-not-allowed"
                : "text-neutral-300 hover:bg-neutral-800"
              }`}
            title={!hasClipboard ? "Clipboard is empty" : "Paste (Ctrl+V)"}
          >
            <ClipboardIcon className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-neutral-800 mx-1"></div>

          {/* Undo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-2 rounded-md transition-colors ${!canUndo
                ? "text-neutral-700 cursor-not-allowed"
                : "text-neutral-300 hover:bg-neutral-800"
              }`}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Redo */}
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`p-2 rounded-md transition-colors ${!canRedo
                ? "text-neutral-700 cursor-not-allowed"
                : "text-neutral-300 hover:bg-neutral-800"
              }`}
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }
);

EditorToolbar.displayName = "EditorToolbar";
