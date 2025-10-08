"use client";

import { AnimationCard } from "@/components/animation-card";

interface AnimationGridProps {
  searchQuery: string;
  isSidebarCollapsed: boolean;
}

const animations = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  title: "Star animation",
  status: "Equiped",
}));

export function AnimationGrid({ searchQuery, isSidebarCollapsed }: AnimationGridProps) {
  const filteredAnimations = animations.filter((animation) =>
    animation.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className={`grid gap-6 ${
        isSidebarCollapsed 
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      }`}>
        {filteredAnimations.map((animation) => (
          <AnimationCard key={animation.id} {...animation} />
        ))}
      </div>
    </div>
  );
}
