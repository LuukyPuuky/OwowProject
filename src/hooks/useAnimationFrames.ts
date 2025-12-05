import { useState, useCallback, useRef, useEffect } from "react";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/canvas";
import type { Frame } from "@/lib/types";

/**
 * Custom hook for managing animation frames and playback
 * Handles frame creation, deletion, navigation, and animation playback
 */
export function useAnimationFrames() {
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

  const updateFrame = useCallback((pixels: boolean[], frameIndex?: number) => {
    const targetIndex = frameIndex ?? currentFrameIndex;
    setFrames(prev => {
      const next = [...prev];
      next[targetIndex] = { ...next[targetIndex], arr: pixels };
      return next;
    });
    setWorkingPixels(pixels);
  }, [currentFrameIndex]);

  const addFrame = useCallback(() => {
    const newFrame: Frame = {
      dur: 1000,
      arr: new Array(CANVAS_WIDTH * CANVAS_HEIGHT).fill(false)
    };
    setFrames(prev => {
      const next = [...prev];
      next.splice(currentFrameIndex + 1, 0, newFrame);
      return next;
    });
    setCurrentFrameIndex(prev => prev + 1);
  }, [currentFrameIndex]);

  const removeFrame = useCallback((index: number) => {
    if (frames.length === 1) return;
    
    setFrames(prev => prev.filter((_, i) => i !== index));
    if (index === currentFrameIndex && currentFrameIndex >= frames.length - 1) {
      setCurrentFrameIndex(prev => Math.max(0, prev - 1));
    }
  }, [frames.length, currentFrameIndex]);

  const duplicateFrame = useCallback((index: number) => {
    const frameToDup = frames[index];
    const newFrame: Frame = {
      dur: frameToDup.dur,
      arr: [...frameToDup.arr]
    };
    setFrames(prev => {
      const next = [...prev];
      next.splice(index + 1, 0, newFrame);
      return next;
    });
    setCurrentFrameIndex(index + 1);
  }, [frames]);

  const setFrameDuration = useCallback((duration: number, index?: number) => {
    const targetIndex = index ?? currentFrameIndex;
    setFrames(prev => {
      const next = [...prev];
      next[targetIndex] = { ...next[targetIndex], dur: duration };
      return next;
    });
  }, [currentFrameIndex]);

  const goToFrame = useCallback((index: number) => {
    if (index >= 0 && index < frames.length) {
      setCurrentFrameIndex(index);
      setWorkingPixels(frames[index].arr);
    }
  }, [frames]);

  const startPlayback = useCallback(() => {
    setPlaying(true);
    let currentIdx = currentFrameIndex;

    const playNext = () => {
      currentIdx = (currentIdx + 1) % framesRef.current.length;
      setCurrentFrameIndex(currentIdx);
      setWorkingPixels(framesRef.current[currentIdx].arr);
      playTimerRef.current = setTimeout(playNext, framesRef.current[currentIdx].dur);
    };

    playTimerRef.current = setTimeout(playNext, framesRef.current[currentIdx].dur);
  }, [currentFrameIndex]);

  const stopPlayback = useCallback(() => {
    setPlaying(false);
    if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
  }, []);

  const clearFrame = useCallback(() => {
    const emptyPixels = new Array(CANVAS_WIDTH * CANVAS_HEIGHT).fill(false);
    updateFrame(emptyPixels);
  }, [updateFrame]);

  useEffect(() => {
    return () => {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
      }
    };
  }, []);

  return {
    frames,
    setFrames,
    currentFrameIndex,
    setCurrentFrameIndex,
    workingPixels,
    setWorkingPixels,
    playing,
    updateFrame,
    addFrame,
    removeFrame,
    duplicateFrame,
    setFrameDuration,
    goToFrame,
    startPlayback,
    stopPlayback,
    clearFrame,
  };
}
