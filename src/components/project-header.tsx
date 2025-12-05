"use client";

import { memo } from "react";
import { Save, Plus } from "lucide-react";

interface ProjectHeaderProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onCreateNew: () => void;
  onSave: () => void;
}

/**
 * Project header with name input and action buttons
 */
export const ProjectHeader = memo<ProjectHeaderProps>(
  ({ projectName, onProjectNameChange, onCreateNew, onSave }) => {
    return (
      <div className="space-y-3">
        {/* Project Name */}
        <input
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          className="w-full bg-background border border-neutral-800 rounded-lg px-4 py-2 text-neutral-300 focus:outline-none focus:border-neutral-600"
          placeholder="Project Name"
        />

        {/* Create New and Save */}
        <div className="flex gap-2">
          <button
            onClick={onCreateNew}
            className="flex-1 bg-background border border-neutral-800 rounded-lg px-4 py-2 text-neutral-300 hover:bg-neutral-900 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
          <button
            onClick={onSave}
            className="flex-1 bg-background border border-neutral-800 rounded-lg px-4 py-2 text-neutral-300 hover:bg-neutral-900 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
    );
  }
);

ProjectHeader.displayName = "ProjectHeader";
