"use client";

import { memo } from "react";
import { Play, Pause, Plus, Copy, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

interface FrameControlsProps {
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;
  frameDuration: number;
  onPlay: () => void;
  onAddFrame: () => void;
  onDuplicateFrame: () => void;
  onPrevFrame: () => void;
  onNextFrame: () => void;
  onFrameDurationChange: (duration: number) => void;
  onRemoveFrame: () => void;
}

/**
 * Frame playback and manipulation controls
 */
export const FrameControls = memo<FrameControlsProps>(
  ({
    isPlaying,
    currentFrame,
    totalFrames,
    frameDuration,
    onPlay,
    onAddFrame,
    onDuplicateFrame,
    onPrevFrame,
    onNextFrame,
    onFrameDurationChange,
    onRemoveFrame,
  }) => {
    return (
      <div className="space-y-4">
        {/* Play Button */}
        <button
          onClick={onPlay}
          className="w-full bg-background border border-neutral-800 rounded-lg px-4 py-3 text-neutral-300 hover:bg-neutral-900 transition-colors flex items-center justify-center gap-2"
        >
          {isPlaying ? (
            <>
              <Pause className="w-5 h-5" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Play
            </>
          )}
        </button>

        {/* Add Frame and Duplicate */}
        <div className="flex gap-2">
          <button
            onClick={onAddFrame}
            className="flex-1 bg-background border border-neutral-800 rounded-lg px-3 py-2 text-neutral-300 hover:bg-neutral-900 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
          <button
            onClick={onDuplicateFrame}
            className="flex-1 bg-background border border-neutral-800 rounded-lg px-3 py-2 text-neutral-300 hover:bg-neutral-900 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
        </div>

        {/* Frame Info */}
        <div className="text-center text-neutral-400 text-sm py-2">
          Frame {currentFrame + 1} / {totalFrames}
        </div>

        {/* Next/Prev Frame */}
        <div className="flex gap-2">
          <button
            onClick={onPrevFrame}
            className="flex-1 bg-background border border-neutral-800 rounded-lg px-3 py-2 text-neutral-300 hover:bg-neutral-900 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <button
            onClick={onNextFrame}
            className="flex-1 bg-background border border-neutral-800 rounded-lg px-3 py-2 text-neutral-300 hover:bg-neutral-900 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Frame Duration */}
        <div className="flex items-center justify-between">
          <label className="text-neutral-400 text-sm">Duration</label>
          <div className="flex items-center bg-background border border-neutral-800 rounded-lg px-3 py-1">
            <input
              type="number"
              value={frameDuration}
              onChange={(e) =>
                onFrameDurationChange(parseFloat(e.target.value) || 0.1)
              }
              min="0.1"
              max="10"
              step="0.1"
              className="w-16 bg-transparent text-neutral-300 text-sm focus:outline-none text-right"
            />
            <span className="text-neutral-400 text-sm ml-1">sec</span>
          </div>
        </div>

        {/* Remove Frame */}
        <button
          onClick={onRemoveFrame}
          disabled={totalFrames === 1}
          className={`w-full border border-neutral-800 rounded-lg px-4 py-2 transition-colors flex items-center justify-center gap-2 text-sm ${
            totalFrames === 1
              ? "bg-neutral-900 text-neutral-600 cursor-not-allowed"
              : "bg-background text-neutral-300 hover:bg-neutral-900"
          }`}
        >
          <Trash2 className="w-4 h-4" />
          Remove Frame
        </button>
      </div>
    );
  }
);

FrameControls.displayName = "FrameControls";
