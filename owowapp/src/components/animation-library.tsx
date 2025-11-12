"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { AnimationGrid } from "@/components/animation-grid";
import { TopBar } from "@/components/top-bar";

export function AnimationLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const startDefaultAnimation = async () => {
      try {
        await fetch("/api/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animationId: "star-bounce" }),
        });
      } catch (error) {
        console.error("Failed to start animation:", error);
      }
    };

    startDefaultAnimation();
  }, []);

  const handleAddFavorite = (id: string) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDelete = (id: string) => {
    setDeletedIds((prev) => new Set(prev).add(id));
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        favorites={favorites}
        onRemoveFavorite={handleAddFavorite}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <AnimationGrid
          searchQuery={searchQuery}
          isSidebarCollapsed={isSidebarCollapsed}
          favorites={favorites}
          onAddFavorite={handleAddFavorite}
          deletedIds={deletedIds}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}
