"use client";

import { AnimationCard } from "@/components/animation-card";
import { animations } from "@/lib/animations";

interface AnimationGridProps {
  searchQuery: string;
  isSidebarCollapsed: boolean;
}

export function AnimationGrid({
  searchQuery,
  isSidebarCollapsed,
}: AnimationGridProps) {
  type Animation = {
    id: string;
    name: string;
    status: string;
  };

  type AnimationObject = {
    metadata: Animation;
    // add other properties if needed
  };

  const filteredAnimations = Object.values(animations)
    .map((AnimationObject: AnimationObject) => AnimationObject.metadata)
    .filter((animation: Animation) =>
      animation.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div
        className={`grid gap-6 ${
          isSidebarCollapsed
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {filteredAnimations.map((animation) => (
          <AnimationCard
            key={animation.id}
            title={animation.name}
            status={animation.status}
            animationType={animation.id} // Pass animation type for preview
          />
        ))}
      </div>
    </div>
  );
}
