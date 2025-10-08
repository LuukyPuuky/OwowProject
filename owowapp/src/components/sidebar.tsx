"use client";

import { useState } from "react";
import { Search, ChevronUp, ChevronDown, Star, MoreVertical } from "lucide-react";
import { Input } from "../components/ui/input";
import { PixelDisplay } from "@/components/pixel-display";

interface SidebarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function Sidebar({ searchQuery, onSearchChange, isCollapsed, onToggleSidebar }: SidebarProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [isFavouritesOpen, setIsFavouritesOpen] = useState(false);
  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-[400px]'} flex flex-col transition-all duration-300`} style={{ backgroundColor: '#1f1f1f' }}>
      {/* Logo */}
      <div className="p-6">
        {isCollapsed ? (
          <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground font-medium text-sm">L</span>
          </div>
        ) : (
          <div className="px-4 py-3 bg-secondary rounded-lg">
            <span className="text-muted-foreground font-medium">Logo</span>
          </div>
        )}
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search ..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 border-2 border-border text-foreground placeholder:text-muted-foreground !bg-[#1f1f1f] focus:outline-none focus:ring-0 focus:border-border"
            />
          </div>
        </div>
      )}

      {/* Preview Section */}
      {isCollapsed ? (
        <div className="flex-1 flex flex-col items-center py-4 space-y-6">
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
            className="w-full flex items-center justify-between text-sm font-medium mb-4 text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-muted-foreground rounded-sm" />
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
                <PixelDisplay size="large" />
              </div>

              <div className="border-3 border-border rounded-lg p-4 space-y-2">
                <h3 className="font-medium text-muted-foreground">Star animation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Displays a star that moves in different directions
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Favourites Section */}
        <div className="px-6 pb-6 border-b-1 border-border mt-5">
          <button 
            onClick={() => setIsFavouritesOpen(!isFavouritesOpen)}
            className="w-full flex items-center justify-between text-sm font-medium text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span>Favourites</span>
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
              <div className="text-sm text-muted-foreground px-2 space-y-3">
                <div className="flex items-center justify-between border-2 p-4 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="bg-black pt-3 pb-3 pl-5 pr-5" />
                    {/* <div className="inline-block h-[4px] min-h-[1em] w-0.5 self-stretch bg-border" /> */}
                    <p>Star animation</p>
                  </div>
                  <MoreVertical className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between border-2 p-4 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="bg-black pt-3 pb-3 pl-5 pr-5" />
                    {/* <div className="inline-block h-[4px] min-h-[1em] w-0.5 self-stretch bg-border" /> */}
                    <p>Rainbow Wave Effect</p>
                  </div>
                  <MoreVertical className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between border-2 p-4 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="bg-black pt-3 pb-3 pl-5 pr-5" />
                    {/* <div className="inline-block h-[4px] min-h-[1em] w-0.5 self-stretch bg-border" /> */}
                    <p>Text Scroll Display</p>
                  </div>
                  <MoreVertical className="h-4 w-4" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Currently Section */}
        <div className="px-6 pb-6 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">Currently: .....</p>
        </div>
        </div>
      )}
    </aside>
  );
}
