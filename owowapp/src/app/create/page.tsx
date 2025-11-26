"use client";
import { useState, useCallback, useEffect, useRef, memo, useMemo } from "react";
import { Sidebar } from "@/components/sidebar";
import { PixelCanvas } from "@/components/pixel-canvas";
import { TopBar as Header } from "@/components/top-bar";
import LatestAnimations from "@/components/latest-animations";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas-utils";
import type { Frame, BrushMode, BrushShape, Tool } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Memoized thumbnail component
const FrameThumbnail = memo<{
  frame: Frame;
  index: number;
  isActive: boolean;
  onClick: () => void;
}>(({ frame, index, isActive, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const cellSize = 2;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < frame.arr.length; i++) {
      if (frame.arr[i]) {
        const x = i % CANVAS_WIDTH;
        const y = Math.floor(i / CANVAS_WIDTH);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }, [frame.arr]);

  return (
    <button
      onClick={onClick}
      className={`w-20 h-12 rounded border-2 transition-all flex items-center justify-center shrink-0 ${
        isActive
          ? 'border-neutral-500 bg-neutral-900'
          : 'border-neutral-800 bg-black hover:border-neutral-700'
      }`}
      title={`Frame ${index + 1} • ${(frame.dur / 1000).toFixed(1)}s`}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH * 2}
        height={CANVAS_HEIGHT * 2}
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
    </button>
  );
});

FrameThumbnail.displayName = 'FrameThumbnail';

