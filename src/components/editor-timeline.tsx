"use client";

import { memo, useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas";
import type { Frame } from "@/lib/types";

interface FrameThumbnailProps {
  frame: Frame | undefined;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

const FrameThumbnail = memo<FrameThumbnailProps>(
  ({ frame, index, isActive, onClick }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      if (!frame || !frame.arr) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const cellSize = 2;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < frame.arr.length; i++) {
        if (frame.arr[i]) {
          const x = i % CANVAS_WIDTH;
          const y = Math.floor(i / CANVAS_WIDTH);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }, [frame]);

    return (
      <button
        onClick={onClick}
        className={`w-20 h-12 rounded border-2 transition-all flex items-center justify-center shrink-0 ${
          isActive
            ? "border-neutral-500 bg-neutral-900"
            : "border-neutral-800 bg-black hover:border-neutral-700"
        }`}
        title={`Frame ${index + 1} • ${(((frame?.dur ?? 0) / 1000) || 0).toFixed(1)}s`}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH * 2}
          height={CANVAS_HEIGHT * 2}
          className="w-full h-full"
          style={{ imageRendering: "pixelated" }}
        />
      </button>
    );
  }
);

FrameThumbnail.displayName = "FrameThumbnail";

interface EditorTimelineProps {
  frames: Frame[];
  currentFrameIndex: number;
  onFrameSelect: (index: number) => void;
}

/**
 * Timeline component showing frame thumbnails
 * Allows navigation between frames with scroll controls
 */
export const EditorTimeline = memo<EditorTimelineProps>(
  ({ frames, currentFrameIndex, onFrameSelect }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } =
          scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };

    useEffect(() => {
      checkScroll();
      const container = scrollContainerRef.current;
      if (container) {
        container.addEventListener("scroll", checkScroll);
        window.addEventListener("resize", checkScroll);
      }
      return () => {
        container?.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }, [frames.length]);

    const scrollTimeline = (direction: "left" | "right") => {
      if (scrollContainerRef.current) {
        const scrollAmount = direction === "left" ? -200 : 200;
        scrollContainerRef.current.scrollBy({
          left: scrollAmount,
          behavior: "smooth",
        });
      }
    };

    return (
      <div className="relative bg-background border-2 border-neutral-800 rounded-lg p-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-neutral-300 text-sm font-medium">Timeline</span>
          <div className="flex-1 border-b border-neutral-800"></div>
          <span className="text-neutral-600 text-xs">
            {frames.length} frame{frames.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="relative">
          {/* Left scroll button */}
          {canScrollLeft && (
            <button
              onClick={() => scrollTimeline("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-neutral-900 border border-neutral-700 rounded-full p-1 hover:bg-neutral-800 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4 text-neutral-300" />
            </button>
          )}

          {/* Timeline scroll container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-900"
            style={{ scrollbarWidth: "thin" }}
          >
            {frames.map((frame, index) => (
              <FrameThumbnail
                key={index}
                frame={frame}
                index={index}
                isActive={index === currentFrameIndex}
                onClick={() => onFrameSelect(index)}
              />
            ))}
          </div>

          {/* Right scroll button */}
          {canScrollRight && (
            <button
              onClick={() => scrollTimeline("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-neutral-900 border border-neutral-700 rounded-full p-1 hover:bg-neutral-800 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4 text-neutral-300" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

EditorTimeline.displayName = "EditorTimeline";
