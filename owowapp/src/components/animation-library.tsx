"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { AnimationGrid } from "@/components/animation-grid";
import { TopBar } from "@/components/top-bar";

export function AnimationLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const startDefaultAnimation = async () => {
      try {
        await fetch("/api/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animationId: "star-bounce" }),
        });
      } catch (error) {
        console.error("[v0] Failed to start animation:", error);
      }
    };

    startDefaultAnimation();
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery}
        isCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopBar onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <AnimationGrid searchQuery={searchQuery} isSidebarCollapsed={isSidebarCollapsed} />
      </main>
    </div>
  );
}
