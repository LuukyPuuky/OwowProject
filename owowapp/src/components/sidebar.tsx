"use client";

import { useState } from "react";
import { Search, ChevronUp, ChevronDown, Star } from "lucide-react";
import { Input } from "../components/ui/input";
import { PixelDisplay } from "@/components/pixel-display";

interface SidebarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Sidebar({ searchQuery, onSearchChange }: SidebarProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [isFavouritesOpen, setIsFavouritesOpen] = useState(false);
  return (
    <aside className="w-[400px] flex flex-col" style={{ backgroundColor: '#1f1f1f' }}>
      {/* Logo */}
      <div className="p-6 ">
        <div className="px-4 py-3 bg-secondary rounded-lg">
          <span className="text-muted-foreground font-medium">Logo</span>
        </div>
      </div>

      {/* Search */}
      <div className="p-6 border-b-2 border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search ..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Preview Section */}
      <div className="flex-1 overflow-hidden">
        <div className="p-6">
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
        <div className="px-6 pb-6">
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
            <div className="mt-4 space-y-2">
              <div className="text-sm text-muted-foreground px-2">
                <p>• Bouncing Ball Animation</p>
                <p>• Rainbow Wave Effect</p>
                <p>• Text Scroll Display</p>
              </div>
            </div>
          )}
        </div>

        {/* Currently Section */}
        <div className="px-6 pb-6 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">Currently: .....</p>
        </div>
      </div>
    </aside>
  );
}
