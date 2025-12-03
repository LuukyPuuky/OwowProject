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

export default function ControlPanel({
  onPlay,
  onCreateNew,
  onSave,
  onAddFrame,
  onDuplicate,
  onRemoveFrame,
}: ControlPanelProps) {
  const [projectName, setProjectName] = useState("Untitled");
  const [size, setSize] = useState(50);
  const [brushType, setBrushType] = useState<
    "square" | "circle" | "triangle" | "eraser"
  >("square");
  const [onionSlicer, setOnionSlicer] = useState(true);
  const [frameDuration, setFrameDuration] = useState(300);

  const brushTypes = [
    { id: "square", label: "Square" },
    { id: "circle", label: "Circle" },
    { id: "triangle", label: "Triangle" },
    { id: "eraser", label: "Eraser" },
  ];

  return (
    <div className="bg-background pt-4 pl-3 space-y-4">
      {/* Project Name Input */}
      <input
        type="text"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        className="w-full bg-background border-2 border-neutral-700 rounded-lg px-3 py-2 text-neutral-400 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 text-center text-xs"
        placeholder="Untitled"
      />

      {/* Create New and Save Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onCreateNew}
          className="flex-1 bg-background border-2 border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-300 hover:border-neutral-500 transition-colors text-xs"
        >
          Create New
        </button>
        <button
          onClick={onSave}
          className="flex-1 bg-background border-2 border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-300 hover:border-neutral-500 transition-colors flex items-center justify-center gap-1 text-xs"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v6m0 0h16m-16 0v-6m16 6v-6m0 0V4"
            />
          </svg>
          Save
        </button>
      </div>

      <div className="bg-background space-y-3">
        {/* Play Button */}
        <button
          onClick={onPlay}
          className="w-full bg-background border-2 border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-300 hover:border-neutral-500 transition-colors flex items-center justify-center gap-1 text-xs"
        >
          Play
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <polygon points="5 3 19 12 5 21" />
          </svg>
        </button>

        {/* Add Frame and Duplicate Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onAddFrame}
            className="flex-1 bg-background border-2 border-neutral-700 rounded-lg px-2 py-1.5 text-neutral-300 hover:border-neutral-500 transition-colors flex items-center justify-center gap-1 text-xs"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Frame
          </button>
          <button
            onClick={onDuplicate}
            className="flex-1 bg-background border-2 border-neutral-700 rounded-lg px-2 py-1.5 text-neutral-300 hover:border-neutral-500 transition-colors flex items-center justify-center gap-1 text-xs"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Duplicate
          </button>
        </div>

        {/* Size Slider */}
        <div className="space-y-1.5">
          <label className="block text-neutral-300 text-xs font-medium">
            Size
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="10"
              max="100"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              className="flex-1 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>

        {/* Brush Type */}
        <div className="space-y-2">
          <label className="block text-neutral-300 text-xs font-medium">
            Brush Type
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {/* Square */}
            <button
              onClick={() => setBrushType("square")}
              className={`aspect-square rounded-lg border-2 transition-colors ${
                brushType === "square"
                  ? "border-neutral-400 bg-neutral-900"
                  : "border-neutral-700 bg-black hover:border-neutral-600"
              } flex items-center justify-center`}
            >
              <div className="w-3 h-3 bg-white rounded-sm" />
            </button>

            {/* Circle */}
            <button
              onClick={() => setBrushType("circle")}
              className={`aspect-square rounded-lg border-2 transition-colors ${
                brushType === "circle"
                  ? "border-neutral-400 bg-neutral-900"
                  : "border-neutral-700 bg-black hover:border-neutral-600"
              } flex items-center justify-center`}
            >
              <div className="w-3 h-3 bg-white rounded-full" />
            </button>

            {/* Triangle */}
            <button
              onClick={() => setBrushType("triangle")}
              className={`aspect-square rounded-lg border-2 transition-colors ${
                brushType === "triangle"
                  ? "border-neutral-400 bg-neutral-900"
                  : "border-neutral-700 bg-black hover:border-neutral-600"
              } flex items-center justify-center`}
            >
              <div className="w-0 h-0 border-l-1.5 border-r-1.5 border-b-3 border-l-transparent border-r-transparent border-b-white" />
            </button>

            {/* Eraser */}
            <button
              onClick={() => setBrushType("eraser")}
              className={`aspect-square rounded-lg border-2 transition-colors ${
                brushType === "eraser"
                  ? "border-neutral-400 bg-neutral-900"
                  : "border-neutral-700 bg-black hover:border-neutral-600"
              } flex items-center justify-center`}
            >
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Onion Slicer */}
        <div className="flex items-center justify-between">
          <label className="text-neutral-300 text-xs font-medium">
            Onion Slicer
          </label>
          <input
            type="checkbox"
            checked={onionSlicer}
            onChange={(e) => setOnionSlicer(e.target.checked)}
            className="w-4 h-4 rounded bg-background border-2 border-neutral-600 cursor-pointer accent-white"
          />
        </div>

        {/* Next/Prev Frame Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 bg-background border-2 border-neutral-700 rounded-lg px-2 py-1.5 text-neutral-300 hover:border-neutral-500 transition-colors flex items-center justify-center gap-1 text-xs">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            Next Frame
          </button>
          <button className="flex-1 bg-background border-2 border-neutral-700 rounded-lg px-2 py-1.5 text-neutral-300 hover:border-neutral-500 transition-colors flex items-center justify-center gap-1 text-xs">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
            Prev Frame
          </button>
        </div>

        {/* Frame Duration */}
        <div className="flex items-center justify-between">
          <label className="text-neutral-300 text-xs font-medium">
            Frame Duration
          </label>
          <div className="flex items-center bg-background border-2 border-neutral-700 rounded-lg px-2 py-1">
            <input
              type="number"
              value={frameDuration}
              onChange={(e) => setFrameDuration(parseInt(e.target.value))}
              className="w-14 bg-transparent text-neutral-300 text-xs focus:outline-none text-right"
            />
            <span className="text-neutral-500 text-xs ml-1">ms</span>
          </div>
        </div>

        {/* Remove Frame Button */}
        <button
          onClick={onRemoveFrame}
          className="w-full bg-background border-2 border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-300 hover:border-neutral-500 transition-colors flex items-center justify-center gap-1 text-xs"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3H4a1 1 0 000 2h1.05L5 19a3 3 0 003 3h8a3 3 0 003-3l.95-12H20a1 1 0 100-2h-3z"
            />
          </svg>
          Remove Frame
        </button>
      </div>
    </div>
  );
}