export default function CreatePage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const favorites = new Set<string>();

  // Frame & Animation State
  const [frames, setFrames] = useState<Frame[]>([
    { dur: 1000, arr: new Array(CANVAS_WIDTH * CANVAS_HEIGHT).fill(false) }
  ]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);
  const framesRef = useRef(frames);
  
  useEffect(() => {
    framesRef.current = frames;
  }, [frames]);
  
  const [workingPixels, setWorkingPixels] = useState<boolean[]>(
    new Array(CANVAS_WIDTH * CANVAS_HEIGHT).fill(false)
  );

  // Drawing State
  const [activeTool, setActiveTool] = useState<Tool>('brush');
  const [brushMode, setBrushMode] = useState<BrushMode>('paint');
  const [brushShape, setBrushShape] = useState<BrushShape>('circle');
  const [brushSize, setBrushSize] = useState(2);
  const [onionEnabled, setOnionEnabled] = useState(false);

  // Project State
  const [projectName, setProjectName] = useState("Untitled");
  const [frameDurationSeconds, setFrameDurationSeconds] = useState(1);

  // History
  const [history, setHistory] = useState<Frame[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Timeline scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      container?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [frames.length]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 100);
    }
  };

  const pushHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(frames)));
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [frames, history, historyIndex]);

  const saveWorkingPixelsToFrame = useCallback(() => {
    setFrames(prevFrames => {
      const newFrames = [...prevFrames];
      newFrames[currentFrameIndex] = { ...newFrames[currentFrameIndex], arr: [...workingPixels] };
      return newFrames;
    });
  }, [currentFrameIndex, workingPixels]);

  useEffect(() => {
    if (playing) return;
    setWorkingPixels([...framesRef.current[currentFrameIndex].arr]);
    setFrameDurationSeconds(framesRef.current[currentFrameIndex].dur / 1000);
  }, [currentFrameIndex, playing]);

  useEffect(() => {
    if (playing) return;
    
    const timeoutId = setTimeout(() => {
      saveWorkingPixelsToFrame();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [workingPixels, saveWorkingPixelsToFrame, playing]);

  const addFrame = useCallback(() => {
    saveWorkingPixelsToFrame();
    pushHistory();
    const newFrames = [...frames];
    const currentDuration = frames[currentFrameIndex].dur;
    newFrames.splice(currentFrameIndex + 1, 0, {
      dur: currentDuration,
      arr: new Array(CANVAS_WIDTH * CANVAS_HEIGHT).fill(false)
    });
    setFrames(newFrames);
    setCurrentFrameIndex(currentFrameIndex + 1);
  }, [frames, currentFrameIndex, pushHistory, saveWorkingPixelsToFrame]);

  const duplicateFrame = useCallback(() => {
    saveWorkingPixelsToFrame();
    pushHistory();
    const newFrames = [...frames];
    newFrames.splice(currentFrameIndex + 1, 0, {
      dur: frames[currentFrameIndex].dur,
      arr: [...workingPixels]
    });
    setFrames(newFrames);
    setCurrentFrameIndex(currentFrameIndex + 1);
  }, [frames, currentFrameIndex, pushHistory, saveWorkingPixelsToFrame, workingPixels]);

  const deleteFrame = useCallback(() => {
    if (frames.length === 1) {
      alert('Cannot delete the last frame!');
      return;
    }
    if (!confirm(`Are you sure you want to delete frame ${currentFrameIndex + 1}?`)) {
      return;
    }
    pushHistory();
    const newFrames = frames.filter((_, i) => i !== currentFrameIndex);
    setFrames(newFrames);
    const newIndex = Math.min(currentFrameIndex, newFrames.length - 1);
    setCurrentFrameIndex(newIndex);
    setWorkingPixels([...newFrames[newIndex].arr]);
    setFrameDurationSeconds(newFrames[newIndex].dur / 1000);
  }, [frames, currentFrameIndex, pushHistory]);

  const nextFrame = useCallback(() => {
    saveWorkingPixelsToFrame();
    setCurrentFrameIndex((prev) => Math.min(prev + 1, frames.length - 1));
  }, [frames.length, saveWorkingPixelsToFrame]);

  const prevFrame = useCallback(() => {
    saveWorkingPixelsToFrame();
    setCurrentFrameIndex((prev) => Math.max(prev - 1, 0));
  }, [saveWorkingPixelsToFrame]);

  const playingRef = useRef(false);
  
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const play = useCallback(() => {
    if (playingRef.current) return;
    setPlaying(true);
    
    let currentIndex = currentFrameIndex;
    
    const step = () => {
      if (!playingRef.current) return;
      
      currentIndex = (currentIndex + 1) % framesRef.current.length;
      setCurrentFrameIndex(currentIndex);
      
      playTimerRef.current = setTimeout(step, framesRef.current[currentIndex].dur);
    };
    
    playTimerRef.current = setTimeout(step, framesRef.current[currentIndex].dur);
  }, [currentFrameIndex]);

  const stop = useCallback(() => {
    setPlaying(false);
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    setWorkingPixels([...framesRef.current[currentFrameIndex].arr]);
  }, [currentFrameIndex]);

  const togglePlayPause = useCallback(() => {
    if (playingRef.current) {
      stop();
    } else {
      play();
    }
  }, [play, stop]);

  const updateCurrentFramePixels = useCallback((newPixels: boolean[]) => {
    setWorkingPixels(newPixels);
  }, []);

  const displayPixels = useMemo(() => {
    return playing ? frames[currentFrameIndex].arr : workingPixels;
  }, [playing, frames, currentFrameIndex, workingPixels]);

  const updateFrameDuration = useCallback((seconds: number) => {
    setFrameDurationSeconds(seconds);
    const durMs = Math.round(seconds * 1000);
    const newFrames = [...frames];
    newFrames[currentFrameIndex] = { ...newFrames[currentFrameIndex], dur: durMs };
    setFrames(newFrames);
    framesRef.current = newFrames;
  }, [frames, currentFrameIndex]);

  const getOnionSkin = useCallback(() => {
    if (!onionEnabled || currentFrameIndex === 0) return undefined;
    const prevFrame = frames[currentFrameIndex - 1];
    return prevFrame ? prevFrame.arr : undefined;
  }, [onionEnabled, currentFrameIndex, frames]);

  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const key = e.key.toLowerCase();
      
      if (key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (key === 'arrowleft') {
        e.preventDefault();
        prevFrame();
      } else if (key === 'arrowright') {
        e.preventDefault();
        nextFrame();
      } else if (key === 'b') {
        setActiveTool('brush');
        setBrushMode('paint');
      } else if (key === 'x') {
        setActiveTool('brush');
        setBrushMode('erase');
      } else if (key === 'l') {
        setActiveTool('line');
      } else if (key === 'e') {
        setActiveTool('ellipse');
      } else if (key === 'r') {
        setActiveTool('rect');
      } else if (key === 'f') {
        setActiveTool('fill');
      } else if (key === '[') {
        setBrushSize(prev => Math.max(1, prev - 1));
      } else if (key === ']') {
        setBrushSize(prev => Math.min(8, prev + 1));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, nextFrame, prevFrame]);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        searchQuery=""
        onSearchChange={() => {}}
        isCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        favorites={favorites}
        onRemoveFavorite={() => {}}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0">
          <Header onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        </div>

        <div className="flex-1 flex overflow-hidden gap-2 px-6">
          {/* Canvas and timeline - takes remaining space */}
          <div className="flex-1 flex flex-col min-w-0 bg-background pt-4">
            {/* Tool Bar */}
            <div className="bg-background border-2 border-neutral-800 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-neutral-300 text-sm font-medium">Tools</span>
                <div className="flex-1 border-b border-neutral-800"></div>
                <span className="text-neutral-600 text-xs">B • X • L • E • R • F</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTool('brush');
                    setBrushMode('paint');
                  }}
                  className={`p-2 rounded-md transition-colors ${
                    brushMode === 'paint'
                      ? 'bg-white text-black'
                      : 'bg-background text-neutral-300 hover:bg-neutral-800'
                  }`}
                  title="Brush (B)"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.996.996 0 0 0-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z"/>
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setActiveTool('brush');
                    setBrushMode('erase');
                  }}
                  className={`p-2 rounded-md transition-colors ${
                    brushMode === 'erase'
                      ? 'bg-white text-black'
                      : 'bg-background text-neutral-300 hover:bg-neutral-800'
                  }`}
                  title="Eraser (X)"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0M4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53-6.36-6.36-3.54 3.53z"/>
                  </svg>
                </button>
                <div className="w-px h-6 bg-neutral-800 mx-1"></div>
                <button
                  onClick={() => setActiveTool('line')}
                  className={`p-2 rounded-md transition-colors ${
                    activeTool === 'line'
                      ? 'bg-white text-black'
                      : 'bg-background text-neutral-300 hover:bg-neutral-800'
                  }`}
                  title="Line (L)"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="19" x2="19" y2="5"/>
                  </svg>
                </button>
                <button
                  onClick={() => setActiveTool('ellipse')}
                  className={`p-2 rounded-md transition-colors ${
                    activeTool === 'ellipse'
                      ? 'bg-white text-black'
                      : 'bg-background text-neutral-300 hover:bg-neutral-800'
                  }`}
                  title="Ellipse (E)"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <ellipse cx="12" cy="12" rx="7" ry="5"/>
                  </svg>
                </button>
                <button
                  onClick={() => setActiveTool('rect')}
                  className={`p-2 rounded-md transition-colors ${
                    activeTool === 'rect'
                      ? 'bg-white text-black'
                      : 'bg-background text-neutral-300 hover:bg-neutral-800'
                  }`}
                  title="Rectangle (R)"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="7" width="14" height="10"/>
                  </svg>
                </button>
                <button
                  onClick={() => setActiveTool('fill')}
                  className={`p-2 rounded-md transition-colors ${
                    activeTool === 'fill'
                      ? 'bg-white text-black'
                      : 'bg-background text-neutral-300 hover:bg-neutral-800'
                  }`}
                  title="Fill (F)"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15a1.49 1.49 0 0 0 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z"/>
                  </svg>
                </button>
                <div className="flex-1"></div>
                <div className="text-neutral-600 text-xs">
                  [ ] Size • Space Play
                </div>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="w-full bg-black border-2 border-neutral-800 rounded-lg overflow-hidden mb-6 p-6 flex items-center justify-center">
              <PixelCanvas
                pixels={displayPixels}
                onPixelsChange={playing ? () => {} : updateCurrentFramePixels}
                brushSize={brushSize}
                brushMode={brushMode}
                brushShape={brushShape}
                activeTool={activeTool}
                onionSkin={getOnionSkin()}
                cellSize={14}
                showGrid={true}
              />
            </div>

            {/* Frame Timeline */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                  canScrollLeft
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                    : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                }`}
              >
                <ChevronLeft size={18} />
              </button>

              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-x-auto scrollbar-hide flex gap-2"
                style={{ scrollBehavior: 'smooth' }}
              >
                {frames.map((frame, i) => (
                  <div key={i} className="flex items-center shrink-0">
                    <FrameThumbnail
                      frame={frame}
                      index={i}
                      isActive={i === currentFrameIndex}
                      onClick={() => {
                        if (i !== currentFrameIndex) {
                          saveWorkingPixelsToFrame();
                          setCurrentFrameIndex(i);
                        }
                      }}
                    />
                    {i < frames.length - 1 && (
                      <div className="flex flex-col gap-0.5 mx-1.5 shrink-0">
                        <div className="w-0.5 h-1 bg-neutral-800"></div>
                        <div className="w-0.5 h-1 bg-neutral-800"></div>
                        <div className="w-0.5 h-1 bg-neutral-800"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                  canScrollRight
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                    : 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                }`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Control Panel - fixed width */}
          <div className="w-60 shrink-0 bg-background pt-4 pl-3 space-y-4">
            {/* Project Name */}
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-background border-2 border-neutral-700 rounded-lg px-3 py-2 text-neutral-400 placeholder-neutral-600 focus:outline-none focus:border-neutral-500 text-center text-xs"
              placeholder="Untitled"
            />

            {/* Create New and Save */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!confirm('Are you sure you want to create a new animation? Any unsaved changes will be lost.')) {
                    return;
                  }
                  setFrames([{ dur: 1000, arr: new Array(CANVAS_WIDTH * CANVAS_HEIGHT).fill(false) }]);
                  setCurrentFrameIndex(0);
                  setProjectName("Untitled");
                  setFrameDurationSeconds(1);
                  setWorkingPixels(new Array(CANVAS_WIDTH * CANVAS_HEIGHT).fill(false));
                  setHistory([]);
                  setHistoryIndex(-1);
                }}
                className="flex-1 bg-background border-2 border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-300 hover:border-neutral-500 transition-colors text-xs"
              >
                Create New
              </button>
              <button
                onClick={() => {
                  if (!confirm(`Are you sure you want to save "${projectName}"?`)) {
                    return;
                  }
                  saveWorkingPixelsToFrame();
                  console.log("Save animation:", { name: projectName, frames });
                  alert('Animation saved successfully!');
                }}
                className="flex-1 bg-background border-2 border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-300 hover:border-neutral-500 transition-colors flex items-center justify-center gap-1 text-xs"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v6m0 0h16m-16 0v-6m16 6v-6m0 0V4" />
                </svg>
                Save
              </button>
            </div>

            {/* Play Button */}
            <button
              onClick={togglePlayPause}
              className="w-full bg-background border-2 border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-300 hover:border-neutral-500 transition-colors flex items-center justify-center gap-1 text-xs"
            >
              {playing ? 'Pause' : 'Play'}
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                {playing ? (
                  <>
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </>
                ) : (
                  <polygon points="5 3 19 12 5 21" />
                )}
              </svg>
            </button>

            {/* Add Frame and Duplicate */}
            <div className="flex gap-2">
              <button
                onClick={addFrame}
                className="flex-1 bg-background border-2 border-neutral-700 rounded-lg px-2 py-1.5 text-neutral-300 hover:border-neutral-500 transition-colors flex items-center justify-center gap-1 text-xs"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Frame
              </button>
              <button
                onClick={duplicateFrame}
                className="flex-1 bg-background border-2 border-neutral-700 rounded-lg px-2 py-1.5 text-neutral-300 hover:border-neutral-500 transition-colors flex items-center justify-center gap-1 text-xs"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Duplicate
              </button>
            </div>

            {/* Size Slider */}
            <div className="space-y-1.5">
              <label className="block text-neutral-300 text-xs font-medium">Size</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="flex-1 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <span className="text-neutral-300 text-xs w-4">{brushSize}</span>
              </div>
            </div>

            {/* Brush Type */}
            <div className="space-y-2">
              <label className="block text-neutral-300 text-xs font-medium">Brush Type</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setBrushShape('square')}
                  className={`aspect-square rounded-lg border-2 transition-colors ${
                    brushShape === 'square'
                      ? 'border-neutral-400 bg-neutral-900'
                      : 'border-neutral-700 bg-black hover:border-neutral-600'
                  } flex items-center justify-center`}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                </button>
                <button
                  onClick={() => setBrushShape('circle')}
                  className={`aspect-square rounded-lg border-2 transition-colors ${
                    brushShape === 'circle'
                      ? 'border-neutral-400 bg-neutral-900'
                      : 'border-neutral-700 bg-black hover:border-neutral-600'
                  } flex items-center justify-center`}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                </button>
                <button
                  onClick={() => setBrushShape('triangle')}
                  className={`aspect-square rounded-lg border-2 transition-colors ${
                    brushShape === 'triangle'
                      ? 'border-neutral-400 bg-neutral-900'
                      : 'border-neutral-700 bg-black hover:border-neutral-600'
                  } flex items-center justify-center`}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                    <polygon points="12,6 18,18 6,18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Onion Skin */}
            <div className="flex items-center justify-between">
              <label className="text-neutral-300 text-xs font-medium">Onion Skin</label>
              <input
                type="checkbox"
                checked={onionEnabled}
                onChange={(e) => setOnionEnabled(e.target.checked)}
                className="w-4 h-4 rounded bg-background border-2 border-neutral-600 cursor-pointer accent-white"
              />
            </div>

            {/* Frame Info */}
            <div className="text-center text-neutral-300 text-sm py-2">
              Frame {currentFrameIndex + 1} / {frames.length}
            </div>

            {/* Next/Prev Frame */}
            <div className="flex gap-2">
              <button 
                onClick={prevFrame}
                className="flex-1 bg-background border-2 border-neutral-700 rounded-lg px-2 py-1.5 text-neutral-300 hover:border-neutral-500 transition-colors flex items-center justify-center gap-1 text-xs"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Prev
              </button>
              <button 
                onClick={nextFrame}
                className="flex-1 bg-background border-2 border-neutral-700 rounded-lg px-2 py-1.5 text-neutral-300 hover:border-neutral-500 transition-colors flex items-center justify-center gap-1 text-xs"
              >
                Next
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Frame Duration */}
            <div className="flex items-center justify-between">
              <label className="text-neutral-300 text-xs font-medium">Frame Duration</label>
              <div className="flex items-center bg-background border-2 border-neutral-700 rounded-lg px-2 py-1">
                <input
                  type="number"
                  value={frameDurationSeconds}
                  onChange={(e) => updateFrameDuration(parseFloat(e.target.value) || 0.1)}
                  min="0.1"
                  max="10"
                  step="0.1"
                  className="w-14 bg-transparent text-neutral-300 text-xs focus:outline-none text-right"
                />
                <span className="text-neutral-500 text-xs ml-1">sec</span>
              </div>
            </div>

            {/* Remove Frame */}
            <button
              onClick={deleteFrame}
              className="w-full bg-background border-2 border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-300 hover:border-neutral-500 transition-colors flex items-center justify-center gap-1 text-xs"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3H4a1 1 0 000 2h1.05L5 19a3 3 0 003 3h8a3 3 0 003-3l.95-12H20a1 1 0 100-2h-3z" />
              </svg>
              Remove Frame
            </button>
          </div>
        </div>

        {/* Latest Animations at bottom */}
        <div className="shrink-0 border-t border-border bg-background">
          <LatestAnimations
            onAnimationSelect={(id) => console.log('Selected animation:', id)}
            onMenuClick={(id) => console.log('Menu clicked:', id)}
          />
        </div>
      </main>

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
