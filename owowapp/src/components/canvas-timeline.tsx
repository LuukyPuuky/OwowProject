'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Frame {
  id: number;
  content: React.ReactNode;
  hasStar?: boolean;
}

interface CanvasTimelineProps {
  frames?: Frame[];
  onFrameSelect?: (frameId: number) => void;
}

export default function CanvasTimeline({
  frames: initialFrames,
  onFrameSelect,
}: CanvasTimelineProps) {
  const [frames, setFrames] = useState<Frame[]>(
    initialFrames || [
      { id: 1, content: '', hasStar: false },
      { id: 2, content: '', hasStar: false },
      { id: 3, content: '', hasStar: true },
      { id: 4, content: '', hasStar: false },
      { id: 5, content: '', hasStar: false },
      { id: 6, content: '', hasStar: false },
      { id: 7, content: '', hasStar: false },
      { id: 8, content: '', hasStar: false },
    ]
  );

  const [selectedFrame, setSelectedFrame] = useState<number>(3);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position to enable/disable arrow buttons
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', checkScroll);
    return () => container?.removeEventListener('scroll', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleFrameSelect = (frameId: number) => {
    setSelectedFrame(frameId);
    onFrameSelect?.(frameId);
  };

  return (
    <div className="w-full bg-black pt-6 pb-6">
      {/* Canvas Area */}
      <div className="mx-auto px-6 mb-8">
        <div className="w-full bg-black border border-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <div className="w-full h-full flex items-center justify-center">
            {selectedFrame === 3 || frames.find(f => f.id === selectedFrame)?.hasStar ? (
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
              <div className="text-gray-600 text-lg">Frame {selectedFrame}</div>
            )}
          </div>
        </div>
      </div>

      {/* Frame Timeline Carousel */}
      <div className="mx-auto px-6">
        <div className="flex items-center gap-4">
          {/* Left Scroll Button */}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
              canScrollLeft
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-gray-900 text-gray-600 cursor-not-allowed'
            }`}
            aria-label="Scroll frames left"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Frames Container */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto scrollbar-hide flex gap-3"
            style={{ scrollBehavior: 'smooth' }}
          >
            {frames.map((frame, index) => (
              <div key={frame.id} className="flex items-center flex-shrink-0">
                {/* Frame Thumbnail */}
                <button
                  onClick={() => handleFrameSelect(frame.id)}
                  className={`w-24 h-16 rounded border-2 transition-all flex items-center justify-center flex-shrink-0 ${
                    selectedFrame === frame.id
                      ? 'border-white bg-gray-800'
                      : 'border-gray-700 bg-black hover:border-gray-600'
                  }`}
                >
                  {frame.hasStar ? (
                    <svg
                      width="30"
                      height="30"
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
                    <div className="text-gray-600 text-xs">Frame {frame.id}</div>
                  )}
                </button>

                {/* Divider Lines */}
                {index < frames.length - 1 && (
                  <div className="flex flex-col gap-1 mx-2 flex-shrink-0">
                    <div className="w-0.5 h-1 bg-gray-700"></div>
                    <div className="w-0.5 h-1 bg-gray-700"></div>
                    <div className="w-0.5 h-1 bg-gray-700"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Scroll Button */}
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
              canScrollRight
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-gray-900 text-gray-600 cursor-not-allowed'
            }`}
            aria-label="Scroll frames right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
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
}
