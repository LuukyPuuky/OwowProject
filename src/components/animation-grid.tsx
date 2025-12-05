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
  sortBy?: string;
  filterBy?: string;
  customAnimations?: Array<{
    id: string;
    name: string;
    frames: Array<{ dur: number; arr: boolean[] }>;
    createdAt: string;
    status: string;
  }>;
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
  sortBy = "Name",
  filterBy = "All",
  customAnimations = [],
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
    () => {
      const builtInAnimations = Object.values(animations)
        .map((AnimationObject: AnimationObject) => AnimationObject.metadata)
        .filter((animation: Animation) => animation && animation.id)
        .map((animation: Animation) => ({
          ...animation,
          isCustom: false,
          createdAt: undefined,
        }));
      
      // Merge custom animations
      const customAnims = customAnimations.map((custom) => ({
        id: custom.id,
        name: custom.name,
        status: custom.status,
        isCustom: true,
        createdAt: custom.createdAt,
      }));
      
      return [...builtInAnimations, ...customAnims];
    },
    [customAnimations]
  );

  const filteredAndSortedAnimations = useMemo(() => {
    let result = allAnimations
      .filter((animation) => !deletedIds.has(animation.id))
      .filter((animation) =>
        animation.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // Apply filter
    if (filterBy === "Favorites") {
      result = result.filter((animation) => favorites.has(animation.id));
    } else if (filterBy === "Custom") {
      result = result.filter((animation) => animation.isCustom);
    } else if (filterBy === "Built-in") {
      result = result.filter((animation) => !animation.isCustom);
    }

    // Apply sort
    if (sortBy === "Name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "Date Created") {
      result.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Most recent first
      });
    } else if (sortBy === "Last Modified") {
      result.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Most recent first
      });
    }

    return result;
  }, [allAnimations, deletedIds, searchQuery, filterBy, favorites, sortBy]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {filteredAndSortedAnimations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <p className="text-lg font-medium">Oopsie Woopsie</p>
          <p className="text-sm">No Animations Found!</p>
        </div>
      ) : (
        <div
          className={`grid gap-6 ${
            isSidebarCollapsed
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {filteredAndSortedAnimations.map((animation) => {
            // Find custom animation data if this is a custom animation
            const customAnim = customAnimations.find(c => c.id === animation.id);
            
            // Get thumbnail from built-in animation metadata
            const builtInAnim = animations[animation.id as keyof typeof animations];
            // Prefer a custom animation's first frame as a static thumbnail; otherwise use built-in metadata thumbnail
            const thumbnail = customAnim?.frames?.[0]?.arr ?? builtInAnim?.metadata?.thumbnail;
            
            return (
              <AnimationCard
                key={animation.id}
                id={animation.id}
                title={animation.name}
                status={animation.status}
                animationType={customAnim ? undefined : animation.id}
                customFrames={customAnim?.frames}
                thumbnail={thumbnail}
                isFavorite={favorites.has(animation.id)}
                onDelete={onDelete}
                onFavorite={onAddFavorite}
                isEquipped={equippedId === animation.id}
                onEquip={onEquip}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
