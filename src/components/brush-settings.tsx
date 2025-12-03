"use client";

import { memo } from "react";
import { Square, Circle, Triangle } from "lucide-react";
import type { BrushShape } from "@/lib/types";

interface BrushSettingsProps {
  brushSize: number;
  brushShape: BrushShape;
  onionSkinEnabled: boolean;
  onBrushSizeChange: (size: number) => void;
  onBrushShapeChange: (shape: BrushShape) => void;
  onOnionSkinToggle: () => void;
}

/**
 * Brush configuration controls
 */
export const BrushSettings = memo<BrushSettingsProps>(
  ({
    brushSize,
    brushShape,
    onionSkinEnabled,
    onBrushSizeChange,
    onBrushShapeChange,
    onOnionSkinToggle,
  }) => {
    return (
      <div className="space-y-4">
        {/* Size Slider */}
        <div className="space-y-2">
          <label className="block text-neutral-400 text-sm">Size</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="8"
              value={brushSize}
              onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
              className="flex-1 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-500"
            />
            <span className="text-neutral-300 text-sm w-8">{brushSize}</span>
          </div>
        </div>

        {/* Brush Type */}
        <div className="space-y-2">
          <label className="block text-neutral-400 text-sm">Brush Type</label>
          <div className="grid grid-cols-3 gap-2">
            {/* Square */}
            <button
              onClick={() => onBrushShapeChange("square")}
              className={`aspect-square rounded-lg border transition-colors ${
                brushShape === "square"
                  ? "border-white bg-neutral-800"
                  : "border-neutral-800 bg-background hover:border-neutral-700"
              } flex items-center justify-center`}
            >
              <Square className="w-6 h-6" fill="white" />
            </button>

            {/* Circle */}
            <button
              onClick={() => onBrushShapeChange("circle")}
              className={`aspect-square rounded-lg border transition-colors ${
                brushShape === "circle"
                  ? "border-white bg-neutral-800"
                  : "border-neutral-800 bg-background hover:border-neutral-700"
              } flex items-center justify-center`}
            >
              <Circle className="w-6 h-6" fill="white" />
            </button>

            {/* Triangle */}
            <button
              onClick={() => onBrushShapeChange("triangle")}
              className={`aspect-square rounded-lg border transition-colors ${
                brushShape === "triangle"
                  ? "border-white bg-neutral-800"
                  : "border-neutral-800 bg-background hover:border-neutral-700"
              } flex items-center justify-center`}
            >
              <Triangle className="w-6 h-6" fill="white" />
            </button>
          </div>
        </div>

        {/* Onion Skin */}
        <div className="flex items-center justify-between">
          <label className="text-neutral-400 text-sm">Onion Skin</label>
          <button
            onClick={onOnionSkinToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              onionSkinEnabled ? "bg-blue-600" : "bg-neutral-800"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                onionSkinEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    );
  }
);

BrushSettings.displayName = "BrushSettings";
