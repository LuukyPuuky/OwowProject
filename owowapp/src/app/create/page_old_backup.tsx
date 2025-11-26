"use client";
import { useState, useCallback, useEffect, useRef, memo, useMemo } from "react";
import { Sidebar } from "@/components/sidebar";
import { PixelCanvas } from "@/components/pixel-canvas";
import { TopBar as Header } from "@/components/top-bar";
import LatestAnimations from "@/components/latest-animations";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas-utils";
import type { Frame, BrushMode, BrushShape, Tool } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Memoized thumbnail component to prevent re-renders during drawing
const FrameThumbnail = memo<{
  frame: Frame;
  index: number;
  isActive: boolean;
  onClick: () => void;
}>(({ frame, index, isActive, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render thumbnail only once when frame data changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Scale factor for thumbnail
    const cellSize = 2; // 2px per pixel for thumbnail

    // Clear canvas (black background)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw pixels
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
      className={`w-40 h-10 rounded-md bg-[#0b0b0b] border-2 flex-shrink-0 transition-all overflow-hidden ${
        isActive
          ? "border-white ring-2 ring-white"
          : "border-[#323232] hover:border-[#444444]"
      }`}
      title={`Frame ${index + 1} • ${(frame.dur / 1000).toFixed(1)}s`}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH * 2}
        height={CANVAS_HEIGHT * 2}
        className="w-full h-full"
        style={{
          imageRendering: 'pixelated',
        }}
      />
    </button>
  );
});

FrameThumbnail.displayName = 'FrameThumbnail';

