import { useState, useCallback } from "react";
import type { Frame } from "@/lib/types";

/**
 * Custom hook for managing project state and persistence
 * Handles project name, save state, and localStorage management
 */
export function useProjectPersistence() {
  const [projectName, setProjectName] = useState("Untitled");
  const [lastSavedState, setLastSavedState] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const saveProject = useCallback((frames: Frame[], name: string) => {
    const timestamp = new Date().toISOString();
    const projectData = {
      id: `custom-${Date.now()}`,
      name,
      frames,
      createdAt: timestamp,
      status: 'idle' as const,
    };

    // Save to localStorage
    const existing = localStorage.getItem('customAnimations');
    const customAnimations = existing ? JSON.parse(existing) : [];
    
    // Check if updating existing project
    const existingIndex = customAnimations.findIndex((a: { name: string }) => a.name === name);
    if (existingIndex >= 0) {
      customAnimations[existingIndex] = projectData;
    } else {
      customAnimations.push(projectData);
    }

    localStorage.setItem('customAnimations', JSON.stringify(customAnimations));
    
    // Update saved state
    const currentState = JSON.stringify({ frames, projectName: name });
    setLastSavedState(currentState);
    setHasUnsavedChanges(false);

    // Trigger storage event for other components
    window.dispatchEvent(new Event('customAnimationsUpdated'));

    return projectData.id;
  }, []);

  const loadProject = useCallback((projectId: string) => {
    const existing = localStorage.getItem('customAnimations');
    if (!existing) return null;

    const customAnimations = JSON.parse(existing);
    const project = customAnimations.find((a: { id: string }) => a.id === projectId);
    
    if (project) {
      setProjectName(project.name);
      const currentState = JSON.stringify({ frames: project.frames, projectName: project.name });
      setLastSavedState(currentState);
      setHasUnsavedChanges(false);
      return project;
    }

    return null;
  }, []);

  const trackChanges = useCallback((frames: Frame[], name: string) => {
    const currentState = JSON.stringify({ frames, projectName: name });
    if (lastSavedState && currentState !== lastSavedState) {
      setHasUnsavedChanges(true);
    } else if (!lastSavedState) {
      setHasUnsavedChanges(false);
    }
  }, [lastSavedState]);

  const newProject = useCallback(() => {
    setProjectName("Untitled");
    setLastSavedState("");
    setHasUnsavedChanges(false);
  }, []);

  return {
    projectName,
    setProjectName,
    hasUnsavedChanges,
    saveProject,
    loadProject,
    trackChanges,
    newProject,
  };
}
