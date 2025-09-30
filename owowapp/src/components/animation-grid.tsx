"use client";

import { AnimationCard } from "@/components/animation-card";

interface AnimationGridProps {
  searchQuery: string;
}

const animations = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  title: "Star animation",
  status: "Equiped",
}));

export function AnimationGrid({ searchQuery }: AnimationGridProps) {
  const filteredAnimations = animations.filter((animation) =>
    animation.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAnimations.map((animation) => (
          <AnimationCard key={animation.id} {...animation} />
        ))}
      </div>
    </div>
  );
}
