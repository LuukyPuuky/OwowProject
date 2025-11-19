"use client";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { PixelDisplay } from "@/components/pixel-display";
import { Star, Menu } from "lucide-react";
import { ControlPanel } from "@/components/control-panel";
import LatestAnimations from "@/components/latest-animations";

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

            {/* Latest animations component */}
            <div>
              <LatestAnimations
                animations={undefined}
                onAnimationSelect={(id) => {
                  // placeholder handler
                }}
                onMenuClick={(id) => {
                  // placeholder handler
                }}
              />
            </div>
          </div>

          {/* Right control panel */}
          <aside className="col-span-4">
            <ControlPanel
              onPlay={() => {}}
              onCreateNew={() => {}}
              onSave={() => {}}
              onAddFrame={() => {}}
              onDuplicate={() => {}}
              onRemoveFrame={() => {}}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
