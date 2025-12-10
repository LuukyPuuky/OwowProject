"use client";

import { useState } from "react";
import {
  Search,
  ChevronUp,
  ChevronDown,
  Star,
  X,
  Eye,
} from "lucide-react";

import { PixelDisplay } from "@/components/pixel-display";
import { animations } from "@/lib/animations";

import { AnimationMetadata } from "@/lib/display/types";

interface SidebarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isCollapsed: boolean;
  onToggleSidebar: () => void;
  favorites?: Set<string>;
  onRemoveFavorite: (id: string) => void;
  onEquipFavorite?: (id: string) => void;
  equippedAnimation?: AnimationMetadata;
  equippedCustomFrames?: Array<{ dur: number; arr: boolean[] }>;
  customAnimations?: Array<{
    id: string;
    name: string;
    frames: Array<{ dur: number; arr: boolean[] }>;
    createdAt: string;
    status: string;
  }>;
}

export function Sidebar({
  searchQuery,
  onSearchChange,
  isCollapsed,
  onToggleSidebar,
  favorites,
  onRemoveFavorite,
  onEquipFavorite,
  equippedAnimation,
  equippedCustomFrames,
  customAnimations = [],
}: SidebarProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [isFavouritesOpen, setIsFavouritesOpen] = useState(false);

  // Get favorite animation objects
  const favoriteAnimations =
    favorites && favorites.size > 0
      ? Array.from(favorites)
        .map((id) => {
          // Check built-in animations
          const builtIn = Object.values(animations).find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (a: any) => a.metadata?.id === id
          );
          if (builtIn) return builtIn.metadata;

          // Check custom animations
          const custom = customAnimations.find((c) => c.id === id);
          if (custom) return custom;

          return undefined;
        })
        .filter((anim) => anim !== undefined)
        .filter((anim) =>
          anim.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : [];

  return (
    <aside
      className={`${isCollapsed ? "w-20" : "w-[400px]"
        } flex flex-col transition-all duration-300`}
      style={{ backgroundColor: "#1f1f1f" }}
    >
      {/* Logo */}
      <div className="p-6 flex justify-center">
        {isCollapsed ? (
          <div className="w-full flex items-center justify-center overflow-hidden rounded-md">
            <PixelDisplay
              size="mini"
              animationType="logo"
              autoRefresh={true}
            />
          </div>
        ) : (
          <div className="w-full flex items-center justify-center overflow-hidden rounded-md">
            <PixelDisplay
              size="large" // Use large for better visibility in expanded mode? Or scale it up manually
              animationType="logo"
              autoRefresh={true}
            />
          </div>
        )}
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground " />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10  bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] px-3 py-1 rounded-md focus:outline-none hover:bg-[#1f1f1f] hover:text-[#c3c3c3]"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground border-2 border-transparent hover:border-[#323232] hover:rounded-md hover:text-white hover:border-2 hover:cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Preview Section */}
      {isCollapsed ? (
        <div className="flex-1 flex flex-col items-center py-4 space-y-6 ">
          {/* Collapsed Preview Button */}
          <button
            onClick={() => {
              setIsPreviewOpen(true);
              onToggleSidebar();
            }}
            className="w-12 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border-2 border-border rounded-lg"
          >
            <div className="w-3 h-3 bg-muted-foreground rounded-sm" />
          </button>

          {/* Collapsed Favourites Button */}
          <button
            onClick={() => {
              setIsFavouritesOpen(true);
              onToggleSidebar();
            }}
            className="w-12 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border-2 border-border rounded-lg"
          >
            <Star className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-6 pt-6 pb-4 border-b-2 border-border">
            <button
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className="w-full flex items-center justify-between text-sm font-medium mb-4 text-muted-foreground hover:cursor-pointer"
              suppressHydrationWarning
            >
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span>Preview</span>
              </div>
              {isPreviewOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {/* Preview Content */}
            {isPreviewOpen && (
              <div className="space-y-4">
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center overflow-hidden">
                  <PixelDisplay
                    size="large"
                    animationType={equippedCustomFrames ? undefined : equippedAnimation?.id}
                    customFrames={equippedCustomFrames}
                  />
                </div>

                <div className="border-3 border-border rounded-lg p-4 space-y-2">
                  <h3 className="font-medium text-muted-foreground">
                    {equippedAnimation?.name || "No animation selected"}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {equippedAnimation?.description ||
                      "Select an animation from your favorites to preview it here."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Favourites Section */}
          <div className="px-6 pb-6 border-b-1 border-border mt-5">
            <button
              onClick={() => setIsFavouritesOpen(!isFavouritesOpen)}
              className="w-full flex items-center justify-between text-sm font-medium text-muted-foreground hover:cursor-pointer"
              suppressHydrationWarning
            >
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span>Favourites ({favorites?.size || 0})</span>
              </div>
              {isFavouritesOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {/* Favourites Content */}
            {isFavouritesOpen && (
              <div className="mt-4 space-y-4">
                {favoriteAnimations.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-2 py-4 text-center">
                    No favorites yet
                  </p>
                ) : (
                  <div className="text-sm text-muted-foreground px-2 space-y-3">
                    {favoriteAnimations.map((anim) => (
                      <div
                        key={anim.id}
                        className="flex items-center justify-between border-2 p-4 rounded-xl hover:bg-accent/10 transition-colors cursor-pointer"
                        onClick={() => onEquipFavorite?.(anim.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="rounded overflow-hidden">
                            <PixelDisplay
                              size="mini"
                              animationType={anim.id}
                              autoRefresh={true}
                            />
                          </div>
                          <p>{anim.name}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFavorite(anim.id);
                          }}
                          className="text-muted-foreground transition-colors border-2 border-transparent hover:border-[#323232] hover:rounded-md hover:text-white hover:border-2 hover:cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Currently Section */}
          <div className="px-6 pb-6 border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              Currently: {equippedAnimation?.name || "None"}
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
