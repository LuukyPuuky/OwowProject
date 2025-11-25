"use client";

import React, { memo } from "react";
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v6m0 0h16m-16 0v-6m16 6v-6m0 0V4" />
          </svg>
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
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            </>
          ) : (
            <>
              Play
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <polygon points="5 3 19 12 5 21" />
              </svg>
            </>
          )}
        </button>

        {/* Add Frame and Duplicate Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onAddFrame}
            className="flex-1 bg-[#161616] border border-[#323232] rounded-lg px-3 py-2 text-[#c3c3c3] transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Frame
          </button>
          <button
            onClick={onDuplicate}
            className="flex-1 bg-[#161616] border border-[#323232] rounded-lg px-3 py-2 text-[#c3c3c3] transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
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
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="6" width="12" height="12" />
              </svg>
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
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                <circle cx="12" cy="12" r="6" />
              </svg>
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
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                <polygon points="12,6 18,18 6,18" />
              </svg>
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </button>
          <button 
            onClick={onNextFrame}
            className="flex-1 bg-[#161616] border border-[#323232] rounded-lg px-3 py-2 text-[#c3c3c3] hover:border-[#444444] transition-colors flex items-center justify-center gap-2 text-sm"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3H4a1 1 0 000 2h1.05L5 19a3 3 0 003 3h8a3 3 0 003-3l.95-12H20a1 1 0 100-2h-3z" />
          </svg>
          Remove Frame
        </button>
      </div>
    </div>
  );
});

ControlPanel.displayName = 'ControlPanel';
