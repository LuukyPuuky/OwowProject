"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { PixelDisplay } from "@/components/pixel-display";
import { Star, Menu } from "lucide-react";

export default function CreatePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const favorites = new Set<string>();
  const handleRemoveFavorite = (id: string) => {
    // placeholder
  };

  // placeholder animation cards
  const cards = new Array(8).fill(null).map((_, i) => ({
    id: `a-${i}`,
    name: "Star animation",
  }));

  return (
    <div className="min-h-screen flex">
      <Sidebar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isCollapsed={isCollapsed}
        onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
        favorites={favorites}
        onRemoveFavorite={handleRemoveFavorite}
      />

      <main className="flex-1 p-6" style={{ backgroundColor: "#161616" }}>
        {/* Top area */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Collapse / menu button to toggle sidebar like main page */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-muted-foreground p-2 rounded-md"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>

              <button className="bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] px-3 py-1 rounded-md">
                Create
              </button>

              {/* Library navigates back to main library page */}
              <a href="/" className="bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] px-3 py-1 rounded-md inline-block">
                Library
              </a>
            </div>
            <div className="border-b border-border flex-1 mx-6" />
          </div>
        </div>

        {/* Editor + Right panel */}
        <div className="grid grid-cols-12 gap-6">
          {/* Main editor area */}
          <div className="col-span-8">
            <div className="bg-black rounded-md overflow-hidden mb-4" style={{ height: 260 }}>
              <div className="w-full h-full flex items-center justify-center">
                <PixelDisplay size="large" />
              </div>
            </div>

            {/* Timeline thumbnails */}
            <div className="flex items-center gap-4 mb-6">
              {new Array(6).fill(null).map((_, i) => (
                <div key={i} className={`w-36 h-16 rounded-md bg-[#0b0b0b] border-2 border-border flex items-center justify-center ${i === 2 ? "ring-2 ring-border" : ""}`}>
                  <Star className="h-6 w-6 text-muted-foreground" />
                </div>
              ))}
            </div>

            {/* Animations grid */}
            <div>
              <div className="mb-3">
                <button className="bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] px-3 py-1 rounded-md">
                  Latest Animations
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {cards.map((c) => (
                  <div key={c.id} className="bg-card border-2 border-border rounded-lg p-3 text-muted-foreground">
                    <div className="bg-black h-24 rounded-md mb-3 flex items-center justify-center">
                      <Star className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="text-sm">{c.name}</div>
                    <div className="text-xs text-[#494949] mt-2">Equipped</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right control panel */}
          <aside className="col-span-4">
            <div className="bg-card border-2 border-border rounded-md p-4 space-y-4">
              <div className="flex items-center justify-between">
                <input className="bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] rounded px-2 py-1 w-36" defaultValue="Untitled" />
                <div className="flex items-center gap-2">
                  <button className="bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] px-3 py-1 rounded-md">Create New</button>
                  <button className="bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] px-3 py-1 rounded-md">Save</button>
                </div>
              </div>

              <div className="border-t border-border pt-3 space-y-3">
                <button className="w-full bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] px-3 py-2 rounded-md">Play ▸</button>

                <div className="flex gap-2">
                  <button className="flex-1 bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] px-2 py-1 rounded-md">+ Add Frame</button>
                  <button className="flex-1 bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] px-2 py-1 rounded-md">Duplicate</button>
                </div>

                <label className="text-sm text-muted-foreground">Size</label>
                <input type="range" className="w-full" />

                <label className="text-sm text-muted-foreground">Brush Type</label>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-[#1f1f1f] border-2 border-[#323232] rounded-md" />
                  <div className="w-8 h-8 bg-[#1f1f1f] border-2 border-[#323232] rounded-md" />
                  <div className="w-8 h-8 bg-[#1f1f1f] border-2 border-[#323232] rounded-md" />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">Onion Slicer</label>
                  <input type="checkbox" />
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] px-2 py-1 rounded-md">Next Frame</button>
                  <button className="flex-1 bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] px-2 py-1 rounded-md">Prev Frame</button>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Frame Duration</label>
                  <input className="w-full bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] rounded px-2 py-1" defaultValue="300 ms" />
                </div>

                <button className="w-full bg-[#1f1f1f] text-[#c3c3c3] border-2 border-[#323232] px-3 py-2 rounded-md">Remove Frame</button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
