"use client";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Sidebar } from "@/components/sidebar";
import { TopBar as Header } from "@/components/top-bar";
import LatestAnimations from "@/components/latest-animations";
import { Modal } from "@/components/modal";
import { EditorToolbar } from "@/components/editor-toolbar";
import { EditorTimeline } from "@/components/editor-timeline";
import { EditorCanvas } from "@/components/editor-canvas";
import { ProjectHeader } from "@/components/project-header";
import { FrameControls } from "@/components/frame-controls";
import { BrushSettings } from "@/components/brush-settings";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useProjectActions } from "@/hooks/useProjectActions";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas";
import type { Frame, BrushMode, BrushShape, Tool } from "@/lib/types";
import { animations } from "@/lib/animations";

export default function CreatePage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Custom animations state for sidebar preview
  const [customAnimations, setCustomAnimations] = useState<Array<{
    id: string;
    name: string;
    frames: Array<{ dur: number; arr: boolean[] }>;
    createdAt: string;
    status: string;
  }>>([]);
  const [equippedId, setEquippedId] = useState<string>("logo");

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

  // Selection & Clipboard State
  const [selection, setSelection] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [clipboard, setClipboard] = useState<{ width: number; height: number; pixels: boolean[] } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Project State
  const [projectName, setProjectName] = useState("Untitled");
  const [frameDurationSeconds, setFrameDurationSeconds] = useState(1);
  const [lastSavedState, setLastSavedState] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // History
  const [history, setHistory] = useState<Frame[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "alert" | "confirm";
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    showDontShowAgain?: boolean;
    dialogId?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert",
  });

  // Track which dialogs should be skipped
  const [skipDialogs, setSkipDialogs] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skipDialogs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  const showAlert = useCallback((title: string, message: string) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: "alert",
    });
  }, []);

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, dialogId?: string) => {
    // Check if this dialog should be skipped
    if (dialogId && skipDialogs.has(dialogId)) {
      onConfirm();
      return;
    }

    setModalConfig({
      isOpen: true,
      title,
      message,
      type: "confirm",
      onConfirm,
      showDontShowAgain: !!dialogId,
      dialogId,
    });
  }, [skipDialogs]);

  const closeModal = useCallback(() => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleDontShowAgain = useCallback((checked: boolean) => {
    if (checked && modalConfig.dialogId) {
      const newSkipDialogs = new Set(skipDialogs);
      newSkipDialogs.add(modalConfig.dialogId);
      setSkipDialogs(newSkipDialogs);
      localStorage.setItem('skipDialogs', JSON.stringify([...newSkipDialogs]));
    }
  }, [modalConfig.dialogId, skipDialogs]);

  // Load custom animations, favorites, and equipped animation for sidebar preview
  useEffect(() => {
    const loadData = () => {
      try {
        // Load custom animations
        const saved = localStorage.getItem('customAnimations');
        if (saved) {
          setCustomAnimations(JSON.parse(saved));
        }

        // Load favorites
        const savedFavorites = localStorage.getItem('favorites');
        if (savedFavorites) {
          setFavorites(new Set(JSON.parse(savedFavorites)));
        }

        // Load equipped animation ID
        const savedEquipped = localStorage.getItem('equippedAnimationId');
        if (savedEquipped) {
          setEquippedId(savedEquipped);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();

    // Listen for changes
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('customAnimationsUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customAnimationsUpdated', handleStorageChange);
    };
  }, []);

  // Track changes to detect unsaved work
  useEffect(() => {
    const currentState = JSON.stringify({ frames, projectName });
    if (lastSavedState === "") {
      // Initial state - no changes yet
      setLastSavedState(currentState);
      setHasUnsavedChanges(false);
    } else {
      setHasUnsavedChanges(currentState !== lastSavedState);
    }
  }, [frames, projectName, lastSavedState]);

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
      showAlert('Cannot Delete', 'Cannot delete the last frame!');
      return;
    }
    showConfirm(
      'Delete Frame',
      `Are you sure you want to delete frame ${currentFrameIndex + 1}?`,
      () => {
        pushHistory();
        const newFrames = frames.filter((_, i) => i !== currentFrameIndex);
        setFrames(newFrames);
        const newIndex = Math.min(currentFrameIndex, newFrames.length - 1);
        setCurrentFrameIndex(newIndex);
        setWorkingPixels([...newFrames[newIndex].arr]);
        setFrameDurationSeconds(newFrames[newIndex].dur / 1000);
      },
      'deleteFrame'
    );
  }, [frames, currentFrameIndex, pushHistory, showAlert, showConfirm]);

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

  // Project actions (create, save, load)
  const { createNewProject, saveProject, loadAnimationForEditing } = useProjectActions({
    frames,
    projectName,
    showAlert,
    showConfirm,
    hasUnsavedChanges,
    setFrames,
    setProjectName,
    setCurrentFrameIndex,
    setFrameDurationSeconds,
    setWorkingPixels,
    setHistory,
    setHistoryIndex,
    setLastSavedState,
    setHasUnsavedChanges,
    saveWorkingPixelsToFrame,
  });

  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, []);

  // Calculate equipped animation metadata for sidebar
  const equippedAnimation = useMemo(() => {
    // Check if it's a custom animation first
    const customAnim = customAnimations.find(c => c.id === equippedId);
    if (customAnim) {
      return {
        id: customAnim.id,
        name: customAnim.name,
        description: `Custom animation created on ${new Date(customAnim.createdAt).toLocaleDateString()}`,
        status: customAnim.status as "Available" | "Equiped",
      };
    }

    // Otherwise check built-in animations
    const anim = Object.values(animations).find(
      (a) => a.metadata.id === equippedId
    );
    return anim?.metadata;
  }, [equippedId, customAnimations]);

  // Get custom frames for equipped animation if it's custom
  // const equippedCustomFrames = useMemo(() => {
  //   const customAnim = customAnimations.find(c => c.id === equippedId);
  //   return customAnim?.frames;
  // }, [equippedId, customAnimations]);

  // Copy selection to clipboard (only white pixels)
  const copySelection = useCallback(() => {
    if (!selection) return;

    const minX = Math.min(selection.startX, selection.endX);
    const maxX = Math.max(selection.startX, selection.endX);
    const minY = Math.min(selection.startY, selection.endY);
    const maxY = Math.max(selection.startY, selection.endY);

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const pixels: boolean[] = [];

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const index = y * CANVAS_WIDTH + x;
        // Only copy white pixels (true values)
        pixels.push(workingPixels[index] === true);
      }
    }

    setClipboard({ width, height, pixels });
  }, [selection, workingPixels]);

  // Paste clipboard at current selection start or center
  const pasteClipboard = useCallback(() => {
    if (!clipboard) return;

    const pasteX = selection ? Math.min(selection.startX, selection.endX) : Math.floor((CANVAS_WIDTH - clipboard.width) / 2);
    const pasteY = selection ? Math.min(selection.startY, selection.endY) : Math.floor((CANVAS_HEIGHT - clipboard.height) / 2);

    const newPixels = [...workingPixels];

    for (let dy = 0; dy < clipboard.height; dy++) {
      for (let dx = 0; dx < clipboard.width; dx++) {
        const targetX = pasteX + dx;
        const targetY = pasteY + dy;

        if (targetX >= 0 && targetX < CANVAS_WIDTH && targetY >= 0 && targetY < CANVAS_HEIGHT) {
          const sourceIndex = dy * clipboard.width + dx;
          const targetIndex = targetY * CANVAS_WIDTH + targetX;
          // Only paste white pixels (overwrite only if source pixel is true)
          if (clipboard.pixels[sourceIndex]) {
            newPixels[targetIndex] = true;
          }
        }
      }
    }

    setWorkingPixels(newPixels);
    pushHistory();
    setSelection(null); // Clear selection after paste
  }, [clipboard, selection, workingPixels, pushHistory]);

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setFrames(prevState);
      setHistoryIndex(historyIndex - 1);
      setWorkingPixels([...prevState[currentFrameIndex].arr]);
    }
  }, [history, historyIndex, currentFrameIndex]);

  // Cut selection: Copy then Clear
  const cutSelection = useCallback(() => {
    if (!selection) return;

    // 1. Copy
    copySelection();

    // 2. Clear pixels in selection
    const minX = Math.min(selection.startX, selection.endX);
    const maxX = Math.max(selection.startX, selection.endX);
    const minY = Math.min(selection.startY, selection.endY);
    const maxY = Math.max(selection.startY, selection.endY);

    const newPixels = [...workingPixels];
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const index = y * CANVAS_WIDTH + x;
        newPixels[index] = false;
      }
    }

    setWorkingPixels(newPixels);
    pushHistory();
    setSelection(null);
  }, [selection, copySelection, workingPixels, pushHistory]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onPlayPause: togglePlayPause,
    onNextFrame: nextFrame,
    onPrevFrame: prevFrame,
    onCopy: copySelection,
    onCut: cutSelection,
    onPaste: pasteClipboard,
    onUndo: undo,
    onToolChange: setActiveTool,
    onBrushModeChange: setBrushMode,
    onBrushSizeChange: (delta) => setBrushSize(prev => Math.max(1, Math.min(8, prev + delta))),
    onClearSelection: () => setSelection(null),
    hasSelection: !!selection,
    hasClipboard: !!clipboard,
  });

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        searchQuery=""
        onSearchChange={() => { }}
        isCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        favorites={favorites}
        onRemoveFavorite={() => { }}
        equippedAnimation={equippedAnimation}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0">
          <Header onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        </div>

        <div className="flex-1 flex overflow-hidden gap-2 px-6">
          {/* Canvas and timeline - takes remaining space */}
          <div className="flex-1 flex flex-col min-w-0 bg-background pt-4">
            <EditorToolbar
              activeTool={activeTool}
              brushMode={brushMode}
              hasClipboard={!!clipboard}
              hasSelection={!!selection}
              canUndo={historyIndex > 0}
              canRedo={false}
              onToolChange={(tool) => {
                if (tool === 'brush') {
                  setActiveTool('brush');
                  setBrushMode('paint');
                } else {
                  setActiveTool(tool);
                }
              }}
              onBrushModeChange={setBrushMode}
              onCopy={copySelection}
              onCut={cutSelection}
              onPaste={pasteClipboard}
              onUndo={undo}
              onRedo={() => { }}
            />

            <EditorCanvas
              pixels={displayPixels}
              onPixelsChange={playing ? () => { } : updateCurrentFramePixels}
              brushSize={brushSize}
              brushMode={brushMode}
              brushShape={brushShape}
              activeTool={activeTool}
              onionSkin={getOnionSkin() || null}
              selection={selection}
              onSelectionChange={setSelection}
              isSelecting={isSelecting}
              onSelectingChange={setIsSelecting}
            />

            <EditorTimeline
              frames={frames}
              currentFrameIndex={currentFrameIndex}
              onFrameSelect={(index) => {
                if (index !== currentFrameIndex) {
                  saveWorkingPixelsToFrame();
                  setCurrentFrameIndex(index);
                }
              }}
            />
          </div>

          {/* Control Panel - fixed width */}
          <div className="w-60 shrink-0 bg-background pt-4 pl-3 space-y-4">
            <ProjectHeader
              projectName={projectName}
              onProjectNameChange={setProjectName}
              onCreateNew={createNewProject}
              onSave={saveProject}
            />

            <FrameControls
              isPlaying={playing}
              currentFrame={currentFrameIndex}
              totalFrames={frames.length}
              frameDuration={frameDurationSeconds}
              onPlay={togglePlayPause}
              onAddFrame={addFrame}
              onDuplicateFrame={duplicateFrame}
              onPrevFrame={prevFrame}
              onNextFrame={nextFrame}
              onFrameDurationChange={(duration) => updateFrameDuration(duration)}
              onRemoveFrame={deleteFrame}
            />

            <BrushSettings
              brushSize={brushSize}
              brushShape={brushShape}
              onionSkinEnabled={onionEnabled}
              onBrushSizeChange={setBrushSize}
              onBrushShapeChange={setBrushShape}
              onOnionSkinToggle={() => setOnionEnabled(!onionEnabled)}
            />

            {skipDialogs.size > 0 && (
              <button
                onClick={() => {
                  setSkipDialogs(new Set());
                  localStorage.removeItem('skipDialogs');
                  showAlert('Preferences Reset', 'All "Don\'t show again" preferences have been reset.');
                }}
                className="w-full bg-background border-2 border-neutral-700 rounded-lg px-3 py-1.5 text-neutral-400 hover:border-neutral-500 hover:text-neutral-300 transition-colors flex items-center justify-center gap-1 text-xs"
                title="Reset all 'Don't show again' preferences"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Dialogs
              </button>
            )}
          </div>
        </div>

        {/* Latest Animations at bottom */}
        <div className="shrink-0 border-t border-border bg-background">
          <LatestAnimations
            onAnimationSelect={loadAnimationForEditing}
            onMenuClick={(id) => console.log('Menu clicked:', id)}
          />
        </div>
      </main>

      {/* Modal */}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        showDontShowAgain={modalConfig.showDontShowAgain}
        onDontShowAgain={handleDontShowAgain}
      />
    </div>
  );
}
