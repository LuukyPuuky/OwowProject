"use client";

import React, { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Frame {
  id: number;
  content?: React.ReactNode;
  hasStar?: boolean;
}

interface CanvasTimelineProps {
  frames?: Frame[];
  currentFrame?: number;
  onFrameSelect?: (frameIndex: number) => void;
}

const CanvasTimeline: React.FC<CanvasTimelineProps> = ({
  frames: externalFrames,
  currentFrame: externalCurrentFrame = 0,
  onFrameSelect,
}) => {
  const frames = externalFrames || [
    { id: 1, content: "", hasStar: false },
    { id: 2, content: "", hasStar: false },
    { id: 3, content: "", hasStar: true },
    { id: 4, content: "", hasStar: false },
    { id: 5, content: "", hasStar: false },
    { id: 6, content: "", hasStar: false },
    { id: 7, content: "", hasStar: false },
    { id: 8, content: "", hasStar: false },
  ];

  const selectedFrame = externalCurrentFrame;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      const frameElement = scrollContainerRef.current.children[selectedFrame];
      if (frameElement) {
        frameElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
    checkScroll();
  }, [selectedFrame]);

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
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 100);
    }
  };

  const handleFrameSelect = (frameIndex: number) => {
    onFrameSelect?.(frameIndex);
  };

  const displayFrame = frames[selectedFrame] || frames[2];
  const hasStar = displayFrame?.hasStar || selectedFrame === 2;

  return (
    <div className="w-full bg-background pt-4 pb-4">
      {/* Canvas Area */}
      <div className="w-full mb-6">
        <div
          className="w-full bg-black border-2 border-neutral-800 rounded-lg overflow-hidden"
          style={{ aspectRatio: "2/1" }}
        >
          <div className="w-full h-full flex items-center justify-center">
            {hasStar ? (
              <svg
                width="150"
                height="150"
                viewBox="0 0 150 150"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M75 15L95 60H142L105 90L125 135L75 105L25 135L45 90L8 60H55L75 15Z"
                  fill="#D3D3D3"
                />
              </svg>
            ) : (
              <div className="text-neutral-600 text-lg">
                Frame {selectedFrame + 1}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Frame Timeline Carousel */}
      <div className="flex items-center gap-2">
        {/* Left Scroll Button */}
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
            canScrollLeft
              ? "bg-neutral-800 hover:bg-neutral-700 text-white"
              : "bg-neutral-900 text-neutral-600 cursor-not-allowed"
          }`}
          aria-label="Scroll frames left"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Frames Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto scrollbar-hide flex gap-2"
          style={{ scrollBehavior: "smooth" }}
        >
          {frames.map((frame, index) => (
            <div key={frame.id} className="flex items-center flex-shrink-0">
              {/* Frame Thumbnail */}
              <button
                onClick={() => handleFrameSelect(index)}
                className={`w-20 h-12 rounded border-2 transition-all flex items-center justify-center flex-shrink-0 ${
                  selectedFrame === index
                    ? "border-neutral-500 bg-neutral-900"
                    : "border-neutral-800 bg-black hover:border-neutral-700"
                }`}
              >
                {frame.hasStar ? (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 150 150"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M75 15L95 60H142L105 90L125 135L75 105L25 135L45 90L8 60H55L75 15Z"
                      fill="#FFFFFF"
                    />
                  </svg>
                ) : (
                  <div className="text-neutral-600 text-xs">F{index + 1}</div>
                )}
              </button>

              {/* Divider Lines */}
              {index < frames.length - 1 && (
                <div className="flex flex-col gap-0.5 mx-1.5 flex-shrink-0">
                  <div className="w-0.5 h-1 bg-neutral-800"></div>
                  <div className="w-0.5 h-1 bg-neutral-800"></div>
                  <div className="w-0.5 h-1 bg-neutral-800"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Scroll Button */}
        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
            canScrollRight
              ? "bg-neutral-800 hover:bg-neutral-700 text-white"
              : "bg-neutral-900 text-neutral-600 cursor-not-allowed"
          }`}
          aria-label="Scroll frames right"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Hide scrollbar styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default CanvasTimeline;
