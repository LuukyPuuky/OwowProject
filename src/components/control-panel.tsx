"use client";

import { memo } from "react";
import { 
  Save, 
  Play, 
  Pause, 
  Plus, 
  Copy, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Square,
  Circle,
  Triangle
} from "lucide-react";
import type { BrushShape } from "@/lib/types";

interface ControlPanelProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  size: number;
  onSizeChange: (size: number) => void;
  brushType: BrushShape;
  onBrushTypeChange: (type: BrushShape) => void;
  onionSlicer: boolean;
  onOnionSlicerChange: (enabled: boolean) => void;
  frameDuration: number;
  onFrameDurationChange: (duration: number) => void;
  onPlay: () => void;
  onCreateNew: () => void;
  onSave: () => void;
  onAddFrame: () => void;
  onDuplicate: () => void;
  onRemoveFrame: () => void;
  onNextFrame: () => void;
  onPrevFrame: () => void;
  currentFrame: number;
  totalFrames: number;
  isPlaying?: boolean;
}

export const ControlPanel = memo<ControlPanelProps>(({
  projectName,
  onProjectNameChange,
  size,
  onSizeChange,
  brushType,
  onBrushTypeChange,
  onionSlicer,
  onOnionSlicerChange,
  frameDuration,
  onFrameDurationChange,
  onPlay,
  onCreateNew,
  onSave,
  onAddFrame,
  onDuplicate,
  onRemoveFrame,
  onNextFrame,
  onPrevFrame,
  currentFrame,
  totalFrames,
  isPlaying = false,
}) => {

  return (
    <div className="w-80 rounded-lg p-6 space-y-6 bg-[#161616] border border-[#323232] text-[#c3c3c3]">
      {/* Project Name Input */}
      <input
        type="text"
        value={projectName}
        onChange={(e) => onProjectNameChange(e.target.value)}
        className="w-full bg-[#161616] border border-[#323232] rounded-lg px-4 py-3 text-[#c3c3c3] placeholder-[#c3c3c3] focus:outline-none focus:border-[#323232] text-center"
        placeholder="Untitled"
      />

      {/* Create New and Save Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCreateNew}
          className="flex-1 bg-[#161616] border border-[#323232] rounded-lg px-4 py-2 text-[#c3c3c3] transition-colors"
        >
          Create New
        </button>
        <button
          onClick={onSave}
          className="flex-1 bg-[#161616] border border-[#323232] rounded-lg px-4 py-2 text-[#c3c3c3] transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>

      {/* Main Control Box */}
      <div className="bg-[#161616] border border-[#323232] rounded-lg p-5 space-y-5">
        {/* Play/Pause Button */}
        <button
          onClick={onPlay}
          className="w-full bg-[#161616] border border-[#323232] rounded-lg px-4 py-3 text-[#c3c3c3] hover:border-[#444444] transition-colors flex items-center justify-center gap-2"
        >
          {isPlaying ? (
            <>
              Pause
              <Pause className="w-5 h-5" />
            </>
          ) : (
            <>
              Play
              <Play className="w-5 h-5" />
            </>
          )}
        </button>

        {/* Add Frame and Duplicate Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onAddFrame}
            className="flex-1 bg-[#161616] border border-[#323232] rounded-lg px-3 py-2 text-[#c3c3c3] transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Frame
          </button>
          <button
            onClick={onDuplicate}
            className="flex-1 bg-[#161616] border border-[#323232] rounded-lg px-3 py-2 text-[#c3c3c3] transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
        </div>

        {/* Size Slider */}
        <div className="space-y-2">
          <label className="block text-[#c3c3c3] text-sm font-medium">Size</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="8"
              value={size}
              onChange={(e) => onSizeChange(parseInt(e.target.value))}
              className="flex-1 h-1 bg-[#323232] rounded-lg appearance-none cursor-pointer accent-[#c3c3c3]"
            />
            <span className="text-[#c3c3c3] text-sm w-8">{size}</span>
          </div>
        </div>

        {/* Brush Type */}
        <div className="space-y-3">
          <label className="block text-[#c3c3c3] text-sm font-medium">Brush Type</label>
          <div className="grid grid-cols-3 gap-2">
            {/* Square */}
            <button
              onClick={() => onBrushTypeChange("square")}
              className={`aspect-square rounded-lg border transition-colors ${
                brushType === "square"
                  ? "border-white bg-[#2a2a2a]"
                  : "border-[#323232] bg-[#161616] hover:border-[#444444]"
              } flex items-center justify-center`}
            >
              <Square className="w-6 h-6" fill="white" />
            </button>

            {/* Circle */}
            <button
              onClick={() => onBrushTypeChange("circle")}
              className={`aspect-square rounded-lg border transition-colors ${
                brushType === "circle"
                  ? "border-white bg-[#2a2a2a]"
                  : "border-[#323232] bg-[#161616] hover:border-[#444444]"
              } flex items-center justify-center`}
            >
              <Circle className="w-6 h-6" fill="white" />
            </button>

            {/* Triangle */}
            <button
              onClick={() => onBrushTypeChange("triangle")}
              className={`aspect-square rounded-lg border transition-colors ${
                brushType === "triangle"
                  ? "border-white bg-[#2a2a2a]"
                  : "border-[#323232] bg-[#161616] hover:border-[#444444]"
              } flex items-center justify-center`}
            >
              <Triangle className="w-6 h-6" fill="white" />
            </button>
          </div>
        </div>

        {/* Onion Slicer */}
        <div className="flex items-center justify-between">
          <label className="text-[#c3c3c3] text-sm font-medium">Onion Skin</label>
          <input
            type="checkbox"
            checked={onionSlicer}
            onChange={(e) => onOnionSlicerChange(e.target.checked)}
            className="w-5 h-5 rounded bg-[#161616] border border-[#323232] cursor-pointer accent-[#c3c3c3]"
          />
        </div>

        {/* Frame Info */}
        <div className="text-center text-[#c3c3c3] text-sm py-2">
          Frame {currentFrame + 1} / {totalFrames}
        </div>

        {/* Next/Prev Frame Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={onPrevFrame}
            className="flex-1 bg-[#161616] border border-[#323232] rounded-lg px-3 py-2 text-[#c3c3c3] hover:border-[#444444] transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <button 
            onClick={onNextFrame}
            className="flex-1 bg-[#161616] border border-[#323232] rounded-lg px-3 py-2 text-[#c3c3c3] hover:border-[#444444] transition-colors flex items-center justify-center gap-2 text-sm"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Frame Duration */}
        <div className="flex items-center justify-between">
          <label className="text-[#c3c3c3] text-sm font-medium">Frame Duration</label>
          <div className="flex items-center bg-[#161616] border border-[#323232] rounded-lg px-3 py-1">
            <input
              type="number"
              value={frameDuration}
              onChange={(e) => onFrameDurationChange(parseFloat(e.target.value) || 0.1)}
              min="0.1"
              max="10"
              step="0.1"
              className="w-16 bg-transparent text-[#c3c3c3] text-sm focus:outline-none text-right"
            />
            <span className="text-[#c3c3c3] text-sm ml-1">sec</span>
          </div>
        </div>

        {/* Remove Frame Button */}
        <button
          onClick={onRemoveFrame}
          className="w-full bg-[#161616] border border-[#323232] rounded-lg px-4 py-2 text-[#c3c3c3] hover:border-[#323232] transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Trash2 className="w-4 h-4" />
          Remove Frame
        </button>
      </div>
    </div>
  );
});

ControlPanel.displayName = 'ControlPanel';