export default function CreatePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Frame & Animation State
  const [frames, setFrames] = useState<Frame[]>([
    { dur: 1000, arr: new Array(CANVAS_WIDTH * CANVAS_HEIGHT).fill(false) }
  ]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);
  const framesRef = useRef(frames);
  
  // Keep framesRef in sync
  useEffect(() => {
    framesRef.current = frames;
  }, [frames]);
  
  // Current working pixels (separate from saved frames for performance)
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
  // Store duration in seconds (display value), convert to ms for frames
  const [frameDurationSeconds, setFrameDurationSeconds] = useState(1);

  // History for undo/redo
  const [history, setHistory] = useState<Frame[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const favorites = new Set<string>();
  const handleRemoveFavorite = () => {
    // placeholder
  };

  // History management
  const pushHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(frames)));
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [frames, history, historyIndex]);

  // Save working pixels to the actual frame (call this when done drawing, switching frames, etc.)
  const saveWorkingPixelsToFrame = useCallback(() => {
    setFrames(prevFrames => {
      const newFrames = [...prevFrames];
      newFrames[currentFrameIndex] = { ...newFrames[currentFrameIndex], arr: [...workingPixels] };
      return newFrames;
    });
  }, [currentFrameIndex, workingPixels]);

  // Load frame pixels into working area when switching frames ONLY
  // Skip during playback for performance
  useEffect(() => {
    if (playing) return; // Don't reload pixels during playback
    setWorkingPixels([...framesRef.current[currentFrameIndex].arr]);
    // Sync frame duration when switching frames (convert ms to seconds)
    setFrameDurationSeconds(framesRef.current[currentFrameIndex].dur / 1000);
  }, [currentFrameIndex, playing]); // Only reload when frame index changes, not when frames update

  // Auto-save working pixels to frame after drawing stops (debounced)
  // Don't auto-save during playback to prevent performance issues
  useEffect(() => {
    if (playing) return; // Skip auto-save during playback
    
    const timeoutId = setTimeout(() => {
      saveWorkingPixelsToFrame();
    }, 500); // Save 500ms after last change
    
    return () => clearTimeout(timeoutId);
  }, [workingPixels, saveWorkingPixelsToFrame, playing]);

  // Frame operations
  const addFrame = useCallback(() => {
    // Save current work before adding new frame
    saveWorkingPixelsToFrame();
    pushHistory();
    const newFrames = [...frames];
    // Use current frame's duration for the new frame
    const currentDuration = frames[currentFrameIndex].dur;
    newFrames.splice(currentFrameIndex + 1, 0, {
      dur: currentDuration,
      arr: new Array(CANVAS_WIDTH * CANVAS_HEIGHT).fill(false)
    });
    setFrames(newFrames);
    setCurrentFrameIndex(currentFrameIndex + 1);
    // New frame has same duration as current, so frameDuration stays the same
  }, [frames, currentFrameIndex, pushHistory, saveWorkingPixelsToFrame]);

  const duplicateFrame = useCallback(() => {
    // Save current work before duplicating
    saveWorkingPixelsToFrame();
    pushHistory();
    const newFrames = [...frames];
    newFrames.splice(currentFrameIndex + 1, 0, {
      dur: frames[currentFrameIndex].dur,
      arr: [...workingPixels] // Duplicate the current working pixels
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
    // Load the new current frame
    setWorkingPixels([...newFrames[newIndex].arr]);
    setFrameDurationSeconds(newFrames[newIndex].dur / 1000);
  }, [frames, currentFrameIndex, pushHistory]);

  const nextFrame = useCallback(() => {
    // Save current work before switching
    saveWorkingPixelsToFrame();
    setCurrentFrameIndex((prev) => Math.min(prev + 1, frames.length - 1));
  }, [frames.length, saveWorkingPixelsToFrame]);

  const prevFrame = useCallback(() => {
    // Save current work before switching
    saveWorkingPixelsToFrame();
    setCurrentFrameIndex((prev) => Math.max(prev - 1, 0));
  }, [saveWorkingPixelsToFrame]);

  // Playback - Fixed to use refs to avoid stale closures
  const playingRef = useRef(false);
  
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const play = useCallback(() => {
    if (playingRef.current) return;
    setPlaying(true);
    
    let currentIndex = currentFrameIndex;
    
    const step = () => {
      if (!playingRef.current) return; // Check if still playing
      
      // Move to next frame
      currentIndex = (currentIndex + 1) % framesRef.current.length;
      setCurrentFrameIndex(currentIndex);
      
      // Schedule next step with the current frame's duration (how long to show THIS frame)
      playTimerRef.current = setTimeout(step, framesRef.current[currentIndex].dur);
    };
    
    // Start playback after showing current frame for its duration
    playTimerRef.current = setTimeout(step, framesRef.current[currentIndex].dur);
  }, [currentFrameIndex]);

  const stop = useCallback(() => {
    setPlaying(false);
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    // Reload working pixels after stopping to allow editing
    setWorkingPixels([...framesRef.current[currentFrameIndex].arr]);
  }, [currentFrameIndex]);

  const togglePlayPause = useCallback(() => {
    if (playingRef.current) {
      stop();
    } else {
      play();
    }
  }, [play, stop]);

  // Update working pixels (doesn't affect frame thumbnails)
  const updateCurrentFramePixels = useCallback((newPixels: boolean[]) => {
    setWorkingPixels(newPixels);
  }, []);

  // Get the pixels to display - during playback show frame, otherwise show working pixels
  // Use useMemo to avoid creating new array reference on every render
  const displayPixels = useMemo(() => {
    return playing ? frames[currentFrameIndex].arr : workingPixels;
  }, [playing, frames, currentFrameIndex, workingPixels]);

  // Update frame duration - convert seconds to milliseconds
  const updateFrameDuration = useCallback((seconds: number) => {
    setFrameDurationSeconds(seconds);
    const durMs = Math.round(seconds * 1000); // Convert to ms
    const newFrames = [...frames];
    newFrames[currentFrameIndex] = { ...newFrames[currentFrameIndex], dur: durMs };
    setFrames(newFrames);
    framesRef.current = newFrames;
  }, [frames, currentFrameIndex]);

  // Calculate onion skin overlay
  const getOnionSkin = useCallback(() => {
    if (!onionEnabled || currentFrameIndex === 0) return undefined;
    const prevFrame = frames[currentFrameIndex - 1];
    return prevFrame ? prevFrame.arr : undefined;
  }, [onionEnabled, currentFrameIndex, frames]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, []);

  // Keyboard shortcuts
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
  }, [togglePlayPause, nextFrame, prevFrame, setBrushMode, setBrushSize]);

  return (
    <div className="min-h-screen flex">
      <Sidebar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isCollapsed={isCollapsed}
        onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
        favorites={favorites}
        onRemoveFavorite={handleRemoveFavorite}
      />

      <main className="flex-1 p-6" style={{ backgroundColor: "#161616" }}>
        {/* Top area */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Collapse / menu button to toggle sidebar like main page */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-muted-foreground p-2 rounded-md"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>

              <button className="bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] px-3 py-1 rounded-md">
                Create
              </button>

              {/* Library navigates back to main library page */}
              <Link href="/" className="bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] px-3 py-1 rounded-md inline-block">
                Library
              </Link>
            </div>
            <div className="border-b border-border flex-1 mx-6" />
          </div>
        </div>

        {/* Editor + Right panel */}
        <div className="grid grid-cols-12 gap-6">
          {/* Main editor area */}
          <div className="col-span-8">
            {/* Tool Bar */}
            <div className="bg-[#161616] border border-[#323232] rounded-md p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[#c3c3c3] text-sm font-medium">Tools</span>
                <div className="flex-1 border-b border-[#323232]"></div>
                <span className="text-[#666666] text-xs">B • X • L • E • R • F</span>
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
                      : 'bg-[#161616] text-[#c3c3c3] hover:bg-[#2a2a2a]'
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
                      : 'bg-[#161616] text-[#c3c3c3] hover:bg-[#2a2a2a]'
                  }`}
                  title="Eraser (X)"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0M4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53-6.36-6.36-3.54 3.53z"/>
                  </svg>
                </button>
                <div className="w-px h-6 bg-[#323232] mx-1"></div>
                <button
                  onClick={() => setActiveTool('line')}
                  className={`p-2 rounded-md transition-colors ${
                    activeTool === 'line'
                      ? 'bg-white text-black'
                      : 'bg-[#161616] text-[#c3c3c3] hover:bg-[#2a2a2a]'
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
                      : 'bg-[#161616] text-[#c3c3c3] hover:bg-[#2a2a2a]'
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
                      : 'bg-[#161616] text-[#c3c3c3] hover:bg-[#2a2a2a]'
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
                      : 'bg-[#161616] text-[#c3c3c3] hover:bg-[#2a2a2a]'
                  }`}
                  title="Fill (F)"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15a1.49 1.49 0 0 0 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.21 10L10 5.21 14.79 10H5.21zM19 11.5s-2 2.17-2 3.5c0 1.1.9 2 2 2s2-.9 2-2c0-1.33-2-3.5-2-3.5z"/>
                  </svg>
                </button>
                <div className="flex-1"></div>
                <div className="text-[#666666] text-xs">
                  [ ] Size • Space Play
                </div>
              </div>
            </div>

            <div className="bg-black rounded-md overflow-hidden mb-4 p-6">
              <div className="w-full flex items-center justify-center">
                <PixelCanvas
                  pixels={displayPixels}
                  onPixelsChange={playing ? () => {} : updateCurrentFramePixels}
                  brushSize={brushSize}
                  brushMode={brushMode}
                  brushShape={brushShape}
                  activeTool={activeTool}
                  onionSkin={getOnionSkin()}
                  cellSize={8}
                  showGrid={true}
                />
              </div>
            </div>

            {/* Timeline thumbnails */}
            <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2">
              {frames.map((frame, i) => (
                <FrameThumbnail
                  key={i}
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
              ))}
            </div>

            {/* Latest animations component */}
            <div>
              <LatestAnimations
                animations={undefined}
                onAnimationSelect={() => {
                  // placeholder handler
                }}
                onMenuClick={() => {
                  // placeholder handler
                }}
              />
            </div>
          </div>

          {/* Right control panel */}
          <aside className="col-span-4">
            <ControlPanel
              projectName={projectName}
              onProjectNameChange={setProjectName}
              size={brushSize}
              onSizeChange={setBrushSize}
              brushType={brushShape}
              onBrushTypeChange={setBrushShape}
              onionSlicer={onionEnabled}
              onOnionSlicerChange={setOnionEnabled}
              frameDuration={frameDurationSeconds}
              onFrameDurationChange={updateFrameDuration}
              onPlay={togglePlayPause}
              isPlaying={playing}
              onCreateNew={() => {
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
              onSave={() => {
                if (!confirm(`Are you sure you want to save "${projectName}"?`)) {
                  return;
                }
                // Save working pixels before saving
                saveWorkingPixelsToFrame();
                console.log("Save animation:", { name: projectName, frames });
                alert('Animation saved successfully!');
              }}
              onAddFrame={addFrame}
              onDuplicate={duplicateFrame}
              onRemoveFrame={deleteFrame}
              onNextFrame={nextFrame}
              onPrevFrame={prevFrame}
              currentFrame={currentFrameIndex}
              totalFrames={frames.length}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
