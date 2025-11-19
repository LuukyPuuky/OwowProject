"use client";

import React, { useState } from "react";

interface ControlPanelProps {
  onPlay?: () => void;
  onCreateNew?: () => void;
  onSave?: () => void;
  onAddFrame?: () => void;
  onDuplicate?: () => void;
  onRemoveFrame?: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onPlay,
  onCreateNew,
  onSave,
  onAddFrame,
  onDuplicate,
  onRemoveFrame,
}) => {
  const [projectName, setProjectName] = useState("Untitled");
  const [size, setSize] = useState(50);
  const [brushType, setBrushType] = useState<"square" | "circle" | "triangle" | "eraser">("square");
  const [onionSlicer, setOnionSlicer] = useState(true);
  const [frameDuration, setFrameDuration] = useState(300);

  const brushTypes = [
    { id: "square", label: "Square" },
    { id: "circle", label: "Circle" },
    { id: "triangle", label: "Triangle" },
    { id: "eraser", label: "Eraser" },
  ];

  return (
    <div className="w-80 rounded-lg p-6 space-y-6 bg-[#161616] border border-[#323232] text-[#c3c3c3]">
      {/* Project Name Input */}
      <input
        type="text"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
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
        {/* Play Button */}
        <button
          onClick={onPlay}
          className="w-full bg-[#161616] border border-[#323232] rounded-lg px-4 py-3 text-[#c3c3c3] transition-colors flex items-center justify-center gap-2"
        >
          Play
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <polygon points="5 3 19 12 5 21" />
          </svg>
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
              min="10"
              max="100"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              className="flex-1 h-1 bg-[#323232] rounded-lg appearance-none cursor-pointer accent-[#c3c3c3]"
            />
          </div>
        </div>

        {/* Brush Type */}
        <div className="space-y-3">
          <label className="block text-[#c3c3c3] text-sm font-medium">Brush Type</label>
          <div className="grid grid-cols-4 gap-2">
            {/* Square */}
            <button
              onClick={() => setBrushType("square")}
              className={`aspect-square rounded-lg border transition-colors ${
                brushType === "square"
                  ? "border-[#323232] bg-[#161616]"
                  : "border-[#323232] bg-[#161616] hover:border-[#323232]"
              } flex items-center justify-center`}
            >
              <div className="w-4 h-4 bg-white rounded-sm" />
            </button>

            {/* Circle */}
            <button
              onClick={() => setBrushType("circle")}
              className={`aspect-square rounded-lg border transition-colors ${
                brushType === "circle"
                  ? "border-[#323232] bg-[#161616]"
                  : "border-[#323232] bg-[#161616] hover:border-[#323232]"
              } flex items-center justify-center`}
            >
              <div className="w-4 h-4 bg-white rounded-full" />
            </button>

            {/* Triangle */}
            <button
              onClick={() => setBrushType("triangle")}
              className={`aspect-square rounded-lg border transition-colors ${
                brushType === "triangle"
                  ? "border-[#323232] bg-[#161616]"
                  : "border-[#323232] bg-[#161616] hover:border-[#323232]"
              } flex items-center justify-center`}
            >
              <div className="w-0 h-0 border-l-2 border-r-2 border-b-4 border-l-transparent border-r-transparent border-b-white" />
            </button>

            {/* Eraser */}
            <button
              onClick={() => setBrushType("eraser")}
              className={`aspect-square rounded-lg border transition-colors ${
                brushType === "eraser"
                  ? "border-[#323232] bg-[#161616]"
                  : "border-[#323232] bg-[#161616] hover:border-[#323232]"
              } flex items-center justify-center`}
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Onion Slicer */}
        <div className="flex items-center justify-between">
          <label className="text-[#c3c3c3] text-sm font-medium">Onion Slicer</label>
          <input
            type="checkbox"
            checked={onionSlicer}
            onChange={(e) => setOnionSlicer(e.target.checked)}
            className="w-5 h-5 rounded bg-[#161616] border border-[#323232] cursor-pointer accent-[#c3c3c3]"
          />
        </div>

        {/* Next/Prev Frame Buttons */}
        <div className="flex gap-3">
          <button className="flex-1 bg-[#161616] border border-[#323232] rounded-lg px-3 py-2 text-[#c3c3c3] hover:border-[#323232] transition-colors flex items-center justify-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Next Frame
          </button>
          <button className="flex-1 bg-[#161616] border border-[#323232] rounded-lg px-3 py-2 text-[#c3c3c3] hover:border-[#323232] transition-colors flex items-center justify-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Prev Frame
          </button>
        </div>

        {/* Frame Duration */}
        <div className="flex items-center justify-between">
          <label className="text-[#c3c3c3] text-sm font-medium">Frame Duration</label>
          <div className="flex items-center bg-[#161616] border border-[#323232] rounded-lg px-3 py-1">
            <input
              type="number"
              value={frameDuration}
              onChange={(e) => setFrameDuration(parseInt(e.target.value))}
              className="w-16 bg-transparent text-[#c3c3c3] text-sm focus:outline-none text-right"
            />
            <span className="text-[#c3c3c3] text-sm ml-1">ms</span>
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
};
