import { useCallback } from "react";
import type { Frame } from "@/lib/types";
import type { CustomAnimation } from "@/hooks/useCustomAnimationStorage";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas";

interface UseProjectActionsProps {
  frames: Frame[];
  projectName: string;
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, dialogId?: string) => void;
  hasUnsavedChanges: boolean;
  setFrames: (frames: Frame[]) => void;
  setProjectName: (name: string) => void;
  setCurrentFrameIndex: (index: number) => void;
  setFrameDurationSeconds: (seconds: number) => void;
  setWorkingPixels: (pixels: boolean[]) => void;
  setHistory: (history: Frame[][]) => void;
  setHistoryIndex: (index: number) => void;
  setLastSavedState: (state: string) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  saveWorkingPixelsToFrame: () => void;
  addAnimation?: (animation: CustomAnimation) => void;
}

/**
 * Hook that provides project-level actions (create, save, load)
 */
export function useProjectActions({
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
  addAnimation,
}: UseProjectActionsProps) {
  const createNewProject = useCallback(() => {
    const doCreateNew = () => {
      setFrames([{ dur: 1000, arr: new Array(CANVAS_WIDTH * CANVAS_HEIGHT).fill(false) }]);
      setCurrentFrameIndex(0);
      setProjectName("Untitled");
      setFrameDurationSeconds(1);
      setWorkingPixels(new Array(CANVAS_WIDTH * CANVAS_HEIGHT).fill(false));
      setHistory([]);
      setHistoryIndex(-1);
      const newState = JSON.stringify({ 
        frames: [{ dur: 1000, arr: new Array(CANVAS_WIDTH * CANVAS_HEIGHT).fill(false) }], 
        projectName: "Untitled" 
      });
      setLastSavedState(newState);
      setHasUnsavedChanges(false);
    };

    if (hasUnsavedChanges) {
      showConfirm(
        'Unsaved Changes',
        'Your work isn\'t saved. Are you sure you want to continue?',
        doCreateNew,
        'createNew'
      );
    } else {
      doCreateNew();
    }
  }, [
    hasUnsavedChanges,
    showConfirm,
    setFrames,
    setCurrentFrameIndex,
    setProjectName,
    setFrameDurationSeconds,
    setWorkingPixels,
    setHistory,
    setHistoryIndex,
    setLastSavedState,
    setHasUnsavedChanges,
  ]);

  const saveProject = useCallback(async () => {
    if (!projectName || projectName.trim() === "" || projectName === "Untitled") {
      showAlert('Invalid Name', 'Please enter a valid project name!');
      return;
    }
    
    const doSave = async () => {
      saveWorkingPixelsToFrame();
    
      try {
        const animationData: CustomAnimation = {
          id: `custom-${Date.now()}`,
          name: projectName,
          frames: frames,
          createdAt: new Date().toISOString(),
          status: 'Custom'
        };
        
        // Use addAnimation if provided (e.g., cookie/local state helper)
        if (addAnimation) {
          addAnimation(animationData);
        } else {
          // Fallback: persist to localStorage so Library can see it
          const existing = localStorage.getItem('customAnimations');
          const customAnimations = existing ? JSON.parse(existing) : [];
          customAnimations.unshift(animationData);
          localStorage.setItem('customAnimations', JSON.stringify(customAnimations));
          // Notify listeners (AnimationLibrary subscribes to this)
          window.dispatchEvent(new Event('customAnimationsUpdated'));
        }
        
        const savedState = JSON.stringify({ frames, projectName });
        setLastSavedState(savedState);
        setHasUnsavedChanges(false);
        
        showAlert('Success', 'Animation saved successfully! Go to Library to see it.');
      } catch (error) {
        console.error('Failed to save animation:', error);
        showAlert('Error', 'Failed to save animation. Please try again.');
      }
    };

    showConfirm(
      'Save Animation',
      `Are you sure you want to save "${projectName}"?`,
      doSave,
      'saveAnimation'
    );
  }, [
    projectName,
    frames,
    showAlert,
    showConfirm,
    saveWorkingPixelsToFrame,
    setLastSavedState,
    setHasUnsavedChanges,
    addAnimation,
  ]);

  const loadAnimationForEditing = useCallback((
    animationId: string, 
    animationFrames?: Array<{ dur: number; arr: boolean[] }>
  ) => {
    if (!animationFrames || animationFrames.length === 0) {
      showAlert('No Frames', 'No frames found for this animation');
      return;
    }

    const doLoad = () => {
      // Find animation name from ID (simple approach - you could enhance this)
      const animationName = `Animation ${animationId.slice(-6)}`;
      
      setProjectName(animationName);
      setFrames(animationFrames);
      setCurrentFrameIndex(0);
      setWorkingPixels([...animationFrames[0].arr]);
      setFrameDurationSeconds(animationFrames[0].dur / 1000);
      setHistory([]);
      setHistoryIndex(-1);
      setLastSavedState(JSON.stringify({ frames: animationFrames, projectName: animationName }));
      setHasUnsavedChanges(false);
      showAlert('Animation Loaded', `Loaded animation for editing`);
    };

    if (hasUnsavedChanges) {
      showConfirm(
        'Unsaved Changes',
        'Your work isn\'t saved. Are you sure you want to continue?',
        doLoad,
        'loadAnimation'
      );
    } else {
      doLoad();
    }
  }, [
    hasUnsavedChanges,
    showAlert,
    showConfirm,
    setProjectName,
    setFrames,
    setCurrentFrameIndex,
    setWorkingPixels,
    setFrameDurationSeconds,
    setHistory,
    setHistoryIndex,
    setLastSavedState,
    setHasUnsavedChanges,
  ]);

  return {
    createNewProject,
    saveProject,
    loadAnimationForEditing,
  };
}
