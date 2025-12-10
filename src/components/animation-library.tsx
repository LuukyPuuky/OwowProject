"use client";

import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/sidebar";
import { AnimationGrid } from "@/components/animation-grid";
import { TopBar } from "@/components/top-bar";
import { animations } from "@/lib/animations";

export function AnimationLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  // Ensure SSR and client hydration start with the same value
  const [equippedId, setEquippedId] = useState<string>("logo");
  const [sortBy, setSortBy] = useState("Name");
  const [filterBy, setFilterBy] = useState("All");
  const [customAnimations, setCustomAnimations] = useState<Array<{
    id: string;
    name: string;
    frames: Array<{ dur: number; arr: boolean[] }>;
    createdAt: string;
    status: string;
  }>>([]);

  // Load custom animations, favorites, and equipped animation from localStorage (client-only)
  useEffect(() => {
    const loadCustomAnimations = () => {
      try {
        const saved = localStorage.getItem('customAnimations');
        if (saved) {
          setCustomAnimations(JSON.parse(saved));
        }
        // Load favorites
        const savedFavorites = localStorage.getItem('favorites');
        if (savedFavorites) {
          setFavorites(new Set(JSON.parse(savedFavorites)));
        }
        // Load equipped ID after mount to avoid hydration mismatches
        const eq = localStorage.getItem('equippedAnimationId');
        if (eq) {
          setEquippedId(eq);
        } else {
          // Set default to logo if nothing is equipped
          localStorage.setItem('equippedAnimationId', 'logo');
          setEquippedId('logo');
        }
      } catch (error) {
        console.error('Failed to load custom animations:', error);
      }
    };

    loadCustomAnimations();

    // Listen for storage changes to update when animations are saved
    const handleStorageChange = () => {
      loadCustomAnimations();
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event from same window
    window.addEventListener('customAnimationsUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('customAnimationsUpdated', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const startDefaultAnimation = async () => {
      try {
        // Check if this is a custom animation
        const customAnim = customAnimations.find(a => a.id === equippedId);

        const payload = customAnim
          ? { animationId: equippedId, customFrames: customAnim.frames }
          : { animationId: equippedId };

        const response = await fetch("/api/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).catch((error) => {
          // Silently handle network errors - backend API not available
          console.warn("Animation start API not available:", error.message);
          return null;
        });

        if (!response) {
          // API not available - this is fine, just means no hardware display
          return;
        }

        if (!response.ok) {
          console.warn("Failed to start animation:", response.statusText);
        }
      } catch (error) {
        console.warn("Failed to start animation (backend may not be running):", error);
      }
    };

    startDefaultAnimation();
  }, [equippedId, customAnimations]);

  const handleAddFavorite = (id: string) => {
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      // Save to localStorage
      localStorage.setItem('favorites', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const handleDelete = (id: string) => {
    setDeletedIds((prev) => new Set(prev).add(id));
  };

  const handleEquip = (id: string) => {
    setEquippedId(id);
    // Save to localStorage so other pages can see it
    localStorage.setItem('equippedAnimationId', id);
  };

  const equippedAnimation = useMemo(() => {
    // Check if it's a custom animation first
    const customAnim = customAnimations.find(c => c.id === equippedId);
    if (customAnim) {
      return {
        id: customAnim.id,
        name: customAnim.name,
        description: `Custom animation created on ${new Date(customAnim.createdAt).toLocaleDateString()}`,
        status: customAnim.status as "Available" | "Equiped",
      };
    }

    // Otherwise check built-in animations
    const anim = Object.values(animations).find(
      (a) => a.metadata.id === equippedId
    );
    return anim?.metadata;
  }, [equippedId, customAnimations]);

  // Get custom frames for equipped animation if it's custom
  const equippedCustomFrames = useMemo(() => {
    const customAnim = customAnimations.find(c => c.id === equippedId);
    return customAnim?.frames;
  }, [equippedId, customAnimations]);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        favorites={favorites}
        onRemoveFavorite={(id) => {
          const newFavorites = new Set(favorites);
          newFavorites.delete(id);
        }}
        onEquipFavorite={(id) => {
          handleEquip(id);
        }}
        equippedAnimation={equippedAnimation}
        equippedCustomFrames={equippedCustomFrames}
        customAnimations={customAnimations}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          sortBy={sortBy}
          onSortChange={setSortBy}
          filterBy={filterBy}
          onFilterChange={setFilterBy}
        />
        <AnimationGrid
          searchQuery={searchQuery}
          isSidebarCollapsed={isSidebarCollapsed}
          favorites={favorites}
          onAddFavorite={handleAddFavorite}
          deletedIds={deletedIds}
          onDelete={handleDelete}
          equippedId={equippedId}
          onEquip={handleEquip}
          customAnimations={customAnimations}
          sortBy={sortBy}
          filterBy={filterBy}
        />
      </main>
    </div>
  );
}
