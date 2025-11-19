"use client";

import { useMemo } from "react";
import { AnimationCard } from "@/components/animation-card";
import { animations } from "@/lib/animations";

interface AnimationGridProps {
  searchQuery: string;
  isSidebarCollapsed: boolean;
  favorites: Set<string>;
  onAddFavorite: (id: string) => void;
  deletedIds: Set<string>;
  onDelete: (id: string) => void;
  equippedId: string;
  onEquip: (id: string) => void;
}

export function AnimationGrid({
  searchQuery,
  isSidebarCollapsed,
  favorites,
  onAddFavorite,
  deletedIds,
  onDelete,
  equippedId,
  onEquip,
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

  // Initialize with all animations
  const allAnimations = useMemo(
    () =>
      Object.values(animations)
        .map((AnimationObject: AnimationObject) => AnimationObject.metadata)
        .filter((animation: Animation) => animation && animation.id),
    []
  );

  const filteredAnimations = allAnimations
    .filter((animation: Animation) => !deletedIds.has(animation.id))
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
            id={animation.id}
            title={animation.name}
            status={animation.status}
            animationType={animation.id}
            isFavorite={favorites.has(animation.id)}
            onDelete={onDelete}
            onFavorite={onAddFavorite}
            isEquipped={equippedId === animation.id}
            onEquip={onEquip}
          />
        ))}
      </div>
    </div>
  );
}
